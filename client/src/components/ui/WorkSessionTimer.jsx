import { useState, useEffect } from 'react';

export default function WorkSessionTimer() {
  const [elapsed, setElapsed] = useState({ h: '00', m: '00' });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const enabledStr = localStorage.getItem('flowgen_timer_enabled');
      const startStr   = localStorage.getItem('flowgen_timer_start');

      if (enabledStr === 'false' || !startStr) {
        setIsEnabled(false);
        setElapsed({ h: '00', m: '00' });
        return;
      }

      const startTime = parseInt(startStr, 10);
      if (isNaN(startTime)) {
        setIsEnabled(false);
        setElapsed({ h: '00', m: '00' });
        return;
      }

      setIsEnabled(true);
      const diffSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsed({
        h: String(Math.floor(diffSec / 3600)).padStart(2, '0'),
        m: String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative select-none" title={isEnabled ? 'Work session in progress' : 'Session timer inactive'}>
      {/* Glowing border gradient */}
      <div
        className="absolute inset-0 rounded-2xl blur-sm"
        style={{
          background: isEnabled
            ? 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #f97316)'
            : 'linear-gradient(135deg, #334155, #475569)',
          padding: '2px',
        }}
      />

      {/* Clock face */}
      <div
        className="relative rounded-2xl px-5 py-2.5 flex items-center gap-1"
        style={{ background: '#0a0a0a', border: '2px solid transparent' }}
      >
        {/* Hours */}
        <span
          className="font-mono font-bold tracking-widest text-white leading-none"
          style={{ fontSize: '1.55rem', textShadow: '0 0 18px rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}
        >
          {elapsed.h}
        </span>

        {/* Colon */}
        <span
          className="font-mono font-bold text-white leading-none mb-0.5"
          style={{
            fontSize: '1.55rem',
            opacity: isEnabled ? 1 : 0.3,
            animation: isEnabled ? 'colonBlink 1s step-end infinite' : 'none',
          }}
        >
          :
        </span>

        {/* Minutes */}
        <span
          className="font-mono font-bold tracking-widest text-white leading-none"
          style={{ fontSize: '1.55rem', textShadow: '0 0 18px rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}
        >
          {elapsed.m}
        </span>
      </div>

      <style>{`
        @keyframes colonBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
