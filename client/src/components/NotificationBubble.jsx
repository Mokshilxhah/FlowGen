import { motion } from 'framer-motion';

export default function NotificationBubble({ count, label, icon = '🔔', color = '#F43F5E' }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      title={`${count} ${label}`}
      className="absolute -top-2 -right-2 min-w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs pointer-events-none"
      style={{
        background: color,
        fontSize: '10px',
        boxShadow: `0 0 12px ${color}80`,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}>
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}

// Add this CSS to your global styles or Tailwind config
export const bubblePulseCSS = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;
