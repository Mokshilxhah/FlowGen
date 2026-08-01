import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [value]);
  return <motion.span>{rounded}</motion.span>;
}

const colorMap = {
  electric: {
    barBg: 'bg-blue-500',
    barGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
  },
  cyan: {
    barBg: 'bg-cyan-400',
    barGlow: 'shadow-[0_0_12px_rgba(6,182,212,0.6)]',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  emerald: {
    barBg: 'bg-emerald-400',
    barGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  amber: {
    barBg: 'bg-amber-400',
    barGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
  },
  violet: {
    barBg: 'bg-purple-500',
    barGlow: 'shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
  },
  rose: {
    barBg: 'bg-rose-500',
    barGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
  },
};

export default function Stat({ title, value, prefix = '', suffix = '', trend, trendLabel, icon, color = 'electric', className = '', compact = false }) {
  const c = colorMap[color] || colorMap.electric;
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 shadow-lg ${compact ? 'p-4' : 'p-5'} ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Center Content: Title & Metric Number */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </p>
          <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-extrabold font-display tracking-tight text-white mt-0.5 flex items-baseline gap-1`}>
            <AnimatedNumber value={typeof value === 'number' ? value : 0} prefix={prefix} suffix={suffix} />
            {typeof value === 'string' && value}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold">
              <span className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-slate-500 font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>

        {/* Right Icon Box */}
        {icon && (
          <div className={`p-2.5 rounded-xl border ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
