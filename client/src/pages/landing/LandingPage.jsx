import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  MessageSquare, ArrowRight, Sparkles, Lock, Shield,
  Kanban, BookOpen, Menu, X, ArrowUpRight, ChevronLeft, ChevronRight,
  Clock, Mail, GitBranch, Globe, ExternalLink, Users, TrendingUp,
  BarChart3, Download, Bell, Building2, Award, CheckSquare, FileText,
  Star, Target, ShieldCheck, Database, RotateCw
} from 'lucide-react';

/* ═══════════════════════════ DATA ═══════════════════════════ */
const plans = [
  {
    name: 'Sandbox Free',
    price: { monthly: 0, annual: 0 },
    desc: '',
    color: '#6366F1',
    badge: 'Free Forever',
    features: ['5 active members', '3 projects', 'Team chat channels', 'Basic Kanban boards', 'OTP verification', 'DB schema isolation'],
  },
  {
    name: 'FlowGen Pro',
    price: { monthly: 49, annual: 39 },
    desc: '',
    color: '#06B6D4',
    popular: true,
    badge: 'Most Popular',
    features: ['Unlimited members', 'Unlimited sprints', 'HR attendance rosters', 'FlowBot AI copilot', 'Full learning library', 'Custom roles', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: { monthly: 149, annual: 119 },
    desc: '',
    color: '#F59E0B',
    badge: 'Full Suite',
    features: ['Everything in Pro', 'SSO / SAML auth', '99.9% uptime SLA', 'Security audit logs', 'On-premise deploy', 'Custom API access', '24/7 account manager'],
  },
];

const testimonials = [
  { name: 'Sarah Chen',   role: 'HR Director',  company: 'TechFlow Inc',  quote: 'FlowGen replaced 6 tools in one month. Sprint speed went up 40% and attendance finally made sense.', initials: 'SC', color: '#06B6D4' },
  { name: 'Marcus Webb',  role: 'CTO',           company: 'Stellar Labs',  quote: 'FlowBot AI summaries are scary accurate. Like having an extra project lead who never sleeps.', initials: 'MW', color: '#6366F1' },
  { name: 'Priya Sharma', role: 'Team Lead',     company: 'Acme Corp',     quote: 'One login for Kanban, chats, and HR. I stopped opening six tabs. That alone was worth it.', initials: 'PS', color: '#F59E0B' },
];

const companyLogos = [
  {
    name: 'Acme Corp', color: '#6366F1', bg: '#EEF2FF',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
  },
  {
    name: 'TechFlow', color: '#10B981', bg: '#ECFDF5',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
  },
  {
    name: 'Stellar Labs', color: '#8B5CF6', bg: '#F5F3FF',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
  },
  {
    name: 'Apex Systems', color: '#F59E0B', bg: '#FFFBEB',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 2L22 22H2L12 2z" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
  },
  {
    name: 'Quantum Co', color: '#06B6D4', bg: '#EBF5FF',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="12" r="9" stroke="#06B6D4" strokeWidth="2.2"/><path d="M12 7v10M7 12h10" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round"/></svg>)
  },
  {
    name: 'Nova Studio', color: '#EC4899', bg: '#FDF2F8',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="#EC4899" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="#EC4899"/></svg>)
  },
  {
    name: 'Nexus Tech', color: '#3B82F6', bg: '#EFF6FF',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#3B82F6" strokeWidth="2.2"/><path d="M9 9l6 6M15 9l-6 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>)
  },
  {
    name: 'Orbit Labs', color: '#10B981', bg: '#F0FDF4',
    svg: (<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3"/><circle cx="12" cy="12" r="3.5" fill="#10B981"/></svg>)
  },
];

const carouselSlides = [
  { label: 'Admin Command',  gradient: 'linear-gradient(135deg,#6366F1,#818CF8,#A78BFA)' },
  { label: 'HR Attendance',  gradient: 'linear-gradient(135deg,#10B981,#34D399,#6EE7B7)' },
  { label: 'Sprint Board',   gradient: 'linear-gradient(135deg,#06B6D4,#22D3EE,#67E8F9)' },
  { label: 'Intern Hub',     gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24,#FDE68A)' },
];

/* Portal nodes — features match ACTUAL project pages */
const portalNodes = [
  {
    id: 'admin', label: 'Admin', icon: Shield, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE',
    tagline: 'Full organization control.',
    cardRank: 'A', suit: '♠',
    links: [
      { label: 'Register Org Admin', path: '/org/login', primary: true },
      { label: 'Admin Login', path: '/org/login', primary: false }
    ],
    features: [
      { icon: Users,      label: 'Member Management' },
      { icon: Kanban,     label: 'Projects Overview' },
      { icon: BarChart3,  label: 'Analytics Dashboard' },
      { icon: ShieldCheck,label: 'OTP Verification' },
      { icon: FileText,   label: 'Billing & Plans' },
      { icon: Lock,       label: 'Org Settings' },
    ],
  },
  {
    id: 'hr', label: 'HR', icon: Users, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0',
    tagline: 'Workforce management, done.',
    cardRank: 'K', suit: '♥',
    links: [
      { label: 'HR Portal Login', path: '/hr/login', primary: true }
    ],
    features: [
      { icon: Users,      label: 'Teams & Members' },
      { icon: Clock,      label: 'Attendance Logs' },
      { icon: Bell,       label: 'Late Alerts Feed' },
      { icon: Download,   label: 'Reports Export' },
      { icon: Globe,      label: 'Meetings Scheduler' },
      { icon: Building2,  label: 'Calendar View' },
    ],
  },
  {
    id: 'staff', label: 'Staff', icon: Kanban, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE',
    tagline: 'Ship tasks. Stay in sync.',
    cardRank: 'Q', suit: '♦',
    links: [
      { label: 'Staff Portal Login', path: '/team/login', primary: true }
    ],
    features: [
      { icon: CheckSquare,label: 'My Tasks Board' },
      { icon: MessageSquare, label: 'Team Chat' },
      { icon: MessageSquare, label: 'Inbox Messages' },
      { icon: Clock,      label: 'Attendance Check-in' },
      { icon: Globe,      label: 'Team Calendar' },
      { icon: Sparkles,   label: 'FlowBot AI' },
    ],
  },
  {
    id: 'intern', label: 'Intern', icon: BookOpen, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A',
    tagline: 'Learn. Track. Grow.',
    cardRank: 'J', suit: '♣',
    links: [
      { label: 'Intern Portal Login', path: '/intern/login', primary: true }
    ],
    features: [
      { icon: BookOpen,   label: 'Learning Library' },
      { icon: BarChart3,  label: 'Course Progress' },
      { icon: CheckSquare,label: 'Task Assignments' },
      { icon: Users,      label: 'Mentor Connect' },
      { icon: Clock,      label: 'Daily Check-in' },
      { icon: Award,      label: 'Achievement Track' },
    ],
  },
];

/* Apps replaced — real brand SVG icons, circular orbit */
const replacedApps = [
  {
    name: 'Slack', color: '#4A154B', bg: '#F4EFF7', angle: 0,
    svg: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#4A154B"/>
      </svg>
    ),
  },
  {
    name: 'Jira', color: '#0052CC', bg: '#EBF2FF', angle: 60,
    svg: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005z" fill="#2684FF"/>
        <path d="M5.868 5.868H0a5.22 5.22 0 0 0 5.217 5.215h2.13V9.026A5.215 5.215 0 0 0 12.56 3.81V-0h-5.69zm5.703 0H0a5.22 5.22 0 0 0 5.22 5.215h2.128V9.026a5.215 5.215 0 0 0 5.215-5.215V-0h-5.69z" fill="url(#jiraGrad)"/>
        <defs><linearGradient id="jiraGrad" x1="6" y1="5.868" x2="12" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#0052CC"/><stop offset="100%" stopColor="#2684FF"/></linearGradient></defs>
      </svg>
    ),
  },
  {
    name: 'Notion', color: '#191919', bg: '#F0F0EE', angle: 120,
    svg: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#191919"/>
      </svg>
    ),
  },
  {
    name: 'Zoom', color: '#2D8CFF', bg: '#EBF5FF', angle: 180,
    svg: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z" fill="#2D8CFF"/>
        <path d="M6 8.5A1.5 1.5 0 0 1 7.5 7h6A1.5 1.5 0 0 1 15 8.5v4.75l3-2.25v5l-3-2.25V15.5A1.5 1.5 0 0 1 13.5 17h-6A1.5 1.5 0 0 1 6 15.5v-7z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Trello', color: '#0079BF', bg: '#EBF4FF', angle: 240,
    svg: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M21 0H3a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3z" fill="#0079BF"/>
        <path d="M10.2 5.1H5.7c-.6 0-1.1.5-1.1 1.1v11c0 .6.5 1.1 1.1 1.1h4.5c.6 0 1.1-.5 1.1-1.1V6.2c0-.6-.5-1.1-1.1-1.1zm8.1 0h-4.5c-.6 0-1.1.5-1.1 1.1v6.6c0 .6.5 1.1 1.1 1.1h4.5c.6 0 1.1-.5 1.1-1.1V6.2c0-.6-.5-1.1-1.1-1.1z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Asana', color: '#F06A6A', bg: '#FEF0F0', angle: 300,
    svg: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M19.003 12.01a4.003 4.003 0 1 1-8.007 0 4.003 4.003 0 0 1 8.007 0M8.004 17.001a4.003 4.003 0 1 1-8.007 0 4.003 4.003 0 0 1 8.007 0m11.999 0a4.003 4.003 0 1 1-8.006 0 4.003 4.003 0 0 1 8.006 0" fill="#F06A6A"/>
      </svg>
    ),
  },
];

