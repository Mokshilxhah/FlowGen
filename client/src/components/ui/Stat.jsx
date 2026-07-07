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
  electric: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', icon: 'rgba(99,102,241,0.2)', iconColor: '#6366F1', glow: 'rgba(99,102,241,0.15)' },
  cyan:     { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)',  icon: 'rgba(6,182,212,0.2)',  iconColor: '#06B6D4', glow: 'rgba(6,182,212,0.15)' },
  emerald:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: 'rgba(16,185,129,0.2)', iconColor: '#10B981', glow: 'rgba(16,185,129,0.15)' },
  amber:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: 'rgba(245,158,11,0.2)', iconColor: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
  violet:   { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', icon: 'rgba(139,92,246,0.2)', iconColor: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
  rose:     { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)',  icon: 'rgba(244,63,94,0.2)',  iconColor: '#F43F5E', glow: 'rgba(244,63,94,0.15)' },
};

export default function Stat({ title, value, prefix = '', suffix = '', trend, trendLabel, icon, color = 'electric', className = '' }) {
  const c = colorMap[color] || colorMap.electric;
  const isPositive = trend > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: `0 4px 24px ${c.glow}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: c.icon, color: c.iconColor }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: isPositive ? '#10B981' : '#F43F5E' }}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-display mb-1" style={{ color: '#F1F5F9' }}>
        <AnimatedNumber value={typeof value === 'number' ? value : 0} prefix={prefix} suffix={suffix} />
        {typeof value === 'string' && value}
      </div>
      <p className="text-sm" style={{ color: '#94A3B8' }}>{title}</p>
      {trendLabel && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{trendLabel}</p>}
    </motion.div>
  );
}
