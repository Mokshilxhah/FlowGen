import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationBubble - Shows unread count badge on icons
 * Used for Tasks, Chat, Messages, Meetings, etc.
 */
export default function NotificationBubble({ count = 0, color = 'red', size = 'sm' }) {
  if (!count || count === 0) return null;

  const sizeClasses = {
    xs: 'min-w-[18px] h-4 px-1 text-[10px]',
    sm: 'min-w-[20px] h-5 px-1 text-xs',
    md: 'min-w-[24px] h-6 px-1.5 text-sm',
    lg: 'min-w-[28px] h-7 px-2 text-base',
  };

  const colorClasses = {
    red: 'bg-[#EF4444]',
    blue: 'bg-blue-600',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    purple: 'bg-purple-600',
    cyan: 'bg-cyan-500',
  };

  const isHex = typeof color === 'string' && color.startsWith('#');
  const bgStyle = isHex ? { backgroundColor: color } : {};
  const colorClass = !isHex ? (colorClasses[color] || 'bg-[#EF4444]') : '';

  const displayCount = count > 99 ? '99+' : count;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        style={bgStyle}
        className={`
          ${sizeClasses[size] || sizeClasses.sm} 
          ${colorClass}
          rounded-full 
          flex items-center justify-center 
          text-white font-bold text-center leading-none
          shadow-md
          z-10
        `}
      >
        {displayCount}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * NotificationDot - Simple dot indicator (no count)
 */
export function NotificationDot({ color = 'red', pulse = true }) {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
      {pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]} border-2 border-background`}
      />
    </span>
  );
}
