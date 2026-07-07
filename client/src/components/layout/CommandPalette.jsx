import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ArrowRight, Clock, Users, FolderKanban, ClipboardList } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';

const typeColors = {
  page: 'text-accent-electric',
  member: 'text-accent-cyan',
  project: 'text-accent-violet',
  task: 'text-accent-emerald',
  message: 'text-accent-amber',
};

function roleBasePath(role) {
  if (role === 'org_admin') return '/org';
  if (role === 'hr') return '/hr';
  if (role === 'intern') return '/intern';
  return '/employee';
}

function staticPagesForRole(role) {
  const b = roleBasePath(role);
  if (role === 'org_admin') {
    return [
      { type: 'page', label: 'Dashboard', path: `${b}/dashboard`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Members', path: `${b}/members`, icon: <Users size={14} /> },
      { type: 'page', label: 'Projects', path: `${b}/projects`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Analytics', path: `${b}/analytics`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Billing', path: `${b}/billing`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Settings', path: `${b}/settings`, icon: <FolderKanban size={14} /> },
    ];
  }
  if (role === 'hr') {
    return [
      { type: 'page', label: 'Dashboard', path: `${b}/dashboard`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Teams', path: `${b}/teams`, icon: <Users size={14} /> },
      { type: 'page', label: 'Attendance', path: `${b}/attendance`, icon: <Users size={14} /> },
      { type: 'page', label: 'Reports', path: `${b}/reports`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Calendar', path: `${b}/calendar`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Meetings', path: `${b}/meetings`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Alerts', path: `${b}/alerts`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Chat', path: `${b}/chat`, icon: <Users size={14} /> },
      { type: 'page', label: 'Settings', path: `${b}/settings`, icon: <FolderKanban size={14} /> },
    ];
  }
  if (role === 'intern') {
    return [
      { type: 'page', label: 'Dashboard', path: `${b}/dashboard`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Tasks', path: `${b}/tasks`, icon: <ClipboardList size={14} /> },
      { type: 'page', label: 'Learning', path: `${b}/learning`, icon: <FolderKanban size={14} /> },
      { type: 'page', label: 'Mentor', path: `${b}/mentor`, icon: <Users size={14} /> },
      { type: 'page', label: 'Chat', path: `${b}/chat`, icon: <Users size={14} /> },
      { type: 'page', label: 'Settings', path: `${b}/settings`, icon: <FolderKanban size={14} /> },
    ];
  }
  return [
    { type: 'page', label: 'Dashboard', path: `${b}/dashboard`, icon: <FolderKanban size={14} /> },
    { type: 'page', label: 'Tasks', path: `${b}/tasks`, icon: <ClipboardList size={14} /> },
    { type: 'page', label: 'Inbox', path: `${b}/inbox`, icon: <Users size={14} /> },
    { type: 'page', label: 'Chat', path: `${b}/chat`, icon: <Users size={14} /> },
    { type: 'page', label: 'Calendar', path: `${b}/calendar`, icon: <FolderKanban size={14} /> },
    { type: 'page', label: 'Profile', path: `${b}/profile`, icon: <Users size={14} /> },
    { type: 'page', label: 'Settings', path: `${b}/settings`, icon: <FolderKanban size={14} /> },
  ];
}

export default function CommandPalette() {
  const { user } = useAuthStore();
  const { commandPaletteOpen, closeCommandPalette, recentSearches, addRecentSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
    enabled: commandPaletteOpen && !!user,
    staleTime: 30_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data.data,
    enabled: commandPaletteOpen && !!user,
    staleTime: 30_000,
  });

  const { data: people = [] } = useQuery({
    queryKey: ['command', 'people', user?.role],
    queryFn: async () => {
      if (user?.role === 'org_admin') return (await api.get('/members')).data.data;
      return (await api.get('/user/peers')).data.data;
    },
    enabled: commandPaletteOpen && !!user,
    staleTime: 30_000,
  });

  const allItems = useMemo(() => {
    if (!user) return [];
    const role = user.role;
    const base = roleBasePath(role);
    const pages = staticPagesForRole(role);

    const projectPath = role === 'org_admin' ? `${base}/projects` : `${base}/tasks`;
    const memberPath = role === 'org_admin' ? `${base}/members` : `${base}/chat`;

    const memberItems = (people || []).slice(0, 24).map((p) => ({
      type: 'member',
      label: p.name,
      sub: p.designation || p.role,
      path: memberPath,
      icon: <Users size={14} />,
    }));

    const projectItems = (projects || []).map((p) => ({
      type: 'project',
      label: p.name,
      sub: p.status,
      path: projectPath,
      icon: <FolderKanban size={14} />,
    }));

    const taskItems = (tasks || []).slice(0, 20).map((t) => ({
      type: 'task',
      label: t.title,
      sub: t.status,
      path: `${base}/tasks`,
      icon: <ClipboardList size={14} />,
    }));

    return [...pages, ...memberItems, ...projectItems, ...taskItems];
  }, [user, people, projects, tasks]);

  const results = query.length > 0
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPaletteOpen ? closeCommandPalette() : useUIStore.getState().openCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, closeCommandPalette]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, Math.max(0, results.length - 1))); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) {
      addRecentSearch(query);
      navigate(results[selected].path);
      closeCommandPalette();
    }
    if (e.key === 'Escape') closeCommandPalette();
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCommandPalette}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl glass-card overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/06">
              <Search size={18} className="text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, people, projects, tasks..."
                className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10 text-text-muted">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="p-3">
                  <p className="text-xs text-text-muted px-2 mb-2 flex items-center gap-1.5">
                    <Clock size={12} /> Recent searches
                  </p>
                  {recentSearches.map((s, i) => (
                    <button key={i} type="button" onClick={() => setQuery(s)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-left">
                      <Clock size={14} className="text-text-muted" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {results.length > 0 && (
                <div className="p-2">
                  {results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.label}-${i}`}
                      type="button"
                      onClick={() => { addRecentSearch(query); navigate(item.path); closeCommandPalette(); }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                        ${i === selected ? 'bg-accent-electric/15 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
                      `}
                    >
                      <span className={typeColors[item.type]}>{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.label}</span>
                        {item.sub && <span className="ml-2 text-xs text-text-muted capitalize">{item.sub}</span>}
                      </div>
                      <span className="text-xs text-text-muted capitalize px-2 py-0.5 bg-white/5 rounded">{item.type}</span>
                      {i === selected && <ArrowRight size={14} className="text-accent-electric" />}
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && results.length === 0 && (
                <div className="p-8 text-center text-text-muted">
                  <Search size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No results for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
