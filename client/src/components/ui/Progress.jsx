import { motion } from 'framer-motion';

const gradients = {
  electric: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
  cyan:     'linear-gradient(90deg, #06B6D4, #6366F1)',
  emerald:  'linear-gradient(90deg, #10B981, #06B6D4)',
  amber:    'linear-gradient(90deg, #F59E0B, #F43F5E)',
  rose:     'linear-gradient(90deg, #F43F5E, #F59E0B)',
  violet:   'linear-gradient(90deg, #8B5CF6, #6366F1)',
};

const heights = { xs: 4, sm: 6, md: 8, lg: 10, xl: 14 };

export default function Progress({ value = 0, max = 100, color = 'electric', size = 'md', showLabel = false, label, className = '', animated = true }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const h = heights[size] || 8;

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs" style={{ color: '#94A3B8' }}>{label}</span>}
          {showLabel && <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{Math.round(percent)}%</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height: h, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: gradients[color] || gradients.electric }}
          initial={animated ? { width: 0 } : { width: `${percent}%` }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  );
}
