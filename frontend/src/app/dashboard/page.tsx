'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  Shield, TrendingUp, TrendingDown, AlertTriangle, 
  ChevronRight, Clock, Zap, Lock, RefreshCw,
  PieChart, BarChart3, Activity, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent, getRiskColor, getRiskLabel } from '@/lib/utils';
import { RiskGauge } from '@/components/risk-gauge';
import { PositionCard } from '@/components/position-card';
import { ActivityFeed } from '@/components/activity-feed';

// Mock data for demonstration
const mockPortfolio = {
  totalValue: 125420.50,
  change24h: 3.24,
  riskScore: 42,
  lastAnalysis: Date.now() - 3600000,
  positions: [
    { id: 1, protocol: 'Aave', type: 'supply', asset: 'WETH', amount: 5.2, valueUsd: 16640, apy: 2.1 },
    { id: 2, protocol: 'Aave', type: 'borrow', asset: 'USDC', amount: 8000, valueUsd: 8000, apy: -4.2 },
    { id: 3, protocol: 'Uniswap', type: 'lp', asset: 'ETH/USDC', amount: 1, valueUsd: 25000, apy: 12.5 },
    { id: 4, protocol: 'GMX', type: 'perpetual', asset: 'ETH-LONG', amount: 3, valueUsd: 15000, pnl: 1250 },
    { id: 5, protocol: 'Compound', type: 'supply', asset: 'WBTC', amount: 0.5, valueUsd: 47500, apy: 0.8 },
  ],
  allocation: {
    eth: 35,
    btc: 38,
    stablecoins: 18,
    other: 9,
  },
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect if not connected
  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to view your dashboard</p>
          <Link href="/#connect">
            <button className="phantom-button">Connect Wallet</button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate TEE analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    setPortfolio(prev => ({
      ...prev,
      riskScore: Math.floor(Math.random() * 30) + 30,
      lastAnalysis: Date.now(),
    }));
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Dashboard</h1>
          <p className="text-gray-400">
            Your confidential DeFi overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="phantom-button flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Total Value</span>
            <Wallet className="w-5 h-5 text-phantom-purple" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div className={`text-sm flex items-center gap-1 ${
            portfolio.change24h >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {portfolio.change24h >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatPercent(portfolio.change24h)} (24h)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Risk Score</span>
            <Activity className="w-5 h-5 text-phantom-blue" />
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${getRiskColor(portfolio.riskScore)}`}>
              {portfolio.riskScore}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              portfolio.riskScore < 25 ? 'bg-green-500/20 text-green-500' :
              portfolio.riskScore < 50 ? 'bg-yellow-500/20 text-yellow-500' :
              portfolio.riskScore < 75 ? 'bg-orange-500/20 text-orange-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {getRiskLabel(portfolio.riskScore)}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last analyzed {Math.floor((Date.now() - portfolio.lastAnalysis) / 60000)}m ago
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Active Positions</span>
            <BarChart3 className="w-5 h-5 text-phantom-cyan" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {portfolio.positions.length}
          </div>
          <div className="text-sm text-gray-400">
            Across {new Set(portfolio.positions.map(p => p.protocol)).size} protocols
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Privacy Status</span>
            <Lock className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white font-medium">Protected</span>
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Data encrypted in TEE
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk Gauge & Allocation */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Risk Analysis</h3>
            <RiskGauge score={portfolio.riskScore} />
            <div className="mt-6 space-y-3">
              {[
                { label: 'Concentration', value: 35, color: 'bg-yellow-500' },
                { label: 'Protocol Risk', value: 22, color: 'bg-green-500' },
                { label: 'Leverage', value: 45, color: 'bg-orange-500' },
                { label: 'Liquidity', value: 18, color: 'bg-green-500' },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Allocation</h3>
            <div className="space-y-3">
              {Object.entries(portfolio.allocation).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{key}</span>
                    <span className="text-white">{value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-phantom-purple to-phantom-blue rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Positions</h3>
              <Link href="/analyze">
                <button className="text-sm text-phantom-purple hover:text-phantom-blue transition-colors flex items-center gap-1">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="space-y-3">
              {portfolio.positions.map((position, index) => (
                <PositionCard key={position.id} position={position} index={index} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid md:grid-cols-3 gap-4"
      >
        {[
          {
            title: 'Run Full Analysis',
            description: 'Deep risk assessment in TEE',
            icon: Shield,
            href: '/analyze',
            color: 'from-purple-500 to-blue-500',
          },
          {
            title: 'Execute Strategy',
            description: 'Rebalance with MEV protection',
            icon: Zap,
            href: '/execute',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            title: 'Configure Automation',
            description: 'Set up gasless auto-rebalance',
            icon: RefreshCw,
            href: '/settings',
            color: 'from-cyan-500 to-green-500',
          },
        ].map((action, index) => (
          <Link key={index} href={action.href}>
            <div className="glass-card p-6 card-hover cursor-pointer group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
              <p className="text-sm text-gray-400">{action.description}</p>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