/* ═══════════════════════════ COUNTER ═══════════════════════════ */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        const end = parseFloat(target);
        if (isNaN(end)) { setCount(target); return; }
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(+(end * ease).toFixed(1));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════ CAROUSEL ═══════════════════════════ */
function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setActive(c => (c + 1) % carouselSlides.length), 4200);
    return () => clearInterval(timer.current);
  }, [paused]);

  return (
    <div className="w-full max-w-xl mx-auto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative rounded-[20px] overflow-hidden shadow-2xl shadow-indigo-300/25 border-4 border-white" style={{ aspectRatio: '16/9' }}>
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0" style={{ background: carouselSlides[active].gradient }} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/12 pointer-events-none" />
        <div className="absolute bottom-3 left-4">
          <AnimatePresence mode="wait">
            <motion.span key={active} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[10px] font-black text-white/65 uppercase tracking-widest">
              {carouselSlides[active].label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-3.5 flex items-center justify-between px-1">
        <div className="flex gap-2 items-center">
          {carouselSlides.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="rounded-full border-none cursor-pointer transition-all duration-300"
              style={{ width: i === active ? 20 : 7, height: 7, background: i === active ? '#6366F1' : '#CBD5E1' }} />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setActive(c => (c - 1 + carouselSlides.length) % carouselSlides.length)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setActive(c => (c + 1) % carouselSlides.length)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ PORTAL FEATURE GRID ═══════════════════════════ */
function PortalSelector() {
  const navigate = useNavigate();
  const [active, setActive] = useState('admin');
  const node = portalNodes.find(n => n.id === active);

  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      {/* Role tabs */}
      <div className="flex lg:flex-col gap-2 flex-wrap lg:flex-nowrap flex-shrink-0 lg:w-40">
        {portalNodes.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 focus:outline-none"
            style={{
              background: active === n.id ? n.bg : '#fff',
              borderColor: active === n.id ? n.color : '#E2E8F0',
              boxShadow: active === n.id ? `0 4px 14px ${n.color}22` : 'none',
            }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: active === n.id ? n.color : '#F1F5F9' }}>
              <n.icon className="w-3.5 h-3.5" style={{ color: active === n.id ? '#fff' : '#94A3B8' }} />
            </div>
            <span className="text-xs font-extrabold" style={{ color: active === n.id ? n.color : '#64748B' }}>
              {n.label}
            </span>
          </button>
        ))}
      </div>

      {/* Feature icon cards panel */}
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="flex-1 rounded-2xl border-2 p-5 flex flex-col justify-between"
          style={{ background: node.bg, borderColor: node.border }}>

          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: node.color }}>
                <node.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: node.color }}>{node.label} Portal</p>
                <h4 className="text-sm font-black text-slate-900 font-display">{node.tagline}</h4>
              </div>
            </div>

            {/* Icon feature cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {node.features.map((f, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default text-center"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: node.color + '15' }}>
                    <f.icon className="w-4.5 h-4.5" style={{ color: node.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Links for Registration & Portal Login */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Direct Access:
            </span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              {node.links?.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none shadow-sm ${
                    link.primary
                      ? 'text-white hover:scale-[1.03] active:scale-[0.97]'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                  style={{
                    background: link.primary ? node.color : undefined,
                    boxShadow: link.primary ? `0 4px 14px ${node.color}35` : undefined,
                  }}
                >
                  {link.label} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════ CIRCULAR REPLACES (real brand SVGs) ═══════════════════════════ */
function ReplacesOrbit() {
  const radius = 108;
  const center = 148;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center gap-4 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" style={{ width: 296, height: 296 }}>
        {/* Dashed static orbit ring */}
        <svg className="absolute inset-0" width="296" height="296">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5 4" />
        </svg>

        {/* Rotating layer for spokes & orbiting icons */}
        <div
          className="absolute inset-0"
          style={{
            animation: 'orbitSpin 28s linear infinite',
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        >
          {/* Spoke lines connecting core to app positions */}
          <svg className="absolute inset-0" width="296" height="296">
            {replacedApps.map((app, i) => {
              const rad = (app.angle - 90) * (Math.PI / 180);
              const x2 = center + (radius - 28) * Math.cos(rad);
              const y2 = center + (radius - 28) * Math.sin(rad);
              return (
                <line key={i} x1={center} y1={center} x2={x2} y2={y2}
                  stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
              );
            })}
          </svg>

          {/* Orbiting brand icons */}
          {replacedApps.map((app) => {
            const rad = (app.angle - 90) * (Math.PI / 180);
            const x = center + radius * Math.cos(rad) - 22;
            const y = center + radius * Math.sin(rad) - 22;
            return (
              <div key={app.name} className="absolute" style={{ left: x, top: y }}>
                {/* Counter-rotating wrapper keeps icon right-side up */}
                <div
                  className="group relative cursor-pointer"
                  style={{
                    animation: 'orbitReverse 28s linear infinite',
                    animationPlayState: isHovered ? 'paused' : 'running',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white/90 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-500/30 hover:scale-115 transition-all duration-200"
                    style={{ background: app.bg }}
                  >
                    {app.svg}
                  </div>
                  <span
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white shadow-lg z-10"
                  >
                    {app.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center FlowGen logo (Static) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center justify-center gap-1 border-4 border-slate-900 shadow-2xl shadow-indigo-500/30 rounded-2xl overflow-hidden pointer-events-auto hover:scale-105 transition-transform"
            style={{ width: 68, height: 68 }}
          >
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="68" height="68">
              <defs><linearGradient id="fg-orbit" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
              <rect width="48" height="48" fill="url(#fg-orbit)"/>
              <rect x="9" y="10" width="8" height="8" rx="2" fill="white"/>
              <path d="M11 14 L12.8 15.8 L16.5 11.5" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="20" y="12" width="19" height="4" rx="2" fill="white"/>
              <rect x="9" y="21" width="8" height="8" rx="2" fill="white" fillOpacity="0.75"/>
              <rect x="20" y="23" width="14" height="4" rx="2" fill="white" fillOpacity="0.75"/>
              <rect x="9" y="32" width="8" height="8" rx="2" fill="white" fillOpacity="0.35"/>
              <rect x="20" y="34" width="9" height="4" rx="2" fill="white" fillOpacity="0.35"/>
            </svg>
          </motion.div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 font-medium max-w-[220px] leading-relaxed">
        All these tools — <strong className="text-white font-semibold">replaced, built in.</strong>
      </p>
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden font-sans antialiased" style={{ fontFamily: 'Inter, Plus Jakarta Sans, sans-serif' }}>

      {/* ── SCROLL PROGRESS ── */}
      <motion.div style={{ scaleX, transformOrigin: '0%' }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 z-[200]" />

      {/* ══════════════════════
          NAV
      ══════════════════════ */}
      <nav className="fixed inset-x-0 top-0 z-[100] h-15 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 md:px-12" style={{ height: 60 }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 group">
          {/* FlowGen logo — task checklist mark */}
          <div className="w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <defs><linearGradient id="fg-nav" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
              <rect width="48" height="48" rx="12" fill="url(#fg-nav)"/>
              <rect x="9" y="10" width="8" height="8" rx="2" fill="white"/>
              <path d="M11 14 L12.8 15.8 L16.5 11.5" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="20" y="12" width="19" height="4" rx="2" fill="white"/>
              <rect x="9" y="21" width="8" height="8" rx="2" fill="white" fillOpacity="0.75"/>
              <rect x="20" y="23" width="14" height="4" rx="2" fill="white" fillOpacity="0.75"/>
              <rect x="9" y="32" width="8" height="8" rx="2" fill="white" fillOpacity="0.35"/>
              <rect x="20" y="34" width="9" height="4" rx="2" fill="white" fillOpacity="0.35"/>
            </svg>
          </div>
          <span className="font-black text-[17px] text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>FlowGen</span>
        </button>

        <div className="hidden md:flex items-center gap-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
          {[['Platform', '#platform'], ['Modules', '#modules'], ['Pricing', '#pricing'], ['Reviews', '#reviews']].map(([n, h]) => (
            <a key={n} href={h} className="hover:text-white transition-colors">{n}</a>
          ))}
        </div>

        <div className="hidden md:block">
          <button onClick={() => navigate('/org/login')}
            className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[11px] font-bold shadow-md shadow-indigo-950/60 hover:scale-[1.04] active:scale-[0.97] transition-all cursor-pointer border-none">
            Get Started →
          </button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl border border-slate-800 bg-slate-900 text-white cursor-pointer">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-0 top-[60px] z-[99] bg-slate-900 border-b border-slate-800 p-5 flex flex-col gap-3 md:hidden shadow-xl text-white">
            {[['Platform', '#platform'], ['Modules', '#modules'], ['Pricing', '#pricing'], ['Reviews', '#reviews']].map(([n, h]) => (
              <a key={n} href={h} onClick={() => setMobileOpen(false)}
                className="text-slate-200 font-extrabold text-sm py-2 border-b border-slate-800 uppercase tracking-wider hover:text-white transition-colors">{n}</a>
            ))}
            <button onClick={() => { setMobileOpen(false); navigate('/org/login'); }}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-md cursor-pointer border-none mt-1">
              Get Started Free →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════
          §1 HERO — Premium 2-Column Split Screen (Dark Theme + White Line Grid Texture)
      ══════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden bg-slate-950 text-white">
        {/* Background glow & white grid line texture */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />
          <div className="absolute top-1/4 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-transparent blur-3xl" />
          <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-cyan-500/20 via-indigo-600/20 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-7 text-center lg:text-left">

            {/* H1 Title */}
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-black tracking-tight leading-[1.2] text-white"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Stop switching{' '}
              <span className="inline-block py-1 pr-2" style={{
                background: 'linear-gradient(100deg,#818CF8 0%,#22D3EE 55%,#C084FC 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                apps
              </span>{' '}
              Start flowing.
            </motion.h1>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Admin, HR, staff and interns — each on their own portal, all inside one <strong className="text-white font-semibold">secure tenant</strong>. Replace scattered tools with one unified core.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-2">
              <button onClick={() => navigate('/org/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white text-sm font-bold shadow-xl shadow-indigo-950/80 hover:shadow-indigo-900/90 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer border-none">
                Create Free Org <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => document.querySelector('#platform')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 text-slate-200 text-sm font-bold hover:border-slate-400 hover:text-white transition-all cursor-pointer shadow-md backdrop-blur-md">
                See how it works
              </button>
            </motion.div>

          </div>

          {/* Right Column (Glassmorphic Showcase Card with Orbit Visual) */}
          <motion.div initial={{ opacity: 0, scale: 0.94, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.65 }}
            className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            
            <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-950/80 hover:border-white/20 transition-all duration-300 group max-w-md w-full">
              
              {/* Corner ambient glow inside card */}
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

              {/* Orbit component centered inside card */}
              <div className="flex justify-center py-2">
                <ReplacesOrbit />
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* ══════════════════════
          §3 PLATFORM — White BG with Vertical Playing Cards for Portals
      ══════════════════════ */}
      <section id="platform" className="py-20 bg-white border-b border-slate-100 relative overflow-hidden text-slate-900">
        <div className="absolute inset-0 pointer-events-none select-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-100/50 via-violet-100/40 to-cyan-100/40 blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp()} className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight sm:whitespace-nowrap" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Four portals. One secure core.
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
              Every role gets its own dedicated workspace. Hover over any card to flip it and explore features & direct access links.
            </p>
          </motion.div>

          {/* 4 Role Vertical Playing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portalNodes.map((n, i) => (
              <motion.div key={n.id} {...fadeUp(i * 0.08)} className="group [perspective:1000px] h-[360px]">
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">

                  {/* ── FRONT FACE (Playing Card Aesthetic on White BG) ── */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl p-3 bg-white border-2 flex flex-col justify-between shadow-xl group-hover:shadow-2xl transition-all duration-300 [backface-visibility:hidden] select-none"
                    style={{ borderColor: n.border }}
                  >
                    {/* Playing Card Inner Frame Border */}
                    <div className="w-full h-full rounded-2xl border-2 border-slate-100 p-3.5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40">
                      
                      {/* Top-Left Corner Index (Role Name Badge) */}
                      <div className="flex items-center text-left">
                        <span
                          className="text-xs font-black font-display uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-xs"
                          style={{ background: n.color + '15', color: n.color, borderColor: n.color + '35' }}
                        >
                          {n.label}
                        </span>
                      </div>

                      {/* Center Content: ONLY Logo Badge & Minor Description */}
                      <div className="flex flex-col items-center justify-center text-center my-auto py-2">
                        {/* Centered Logo Badge */}
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl mb-3 group-hover:scale-110 transition-transform duration-300 border-2 border-white"
                          style={{ background: n.color, boxShadow: `0 8px 24px ${n.color}40` }}
                        >
                          <n.icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Minor Description Only */}
                        <p className="text-xs font-semibold text-slate-600 max-w-[195px] leading-relaxed">
                          {n.tagline}
                        </p>
                      </div>

                      {/* Bottom-Right Corner Index (Upright Role Name Badge) */}
                      <div className="flex items-center justify-end text-right">
                        <span
                          className="text-xs font-black font-display uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-xs"
                          style={{ background: n.color + '15', color: n.color, borderColor: n.color + '35' }}
                        >
                          {n.label}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* ── BACK FACE (Flipped 180 deg - Features & Access Links) ── */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 bg-slate-950 text-white border-2 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between shadow-2xl overflow-hidden"
                    style={{ borderColor: n.color }}
                  >
                    {/* Ambient background glow */}
                    <div
                      className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
                      style={{ background: n.color }}
                    />

                    <div>
                      {/* Header */}
                      <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-white/10">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow" style={{ background: n.color }}>
                          <n.icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-sm font-black text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{n.label} Features</h4>
                      </div>

                      {/* Included Features List */}
                      <div className="space-y-1.5 my-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Included Capabilities:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {n.features.map((f, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold"
                              style={{ background: n.color + '22', color: n.color, border: `1px solid ${n.color}40` }}
                            >
                              <f.icon className="w-3 h-3 flex-shrink-0" />
                              {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action / Login Buttons */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      {n.links?.map((link, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); navigate(link.path); }}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer border-none shadow-md ${
                            link.primary
                              ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                              : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                          style={{
                            background: link.primary ? n.color : undefined,
                            boxShadow: link.primary ? `0 4px 14px ${n.color}50` : undefined,
                          }}
                        >
                          {link.label} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════
          §4 MODULES — Dark slate bento grid
      ══════════════════════ */}
      <section id="modules" className="py-20 bg-slate-950 border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp()} className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Everything built in.</h2>
            <p className="text-slate-400 text-sm font-medium">Six modules. Zero integrations. Ready the moment you log in.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* A — indigo filled tall */}
            <motion.div {...fadeUp(0.04)} className="md:row-span-2 rounded-3xl bg-indigo-600 p-7 flex flex-col justify-between text-white relative overflow-hidden group cursor-default shadow-xl shadow-indigo-950">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
              <div>
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-5 shadow-sm">
                  <Shield className="w-5.5 h-5.5 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Org Command Center</h3>
                <p className="text-indigo-100 text-sm leading-relaxed font-medium">Set domain locks, manage user caps, read audit logs — the entire org at a glance from one admin dashboard.</p>
              </div>
              <span className="text-indigo-200 text-xs font-bold flex items-center gap-1 mt-5">Admin access only <ArrowRight className="w-3 h-3" /></span>
            </motion.div>

            {/* B — emerald */}
            <motion.div {...fadeUp(0.07)} className="rounded-3xl bg-slate-900/90 border-2 border-emerald-500/30 p-5 flex flex-col justify-between hover:border-emerald-500/70 hover:-translate-y-1 transition-all duration-250 cursor-default shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-950 group-hover:scale-110 transition-transform">
                    <Kanban className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Sprints</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Agile Kanban Sprints</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Story points, backlogs, velocity — all in one board. No Jira needed.</p>
              </div>
            </motion.div>

            {/* C — purple */}
            <motion.div {...fadeUp(0.1)} className="rounded-3xl bg-slate-900/90 border-2 border-purple-500/30 p-5 flex flex-col justify-between hover:border-purple-500/70 hover:-translate-y-1 transition-all duration-250 cursor-default shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-950 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Chat</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Isolated Team Chats</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Tenant-scoped messaging. No data crossover. Built-in, not bolted on.</p>
              </div>
            </motion.div>

            {/* D — cyan wide */}
            <motion.div {...fadeUp(0.13)} className="md:col-span-2 rounded-3xl bg-cyan-600 p-6 flex flex-col sm:flex-row items-center gap-5 text-white relative overflow-hidden shadow-xl shadow-cyan-950 group cursor-default">
              <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-sm">
                <Clock className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="relative z-10 flex-1">
                <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest text-cyan-100">HR Module</span>
                <h3 className="text-base font-black mt-1.5 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>HR Attendance & Rosters</h3>
                <p className="text-cyan-100 text-xs leading-relaxed font-medium max-w-md">Check-in registers, late-clock alerts, monthly exports — no third-party HR tool needed.</p>
              </div>
            </motion.div>

            {/* E — rose */}
            <motion.div {...fadeUp(0.16)} className="rounded-3xl bg-slate-900/90 border-2 border-rose-500/30 p-5 flex flex-col justify-between hover:border-rose-500/70 hover:-translate-y-1 transition-all duration-250 cursor-default shadow-lg group">
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center mb-3 shadow-md shadow-rose-950 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Intern Learning Hub</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Courses, daily streaks, mentor channels. Interns always know what to do next.</p>
              </div>
            </motion.div>

            {/* F — amber full width */}
            <motion.div {...fadeUp(0.19)} className="md:col-span-2 rounded-3xl border-2 border-amber-500/30 bg-slate-900/90 p-5 flex flex-col sm:flex-row items-center gap-4 hover:border-amber-500/70 transition-all duration-250 cursor-default group shadow-lg">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-950 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-widest">AI Copilot</span>
                <h3 className="text-sm font-extrabold text-white mt-1.5 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>FlowBot AI — Sprint Intelligence</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-lg">Ask FlowBot. It reads your live data and writes sprint summaries, task plans and workload reports in seconds.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════
          §5 HOW IT WORKS — indigo-50 tint
      ══════════════════════ */}
      <section className="py-16 bg-indigo-50/50 border-y border-indigo-100">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp()} className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Up in 3 steps.</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute top-10 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 hidden md:block rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: '1', icon: Lock,       color: '#6366F1', light: '#EEF2FF', title: 'Create Your Org',       desc: 'Verify with a 6-digit OTP. Your isolated DB tenant spins up instantly.' },
                { n: '2', icon: Users,      color: '#8B5CF6', light: '#F5F3FF', title: 'HR Onboards the Team',  desc: 'HR maps roles, adds members, and sets attendance rules from one panel.' },
                { n: '3', icon: TrendingUp, color: '#06B6D4', light: '#ECFEFF', title: 'Sprint. Track. Learn.',  desc: 'Staff ship Kanban tasks. Interns hit streaks. FlowBot keeps everyone in the loop.' },
              ].map((s, i) => (
                <motion.div key={i} {...fadeUp(i * 0.12)} className="flex flex-col items-center text-center gap-4">
                  <div className="relative z-10 w-20 h-20 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform cursor-default" style={{ background: s.light }}>
                    <s.icon className="w-8 h-8" style={{ color: s.color }} />
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-md" style={{ background: s.color }}>
                      {s.n}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-[200px] mx-auto">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          §6 PRICING — Dark navy (contrast break after white §4 and light §5)
      ══════════════════════ */}
      <section id="pricing" className="py-16 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-indigo-900/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp()} className="text-center max-w-md mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pick your plan.</h2>
            <p className="text-slate-500 text-sm font-medium">Start free. Upgrade when ready.</p>
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 mt-2">
              {['monthly', 'annual'].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all border-none cursor-pointer ${billing === b ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-300'}`}>
                  {b === 'annual' ? 'Annual −20%' : 'Monthly'}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan, i) => {
              const priceVal = plan.price[billing];
              const inr = plan.name === 'Sandbox Free' ? '₹0' : plan.name === 'FlowGen Pro' ? (billing === 'annual' ? '₹3,299' : '₹4,099') : (billing === 'annual' ? '₹9,999' : '₹12,499');

              return (
                <motion.div key={i} {...fadeUp(i * 0.1)}
                  className="rounded-2xl border flex flex-col relative overflow-hidden"
                  style={{
                    background: plan.popular ? '#0F172A' : '#0D1117',
                    borderColor: plan.popular ? plan.color + '60' : '#1E293B',
                    boxShadow: plan.popular ? `0 0 40px ${plan.color}18` : 'none',
                  }}>
                  {plan.popular && (
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${plan.color},#6366F1)` }} />
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {plan.popular && (
                      <div className="mb-3 inline-flex self-start px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white"
                        style={{ background: `linear-gradient(90deg,${plan.color},#6366F1)` }}>
                        ✦ Most Popular
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: plan.color }}>{plan.name}</span>
                      <span className="text-[9px] font-black border rounded-full px-2 py-0.5 uppercase tracking-wider"
                        style={{ color: plan.color, borderColor: plan.color + '35', background: plan.color + '12' }}>{plan.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mb-4">{plan.desc}</p>

                    <div className="flex items-end gap-1 mb-0.5">
                      <span className="text-4xl font-black text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>${priceVal}</span>
                      {priceVal > 0 && <span className="text-xs text-slate-600 mb-1.5"></span>}
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono font-bold mb-5">
                      {priceVal === 0}
                    </p>

                    <button onClick={() => navigate('/org/login')}
                      className="w-full py-3 rounded-xl text-xs font-black border-none cursor-pointer transition-all mb-5 hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background: plan.popular ? `linear-gradient(135deg,${plan.color},#6366F1)` : '#1E293B',
                        color: plan.popular ? '#fff' : plan.color,
                        boxShadow: plan.popular ? `0 6px 20px ${plan.color}35` : 'none',
                      }}>
                      {priceVal === 0 ? 'Launch Free Workspace →' : 'Start Free Trial →'}
                    </button>

                    <ul className="space-y-2 border-t border-slate-800 pt-4 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="text-emerald-500 font-black flex-shrink-0">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reviews" className="py-16 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 text-center">
          <motion.div {...fadeUp()} className="mb-10">
            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Real teams. Real results.</h2>
            <p className="text-indigo-200 text-sm font-medium">No marketing fluff — what users actually say.</p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={testimonialIdx}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.38 }}
              className="p-7 sm:p-9 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
              <div className="flex justify-center gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, i) => <span key={i} className="text-amber-400 text-lg">★</span>)}
              </div>
              <p className="text-white/90 text-base leading-relaxed mb-7 font-medium">
                "{testimonials[testimonialIdx].quote}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                  style={{ background: `linear-gradient(135deg,${testimonials[testimonialIdx].color},${testimonials[testimonialIdx].color}88)` }}>
                  {testimonials[testimonialIdx].initials}
                </div>
                <div className="text-left">
                  <p className="font-black text-white text-sm">{testimonials[testimonialIdx].name}</p>
                  <p className="text-indigo-300 text-[11px] font-medium">{testimonials[testimonialIdx].role} · {testimonials[testimonialIdx].company}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-5">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)}
                className="rounded-full border-none cursor-pointer transition-all duration-300"
                style={{ width: i === testimonialIdx ? 22 : 7, height: 7, background: i === testimonialIdx ? '#fff' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════
          §8 CTA — Clean white (closes after dark/vivid sections)
      ══════════════════════ */}
      <section className="py-20 px-6 bg-white border-t border-slate-100 text-center">
        <motion.div {...fadeUp()} className="max-w-lg mx-auto space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Your team deserves<br />
            <span style={{ background: 'linear-gradient(90deg,#6366F1,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              better tools.
            </span>
          </h2>
          <p className="text-slate-500 text-base font-medium">
            Free to start. 60 seconds to your first workspace. No credit card.
          </p>
          <button onClick={() => navigate('/org/login')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-black shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.04] active:scale-[0.97] transition-all cursor-pointer border-none">
            Create Free Organization <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-slate-400 text-xs font-medium">Free up to 5 members · No setup required · Upgrade anytime</p>
        </motion.div>
      </section>

      {/* ══════════════════════
          FOOTER — Slate-950
      ══════════════════════ */}
      <footer className="bg-slate-950 border-t border-slate-900 py-14 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-9 mb-10">
            <div className="sm:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex-shrink-0">
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                    <defs><linearGradient id="fg-footer" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
                    <rect width="48" height="48" rx="12" fill="url(#fg-footer)"/>
                    <rect x="9" y="10" width="8" height="8" rx="2" fill="white"/>
                    <path d="M11 14 L12.8 15.8 L16.5 11.5" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="20" y="12" width="19" height="4" rx="2" fill="white"/>
                    <rect x="9" y="21" width="8" height="8" rx="2" fill="white" fillOpacity="0.75"/>
                    <rect x="20" y="23" width="14" height="4" rx="2" fill="white" fillOpacity="0.75"/>
                    <rect x="9" y="32" width="8" height="8" rx="2" fill="white" fillOpacity="0.35"/>
                    <rect x="20" y="34" width="9" height="4" rx="2" fill="white" fillOpacity="0.35"/>
                  </svg>
                </div>
                <span className="font-black text-lg text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>FlowGen</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs font-medium">
                One workforce OS for Admin, HR, staff and interns. Replaces 6+ tools under one isolated tenant.
              </p>
              <div className="flex gap-2.5 pt-1">
                {[Mail, Globe, GitBranch, ExternalLink].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:border-indigo-800 transition-all">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: [{ n: 'Modules', h: '#modules' }, { n: 'Pricing', h: '#pricing' }] },
              {
                title: 'Portals',
                links: [
                  { n: 'Admin Login',     p: '/org/login' },
                  { n: 'HR Panel',        p: '/hr/login' },
                  { n: 'Staff Workspace', p: '/team/login' },
                  { n: 'Intern Hub',      p: '/intern/login' },
                ],
              },
              {
                title: 'Security',
                links: [
                  { n: 'Tenancy Isolation', p: '/org/login' },
                  { n: 'Schema Audit',      p: '/org/login' },
                  { n: 'OTP Status',        p: '/org/login' },
                ],
              },
            ].map(col => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{col.title}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l, idx) => {
                    const go = (e) => {
                      if (l.h) { e.preventDefault(); document.querySelector(l.h)?.scrollIntoView({ behavior: 'smooth' }); }
                      else if (l.p) { e.preventDefault(); navigate(l.p); }
                    };
                    return (
                      <li key={idx}>
                        <a href={l.h || l.p} onClick={go}
                          className="text-xs text-slate-600 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 font-medium">
                          {l.n} {!l.h && <ArrowUpRight className="w-2.5 h-2.5 opacity-50" />}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-7 border-t border-slate-900 gap-3">
            <p className="text-[10px] text-slate-700 font-medium">© 2026 FlowGen Technologies. All rights reserved.</p>
            <p className="text-[10px] text-slate-800 font-medium">Built for teams who move fast.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
