import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, glow = false, onClick, padding = true }) {
  const base = {
    background: 'rgba(26, 34, 54, 0.7)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${glow ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.12)'}`,
    borderRadius: '16px',
    boxShadow: glow
      ? '0 8px 32px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  if (hover || onClick) {
    return (
      <motion.div className={`${padding ? 'p-6' : ''} ${className}`} style={base}
        onClick={onClick} whileHover={{ scale: 1.01, y: -2 }} transition={{ duration: 0.2 }}
        style={{ ...base, cursor: onClick ? 'pointer' : 'default' }}>
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${padding ? 'p-6' : ''} ${className}`} style={base}>
      {children}
    </div>
  );
}
