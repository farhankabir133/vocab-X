import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const dailyData = [
  { label: 'MON', value: 12 },
  { label: 'TUE', value: 18 },
  { label: 'WED', value: 15 },
  { label: 'THU', value: 25 },
  { label: 'FRI', value: 32 },
  { label: 'SAT', value: 28 },
  { label: 'SUN', value: 40 },
];

const weeklyData = [
  { label: 'W1', value: 120 },
  { label: 'W2', value: 150 },
  { label: 'W3', value: 140 },
  { label: 'W4', value: 210 },
];

const monthlyData = [
  { label: 'JAN', value: 450 },
  { label: 'FEB', value: 520 },
  { label: 'MAR', value: 480 },
  { label: 'APR', value: 610 },
  { label: 'MAY', value: 750 },
  { label: 'JUN', value: 690 },
];

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function ProgressChart() {
  const [view, setView] = useState<ViewType>('daily');

  const data = view === 'daily' ? dailyData : view === 'weekly' ? weeklyData : monthlyData;
  
  const stats = {
    daily: { streak: 12, avg: 24, label: 'Daily Mastery' },
    weekly: { streak: 4, avg: 155, label: 'Weekly Velocity' },
    monthly: { streak: 6, avg: 585, label: 'Monthly Volume' }
  };

  const currentStats = stats[view];

  return (
    <div className="w-full h-full flex flex-col">
      {/* View Selector & Summary Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex bg-white/5 p-1 rounded-sm border border-white/5">
          {(['daily', 'weekly', 'monthly'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                view === v 
                  ? 'bg-vocab-primary text-vocab-surface shadow-[0_0_15px_rgba(138,180,248,0.3)]' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="terminal-label text-[8px] opacity-40 uppercase">Streak</span>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-lg font-bold">{currentStats.streak}</span>
              <span className="text-slate-500 text-[9px] uppercase font-bold">{view === 'daily' ? 'Days' : view === 'weekly' ? 'Weeks' : 'Months'}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="terminal-label text-[8px] opacity-40 uppercase">Avg Index</span>
            <span className="text-vocab-primary text-lg font-bold">{currentStats.avg}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8ab4f8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8ab4f8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255,255,255,0.05)" 
            />
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-vocab-surface-container-lowest border border-vocab-primary/30 p-3 shadow-2xl backdrop-blur-xl border-l-4"
                    >
                      <p className="text-[9px] font-black uppercase text-vocab-primary tracking-[0.2em] mb-1">
                        Neural Scan: {payload[0].payload.label}
                      </p>
                      <p className="text-white text-xs font-mono">
                        Points: <span className="font-bold text-vocab-secondary">{payload[0].value}</span>
                      </p>
                    </motion.div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8ab4f8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
              key={view} // Trigger re-animation on view change
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
