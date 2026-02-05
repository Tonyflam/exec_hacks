// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title PhantomPaymaster
 * @notice ERC-4337 Paymaster for gasless PHANTOM transactions
 * @dev Sponsors gas for verified TEE-generated strategy executions
 */
contract PhantomPaymaster is BasePaymaster {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice Trusted signer for off-chain sponsorship authorization
    address public verifyingSigner;
    
    /// @notice PhantomVault contract address
    address public phantomVault;
    
    /// @notice Mapping of user to their sponsored tx count
    mapping(address => uint256) public sponsoredTxCount;
    
    /// @notice Maximum sponsored transactions per user per day
    uint256 public maxDailySponsored = 10;
    
    /// @notice Mapping of user to daily reset timestamp
    mapping(address => uint256) public dailyResetTime;
    
    /// @notice Whitelisted function selectors for sponsorship
    mapping(bytes4 => bool) public whitelistedSelectors;

    // ============ Events ============

    event GasSponsored(
        address indexed user,
        bytes32 indexed userOpHash,
        uint256 gasUsed
    );
    
    event SignerUpdated(address oldSigner, address newSigner);
    event SelectorWhitelisted(bytes4 selector, bool status);

    // ============ Errors ============

    error InvalidSignature();
    error DailyLimitExceeded();
    error SelectorNotWhitelisted();
    error InvalidTarget();

    // ============ Constructor ============

    constructor(
        IEntryPoint _entryPoint,
        address _owner,
        address _verifyingSigner,
        address _phantomVault
    ) BasePaymaster(_entryPoint, _owner) {
        verifyingSigner = _verifyingSigner;
        phantomVault = _phantomVault;
        
        // Whitelist PHANTOM vault functions
        whitelistedSelectors[bytes4(keccak256("createPortfolio(bytes32,bool,uint256)"))] = true;
        whitelistedSelectors[bytes4(keccak256("updatePortfolio(bytes32,bool,uint256)"))] = true;
        whitelistedSelectors[bytes4(keccak256("executeStrategy(bytes32)"))] = true;
        whitelistedSelectors[bytes4(keccak256("submitStrategy(address[],uint256[],bytes,uint256)"))] = true;
    }

    // ============ Paymaster Validation ============

    /**
     * @notice Validate a user operation for sponsorship
     * @dev Called by EntryPoint during validation phase
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        (userOpHash); // silence unused warning
        
        // Extract signature from paymasterAndData
        bytes calldata paymasterData = userOp.paymasterAndData[PAYMASTER_DATA_OFFSET:];
        require(paymasterData.length >= 77, "Invalid paymaster data length");
        
        bytes calldata signature = paymasterData[0:65];
        uint48 validUntil = uint48(bytes6(paymasterData[65:71]));
        uint48 validAfter = uint48(bytes6(paymasterData[71:77]));
        
        // Verify the sponsorship signature
        bytes32 hash = getHash(userOp, validUntil, validAfter);
        address recovered = hash.toEthSignedMessageHash().recover(signature);
        
        if (recovered != verifyingSigner) {
            revert InvalidSignature();
        }
        
        // Check target is PhantomVault
        address target = _getTarget(userOp.callData);
        if (target != phantomVault) {
            revert InvalidTarget();
        }
        
        // Check function selector is whitelisted
        bytes4 selector = _getSelector(userOp.callData);
        if (!whitelistedSelectors[selector]) {
            revert SelectorNotWhitelisted();
        }
        
        // Check daily limit
        _checkAndUpdateDailyLimit(userOp.sender);
        
        // Return context for postOp
        context = abi.encode(userOp.sender, maxCost);
        validationData = _packValidationData(false, validUntil, validAfter);
    }

    /**
     * @notice Post-operation hook
     * @dev Called after user operation execution
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        (actualUserOpFeePerGas); // silence unused warning
        (address user, ) = abi.decode(context, (address, uint256));
        
        if (mode == PostOpMode.opSucceeded) {
            emit GasSponsored(user, bytes32(0), actualGasCost);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get hash for signature verification
     */
    function getHash(
        PackedUserOperation calldata userOp,
        uint48 validUntil,
        uint48 validAfter
    ) public view returns (bytes32) {
        return keccak256(abi.encode(
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.callData),
            block.chainid,
            address(this),
            validUntil,
            validAfter
        ));
    }

    // ============ Internal Functions ============

    function _getTarget(bytes calldata callData) internal pure returns (address target) {
        // For execute(address, uint256, bytes) format
        if (callData.length >= 36) {
            assembly {
                target := calldataload(add(callData.offset, 16))
            }
        }
    }

    function _getSelector(bytes calldata callData) internal pure returns (bytes4 selector) {
        if (callData.length >= 4) {
            assembly {
                selector := calldataload(callData.offset)
            }
        }
    }

    function _checkAndUpdateDailyLimit(address user) internal {
        uint256 resetTime = dailyResetTime[user];
        
        if (block.timestamp > resetTime + 1 days) {
            dailyResetTime[user] = block.timestamp;
            sponsoredTxCount[user] = 1;
        } else {
            if (sponsoredTxCount[user] >= maxDailySponsored) {
                revert DailyLimitExceeded();
            }
            sponsoredTxCount[user]++;
        }
    }

    // ============ Admin Functions ============

    function setVerifyingSigner(address _newSigner) external onlyOwner {
        emit SignerUpdated(verifyingSigner, _newSigner);
        verifyingSigner = _newSigner;
    }

    function setPhantomVault(address _vault) external onlyOwner {
        phantomVault = _vault;
    }

    function setMaxDailySponsored(uint256 _max) external onlyOwner {
        maxDailySponsored = _max;
    }

    function whitelistSelector(bytes4 _selector, bool _status) external onlyOwner {
        whitelistedSelectors[_selector] = _status;
        emit SelectorWhitelisted(_selector, _status);
    }
}
