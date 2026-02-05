// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/PhantomVault.sol";
import "../src/PhantomPaymaster.sol";
import "../src/PhantomAccountFactory.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title DeployPhantom
 * @notice Deploy all PHANTOM contracts to Arbitrum Sepolia
 */
contract DeployPhantom is Script {
    // Arbitrum Sepolia addresses
    // ERC-4337 v0.7 EntryPoint
    address constant ENTRY_POINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    address constant IEXEC_WORKERPOOL = 0x2C06263943180Cc024dAFfeEe15612DB6e5fD248;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PHANTOM contracts...");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy PhantomVault
        // Note: trustedIApp will be updated after iApp deployment
        PhantomVault vault = new PhantomVault(
            address(0), // Will update with iApp address
            IEXEC_WORKERPOOL,
            deployer
        );
        console.log("PhantomVault deployed at:", address(vault));
        
        // Deploy PhantomAccountFactory
        PhantomAccountFactory factory = new PhantomAccountFactory(
            IEntryPoint(ENTRY_POINT),
            address(vault)
        );
        console.log("PhantomAccountFactory deployed at:", address(factory));
        
        // Deploy PhantomPaymaster
        PhantomPaymaster paymaster = new PhantomPaymaster(
            IEntryPoint(ENTRY_POINT),
            deployer, // Owner
            deployer, // Verifying signer
            address(vault)
        );
        console.log("PhantomPaymaster deployed at:", address(paymaster));
        
        // Note: Fund paymaster with ETH separately after deployment
        // paymaster.deposit{value: 0.01 ether}();
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== PHANTOM Deployment Summary ===");
        console.log("Network: Arbitrum Sepolia");
        console.log("PhantomVault:", address(vault));
        console.log("PhantomAccountFactory:", address(factory));
        console.log("PhantomPaymaster:", address(paymaster));
        console.log("EntryPoint:", ENTRY_POINT);
        console.log("iExec Workerpool:", IEXEC_WORKERPOOL);
        console.log("\nNEXT STEPS:");
        console.log("1. Deploy iApp and get its address");
        console.log("2. Call vault.setTrustedIApp(iAppAddress)");
    }
}

/**
 * @title UpdateIAppAddress
 * @notice Update the trusted iApp address after deployment
 */
contract UpdateIAppAddress is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = vm.envAddress("PHANTOM_VAULT");
        address iAppAddress = vm.envAddress("IAPP_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PhantomVault vault = PhantomVault(vaultAddress);
        vault.setTrustedIApp(iAppAddress);
        
        console.log("Updated trusted iApp to:", iAppAddress);
        
        vm.stopBroadcast();
    }
}
