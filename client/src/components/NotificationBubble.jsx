import { motion } from 'framer-motion';

export default function NotificationBubble({ count, label, icon = '🔔', color = '#EF4444' }) {
  if (!count || count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      title={label ? `${count} ${label}` : undefined}
      className="min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-white font-bold text-xs pointer-events-none shadow-md"
      style={{
        background: color || '#EF4444',
        fontSize: '10px',
        boxShadow: `0 0 10px ${color || '#EF4444'}80`,
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
