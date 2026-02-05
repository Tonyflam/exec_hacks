/**
 * PHANTOM Portfolio Aggregator
 * 
 * Aggregates DeFi positions across multiple protocols
 * Runs inside TEE to keep position data confidential
 */

import { ethers } from "ethers";

/**
 * Protocol ABIs for position fetching
 */
const PROTOCOL_CONFIGS = {
    aave: {
        poolAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave v3 Pool
        getPositionSelector: "getUserAccountData(address)"
    },
    compound: {
        comptrollerAddress: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
        getAssetsSelector: "getAssetsIn(address)"
    },
    uniswap: {
        positionManagerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        getPositionsSelector: "positions(uint256)"
    }
};

/**
 * Token price cache (would be fetched from oracle in production)
 */
const MOCK_PRICES = {
    "ETH": 3200,
    "WETH": 3200,
    "BTC": 95000,
    "WBTC": 95000,
    "USDC": 1,
    "USDT": 1,
    "DAI": 1,
    "ARB": 1.2,
    "LINK": 18,
    "UNI": 12,
    "AAVE": 280
};

export class PortfolioAggregator {
    constructor() {
        this.priceCache = MOCK_PRICES;
    }

    /**
     * Aggregate positions from protected data
     * @param {Object} protectedData - Decrypted portfolio configuration
     * @returns {Array} Aggregated positions with USD values
     */
    async aggregate(protectedData) {
        console.log("📊 Aggregating portfolio positions...");

        // Handle bulk mode (multiple datasets)
        if (protectedData.bulkMode) {
            return this.aggregateBulk(protectedData.datasets);
        }

        const positions = [];

        // Extract wallets and protocols from config
        const { wallets, protocols, manualPositions } = protectedData;

        // Process each wallet
        for (const wallet of wallets || []) {
            // Fetch positions from configured protocols
            for (const protocol of protocols || []) {
                const protocolPositions = await this.fetchProtocolPositions(
                    wallet,
                    protocol
                );
                positions.push(...protocolPositions);
            }
        }

        // Add manual positions from user input
        if (manualPositions && Array.isArray(manualPositions)) {
            const processed = manualPositions.map(p => this.processManualPosition(p));
            positions.push(...processed);
        }

        // Deduplicate and merge
        const merged = this.mergePositions(positions);

        // Calculate USD values
        const valued = this.calculateValues(merged);

        console.log(`✅ Found ${valued.length} unique positions`);
        return valued;
    }

    /**
     * Aggregate multiple datasets in bulk mode
     */
    async aggregateBulk(datasets) {
        console.log(`📦 Bulk mode: processing ${datasets.length} datasets`);

        const allPositions = [];

        for (const dataset of datasets) {
            const positions = await this.aggregate(dataset);
            allPositions.push({
                datasetId: dataset.id || "unknown",
                positions,
                totalValue: positions.reduce((sum, p) => sum + p.valueUsd, 0)
            });
        }

        return allPositions;
    }

    /**
     * Fetch positions from a specific protocol
     */
    async fetchProtocolPositions(wallet, protocol) {
        // In production, this would make RPC calls to fetch actual positions
        // For hackathon demo, we simulate based on protocol type

        console.log(`  Fetching ${protocol} positions for ${wallet.slice(0, 8)}...`);

        switch (protocol.toLowerCase()) {
            case "aave":
                return this.mockAavePositions(wallet);
            case "compound":
                return this.mockCompoundPositions(wallet);
            case "uniswap":
                return this.mockUniswapPositions(wallet);
            case "gmx":
                return this.mockGmxPositions(wallet);
            default:
                return [];
        }
    }

    /**
     * Mock Aave positions (would be real RPC calls in production)
     */
    mockAavePositions(wallet) {
        // Simulate lending/borrowing positions
        return [
            {
                id: `aave-supply-${wallet}-eth`,
                wallet,
                protocol: "Aave",
                type: "supply",
                asset: "WETH",
                amount: 2.5,
                apy: 2.1,
                healthFactor: 1.85
            },
            {
                id: `aave-borrow-${wallet}-usdc`,
                wallet,
                protocol: "Aave",
                type: "borrow",
                asset: "USDC",
                amount: 3000,
                apy: -4.2,
                healthFactor: 1.85
            }
        ];
    }

