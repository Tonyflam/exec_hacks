/**
 * PHANTOM Risk Engine
 * 
 * AI-powered risk analysis running inside TEE
 * Analyzes DeFi portfolio positions and generates risk scores
 */

/**
 * Risk weights for different factors (total = 100%)
 */
const RISK_WEIGHTS = {
    concentration: 0.25,    // Single asset exposure
    protocol: 0.20,         // Smart contract risk
    correlation: 0.15,      // Cross-asset correlation
    liquidity: 0.15,        // Exit liquidity
    impermanentLoss: 0.15,  // LP position IL risk
    leverage: 0.10          // Borrowing ratio
};

/**
 * Protocol risk scores (0-100, lower is safer)
 */
const PROTOCOL_RISK_SCORES = {
    "aave": 15,
    "compound": 18,
    "uniswap": 20,
    "curve": 22,
    "balancer": 25,
    "gmx": 35,
    "radiant": 40,
    "unknown": 50
};

export class RiskEngine {
    constructor() {
        this.weights = RISK_WEIGHTS;
        this.protocolScores = PROTOCOL_RISK_SCORES;
    }

    /**
     * Analyze portfolio positions and generate risk report
     * @param {Array} positions - Array of portfolio positions
     * @returns {Object} Risk report with scores and recommendations
     */
    async analyze(positions) {
        console.log("🔍 Running risk analysis...");

        // Calculate individual risk components
        const concentrationRisk = this.calculateConcentrationRisk(positions);
        const protocolRisk = this.calculateProtocolRisk(positions);
        const correlationRisk = this.calculateCorrelationRisk(positions);
        const liquidityRisk = this.calculateLiquidityRisk(positions);
        const ilRisk = this.calculateImpermanentLossRisk(positions);
        const leverageRisk = this.calculateLeverageRisk(positions);

        // Calculate weighted portfolio score
        const portfolioScore = this.calculatePortfolioScore({
            concentration: concentrationRisk,
            protocol: protocolRisk,
            correlation: correlationRisk,
            liquidity: liquidityRisk,
            impermanentLoss: ilRisk,
            leverage: leverageRisk
        });

        // Determine risk level
        const riskLevel = this.getRiskLevel(portfolioScore);

        // Generate recommendations
        const recommendations = this.generateRecommendations({
            positions,
            concentrationRisk,
            protocolRisk,
            correlationRisk,
            liquidityRisk,
            ilRisk,
            leverageRisk
        });

        // Generate alerts
        const alerts = this.generateAlerts({
            portfolioScore,
            concentrationRisk,
            leverageRisk,
            positions
        });

        return {
            portfolioScore: Math.round(portfolioScore),
            riskLevel,
            components: {
                concentrationRisk: Math.round(concentrationRisk),
                protocolRisk: Math.round(protocolRisk),
                correlationRisk: Math.round(correlationRisk),
                liquidityRisk: Math.round(liquidityRisk),
                impermanentLoss: Math.round(ilRisk),
                leverageRatio: Math.round(leverageRisk)
            },
            recommendations,
            alerts,
            analyzedAt: Date.now(),
            positionsAnalyzed: positions.length
        };
    }

    /**
     * Calculate concentration risk (single asset exposure)
     */
    calculateConcentrationRisk(positions) {
        if (positions.length === 0) return 0;

        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
        if (totalValue === 0) return 0;

        // Find largest position percentage
        const maxExposure = Math.max(...positions.map(p => p.valueUsd / totalValue));
        
        // HHI (Herfindahl-Hirschman Index) for concentration
        const hhi = positions.reduce((sum, p) => {
            const share = p.valueUsd / totalValue;
            return sum + (share * share);
        }, 0);

        // Normalize: HHI ranges from 1/n to 1
        // Risk score: 0 (diversified) to 100 (concentrated)
        const normalizedHHI = (hhi - 1/positions.length) / (1 - 1/positions.length);
        
        // Also factor in absolute max exposure
        const maxExposureRisk = maxExposure > 0.5 ? 100 : maxExposure * 200;
        
        return (normalizedHHI * 60 + maxExposureRisk * 40) / 100;
    }

    /**
     * Calculate protocol risk (smart contract risk)
     */
    calculateProtocolRisk(positions) {
        if (positions.length === 0) return 0;

        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
        if (totalValue === 0) return 0;

        // Weighted average of protocol risk scores
        const weightedRisk = positions.reduce((sum, p) => {
            const protocolScore = this.protocolScores[p.protocol.toLowerCase()] || 50;
            const weight = p.valueUsd / totalValue;
            return sum + (protocolScore * weight);
        }, 0);

        return weightedRisk;
    }

    /**
     * Calculate correlation risk (cross-asset correlation)
     */
    calculateCorrelationRisk(positions) {
        // Group by asset type
        const assetTypes = {};
        positions.forEach(p => {
            const type = this.getAssetType(p.asset);
            assetTypes[type] = (assetTypes[type] || 0) + p.valueUsd;
        });

        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
        if (totalValue === 0) return 0;

        // High correlation if dominated by single asset type
        const typeShares = Object.values(assetTypes).map(v => v / totalValue);
        const maxTypeShare = Math.max(...typeShares);

        // More than 70% in one type = high correlation risk
        if (maxTypeShare > 0.7) return 80;
        if (maxTypeShare > 0.5) return 50;
        return 20;
    }

