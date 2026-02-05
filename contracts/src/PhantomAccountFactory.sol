// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./PhantomAccount.sol";

/**
 * @title PhantomAccountFactory
 * @notice Factory for deploying ERC-4337 smart accounts for PHANTOM users
 * @dev Uses CREATE2 for deterministic addresses
 */
contract PhantomAccountFactory {
    
    /// @notice Implementation contract for proxies
    PhantomAccount public immutable accountImplementation;
    
    /// @notice EntryPoint contract
    IEntryPoint public immutable entryPoint;
    
    /// @notice PhantomVault contract
    address public immutable phantomVault;
    
    /// @notice Mapping of owner to their smart account
    mapping(address => address) public ownerToAccount;
    
    /// @notice Total accounts created
    uint256 public totalAccounts;

    // ============ Events ============

    event AccountCreated(
        address indexed owner,
        address indexed account,
        uint256 salt
    );

    // ============ Constructor ============

    constructor(IEntryPoint _entryPoint, address _phantomVault) {
        entryPoint = _entryPoint;
        phantomVault = _phantomVault;
        accountImplementation = new PhantomAccount(_entryPoint, _phantomVault);
    }

    // ============ Account Creation ============

    /**
     * @notice Create a new smart account for an owner
     * @param owner The EOA owner of the new account
     * @param salt Salt for CREATE2 address generation
     * @return account The address of the created account
     */
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (PhantomAccount account) {
        address addr = getAddress(owner, salt);
        
        // Return existing account if already deployed
        if (addr.code.length > 0) {
            return PhantomAccount(payable(addr));
        }
        
        // Deploy new account proxy
        account = PhantomAccount(payable(new ERC1967Proxy{salt: bytes32(salt)}(
            address(accountImplementation),
            abi.encodeCall(PhantomAccount.initialize, (owner))
        )));
        
        ownerToAccount[owner] = address(account);
        totalAccounts++;
        
        emit AccountCreated(owner, address(account), salt);
    }

    /**
     * @notice Compute the counterfactual address of an account
     * @param owner The EOA owner
     * @param salt Salt for CREATE2
     * @return The deterministic address
     */
    function getAddress(
        address owner,
        uint256 salt
    ) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(PhantomAccount.initialize, (owner))
                )
            ))
        );
    }

    /**
     * @notice Check if an account exists for an owner
     */
    function accountExists(address owner) external view returns (bool) {
        return ownerToAccount[owner] != address(0);
    }
}
