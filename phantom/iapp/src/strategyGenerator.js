/**
 * PHANTOM Strategy Generator
 * 
 * AI-powered strategy generation running inside TEE
 * Generates rebalancing actions based on risk analysis
 */

import { ethers } from "ethers";

/**
 * Strategy constraints and limits
 */
const STRATEGY_LIMITS = {
    maxActionsPerStrategy: 10,
    maxSingleTradePercent: 25,     // Max 25% of portfolio in one trade
    minTradeValueUsd: 100,          // Minimum trade size
    maxSlippageBps: 100,            // 1% max slippage
    defaultValidityPeriod: 3600     // 1 hour
};

/**
 * Target allocations for different risk profiles
 */
const RISK_PROFILES = {
    conservative: {
        stablecoin: 0.50,
        eth: 0.30,
        btc: 0.15,
        altcoin: 0.05
    },
    moderate: {
        stablecoin: 0.30,
        eth: 0.40,
        btc: 0.20,
        altcoin: 0.10
    },
    aggressive: {
        stablecoin: 0.15,
        eth: 0.40,
        btc: 0.25,
        altcoin: 0.20
    }
};

export class StrategyGenerator {
    constructor() {
        this.limits = STRATEGY_LIMITS;
        this.riskProfiles = RISK_PROFILES;
    }

    /**
     * Generate rebalancing strategy based on positions and risk analysis
     * @param {Array} positions - Current portfolio positions
     * @param {Object} riskReport - Risk analysis results
     * @param {Object} config - User configuration
     * @returns {Object} Strategy with actions to execute
     */
    async generate(positions, riskReport, config = {}) {
        console.log("📋 Generating rebalancing strategy...");

        const {
            riskTolerance = "moderate",
            rebalanceThreshold = 500, // 5% in basis points
            autoExecute = false
        } = config;

        // Get target allocation for risk profile
        const targetAllocation = this.riskProfiles[riskTolerance] || this.riskProfiles.moderate;

        // Calculate current allocation
        const currentAllocation = this.calculateCurrentAllocation(positions);

        // Calculate deviations
        const deviations = this.calculateDeviations(currentAllocation, targetAllocation);

        // Check if rebalancing is needed
        const maxDeviation = Math.max(...Object.values(deviations).map(Math.abs));
        const needsRebalance = maxDeviation > (rebalanceThreshold / 100);

        if (!needsRebalance && riskReport.portfolioScore < 50) {
            console.log("✅ Portfolio within tolerance, no rebalancing needed");
            return {
                strategyType: "HOLD",
                actions: [],
                reason: "Portfolio within target allocation and risk tolerance",
                currentAllocation,
                targetAllocation,
                deviations,
                maxDeviation: maxDeviation * 100
            };
        }

        // Generate rebalancing actions
        const actions = this.generateActions(
            positions,
            currentAllocation,
            targetAllocation,
            deviations,
            riskReport
        );

        // Optimize action order
        const optimizedActions = this.optimizeActionOrder(actions);

        // Calculate expected outcomes
        const expectedOutcome = this.calculateExpectedOutcome(
            positions,
            optimizedActions,
            riskReport
        );

        // Generate strategy hash for on-chain verification
        const strategyHash = this.hashStrategy(optimizedActions);

        return {
            strategyType: "REBALANCE",
            strategyHash,
            actions: optimizedActions,
            currentAllocation,
            targetAllocation,
            deviations,
            maxDeviation: maxDeviation * 100,
            expectedOutcome,
            validUntil: Date.now() + this.limits.defaultValidityPeriod * 1000,
            autoExecute,
            estimatedGas: this.estimateGas(optimizedActions),
            estimatedSlippage: this.estimateSlippage(optimizedActions)
        };
    }

    /**
     * Calculate current portfolio allocation by asset type
     */
    calculateCurrentAllocation(positions) {
        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
        if (totalValue === 0) {
            return { stablecoin: 0, eth: 0, btc: 0, altcoin: 0 };
        }

        const allocation = { stablecoin: 0, eth: 0, btc: 0, altcoin: 0 };

        positions.forEach(position => {
            const type = this.getAssetType(position.asset);
            const share = position.valueUsd / totalValue;
            allocation[type] = (allocation[type] || 0) + share;
        });

        return allocation;
    }