    /**
     * Calculate liquidity risk (exit liquidity availability)
     */
    calculateLiquidityRisk(positions) {
        const liquidityScores = positions.map(p => {
            // Large positions in LP have higher liquidity risk
            if (p.type === "lp" && p.valueUsd > 100000) return 70;
            if (p.type === "lp") return 40;
            
            // Lending positions have moderate risk
            if (p.type === "lending") return 30;
            
            // Spot positions are most liquid
            return 10;
        });

        return liquidityScores.length > 0 
            ? liquidityScores.reduce((a, b) => a + b) / liquidityScores.length 
            : 0;
    }

    /**
     * Calculate impermanent loss risk for LP positions
     */
    calculateImpermanentLossRisk(positions) {
        const lpPositions = positions.filter(p => p.type === "lp");
        if (lpPositions.length === 0) return 0;

        const ilScores = lpPositions.map(p => {
            // Volatile pairs have higher IL risk
            if (p.pair && (p.pair.includes("ETH") || p.pair.includes("BTC"))) {
                return 40;
            }
            // Stablecoin pairs have lower risk
            if (p.pair && (p.pair.includes("USDC") || p.pair.includes("USDT"))) {
                return 15;
            }
            return 60; // Unknown pairs
        });

        const totalLpValue = lpPositions.reduce((sum, p) => sum + p.valueUsd, 0);
        const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
        
        const lpShare = totalValue > 0 ? totalLpValue / totalValue : 0;
        const averageIlRisk = ilScores.reduce((a, b) => a + b) / ilScores.length;
        
        // Weight by LP share of portfolio
        return averageIlRisk * lpShare;
    }

    /**
     * Calculate leverage risk
     */
    calculateLeverageRisk(positions) {
        const borrowed = positions
            .filter(p => p.type === "borrow")
            .reduce((sum, p) => sum + p.valueUsd, 0);
        
        const supplied = positions
            .filter(p => p.type === "supply" || p.type === "lending")
            .reduce((sum, p) => sum + p.valueUsd, 0);

        if (supplied === 0) return 0;

        const leverageRatio = borrowed / supplied;
        
        // Convert to risk score
        if (leverageRatio > 0.8) return 100; // Very high leverage
        if (leverageRatio > 0.6) return 75;
        if (leverageRatio > 0.4) return 50;
        if (leverageRatio > 0.2) return 25;
        return 10;
    }

    /**
     * Calculate weighted portfolio score
     */
    calculatePortfolioScore(components) {
        let score = 0;
        for (const [key, value] of Object.entries(components)) {
            const weight = this.weights[key] || 0;
            score += value * weight;
        }
        
        // Invert: high risk = low score for user display
        // But internally we track risk level
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Get risk level label
     */
    getRiskLevel(score) {
        if (score >= 75) return "critical";
        if (score >= 50) return "high";
        if (score >= 25) return "moderate";
        return "low";
    }

    /**
     * Get asset type for correlation analysis
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

    /**
     * Generate risk mitigation recommendations
     */
    generateRecommendations({ positions, concentrationRisk, protocolRisk, leverageRisk }) {
        const recommendations = [];

        // High concentration
        if (concentrationRisk > 50) {
            const largestPosition = positions.reduce((max, p) => 
                p.valueUsd > max.valueUsd ? p : max
            , { valueUsd: 0 });
            
            recommendations.push({
                priority: "high",
                action: "REDUCE",
                asset: largestPosition.asset,
                protocol: largestPosition.protocol,
                reason: "concentration_risk",
                suggestion: `Reduce ${largestPosition.asset} exposure by 20-30%`
            });
        }

        // High protocol risk
        if (protocolRisk > 40) {
            const riskyPositions = positions.filter(p => 
                (this.protocolScores[p.protocol.toLowerCase()] || 50) > 35
            );
            
            riskyPositions.forEach(p => {
                recommendations.push({
                    priority: "medium",
                    action: "MIGRATE",
                    asset: p.asset,
                    protocol: p.protocol,
                    reason: "protocol_risk",
                    suggestion: `Consider migrating to lower-risk protocol`
                });
            });
        }

        // High leverage
        if (leverageRisk > 60) {
            recommendations.push({
                priority: "critical",
                action: "DELEVERAGE",
                reason: "leverage_risk",
                suggestion: "Reduce borrowed positions to avoid liquidation risk"
            });
        }

        return recommendations;
    }

    /**
     * Generate alerts for critical conditions
     */
    generateAlerts({ portfolioScore, concentrationRisk, leverageRisk, positions }) {
        const alerts = [];

        if (portfolioScore > 75) {
            alerts.push({
                severity: "critical",
                title: "Portfolio Risk Critical",
                message: "Your portfolio risk score exceeds safe thresholds. Immediate action recommended."
            });
        }

        if (leverageRisk > 80) {
            alerts.push({
                severity: "critical",
                title: "High Liquidation Risk",
                message: "Current leverage puts you at risk of liquidation. Consider reducing borrowed positions."
            });
        }

        // Check for potential liquidation based on health factor
        const borrowPositions = positions.filter(p => p.type === "borrow");
        borrowPositions.forEach(p => {
            if (p.healthFactor && p.healthFactor < 1.2) {
                alerts.push({
                    severity: "critical",
                    title: `Low Health Factor: ${p.protocol}`,
                    message: `Health factor ${p.healthFactor.toFixed(2)} on ${p.protocol}. Risk of liquidation!`
                });
            }
        });

        return alerts;
    }
}
