'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Settings, Key, Shield, Wallet, Bell, ChevronRight,
  Copy, Check, ExternalLink, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sessionKeys] = useState([
    {
      id: 1,
      name: 'Auto-Rebalance',
      key: '0x742d35Cc6634C0532925a3b844Bc9e7595f',
      expires: Date.now() + 86400000,
      status: 'active',
    },
    {
      id: 2,
      name: 'Risk Monitoring',
      key: '0x8a3f25Dd7745D1643036b944Cd8e8686f',
      expires: Date.now() + 172800000,
      status: 'active',
    },
  ]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Address copied to clipboard',
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-400">Connect to access settings</p>
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
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Account Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-phantom-purple/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-phantom-purple" />
            </div>
            <h2 className="text-xl font-semibold text-white">Account</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="text-sm text-gray-400">Connected Wallet</div>
                <div className="font-mono text-white">
                  {address?.slice(0, 10)}...{address?.slice(-8)}
                </div>
              </div>
              <button
                onClick={copyAddress}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="text-sm text-gray-400">Smart Account</div>
                <div className="font-mono text-white">
                  {address ? `0x${address.slice(2, 10)}...${address.slice(-6)}` : '-'}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Deployed
              </div>
            </div>
          </div>
        </div>

        {/* Session Keys Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-phantom-blue/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-phantom-blue" />
              </div>
              <h2 className="text-xl font-semibold text-white">Session Keys</h2>
            </div>
            <button className="px-4 py-2 rounded-lg bg-phantom-purple/20 text-phantom-purple hover:bg-phantom-purple/30 transition-colors text-sm">
              + Create Key
            </button>
          </div>

          <div className="space-y-3">
            {sessionKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{key.name}</div>
                    <div className="text-sm text-gray-400 font-mono">
                      {key.key.slice(0, 12)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Expires in {Math.floor((key.expires - Date.now()) / 3600000)}h
                  </div>
                  <button className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-white">Risk Alerts</div>
                  <div className="text-sm text-gray-400">Get notified of risk changes</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-white">Auto-Rebalance</div>
                  <div className="text-sm text-gray-400">Enable automatic rebalancing</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="glass-card p-6">
          <div className="space-y-3">
            <a
              href="https://sepolia.arbiscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-white">View on Arbiscan</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a
              href="https://explorer.iex.ec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-white">iExec Explorer</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
