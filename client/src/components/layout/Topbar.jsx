import { useState, useEffect } from 'react';
import { Search, Command } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

const roleColors = {
  org_admin: '#6366F1',
  hr: '#8B5CF6',
  employee: '#06B6D4',
  intern: '#10B981',
};

export default function Topbar({ title }) {
  const { user, logout } = useAuthStore();
  const { openCommandPalette } = useUIStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const roleColor = roleColors[user?.role] || '#6366F1';

  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 relative z-50"
      style={{ background: 'rgba(8,11,20,0.9)', borderBottom: '1px solid rgba(99,102,241,0.12)', backdropFilter: 'blur(20px)' }}>

      {/* Left */}
      <div className="flex items-center gap-3">
        {title && <h1 className="text-lg font-semibold font-display" style={{ color: '#F1F5F9' }}>{title}</h1>}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: roleColor }} />
          <span className="text-xs capitalize" style={{ color: '#475569' }}>{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={openCommandPalette}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ background: 'rgba(26,34,54,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
          <Search size={14} />
          <span className="hidden md:block">Search...</span>
          <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#475569' }}>
            <Command size={10} /> K
          </div>
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(26,34,54,0.8)', border: `1px solid ${menuOpen ? roleColor + '60' : 'rgba(255,255,255,0.08)'}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}>
              {user?.name?.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: '#F1F5F9' }}>{user?.name?.split(' ')[0]}</p>
              <p className="text-xs capitalize mt-0.5" style={{ color: '#475569' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
              style={{ background: '#1A2236', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              {[
                { label: 'Settings', onClick: () => { navigate(`/${user?.role === 'org_admin' ? 'org' : user?.role}/settings`); setMenuOpen(false); } },
              ].map(item => (
                <button key={item.label} onClick={item.onClick}
                  className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              <button onClick={async () => { await logout(); navigate('/'); setMenuOpen(false); }}
                className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                style={{ color: '#F43F5E' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