    /**
     * Mock Compound positions
     */
    mockCompoundPositions(wallet) {
        return [
            {
                id: `compound-supply-${wallet}-eth`,
                wallet,
                protocol: "Compound",
                type: "supply",
                asset: "ETH",
                amount: 1.2,
                apy: 1.8
            }
        ];
    }

    /**
     * Mock Uniswap LP positions
     */
    mockUniswapPositions(wallet) {
        return [
            {
                id: `uniswap-lp-${wallet}-eth-usdc`,
                wallet,
                protocol: "Uniswap",
                type: "lp",
                asset: "UNI-V3-ETH/USDC",
                pair: "ETH/USDC",
                amount: 1,
                token0Amount: 0.5,
                token1Amount: 1600,
                fee: 0.3,
                inRange: true
            }
        ];
    }

    /**
     * Mock GMX positions
     */
    mockGmxPositions(wallet) {
        return [
            {
                id: `gmx-perp-${wallet}-eth-long`,
                wallet,
                protocol: "GMX",
                type: "perpetual",
                asset: "ETH-PERP",
                side: "long",
                size: 5000,
                leverage: 3,
                entryPrice: 3100,
                markPrice: 3200,
                pnl: 161.29
            }
        ];
    }

    /**
     * Process manually entered positions
     */
    processManualPosition(position) {
        return {
            id: `manual-${position.asset}-${Date.now()}`,
            wallet: "manual",
            protocol: position.protocol || "Manual",
            type: position.type || "spot",
            asset: position.asset,
            amount: parseFloat(position.amount),
            customData: position.customData
        };
    }

    /**
     * Merge duplicate positions
     */
    mergePositions(positions) {
        const merged = new Map();

        for (const position of positions) {
            const key = `${position.protocol}-${position.type}-${position.asset}`;
            
            if (merged.has(key)) {
                const existing = merged.get(key);
                existing.amount += position.amount;
                if (position.pnl) existing.pnl = (existing.pnl || 0) + position.pnl;
            } else {
                merged.set(key, { ...position });
            }
        }

        return Array.from(merged.values());
    }

    /**
     * Calculate USD values for all positions
     */
    calculateValues(positions) {
        return positions.map(position => {
            let valueUsd = 0;

            // Get base asset price
            const baseAsset = position.asset.split("-")[0].replace("W", "");
            const price = this.priceCache[baseAsset] || this.priceCache[position.asset] || 0;

            switch (position.type) {
                case "supply":
                case "spot":
                    valueUsd = position.amount * price;
                    break;

                case "borrow":
                    valueUsd = position.amount * price;
                    break;

                case "lp":
                    // For LP, calculate from token amounts
                    const token0Price = this.priceCache[position.pair?.split("/")[0]] || 0;
                    const token1Price = this.priceCache[position.pair?.split("/")[1]] || 0;
                    valueUsd = (position.token0Amount || 0) * token0Price +
                               (position.token1Amount || 0) * token1Price;
                    break;

                case "perpetual":
                    valueUsd = position.size;
                    break;

                default:
                    valueUsd = position.amount * price;
            }

            return {
                ...position,
                priceUsd: price,
                valueUsd: Math.abs(valueUsd)
            };
        });
    }

    /**
     * Get total portfolio value
     */
    getTotalValue(positions) {
        return positions.reduce((sum, p) => sum + p.valueUsd, 0);
    }

    /**
     * Get net value (supplies - borrows)
     */
    getNetValue(positions) {
        const supplies = positions
            .filter(p => p.type !== "borrow")
            .reduce((sum, p) => sum + p.valueUsd, 0);
        
        const borrows = positions
            .filter(p => p.type === "borrow")
            .reduce((sum, p) => sum + p.valueUsd, 0);
        
        return supplies - borrows;
    }
}
