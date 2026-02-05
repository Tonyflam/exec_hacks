'use client';

import { motion } from 'framer-motion';
import { getRiskColor, getRiskLabel } from '@/lib/utils';

interface RiskGaugeProps {
  score: number;
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const rotation = (normalizedScore / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center">
      {/* Gauge Background */}
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored segments */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="33%" stopColor="#eab308" />
            <stop offset="66%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: normalizedScore / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="8" fill="white" />
          <circle cx="100" cy="100" r="4" fill="#8B5CF6" />
        </motion.g>
        
        {/* Labels */}
        <text x="20" y="115" fill="#6b7280" fontSize="10" textAnchor="middle">0</text>
        <text x="100" y="25" fill="#6b7280" fontSize="10" textAnchor="middle">50</text>
        <text x="180" y="115" fill="#6b7280" fontSize="10" textAnchor="middle">100</text>
      </svg>

      {/* Score Display */}
      <div className="mt-4 text-center">
        <motion.div
          className="risk-score"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {score}
        </motion.div>
        <div className={`text-sm font-medium mt-1 ${getRiskColor(score)}`}>
          {getRiskLabel(score)} Risk
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className="flex gap-2 mt-4">
        {['Low', 'Moderate', 'High', 'Critical'].map((label, index) => {
          const isActive = 
            (label === 'Low' && score < 25) ||
            (label === 'Moderate' && score >= 25 && score < 50) ||
            (label === 'High' && score >= 50 && score < 75) ||
            (label === 'Critical' && score >= 75);
          
          const colors = [
            'bg-green-500',
            'bg-yellow-500',
            'bg-orange-500',
            'bg-red-500',
          ];

          return (
            <div
              key={label}
              className={`w-3 h-3 rounded-full ${colors[index]} transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-20'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
