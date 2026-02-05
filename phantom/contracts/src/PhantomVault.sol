// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PhantomVault
 * @notice Main vault contract for PHANTOM - Confidential DeFi Intelligence Engine
 * @dev Stores user portfolio configurations and executes TEE-validated strategies
 */
contract PhantomVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Portfolio {
        address owner;
        bytes32 protectedDataId;      // iExec protected data reference
        uint256 lastAnalysis;         // Timestamp of last TEE analysis
        uint256 riskScore;            // 0-100 risk score from TEE
        bool autoRebalance;           // Enable automatic rebalancing
        uint256 rebalanceThreshold;   // Trigger threshold (basis points)
        uint256 createdAt;
    }

    struct Strategy {
        bytes32 strategyHash;         // Hash of strategy details
        address[] targetAssets;       // Assets involved
        uint256[] allocations;        // Target allocations (basis points)
        bytes teeSignature;           // Signature from TEE execution
        uint256 validUntil;           // Strategy expiry timestamp
        bool executed;
    }

    struct RiskReport {
        uint256 portfolioScore;
        uint256 concentrationRisk;
        uint256 protocolRisk;
        uint256 correlationRisk;
        uint256 liquidityRisk;
        uint256 leverageRatio;
        uint256 timestamp;
        bytes teeAttestation;
    }

    // ============ State Variables ============

    /// @notice Mapping of user address to their portfolio
    mapping(address => Portfolio) public portfolios;
    
    /// @notice Mapping of strategy hash to strategy details
    mapping(bytes32 => Strategy) public strategies;
    
    /// @notice Mapping of user to their risk reports history
    mapping(address => RiskReport[]) public riskHistory;
    
    /// @notice Trusted iExec iApp address for signature verification
    address public trustedIApp;
    
    /// @notice Trusted workerpool for TEE execution
    address public trustedWorkerpool;
    
    /// @notice Minimum time between rebalances (prevents spam)
    uint256 public minRebalanceInterval = 1 hours;
    
    /// @notice Fee for strategy execution (basis points)
    uint256 public executionFeeBps = 10; // 0.1%
    
    /// @notice Fee recipient
    address public feeRecipient;
    
    /// @notice Total portfolios created
    uint256 public totalPortfolios;
    
    /// @notice Total strategies executed
    uint256 public totalStrategiesExecuted;

    // ============ Events ============

    event PortfolioCreated(
        address indexed owner,
        bytes32 protectedDataId,
        uint256 timestamp
    );
    
    event PortfolioUpdated(
        address indexed owner,
        bytes32 newProtectedDataId,
        uint256 timestamp
    );
    
    event RiskAnalysisCompleted(
        address indexed owner,
        uint256 riskScore,
        uint256 timestamp,
        bytes32 reportHash
    );
    
    event StrategySubmitted(
        address indexed owner,
        bytes32 indexed strategyHash,
        uint256 validUntil
    );
    
    event StrategyExecuted(
        address indexed owner,
        bytes32 indexed strategyHash,
        uint256 timestamp
    );
    
    event AutoRebalanceTriggered(
        address indexed owner,
        bytes32 strategyHash,
        uint256 deviation
    );
    
    event TrustedIAppUpdated(address oldIApp, address newIApp);
    event TrustedWorkerpoolUpdated(address oldPool, address newPool);
    event FeesUpdated(uint256 newFeeBps, address newRecipient);

    // ============ Errors ============

    error PortfolioNotFound();
    error StrategyExpired();
    error StrategyAlreadyExecuted();
    error InvalidTEESignature();
    error RebalanceTooFrequent();
    error UnauthorizedCaller();
    error InvalidParameters();
    error InsufficientBalance();

    // ============ Constructor ============

    constructor(
        address _trustedIApp,
        address _trustedWorkerpool,
        address _feeRecipient
    ) Ownable(msg.sender) {
        trustedIApp = _trustedIApp;
        trustedWorkerpool = _trustedWorkerpool;
        feeRecipient = _feeRecipient;
    }

    // ============ Portfolio Management ============

    /**
     * @notice Create a new portfolio linked to protected data
     * @param protectedDataId iExec protected data identifier
     * @param autoRebalance Enable automatic rebalancing
     * @param rebalanceThreshold Deviation threshold in basis points
     */
    function createPortfolio(
        bytes32 protectedDataId,
        bool autoRebalance,
        uint256 rebalanceThreshold
    ) external whenNotPaused {
        if (protectedDataId == bytes32(0)) revert InvalidParameters();
        if (rebalanceThreshold > 5000) revert InvalidParameters(); // Max 50%
        
        portfolios[msg.sender] = Portfolio({
            owner: msg.sender,
            protectedDataId: protectedDataId,
            lastAnalysis: 0,
            riskScore: 0,
            autoRebalance: autoRebalance,
            rebalanceThreshold: rebalanceThreshold,
            createdAt: block.timestamp
        });
        
        totalPortfolios++;
        
        emit PortfolioCreated(msg.sender, protectedDataId, block.timestamp);
    }

    /**
     * @notice Update portfolio configuration
     * @param newProtectedDataId New protected data reference
     * @param autoRebalance Enable/disable auto rebalancing
     * @param rebalanceThreshold New threshold in basis points
     */
    function updatePortfolio(
        bytes32 newProtectedDataId,
        bool autoRebalance,
        uint256 rebalanceThreshold
    ) external whenNotPaused {
        Portfolio storage portfolio = portfolios[msg.sender];
        if (portfolio.owner == address(0)) revert PortfolioNotFound();
        
        if (newProtectedDataId != bytes32(0)) {
            portfolio.protectedDataId = newProtectedDataId;
        }
        portfolio.autoRebalance = autoRebalance;
        portfolio.rebalanceThreshold = rebalanceThreshold;
        
        emit PortfolioUpdated(msg.sender, newProtectedDataId, block.timestamp);
    }

    // ============ Risk Analysis ============

    /**
     * @notice Submit risk analysis results from TEE execution
     * @param user Portfolio owner
     * @param report Risk report from TEE
     * @param teeSignature Signature proving TEE execution
     */
    function submitRiskAnalysis(
        address user,
        RiskReport calldata report,
        bytes calldata teeSignature
    ) external whenNotPaused {
        // Verify TEE signature
        if (!_verifyTEESignature(user, report, teeSignature)) {
            revert InvalidTEESignature();
        }
        
        Portfolio storage portfolio = portfolios[user];
        if (portfolio.owner == address(0)) revert PortfolioNotFound();
        
        portfolio.lastAnalysis = block.timestamp;
        portfolio.riskScore = report.portfolioScore;
        
        riskHistory[user].push(report);
        
        emit RiskAnalysisCompleted(
            user,
            report.portfolioScore,
            block.timestamp,
            keccak256(abi.encode(report))
        );
    }

    // ============ Strategy Execution ============

    /**
     * @notice Submit a strategy generated by TEE for execution
     * @param targetAssets Assets to rebalance
     * @param allocations Target allocations
     * @param teeSignature TEE signature validating the strategy
     * @param validityPeriod How long the strategy is valid (seconds)
     */
    function submitStrategy(
        address[] calldata targetAssets,
        uint256[] calldata allocations,
        bytes calldata teeSignature,
        uint256 validityPeriod
    ) external whenNotPaused returns (bytes32 strategyHash) {
        if (targetAssets.length != allocations.length) revert InvalidParameters();
        if (validityPeriod > 24 hours) revert InvalidParameters();
        
        Portfolio storage portfolio = portfolios[msg.sender];
        if (portfolio.owner == address(0)) revert PortfolioNotFound();
        
        strategyHash = keccak256(abi.encode(
            msg.sender,
            targetAssets,
            allocations,
            block.timestamp
        ));
        
        strategies[strategyHash] = Strategy({
            strategyHash: strategyHash,
            targetAssets: targetAssets,
            allocations: allocations,
            teeSignature: teeSignature,
            validUntil: block.timestamp + validityPeriod,
            executed: false
        });
        
        emit StrategySubmitted(msg.sender, strategyHash, block.timestamp + validityPeriod);
        
        return strategyHash;
    }

    /**
     * @notice Execute a previously submitted strategy
     * @param strategyHash Hash of the strategy to execute
     */
    function executeStrategy(bytes32 strategyHash) external nonReentrant whenNotPaused {
        Strategy storage strategy = strategies[strategyHash];
        
        if (strategy.strategyHash == bytes32(0)) revert InvalidParameters();
        if (strategy.executed) revert StrategyAlreadyExecuted();
        if (block.timestamp > strategy.validUntil) revert StrategyExpired();
        
        strategy.executed = true;
        totalStrategiesExecuted++;
        
        // Execute rebalancing logic here
        // In production, this would interact with DEXes, lending protocols, etc.
        _executeRebalance(strategy);
        
        emit StrategyExecuted(msg.sender, strategyHash, block.timestamp);
    }

    /**
     * @notice Trigger automatic rebalance for a portfolio
     * @param user Portfolio owner
     * @param deviation Current deviation from target (basis points)
     * @param strategy New strategy from TEE
     * @param teeSignature TEE attestation
     */
    function triggerAutoRebalance(
        address user,
        uint256 deviation,
        Strategy calldata strategy,
        bytes calldata teeSignature
    ) external nonReentrant whenNotPaused {
        Portfolio storage portfolio = portfolios[user];
        
        if (!portfolio.autoRebalance) revert UnauthorizedCaller();
        if (deviation < portfolio.rebalanceThreshold) revert InvalidParameters();
        if (block.timestamp < portfolio.lastAnalysis + minRebalanceInterval) {
            revert RebalanceTooFrequent();
        }
        
        // Verify TEE signature for automated execution
        if (!_verifyStrategySignature(user, strategy, teeSignature)) {
            revert InvalidTEESignature();
        }
        
        // Store strategy first, then execute
        bytes32 strategyHash = strategy.strategyHash;
        strategies[strategyHash] = strategy;
        strategies[strategyHash].executed = true;
        totalStrategiesExecuted++;
        
        _executeRebalance(strategies[strategyHash]);
        
        emit AutoRebalanceTriggered(user, strategyHash, deviation);
    }

    // ============ Internal Functions ============

    function _verifyTEESignature(
        address user,
        RiskReport calldata report,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(user, report))
        ));
        
        address recovered = _recoverSigner(messageHash, signature);
        return recovered == trustedIApp;
    }

    function _verifyStrategySignature(
        address user,
        Strategy calldata strategy,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(user, strategy.strategyHash, strategy.targetAssets))
        ));
        
        address recovered = _recoverSigner(messageHash, signature);
        return recovered == trustedIApp;
    }

    function _recoverSigner(
        bytes32 messageHash,
        bytes calldata signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        
        return ecrecover(messageHash, v, r, s);
    }

    function _executeRebalance(Strategy storage strategy) internal {
        // Implementation would execute swaps via DEX aggregator
        // For hackathon, this is a placeholder
        // In production: interact with 1inch, Paraswap, or direct DEX calls
    }

    // ============ View Functions ============

    /**
     * @notice Get portfolio details for a user
     */
    function getPortfolio(address user) external view returns (Portfolio memory) {
        return portfolios[user];
    }

    /**
     * @notice Get risk history for a user
     */
    function getRiskHistory(address user) external view returns (RiskReport[] memory) {
        return riskHistory[user];
    }

    /**
     * @notice Get latest risk report for a user
     */
    function getLatestRiskReport(address user) external view returns (RiskReport memory) {
        RiskReport[] storage history = riskHistory[user];
        if (history.length == 0) {
            return RiskReport(0, 0, 0, 0, 0, 0, 0, "");
        }
        return history[history.length - 1];
    }

    /**
     * @notice Check if a strategy is valid and executable
     */
    function isStrategyValid(bytes32 strategyHash) external view returns (bool) {
        Strategy storage strategy = strategies[strategyHash];
        return strategy.strategyHash != bytes32(0) &&
               !strategy.executed &&
               block.timestamp <= strategy.validUntil;
    }

    // ============ Admin Functions ============

    function setTrustedIApp(address _trustedIApp) external onlyOwner {
        emit TrustedIAppUpdated(trustedIApp, _trustedIApp);
        trustedIApp = _trustedIApp;
    }

    function setTrustedWorkerpool(address _trustedWorkerpool) external onlyOwner {
        emit TrustedWorkerpoolUpdated(trustedWorkerpool, _trustedWorkerpool);
        trustedWorkerpool = _trustedWorkerpool;
    }

    function setFees(uint256 _feeBps, address _feeRecipient) external onlyOwner {
        require(_feeBps <= 100, "Fee too high"); // Max 1%
        executionFeeBps = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeesUpdated(_feeBps, _feeRecipient);
    }

    function setMinRebalanceInterval(uint256 _interval) external onlyOwner {
        minRebalanceInterval = _interval;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw stuck tokens
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
