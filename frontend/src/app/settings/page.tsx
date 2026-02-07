'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Settings, Key, Shield, Wallet, Bell, ChevronRight,
  Copy, Check, ExternalLink, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSmartAccount } from '@/hooks/use-smart-account';
import { VAULT_ADDRESS, getArbiscanUrl, getExplorerUrl } from '@/lib/iexec-config';
import { usePhantom } from '@/hooks/use-phantom';

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { protectedData, isInitializing } = usePhantom();
  const {
    onChainPortfolio,
    onChainRiskReport,
    totalPortfolios,
    totalStrategiesExecuted,
    trustedIApp,
    sessionKeys,
    createSessionKey,
  } = useSmartAccount();
  const [copied, setCopied] = useState(false);

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

  const copyVaultAddress = async () => {
    await navigator.clipboard.writeText(VAULT_ADDRESS);
    toast({
      title: 'Copied',
      description: 'PhantomVault address copied',
    });
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

  const hasPortfolio = onChainPortfolio && onChainPortfolio.owner !== '0x0000000000000000000000000000000000000000';

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
                <div className="text-sm text-gray-400">Smart Account (PhantomVault)</div>
                <div className="font-mono text-white text-sm">
                  {VAULT_ADDRESS.slice(0, 10)}...{VAULT_ADDRESS.slice(-8)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyVaultAddress}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <a
                  href={getArbiscanUrl(VAULT_ADDRESS, 'address')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Deployed
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* On-chain stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <div className="text-lg font-bold text-white">{totalPortfolios?.toString() || '0'}</div>
                <div className="text-xs text-gray-400">Portfolios</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <div className="text-lg font-bold text-white">{totalStrategiesExecuted?.toString() || '0'}</div>
                <div className="text-xs text-gray-400">Strategies</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <div className="text-lg font-bold text-phantom-purple">
                  {protectedData ? '1' : '0'}
                </div>
                <div className="text-xs text-gray-400">Protected</div>
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
            {sessionKeys.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No session keys created yet</p>
                <p className="text-sm mt-1">Session keys enable gasless automated rebalancing</p>
              </div>
            ) : (
              sessionKeys.map((key, index) => (
                <div
                  key={key.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Session Key {index + 1}</div>
                      <div className="text-sm text-gray-400 font-mono">
                        {key.key.slice(0, 12)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      Expires in {Math.max(0, Math.floor((key.expires - Date.now()) / 3600000))}h
                    </div>
                    <button
                      onClick={() => createSessionKey(0)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
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
              href={getArbiscanUrl(VAULT_ADDRESS, 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div>
                <span className="text-white">PhantomVault on Arbiscan</span>
                <div className="text-xs text-gray-400 font-mono mt-1">{VAULT_ADDRESS}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            {protectedData && (
              <a
                href={getExplorerUrl(protectedData.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div>
                  <span className="text-white">Protected Data on iExec Explorer</span>
                  <div className="text-xs text-gray-400 font-mono mt-1">{protectedData.address}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            )}
            <a
              href="https://explorer.iex.ec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-white">iExec Explorer</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            {trustedIApp && trustedIApp !== '0x0000000000000000000000000000000000000000' && (
              <a
                href={getArbiscanUrl(trustedIApp as string, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div>
                  <span className="text-white">Trusted iApp</span>
                  <div className="text-xs text-gray-400 font-mono mt-1">{trustedIApp as string}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
