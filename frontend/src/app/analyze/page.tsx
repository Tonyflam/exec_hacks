'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Shield, Lock, Brain, Loader2, CheckCircle, AlertTriangle,
  ChevronRight, Plus, X, Wallet, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, getRiskColor, getRiskLabel } from '@/lib/utils';

const protocols = ['Aave', 'Compound', 'Uniswap', 'GMX', 'Curve', 'Balancer', 'Radiant'];

const analysisSteps = [
  { id: 'encrypt', label: 'Encrypting portfolio data', icon: Lock },
  { id: 'submit', label: 'Submitting to TEE', icon: Shield },
  { id: 'analyze', label: 'Running AI risk analysis', icon: Brain },
  { id: 'sign', label: 'Signing results', icon: CheckCircle },
];

export default function AnalyzePage() {
  const { address, isConnected } = useAccount();
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(['Aave', 'Uniswap']);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const addWallet = () => {
    if (newWallet && !wallets.includes(newWallet)) {
      setWallets([...wallets, newWallet]);
      setNewWallet('');
    }
  };

  const removeWallet = (wallet: string) => {
    setWallets(wallets.filter(w => w !== wallet));
  };

  const toggleProtocol = (protocol: string) => {
    if (selectedProtocols.includes(protocol)) {
      setSelectedProtocols(selectedProtocols.filter(p => p !== protocol));
    } else {
      setSelectedProtocols([...selectedProtocols, protocol]);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisResult(null);

    // Simulate the analysis steps
    for (let i = 0; i < analysisSteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Mock result
    setAnalysisResult({
      portfolioScore: 38,
      riskLevel: 'moderate',
      components: {
        concentrationRisk: 32,
        protocolRisk: 25,
        correlationRisk: 42,
        liquidityRisk: 28,
        impermanentLoss: 35,
        leverageRatio: 45,
      },
      recommendations: [
        {
          priority: 'high',
          action: 'REDUCE',
          asset: 'WETH',
          reason: 'High concentration in ETH',
          suggestion: 'Reduce ETH exposure by 15%',
        },
        {
          priority: 'medium',
          action: 'HEDGE',
          protocol: 'Aave',
          reason: 'Leverage above optimal',
          suggestion: 'Repay 20% of borrowed USDC',
        },
      ],
      alerts: [],
      timestamp: Date.now(),
    });

    setIsAnalyzing(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to analyze your portfolio</p>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-phantom-purple/20 border border-phantom-purple/30 mb-6">
            <Shield className="w-4 h-4 text-phantom-purple" />
            <span className="text-sm text-phantom-purple">Confidential Analysis</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Analyze Your Portfolio
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Your data is encrypted and processed inside a secure TEE. 
            Nobody—not even us—can see your portfolio details.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isAnalyzing && !analysisResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Wallet Selection */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-phantom-purple" />
                  Wallets to Analyze
                </h3>
                
                <div className="space-y-3 mb-4">
                  {/* Current wallet */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-phantom-purple/10 border border-phantom-purple/20">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-white font-mono flex-1">
                      {address}
                    </span>
                    <span className="text-xs text-phantom-purple">Connected</span>
                  </div>

                  {/* Additional wallets */}
                  {wallets.map((wallet) => (
                    <div key={wallet} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      <span className="text-sm text-white font-mono flex-1 truncate">
                        {wallet}
                      </span>
                      <button
                        onClick={() => removeWallet(wallet)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add wallet input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value)}
                    placeholder="Add another wallet address..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-phantom-purple/50"
                  />
                  <button
                    onClick={addWallet}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Protocol Selection */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Protocols to Scan
                </h3>
                <div className="flex flex-wrap gap-2">
                  {protocols.map((protocol) => (
                    <button
                      key={protocol}
                      onClick={() => toggleProtocol(protocol)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedProtocols.includes(protocol)
                          ? 'bg-phantom-purple text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {protocol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Tolerance */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Risk Tolerance
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskTolerance(level)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        riskTolerance === level
                          ? 'bg-phantom-purple/20 border-2 border-phantom-purple'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium text-white capitalize">
                        {level}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {level === 'conservative' && '50% stables'}
                        {level === 'moderate' && 'Balanced'}
                        {level === 'aggressive' && '20% stables'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={runAnalysis}
                disabled={selectedProtocols.length === 0}
                className="w-full phantom-button text-lg py-4 flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Run Confidential Analysis
              </button>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-phantom-purple/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-10 h-10 text-phantom-purple animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Analyzing in TEE
                </h3>
                <p className="text-gray-400">
                  Your data is being processed inside a secure enclave
                </p>
              </div>

              <div className="space-y-4">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isCurrent ? 'bg-phantom-purple/10 border border-phantom-purple/30' :
                        isComplete ? 'bg-green-500/10' : 'bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete ? 'bg-green-500/20' :
                        isCurrent ? 'bg-phantom-purple/20' : 'bg-white/10'
                      }`}>
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isCurrent ? (
                          <Loader2 className="w-5 h-5 text-phantom-purple animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-gray-500" />
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
          ) : analysisResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Success Banner */}
              <div className="glass-card p-6 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analysis Complete</h3>
                    <p className="text-sm text-gray-400">
                      Processed securely in TEE at {new Date(analysisResult.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Score Card */}
              <div className="glass-card p-8 text-center">
                <h3 className="text-lg text-gray-400 mb-4">Portfolio Risk Score</h3>
                <div className={`text-7xl font-bold mb-2 ${getRiskColor(analysisResult.portfolioScore)}`}>
                  {analysisResult.portfolioScore}
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  analysisResult.portfolioScore < 50 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  {getRiskLabel(analysisResult.portfolioScore)} Risk
                </div>
              </div>

              {/* Risk Components */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Risk Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.components).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-400 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className={`text-2xl font-bold ${getRiskColor(value as number)}`}>
                        {value as number}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          rec.priority === 'high' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{rec.reason}</div>
                        <div className="text-sm text-gray-400">{rec.suggestion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Link href="/execute" className="flex-1">
                  <button className="w-full phantom-button flex items-center justify-center gap-2">
                    Execute Strategy
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Run Again
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
