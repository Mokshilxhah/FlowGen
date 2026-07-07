const sizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, '2xl': 80 };
const statusColors = { active: '#10B981', away: '#F59E0B', busy: '#F43F5E', offline: '#475569' };

export default function Avatar({ src, name, size = 'md', status, className = '', ring = false }) {
  const px = sizes[size] || 40;
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const fontSize = px < 32 ? 10 : px < 48 ? 13 : px < 64 ? 16 : 20;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`} style={{ width: px, height: px }}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          fontSize,
          boxShadow: ring ? '0 0 0 2px rgba(99,102,241,0.5), 0 0 0 4px rgba(8,11,20,1)' : 'none',
        }}>
        {src ? (
          <img src={src} alt={name || 'avatar'} className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: px < 32 ? 8 : 10,
            height: px < 32 ? 8 : 10,
            background: statusColors[status] || statusColors.offline,
            border: '2px solid #080B14',
          }} />
      )}
    </div>
  );
}