    /**
     * Calculate deviation from target allocation
     */
    calculateDeviations(current, target) {
        const deviations = {};
        
        for (const [assetType, targetShare] of Object.entries(target)) {
            const currentShare = current[assetType] || 0;
            deviations[assetType] = currentShare - targetShare;
        }

        return deviations;
    }

    /**
     * Generate specific rebalancing actions
     */
    generateActions(positions, currentAllocation, targetAllocation, deviations, riskReport) {
        const actions = [];
        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);

        // Process risk-based recommendations first
        for (const rec of riskReport.recommendations || []) {
            if (rec.priority === "critical" || rec.priority === "high") {
                const action = this.createActionFromRecommendation(rec, positions, totalValue);
                if (action) actions.push(action);
            }
        }

        // Process allocation rebalancing
        for (const [assetType, deviation] of Object.entries(deviations)) {
            // Skip small deviations
            if (Math.abs(deviation) < 0.03) continue;

            if (deviation > 0) {
                // Overweight - need to sell
                const sellAction = this.createSellAction(
                    assetType,
                    deviation,
                    positions,
                    totalValue
                );
                if (sellAction) actions.push(sellAction);
            } else {
                // Underweight - need to buy
                const buyAction = this.createBuyAction(
                    assetType,
                    Math.abs(deviation),
                    positions,
                    totalValue
                );
                if (buyAction) actions.push(buyAction);
            }
        }

