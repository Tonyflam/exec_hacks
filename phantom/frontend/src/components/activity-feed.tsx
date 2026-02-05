'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface Activity {
  id: number;
  type: 'analysis' | 'execution' | 'alert' | 'success';
  title: string;
  description: string;
  timestamp: number;
}

const mockActivities: Activity[] = [
  {
    id: 1,
    type: 'success',
    title: 'Strategy Executed',
    description: 'Rebalanced ETH/USDC LP position',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 2,
    type: 'analysis',
    title: 'Risk Analysis Complete',
    description: 'Portfolio score: 42/100 (Moderate)',
    timestamp: Date.now() - 7200000,
  },
  {
    id: 3,
    type: 'alert',
    title: 'Concentration Warning',
    description: 'ETH exposure above 40% threshold',
    timestamp: Date.now() - 14400000,
  },
  {
    id: 4,
    type: 'execution',
    title: 'Auto-Rebalance Triggered',
    description: 'Reduced leverage on Aave position',
    timestamp: Date.now() - 86400000,
  },
];

const icons = {
  analysis: Shield,
  execution: Zap,
  alert: AlertTriangle,
  success: CheckCircle,
};

const colors = {
  analysis: 'text-blue-400 bg-blue-500/20',
  execution: 'text-purple-400 bg-purple-500/20',
  alert: 'text-yellow-400 bg-yellow-500/20',
  success: 'text-green-400 bg-green-500/20',
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {mockActivities.map((activity, index) => {
        const Icon = icons[activity.type];
        const colorClass = colors[activity.type];

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">
                {activity.title}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {activity.description}
              </div>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(activity.timestamp)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
