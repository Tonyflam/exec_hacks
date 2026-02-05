// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/PhantomVault.sol";

/**
 * @title DeploySimple
 * @notice Deploy just PhantomVault to Arbitrum Sepolia
 */
contract DeploySimple is Script {
    address constant IEXEC_WORKERPOOL = 0x2C06263943180Cc024dAFfeEe15612DB6e5fD248;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PHANTOM Vault...");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy PhantomVault
        PhantomVault vault = new PhantomVault(
            address(0), // Will update with iApp address
            IEXEC_WORKERPOOL,
            deployer
        );
        console.log("PhantomVault deployed at:", address(vault));
        
        vm.stopBroadcast();
        
        console.log("\n=== PHANTOM Deployment Summary ===");
        console.log("PhantomVault:", address(vault));
    }
}