        // Limit number of actions
        return actions.slice(0, this.limits.maxActionsPerStrategy);
    }

    /**
     * Create action from risk recommendation
     */
    createActionFromRecommendation(rec, positions, totalValue) {
        switch (rec.action) {
            case "REDUCE":
                const position = positions.find(p => 
                    p.asset === rec.asset || p.protocol === rec.protocol
                );
                if (!position) return null;

                return {
                    type: "SELL",
                    asset: position.asset,
                    protocol: position.protocol,
                    amount: position.amount * 0.2, // Reduce by 20%
                    valueUsd: position.valueUsd * 0.2,
                    reason: rec.reason,
                    priority: rec.priority
                };

            case "DELEVERAGE":
                const borrowPositions = positions.filter(p => p.type === "borrow");
                if (borrowPositions.length === 0) return null;

                return {
                    type: "REPAY",
                    positions: borrowPositions.map(p => ({
                        asset: p.asset,
                        protocol: p.protocol,
                        amount: p.amount * 0.3 // Repay 30%
                    })),
                    reason: rec.reason,
                    priority: "critical"
                };

            default:
                return null;
        }
    }

    /**
     * Create sell action for overweight asset type
     */
    createSellAction(assetType, deviation, positions, totalValue) {
        const targetSellValue = deviation * totalValue;
        
        // Find positions of this asset type to sell
        const candidates = positions.filter(p => 
            this.getAssetType(p.asset) === assetType && p.type !== "borrow"
        );

        if (candidates.length === 0) return null;

        // Sort by value descending
        candidates.sort((a, b) => b.valueUsd - a.valueUsd);

        let remainingToSell = targetSellValue;
        const sellDetails = [];

        for (const position of candidates) {
            if (remainingToSell <= 0) break;

            const sellAmount = Math.min(
                position.valueUsd * (this.limits.maxSingleTradePercent / 100),
                remainingToSell
            );

            if (sellAmount >= this.limits.minTradeValueUsd) {
                sellDetails.push({
                    asset: position.asset,
                    protocol: position.protocol,
                    amount: (sellAmount / position.valueUsd) * position.amount,
                    valueUsd: sellAmount
                });
                remainingToSell -= sellAmount;
            }
        }

        if (sellDetails.length === 0) return null;

        return {
            type: "SELL",
            assetType,
            details: sellDetails,
            totalValueUsd: targetSellValue - remainingToSell,
            reason: `Reduce ${assetType} allocation by ${(deviation * 100).toFixed(1)}%`,
            priority: "medium"
        };
    }

    /**
     * Create buy action for underweight asset type
     */
    createBuyAction(assetType, deviation, positions, totalValue) {
        const targetBuyValue = deviation * totalValue;
        
        // Determine which asset to buy
        const assetToBuy = this.selectAssetToBuy(assetType);

        return {
            type: "BUY",
            assetType,
            asset: assetToBuy,
            valueUsd: Math.min(targetBuyValue, totalValue * (this.limits.maxSingleTradePercent / 100)),
            reason: `Increase ${assetType} allocation by ${(deviation * 100).toFixed(1)}%`,
            priority: "medium",
            suggestedProtocol: this.selectBestProtocol(assetToBuy)
        };
    }

    /**
     * Select best asset to buy for given type
     */
    selectAssetToBuy(assetType) {
        const preferences = {
            stablecoin: "USDC",
            eth: "WETH",
            btc: "WBTC",
            altcoin: "ARB"
        };
        return preferences[assetType] || "USDC";
    }

    /**
     * Select best protocol for trading
     */
    selectBestProtocol(asset) {
        // Would use real liquidity data in production
        return "Uniswap";
    }

    /**
     * Optimize action order (sells before buys)
     */
    optimizeActionOrder(actions) {
        // Priority order: critical > high > medium
        // Type order: REPAY > SELL > BUY
        const priorityWeight = { critical: 100, high: 50, medium: 10 };
        const typeWeight = { REPAY: 30, SELL: 20, BUY: 10 };

        return actions.sort((a, b) => {
            const scoreA = (priorityWeight[a.priority] || 0) + (typeWeight[a.type] || 0);
            const scoreB = (priorityWeight[b.priority] || 0) + (typeWeight[b.type] || 0);
            return scoreB - scoreA;
        });
    }

    /**
     * Calculate expected outcome after strategy execution
     */
    calculateExpectedOutcome(positions, actions, riskReport) {
        // Simulate position changes
        let projectedRiskScore = riskReport.portfolioScore;
        let totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);

        // Estimate risk reduction per action
        for (const action of actions) {
            if (action.type === "REPAY") {
                projectedRiskScore -= 15; // Deleveraging significantly reduces risk
            } else if (action.type === "SELL" && action.reason?.includes("concentration")) {
                projectedRiskScore -= 10;
            } else {
                projectedRiskScore -= 3;
            }
        }

        return {
            projectedRiskScore: Math.max(0, projectedRiskScore),
            riskReduction: riskReport.portfolioScore - Math.max(0, projectedRiskScore),
            estimatedPortfolioValue: totalValue * 0.998 // Assume 0.2% slippage
        };
    }

    /**
     * Hash strategy for on-chain verification
     */
    hashStrategy(actions) {
        const data = JSON.stringify(actions.map(a => ({
            type: a.type,
            asset: a.asset,
            valueUsd: Math.round(a.valueUsd || 0)
        })));
        return ethers.keccak256(ethers.toUtf8Bytes(data));
    }

    /**
     * Estimate gas for strategy execution
     */
    estimateGas(actions) {
        // Rough gas estimates per action type
        const gasPerType = {
            SELL: 150000,
            BUY: 150000,
            REPAY: 200000
        };

        return actions.reduce((total, action) => {
            return total + (gasPerType[action.type] || 100000);
        }, 50000); // Base cost
    }

    /**
     * Estimate expected slippage
     */
    estimateSlippage(actions) {
        const totalValue = actions.reduce((sum, a) => sum + (a.valueUsd || 0), 0);
        
        // Larger trades have more slippage
        if (totalValue > 100000) return 100; // 1%
        if (totalValue > 50000) return 50;   // 0.5%
        if (totalValue > 10000) return 30;   // 0.3%
        return 10; // 0.1%
    }

    /**
     * Get asset type for allocation
     */
    getAssetType(asset) {
        const stables = ["USDC", "USDT", "DAI", "FRAX", "LUSD"];
        const eth = ["ETH", "WETH", "stETH", "rETH", "cbETH"];
        const btc = ["BTC", "WBTC", "tBTC"];
        
        if (stables.includes(asset)) return "stablecoin";
        if (eth.includes(asset)) return "eth";
        if (btc.includes(asset)) return "btc";
        return "altcoin";
    }
}
