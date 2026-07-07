import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:   { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' },
  secondary: { background: 'rgba(26,34,54,0.9)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.12)' },
  ghost:     { background: 'transparent', color: '#94A3B8', border: '1px solid transparent' },
  danger:    { background: 'linear-gradient(135deg, #F43F5E, #F59E0B)', color: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(244,63,94,0.3)' },
  glow:      { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', border: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 4px 15px rgba(99,102,241,0.35)' },
  outline:   { background: 'transparent', color: '#818CF8', border: '1px solid rgba(99,102,241,0.5)' },
  success:   { background: 'linear-gradient(135deg, #10B981, #06B6D4)', color: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' },
  cyan:      { background: 'linear-gradient(135deg, #06B6D4, #6366F1)', color: '#fff', border: 'none', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' },
};

const sizeStyles = {
  xs: { padding: '4px 10px', fontSize: '11px', borderRadius: '8px' },
  sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '10px' },
  md: { padding: '9px 18px', fontSize: '13px', borderRadius: '12px' },
  lg: { padding: '12px 24px', fontSize: '15px', borderRadius: '14px' },
  xl: { padding: '16px 32px', fontSize: '17px', borderRadius: '16px' },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, iconRight,
  className = '', onClick, type = 'button', fullWidth = false,
}) {
  const vs = variantStyles[variant] || variantStyles.primary;
  const ss = sizeStyles[size] || sizeStyles.md;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03, opacity: disabled || loading ? 0.5 : 0.92 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`inline-flex items-center justify-center gap-2 font-semibold cursor-pointer select-none transition-all ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        ...vs,
        ...ss,
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        outline: 'none',
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        : icon ? <span className="flex-shrink-0">{icon}</span> : null}
      {children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
