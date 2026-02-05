'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Ghost, Wallet, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analyze', label: 'Analyze' },
  { href: '/execute', label: 'Execute' },
  { href: '/settings', label: 'Settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-phantom-darker/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-phantom-purple to-phantom-blue flex items-center justify-center">
              <Ghost className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PHANTOM</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="relative px-4 py-2">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </span>
                  {pathname === link.href && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-white">
                    {formatAddress(address!)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showWalletMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-56 glass-card p-2"
                  >
                    <a
                      href={`https://sepolia.arbiscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowWalletMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowConnectModal(!showConnectModal)}
                  className="phantom-button flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect
                </button>

                {showConnectModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-64 glass-card p-4"
                  >
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Connect Wallet
                    </h3>
                    <div className="space-y-2">
                      {connectors.map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => {
                            connect({ connector });
                            setShowConnectModal(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-phantom-purple" />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {connector.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      By connecting, you agree to our Terms
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close menus */}
      {(showWalletMenu || showConnectModal) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowWalletMenu(false);
            setShowConnectModal(false);
          }}
        />
      )}
    </nav>
  );
}
