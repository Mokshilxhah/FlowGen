import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, glow = false, onClick, padding = true }) {
  const base = {
    background: 'rgba(30, 41, 59, 0.45)',
    border: `1px solid ${glow ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '16px',
    boxShadow: glow ? '0 10px 30px -10px rgba(59, 130, 246, 0.25)' : '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(12px)',
  };

  if (hover || onClick) {
    return (
      <motion.div className={`${padding ? 'p-6' : ''} ${className}`}
        onClick={onClick} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
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
