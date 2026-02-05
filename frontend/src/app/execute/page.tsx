'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Zap, Shield, Lock, Loader2, CheckCircle, AlertTriangle,
  ArrowRight, TrendingUp, TrendingDown, Wallet, Clock,
  Settings, ChevronDown
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Mock strategy from analysis
const mockStrategy = {
  strategyType: 'REBALANCE',
  actions: [
    {
      type: 'SELL',
      asset: 'WETH',
      protocol: 'Aave',
      amount: 0.5,
      valueUsd: 1600,
      reason: 'Reduce concentration risk',
    },
    {
      type: 'BUY',
      asset: 'USDC',
      protocol: 'Uniswap',
      valueUsd: 1600,
      reason: 'Increase stablecoin allocation',
    },
    {
      type: 'REPAY',
      asset: 'USDC',
      protocol: 'Aave',
      amount: 500,
      valueUsd: 500,
      reason: 'Reduce leverage',
    },
  ],
  expectedOutcome: {
    projectedRiskScore: 28,
    riskReduction: 14,
    estimatedPortfolioValue: 125100,
  },
  estimatedGas: 450000,
  estimatedSlippage: 30,
};

const executionSteps = [
  { id: 'validate', label: 'Validating TEE signature' },
  { id: 'build', label: 'Building transaction bundle' },
  { id: 'sign', label: 'Signing with smart account' },
  { id: 'submit', label: 'Submitting to bundler' },
  { id: 'confirm', label: 'Waiting for confirmation' },
];

export default function ExecutePage() {
  const { address, isConnected } = useAccount();
  const [strategy] = useState(mockStrategy);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [usePaymaster, setUsePaymaster] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);

  const executeStrategy = async () => {
    setIsExecuting(true);
    setCurrentStep(0);
    setExecutionResult(null);

    // Simulate execution steps
    for (let i = 0; i < executionSteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    setExecutionResult({
      success: true,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      gasUsed: 385000,
      gasCost: usePaymaster ? 0 : 0.0012,
      newRiskScore: 28,
      timestamp: Date.now(),
    });

    setIsExecuting(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect to execute strategies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-phantom-blue/20 border border-phantom-blue/30 mb-6">
            <Zap className="w-4 h-4 text-phantom-blue" />
            <span className="text-sm text-phantom-blue">MEV Protected Execution</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Execute Strategy
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Execute your TEE-generated strategy with Account Abstraction. 
            Gasless, automated, and protected from MEV.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isExecuting && !executionResult ? (
            <motion.div
              key="strategy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Strategy Overview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Strategy Actions</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield className="w-4 h-4" />
                    TEE Verified
                  </div>
                </div>

                <div className="space-y-3">
                  {strategy.actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.type === 'SELL' ? 'bg-red-500/20' :
                        action.type === 'BUY' ? 'bg-green-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        {action.type === 'SELL' ? (
                          <TrendingDown className={`w-5 h-5 text-red-400`} />
                        ) : action.type === 'BUY' ? (
                          <TrendingUp className={`w-5 h-5 text-green-400`} />
                        ) : (
                          <ArrowRight className={`w-5 h-5 text-yellow-400`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {action.type} {action.amount ? `${action.amount} ` : ''}{action.asset}
                        </div>
                        <div className="text-sm text-gray-400">
                          {action.protocol} • {action.reason}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {formatCurrency(action.valueUsd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Outcome */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Expected Outcome</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      -{strategy.expectedOutcome.riskReduction}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Risk Reduction</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-2xl font-bold text-phantom-purple">
                      {strategy.expectedOutcome.projectedRiskScore}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">New Risk Score</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-2xl font-bold text-white">
                      ~{strategy.estimatedSlippage/100}%
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Est. Slippage</div>
                  </div>
                </div>
              </div>

              {/* Account Abstraction Options */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Execution Options</h3>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-phantom-purple/20">
                    <Wallet className="w-4 h-4 text-phantom-purple" />
                    <span className="text-sm text-phantom-purple">ERC-4337</span>
                  </div>
                </div>

                {/* Gasless Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mb-4">
                  <div>
                    <div className="font-medium text-white">Gasless Transaction</div>
                    <div className="text-sm text-gray-400">Gas sponsored by PHANTOM paymaster</div>
                  </div>
                  <button
                    onClick={() => setUsePaymaster(!usePaymaster)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      usePaymaster ? 'bg-phantom-purple' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        usePaymaster ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Advanced Settings */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 block mb-2">
                            Slippage Tolerance
                          </label>
                          <div className="flex gap-2">
                            {[0.1, 0.5, 1.0].map((value) => (
                              <button
                                key={value}
                                onClick={() => setSlippageTolerance(value)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                  slippageTolerance === value
                                    ? 'bg-phantom-purple text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {value}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Estimation */}
              <div className="p-4 rounded-xl bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Estimated gas:</span>
                </div>
                <div className="text-white font-medium">
                  {usePaymaster ? (
                    <span className="text-green-400">FREE (sponsored)</span>
                  ) : (
                    `~0.0012 ETH`
                  )}
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={executeStrategy}
                className="w-full phantom-button text-lg py-4 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Execute Strategy
              </button>
            </motion.div>
          ) : isExecuting ? (
            <motion.div
              key="executing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-phantom-blue/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-10 h-10 text-phantom-blue animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Executing Strategy
                </h3>
                <p className="text-gray-400">
                  Submitting through Account Abstraction bundler
                </p>
              </div>

              <div className="space-y-4">
                {executionSteps.map((step, index) => {
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isCurrent ? 'bg-phantom-blue/10 border border-phantom-blue/30' :
                        isComplete ? 'bg-green-500/10' : 'bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete ? 'bg-green-500/20' :
                        isCurrent ? 'bg-phantom-blue/20' : 'bg-white/10'
                      }`}>
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isCurrent ? (
                          <Loader2 className="w-5 h-5 text-phantom-blue animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        isComplete ? 'text-green-400' :
                        isCurrent ? 'text-white' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : executionResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Success Banner */}
              <div className="glass-card p-8 text-center bg-green-500/10 border-green-500/20">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Strategy Executed!</h3>
                <p className="text-gray-400">
                  Your portfolio has been rebalanced successfully
                </p>
              </div>

              {/* Transaction Details */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-400">Transaction Hash</span>
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${executionResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-phantom-purple hover:underline font-mono text-sm"
                    >
                      {executionResult.txHash.slice(0, 10)}...{executionResult.txHash.slice(-8)}
                    </a>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-400">Gas Used</span>
                    <span className="text-white">{executionResult.gasUsed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-400">Gas Cost</span>
                    <span className="text-green-400">
                      {executionResult.gasCost === 0 ? 'Sponsored' : `${executionResult.gasCost} ETH`}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-400">New Risk Score</span>
                    <span className="text-white">{executionResult.newRiskScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <a href="/dashboard" className="flex-1">
                  <button className="w-full phantom-button flex items-center justify-center gap-2">
                    View Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
                <button
                  onClick={() => setExecutionResult(null)}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Execute Another
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
