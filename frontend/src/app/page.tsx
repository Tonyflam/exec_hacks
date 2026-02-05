'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Brain, Zap, Lock, ArrowRight, Sparkles, TrendingUp, Eye } from 'lucide-react';
import { useAccount } from 'wagmi';

const features = [
  {
    icon: Shield,
    title: 'Confidential Analysis',
    description: 'Your portfolio data never leaves the TEE. Analysis runs inside Intel SGX enclaves.',
    gradient: 'from-purple-500 to-blue-500',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Advanced risk analysis and strategy generation powered by machine learning.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Gasless Execution',
    description: 'Account Abstraction enables automated, sponsored transactions.',
    gradient: 'from-cyan-500 to-green-500',
  },
  {
    icon: Lock,
    title: 'MEV Protection',
    description: 'Sealed strategies prevent front-running and sandwich attacks.',
    gradient: 'from-green-500 to-yellow-500',
  },
];

const stats = [
  { value: '100%', label: 'Private' },
  { value: 'TEE', label: 'Secured' },
  { value: '0', label: 'Data Leaks' },
  { value: '24/7', label: 'Monitoring' },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-phantom-purple/30 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-phantom-blue/30 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-phantom-cyan/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="w-4 h-4 text-phantom-purple" />
              <span className="text-sm text-gray-300">Powered by iExec Confidential Computing</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">Your Portfolio.</span>
              <br />
              <span className="bg-gradient-to-r from-phantom-purple via-phantom-blue to-phantom-cyan bg-clip-text text-transparent">
                Your Privacy.
              </span>
              <br />
              <span className="text-white">Your Alpha.</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              PHANTOM brings institutional-grade portfolio intelligence to DeFi—
              privately. Analyze, optimize, and execute strategies without exposing 
              your positions to the world.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isConnected ? '/dashboard' : '#connect'}>
                <button className="phantom-button inline-flex items-center gap-2 text-lg">
                  {isConnected ? 'Go to Dashboard' : 'Connect Wallet'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/demo">
                <button className="px-6 py-3 rounded-xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all inline-flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Watch Demo
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-card p-6 text-center"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-phantom-purple to-phantom-cyan bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Privacy-First DeFi Intelligence
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every feature designed with your privacy as the foundation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 card-hover"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-phantom-purple/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              How PHANTOM Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Three steps to confidential portfolio intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect & Encrypt',
                description: 'Connect your wallet and encrypt your portfolio configuration with iExec DataProtector.',
                icon: Lock,
              },
              {
                step: '02',
                title: 'Analyze in TEE',
                description: 'Your data is processed inside a secure Intel SGX enclave. Nobody can see your positions.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Execute Privately',
                description: 'TEE-signed strategies are executed with MEV protection and gasless transactions.',
                icon: TrendingUp,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="glass-card p-8 h-full">
                  <div className="text-6xl font-bold text-phantom-purple/20 absolute top-4 right-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-phantom-purple/20 flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6 text-phantom-purple" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">
                    {item.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-phantom-purple/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonuses Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center gradient-border"
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Built for the Bonus
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="p-6 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-phantom-cyan mb-2">
                  Bulk Processing
                </div>
                <p className="text-gray-400">
                  Analyze 100+ positions in a single TEE task. 90% cost reduction through batching.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-phantom-purple mb-2">
                  Account Abstraction
                </div>
                <p className="text-gray-400">
                  ERC-4337 smart accounts with gasless transactions and session keys for automation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Take Control?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join the future of confidential DeFi. Your portfolio deserves privacy.
            </p>
            <Link href={isConnected ? '/dashboard' : '#connect'}>
              <button className="phantom-button text-lg px-8 py-4">
                {isConnected ? 'Launch Dashboard' : 'Get Started'}
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
