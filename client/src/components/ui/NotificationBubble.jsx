import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationBubble - Shows unread count badge on icons
 * Used for Tasks, Chat, Messages, Meetings, etc.
 */
export default function NotificationBubble({ count = 0, color = 'red', size = 'sm' }) {
  if (!count || count === 0) return null;

  const sizeClasses = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-7 h-7 text-base',
  };

  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  };

  const displayCount = count > 99 ? '99+' : count;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`
          absolute -top-1 -right-1 
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          rounded-full 
          flex items-center justify-center 
          text-white font-bold
          border-2 border-background
          shadow-lg
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
