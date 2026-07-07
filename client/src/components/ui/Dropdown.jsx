import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  trigger, items, align = 'left', className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 mt-2 min-w-48 glass-card p-1 shadow-glass
              ${align === 'right' ? 'right-0' : 'left-0'}
            `}
          >
            {items.map((item, i) => (
              item.divider ? (
                <div key={i} className="my-1 border-t border-white/06" />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.onClick?.(); setOpen(false); }}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg
                    transition-colors text-left
                    ${item.danger
                      ? 'text-accent-rose hover:bg-accent-rose/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </button>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
