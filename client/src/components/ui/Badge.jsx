const styles = {
  default:    { bg: 'rgba(255,255,255,0.08)',  color: '#94A3B8',  border: 'rgba(255,255,255,0.1)' },
  electric:   { bg: 'rgba(99,102,241,0.15)',   color: '#818CF8',  border: 'rgba(99,102,241,0.3)' },
  cyan:       { bg: 'rgba(6,182,212,0.15)',    color: '#22D3EE',  border: 'rgba(6,182,212,0.3)' },
  violet:     { bg: 'rgba(139,92,246,0.15)',   color: '#A78BFA',  border: 'rgba(139,92,246,0.3)' },
  emerald:    { bg: 'rgba(16,185,129,0.15)',   color: '#34D399',  border: 'rgba(16,185,129,0.3)' },
  rose:       { bg: 'rgba(244,63,94,0.15)',    color: '#FB7185',  border: 'rgba(244,63,94,0.3)' },
  amber:      { bg: 'rgba(245,158,11,0.15)',   color: '#FCD34D',  border: 'rgba(245,158,11,0.3)' },
  // Status
  active:     { bg: 'rgba(16,185,129,0.15)',   color: '#34D399',  border: 'rgba(16,185,129,0.3)' },
  invited:    { bg: 'rgba(245,158,11,0.15)',   color: '#FCD34D',  border: 'rgba(245,158,11,0.3)' },
  suspended:  { bg: 'rgba(244,63,94,0.15)',    color: '#FB7185',  border: 'rgba(244,63,94,0.3)' },
  // Priority
  critical:   { bg: 'rgba(244,63,94,0.15)',    color: '#FB7185',  border: 'rgba(244,63,94,0.3)' },
  high:       { bg: 'rgba(245,158,11,0.15)',   color: '#FCD34D',  border: 'rgba(245,158,11,0.3)' },
  medium:     { bg: 'rgba(6,182,212,0.15)',    color: '#22D3EE',  border: 'rgba(6,182,212,0.3)' },
  low:        { bg: 'rgba(255,255,255,0.06)',  color: '#94A3B8',  border: 'rgba(255,255,255,0.1)' },
  // Project status
  planning:   { bg: 'rgba(139,92,246,0.15)',   color: '#A78BFA',  border: 'rgba(139,92,246,0.3)' },
  completed:  { bg: 'rgba(16,185,129,0.15)',   color: '#34D399',  border: 'rgba(16,185,129,0.3)' },
  on_hold:    { bg: 'rgba(245,158,11,0.15)',   color: '#FCD34D',  border: 'rgba(245,158,11,0.3)' },
  cancelled:  { bg: 'rgba(244,63,94,0.15)',    color: '#FB7185',  border: 'rgba(244,63,94,0.3)' },
  // Roles
  org_admin:  { bg: 'rgba(99,102,241,0.15)',   color: '#818CF8',  border: 'rgba(99,102,241,0.3)' },
  hr:         { bg: 'rgba(139,92,246,0.15)',   color: '#A78BFA',  border: 'rgba(139,92,246,0.3)' },
  employee:   { bg: 'rgba(6,182,212,0.15)',    color: '#22D3EE',  border: 'rgba(6,182,212,0.3)' },
  intern:     { bg: 'rgba(16,185,129,0.15)',   color: '#34D399',  border: 'rgba(16,185,129,0.3)' },
};

const sizes = { xs: '10px 8px', sm: '11px 10px', md: '12px 10px', lg: '13px 12px' };
const dotColors = {
  active: '#10B981', invited: '#F59E0B', suspended: '#F43F5E',
  emerald: '#10B981', amber: '#F59E0B', rose: '#F43F5E',
};

export default function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }) {
  const s = styles[variant] || styles.default;
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${className}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: sizes[size], padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColors[variant] || s.color }} />
      )}
      {children}
    </span>
  );
}
