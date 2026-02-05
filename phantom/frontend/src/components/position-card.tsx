'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface Position {
  id: number;
  protocol: string;
  type: string;
  asset: string;
  amount: number;
  valueUsd: number;
  apy?: number;
  pnl?: number;
}

interface PositionCardProps {
  position: Position;
  index: number;
}

const protocolColors: Record<string, string> = {
  'Aave': 'from-purple-500 to-purple-700',
  'Compound': 'from-green-500 to-green-700',
  'Uniswap': 'from-pink-500 to-pink-700',
  'GMX': 'from-blue-500 to-blue-700',
  'Curve': 'from-yellow-500 to-yellow-700',
};

const typeIcons: Record<string, typeof TrendingUp> = {
  'supply': ArrowUpRight,
  'borrow': ArrowDownRight,
  'lp': TrendingUp,
  'perpetual': TrendingUp,
};

export function PositionCard({ position, index }: PositionCardProps) {
  const Icon = typeIcons[position.type] || TrendingUp;
  const gradient = protocolColors[position.protocol] || 'from-gray-500 to-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
    >
      {/* Protocol Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-lg">
          {position.protocol.charAt(0)}
        </span>
      </div>

      {/* Position Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white truncate">
            {position.asset}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            position.type === 'supply' ? 'bg-green-500/20 text-green-400' :
            position.type === 'borrow' ? 'bg-red-500/20 text-red-400' :
            position.type === 'lp' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {position.type}
          </span>
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <span>{position.protocol}</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>{position.amount.toLocaleString()} {position.asset.split('/')[0]}</span>
        </div>
      </div>

      {/* Value & APY/PnL */}
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-white">
          {formatCurrency(position.valueUsd)}
        </div>
        {position.apy !== undefined && (
          <div className={`text-sm flex items-center justify-end gap-1 ${
            position.apy >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            <Icon className="w-3 h-3" />
            {formatPercent(position.apy)} APY
          </div>
        )}
        {position.pnl !== undefined && (
          <div className={`text-sm flex items-center justify-end gap-1 ${
            position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {position.pnl >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-5 h-5 text-phantom-purple" />
      </div>
    </motion.div>
  );
}
