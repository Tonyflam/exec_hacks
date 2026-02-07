// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/PhantomVault.sol";

contract PhantomVaultTest is Test {
    PhantomVault public vault;

    address public owner = address(this);
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public trustedIApp = makeAddr("iApp");
    address public workerpool = makeAddr("workerpool");
    address public feeRecipient = makeAddr("feeRecipient");

    uint256 internal iAppKey;

    event PortfolioCreated(address indexed owner, bytes32 protectedDataId, uint256 timestamp);
    event PortfolioUpdated(address indexed owner, bytes32 newProtectedDataId, uint256 timestamp);
    event StrategySubmitted(address indexed owner, bytes32 indexed strategyHash, uint256 validUntil);
    event StrategyExecuted(address indexed owner, bytes32 indexed strategyHash, uint256 timestamp);
    event TrustedIAppUpdated(address oldIApp, address newIApp);
    event TrustedWorkerpoolUpdated(address oldPool, address newPool);

    function setUp() public {
        // Create a real key pair for the trustedIApp so we can sign
        iAppKey = 0xA11CE;
        trustedIApp = vm.addr(iAppKey);

        vault = new PhantomVault(trustedIApp, workerpool, feeRecipient);
    }

    // ============ Constructor Tests ============

    function test_Constructor() public view {
        assertEq(vault.trustedIApp(), trustedIApp);
        assertEq(vault.trustedWorkerpool(), workerpool);
        assertEq(vault.feeRecipient(), feeRecipient);
        assertEq(vault.owner(), owner);
        assertEq(vault.totalPortfolios(), 0);
        assertEq(vault.totalStrategiesExecuted(), 0);
        assertEq(vault.executionFeeBps(), 10);
        assertEq(vault.minRebalanceInterval(), 1 hours);
    }

    // ============ Portfolio Management Tests ============

    function test_CreatePortfolio() public {
        bytes32 protectedDataId = keccak256("portfolio-data-1");

        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit PortfolioCreated(user1, protectedDataId, block.timestamp);
        vault.createPortfolio(protectedDataId, true, 500);

        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.owner, user1);
        assertEq(portfolio.protectedDataId, protectedDataId);
        assertTrue(portfolio.autoRebalance);
        assertEq(portfolio.rebalanceThreshold, 500);
        assertEq(portfolio.createdAt, block.timestamp);
        assertEq(vault.totalPortfolios(), 1);
    }

    function test_CreatePortfolio_RevertOnZeroId() public {
        vm.prank(user1);
        vm.expectRevert(PhantomVault.InvalidParameters.selector);
        vault.createPortfolio(bytes32(0), false, 100);
    }

    function test_CreatePortfolio_RevertOnHighThreshold() public {
        vm.prank(user1);
        vm.expectRevert(PhantomVault.InvalidParameters.selector);
        vault.createPortfolio(keccak256("data"), false, 5001);
    }

    function test_CreatePortfolio_MaxThreshold() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 5000);

        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.rebalanceThreshold, 5000);
    }

    function test_CreateMultiplePortfolios() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data1"), true, 500);

        vm.prank(user2);
        vault.createPortfolio(keccak256("data2"), false, 1000);

        assertEq(vault.totalPortfolios(), 2);

        PhantomVault.Portfolio memory p1 = vault.getPortfolio(user1);
        PhantomVault.Portfolio memory p2 = vault.getPortfolio(user2);
        assertEq(p1.owner, user1);
        assertEq(p2.owner, user2);
    }

    function test_UpdatePortfolio() public {
        bytes32 dataId1 = keccak256("data1");
        bytes32 dataId2 = keccak256("data2");

        vm.prank(user1);
        vault.createPortfolio(dataId1, false, 100);

        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit PortfolioUpdated(user1, dataId2, block.timestamp);
        vault.updatePortfolio(dataId2, true, 750);

        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.protectedDataId, dataId2);
        assertTrue(portfolio.autoRebalance);
        assertEq(portfolio.rebalanceThreshold, 750);
    }

    function test_UpdatePortfolio_KeepDataId() public {
        bytes32 dataId = keccak256("data1");

        vm.prank(user1);
        vault.createPortfolio(dataId, false, 100);

        vm.prank(user1);
        vault.updatePortfolio(bytes32(0), true, 200);

        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.protectedDataId, dataId); // unchanged
        assertTrue(portfolio.autoRebalance);
    }

    function test_UpdatePortfolio_RevertIfNotCreated() public {
        vm.prank(user1);
        vm.expectRevert(PhantomVault.PortfolioNotFound.selector);
        vault.updatePortfolio(keccak256("data"), false, 100);
    }

    // ============ Strategy Tests ============

    function test_SubmitStrategy() public {
        // Create portfolio first
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](2);
        assets[0] = makeAddr("WETH");
        assets[1] = makeAddr("USDC");

        uint256[] memory allocations = new uint256[](2);
        allocations[0] = 6000; // 60%
        allocations[1] = 4000; // 40%

        vm.prank(user1);
        bytes32 strategyHash = vault.submitStrategy(
            assets,
            allocations,
            abi.encodePacked(bytes32(0)),
            1 hours
        );

        assertTrue(strategyHash != bytes32(0));
        assertTrue(vault.isStrategyValid(strategyHash));
    }

    function test_SubmitStrategy_RevertMismatchedArrays() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](2);
        assets[0] = makeAddr("WETH");
        assets[1] = makeAddr("USDC");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        vm.expectRevert(PhantomVault.InvalidParameters.selector);
        vault.submitStrategy(assets, allocations, "", 1 hours);
    }

    function test_SubmitStrategy_RevertNoPortfolio() public {
        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        vm.expectRevert(PhantomVault.PortfolioNotFound.selector);
        vault.submitStrategy(assets, allocations, "", 1 hours);
    }

    function test_SubmitStrategy_RevertLongValidity() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        vm.expectRevert(PhantomVault.InvalidParameters.selector);
        vault.submitStrategy(assets, allocations, "", 25 hours);
    }

    function test_ExecuteStrategy() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        bytes32 strategyHash = vault.submitStrategy(assets, allocations, "", 1 hours);

        vm.prank(user1);
        vault.executeStrategy(strategyHash);

        assertFalse(vault.isStrategyValid(strategyHash));
        assertEq(vault.totalStrategiesExecuted(), 1);
    }

    function test_ExecuteStrategy_RevertAlreadyExecuted() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        bytes32 strategyHash = vault.submitStrategy(assets, allocations, "", 1 hours);

        vm.prank(user1);
        vault.executeStrategy(strategyHash);

        vm.prank(user1);
        vm.expectRevert(PhantomVault.StrategyAlreadyExecuted.selector);
        vault.executeStrategy(strategyHash);
    }

    function test_ExecuteStrategy_RevertExpired() public {
        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);

        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");

        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        bytes32 strategyHash = vault.submitStrategy(assets, allocations, "", 1 hours);

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 hours);

        vm.prank(user1);
        vm.expectRevert(PhantomVault.StrategyExpired.selector);
        vault.executeStrategy(strategyHash);
    }

    // ============ Risk Analysis Tests ============

    function test_GetLatestRiskReport_Empty() public view {
        PhantomVault.RiskReport memory report = vault.getLatestRiskReport(user1);
        assertEq(report.portfolioScore, 0);
        assertEq(report.timestamp, 0);
    }

    function test_GetRiskHistory_Empty() public view {
        PhantomVault.RiskReport[] memory history = vault.getRiskHistory(user1);
        assertEq(history.length, 0);
    }

    // ============ View Function Tests ============

    function test_IsStrategyValid_NonExistent() public view {
        assertFalse(vault.isStrategyValid(keccak256("fake")));
    }

    function test_GetPortfolio_NonExistent() public view {
        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.owner, address(0));
    }

    // ============ Admin Function Tests ============

    function test_SetTrustedIApp() public {
        address newIApp = makeAddr("newIApp");

        vm.expectEmit(true, true, true, true);
        emit TrustedIAppUpdated(trustedIApp, newIApp);
        vault.setTrustedIApp(newIApp);

        assertEq(vault.trustedIApp(), newIApp);
    }

    function test_SetTrustedIApp_RevertNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        vault.setTrustedIApp(makeAddr("newIApp"));
    }

    function test_SetTrustedWorkerpool() public {
        address newPool = makeAddr("newPool");

        vm.expectEmit(true, true, true, true);
        emit TrustedWorkerpoolUpdated(workerpool, newPool);
        vault.setTrustedWorkerpool(newPool);

        assertEq(vault.trustedWorkerpool(), newPool);
    }

    function test_SetFees() public {
        vault.setFees(50, makeAddr("newFeeRecipient"));
        assertEq(vault.executionFeeBps(), 50);
        assertEq(vault.feeRecipient(), makeAddr("newFeeRecipient"));
    }

    function test_SetFees_RevertTooHigh() public {
        vm.expectRevert("Fee too high");
        vault.setFees(101, feeRecipient);
    }

    function test_SetFees_MaxAllowed() public {
        vault.setFees(100, feeRecipient); // 1% max
        assertEq(vault.executionFeeBps(), 100);
    }

    function test_SetMinRebalanceInterval() public {
        vault.setMinRebalanceInterval(2 hours);
        assertEq(vault.minRebalanceInterval(), 2 hours);
    }

    function test_Pause() public {
        vault.pause();

        vm.prank(user1);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.createPortfolio(keccak256("data"), false, 500);
    }

    function test_Unpause() public {
        vault.pause();
        vault.unpause();

        vm.prank(user1);
        vault.createPortfolio(keccak256("data"), false, 500);
        assertEq(vault.totalPortfolios(), 1);
    }

    function test_Pause_RevertNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        vault.pause();
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreatePortfolio(bytes32 dataId, uint256 threshold) public {
        vm.assume(dataId != bytes32(0));
        threshold = bound(threshold, 0, 5000);

        vm.prank(user1);
        vault.createPortfolio(dataId, true, threshold);

        PhantomVault.Portfolio memory portfolio = vault.getPortfolio(user1);
        assertEq(portfolio.protectedDataId, dataId);
        assertEq(portfolio.rebalanceThreshold, threshold);
    }

    function testFuzz_SetFees(uint256 feeBps) public {
        feeBps = bound(feeBps, 0, 100);
        vault.setFees(feeBps, feeRecipient);
        assertEq(vault.executionFeeBps(), feeBps);
    }

    // ============ Integration Tests ============

    function test_FullWorkflow() public {
        // 1. Create portfolio
        bytes32 dataId = keccak256("protected-portfolio");
        vm.prank(user1);
        vault.createPortfolio(dataId, true, 500);

        // 2. Submit strategy
        address[] memory assets = new address[](2);
        assets[0] = makeAddr("WETH");
        assets[1] = makeAddr("USDC");

        uint256[] memory allocations = new uint256[](2);
        allocations[0] = 6000;
        allocations[1] = 4000;

        vm.prank(user1);
        bytes32 strategyHash = vault.submitStrategy(
            assets,
            allocations,
            abi.encodePacked(bytes32(0)),
            1 hours
        );

        // 3. Verify strategy is valid
        assertTrue(vault.isStrategyValid(strategyHash));

        // 4. Execute strategy
        vm.prank(user1);
        vault.executeStrategy(strategyHash);

        // 5. Verify execution
        assertFalse(vault.isStrategyValid(strategyHash));
        assertEq(vault.totalStrategiesExecuted(), 1);
        assertEq(vault.totalPortfolios(), 1);
    }

    function test_MultipleUsersWorkflow() public {
        // User 1 creates portfolio and executes strategy
        vm.prank(user1);
        vault.createPortfolio(keccak256("data1"), true, 500);

        address[] memory assets = new address[](1);
        assets[0] = makeAddr("WETH");
        uint256[] memory allocations = new uint256[](1);
        allocations[0] = 10000;

        vm.prank(user1);
        bytes32 hash1 = vault.submitStrategy(assets, allocations, "", 1 hours);

        vm.prank(user1);
        vault.executeStrategy(hash1);

        // User 2 creates portfolio and executes strategy
        vm.prank(user2);
        vault.createPortfolio(keccak256("data2"), false, 1000);

        vm.prank(user2);
        bytes32 hash2 = vault.submitStrategy(assets, allocations, "", 1 hours);

        vm.prank(user2);
        vault.executeStrategy(hash2);

        assertEq(vault.totalPortfolios(), 2);
        assertEq(vault.totalStrategiesExecuted(), 2);
    }
}
