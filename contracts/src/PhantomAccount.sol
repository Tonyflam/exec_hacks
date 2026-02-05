// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title PhantomAccount
 * @notice ERC-4337 Smart Account for PHANTOM users
 * @dev Supports session keys for automated strategy execution
 */
contract PhantomAccount is BaseAccount, Initializable, UUPSUpgradeable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice EntryPoint contract
    IEntryPoint private immutable _entryPoint;
    
    /// @notice PhantomVault contract
    address public immutable phantomVault;
    
    /// @notice Account owner (EOA)
    address public owner;
    
    /// @notice Session key configurations
    struct SessionKey {
        address key;
        uint256 validUntil;
        uint256 spendLimit;
        uint256 spent;
        address[] allowedTargets;
        bytes4[] allowedSelectors;
        bool active;
    }
    
    /// @notice Mapping of session key address to config
    mapping(address => SessionKey) public sessionKeys;
    
    /// @notice Array of active session key addresses
    address[] public activeSessionKeys;

    // ============ Events ============

    event SessionKeyCreated(
        address indexed key,
        uint256 validUntil,
        uint256 spendLimit
    );
    
    event SessionKeyRevoked(address indexed key);
    
    event Executed(
        address indexed target,
        uint256 value,
        bytes data
    );
    
    event BatchExecuted(uint256 numCalls);

    // ============ Errors ============

    error NotOwner();
    error NotOwnerOrEntryPoint();
    error InvalidSessionKey();
    error SessionKeyExpired();
    error SpendLimitExceeded();
    error TargetNotAllowed();
    error SelectorNotAllowed();
    error ExecutionFailed();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ============ Constructor ============

    constructor(IEntryPoint anEntryPoint, address _phantomVault) {
        _entryPoint = anEntryPoint;
        phantomVault = _phantomVault;
        _disableInitializers();
    }

    // ============ Initialization ============

    function initialize(address _owner) public initializer {
        owner = _owner;
    }

    // ============ Account Implementation ============

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @notice Require that execution comes from EntryPoint or owner
     */
    function _requireForExecute() internal view override {
        if (msg.sender != address(_entryPoint) && msg.sender != owner) {
            revert NotFromEntryPoint(msg.sender, address(this), address(_entryPoint));
        }
    }

    /**
     * @notice Validate signature for user operation
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        
        // Try to recover signer from the signature
        if (userOp.signature.length < 65) {
            return SIG_VALIDATION_FAILED;
        }
        
        address recovered = hash.recover(userOp.signature);
        
        // Check if signed by owner
        if (recovered == owner) {
            return 0;
        }
        
        // Check if signed by valid session key
        SessionKey storage session = sessionKeys[recovered];
        if (session.active && block.timestamp <= session.validUntil) {
            // Validate session key constraints
            if (!_validateSessionKeyOp(session, userOp)) {
                return SIG_VALIDATION_FAILED;
            }
            return 0;
        }
        
        return SIG_VALIDATION_FAILED;
    }

    function _validateSessionKeyOp(
        SessionKey storage session,
        PackedUserOperation calldata userOp
    ) internal view returns (bool) {
        // Extract target and selector from callData
        if (userOp.callData.length < 4) return false;
        
        bytes4 selector = bytes4(userOp.callData[:4]);
        
        // For execute calls, extract inner target
        if (selector == this.execute.selector) {
            if (userOp.callData.length < 36) return false;
            address target = abi.decode(userOp.callData[4:36], (address));
            
            // Check target is allowed
            bool targetAllowed = false;
            for (uint i = 0; i < session.allowedTargets.length; i++) {
                if (session.allowedTargets[i] == target) {
                    targetAllowed = true;
                    break;
                }
            }
            if (!targetAllowed) return false;
        }
        
        return true;
    }

    // ============ Session Key Management ============

    /**
     * @notice Create a new session key
     * @param key The session key address
     * @param validUntil Expiration timestamp
     * @param spendLimit Maximum spending allowed
     * @param allowedTargets Addresses the key can interact with
     * @param allowedSelectors Function selectors the key can call
     */
    function createSessionKey(
        address key,
        uint256 validUntil,
        uint256 spendLimit,
        address[] calldata allowedTargets,
        bytes4[] calldata allowedSelectors
    ) external onlyOwner {
        sessionKeys[key] = SessionKey({
            key: key,
            validUntil: validUntil,
            spendLimit: spendLimit,
            spent: 0,
            allowedTargets: allowedTargets,
            allowedSelectors: allowedSelectors,
            active: true
        });
        
        activeSessionKeys.push(key);
        
        emit SessionKeyCreated(key, validUntil, spendLimit);
    }

    /**
     * @notice Create a PHANTOM-specific session key for automated rebalancing
     * @param key The session key address
     * @param duration How long the key is valid for
     */
    function createPhantomSessionKey(
        address key,
        uint256 duration
    ) external onlyOwner {
        address[] memory targets = new address[](1);
        targets[0] = phantomVault;
        
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = bytes4(keccak256("executeStrategy(bytes32)"));
        selectors[1] = bytes4(keccak256("submitStrategy(address[],uint256[],bytes,uint256)"));
        
        sessionKeys[key] = SessionKey({
            key: key,
            validUntil: block.timestamp + duration,
            spendLimit: type(uint256).max,
            spent: 0,
            allowedTargets: targets,
            allowedSelectors: selectors,
            active: true
        });
        
        activeSessionKeys.push(key);
        
        emit SessionKeyCreated(key, block.timestamp + duration, type(uint256).max);
    }

    /**
     * @notice Revoke a session key
     */
    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    // ============ View Functions ============

    function getSessionKey(address key) external view returns (SessionKey memory) {
        return sessionKeys[key];
    }

    function isSessionKeyActive(address key) external view returns (bool) {
        SessionKey storage session = sessionKeys[key];
        return session.active && block.timestamp <= session.validUntil;
    }

    // ============ UUPS ============

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ Receive ETH ============

    receive() external payable {}
}
