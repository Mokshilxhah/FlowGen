import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Check, Crown, Zap, ArrowRight, Loader2, X, Shield,
  Star, Rocket, Building2, Sparkles, Lock, ChevronRight, CheckCircle2,
  Clock, Wifi, AlertCircle, FileText, Download, Ban
} from 'lucide-react';
import { api } from '../../lib/api';
import { showToast } from '../../utils/toast';

// ─── Plan definitions ─────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceINR: 0,
    period: 'forever',
    icon: Zap,
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    glow: 'rgba(99,102,241,0.35)',
    badge: null,
    tier: 0,
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 5 team members',
      'Basic task management',
      'Project tracking',
      '1 GB storage',
      'Email support',
      'Basic analytics',
    ],
    limits: ['No custom integrations', 'No SSO', 'Limited reports'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceINR: 4099,
    period: 'month',
    icon: Rocket,
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4, #6366F1)',
    glow: 'rgba(6,182,212,0.4)',
    badge: 'Most Popular',
    tier: 1,
    description: 'For growing teams that need more power',
    features: [
      'Unlimited team members',
      'Advanced task management',
      'Sprint & Kanban boards',
      'HR & Attendance module',
      '50 GB storage',
      'Priority support',
      'Advanced analytics',
      'AI Assistant access',
      'Custom roles & permissions',
      'Slack & Teams integration',
    ],
    limits: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    priceINR: 12499,
    period: 'month',
    icon: Building2,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    glow: 'rgba(245,158,11,0.4)',
    badge: 'Best Value',
    tier: 2,
    description: 'For large organizations needing full control',
    features: [
      'Everything in Pro',
      'SSO / SAML Authentication',
      'Custom integrations & API',
      'Dedicated account manager',
      'Unlimited storage',
      'SLA-backed 99.9% uptime',
      'Advanced security & audit logs',
      'White-label options',
      'On-premise deployment',
      '24/7 phone & chat support',
    ],
    limits: [],
  },
];

// ─── Plan Feature Modal ───────────────────────────────────────────
function PlanModal({ plan, currentPlan, onClose, onSubscribe }) {
  if (!plan) return null;
  const Icon = plan.icon;
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === 'free';
  const currentTier = PLANS.find(p => p.id === currentPlan)?.tier ?? 0;
  const isLocked = plan.tier < currentTier; // lower tier than current → locked

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full overflow-hidden flex flex-col"
          style={{
            maxWidth: 560,
            maxHeight: '90vh',
            background: 'rgba(10, 14, 26, 0.99)',
            border: `1px solid ${plan.color}45`,
            borderRadius: 24,
            boxShadow: `0 32px 80px rgba(0,0,0,0.75), 0 0 60px ${plan.glow}`,
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full flex-shrink-0" style={{ background: plan.gradient }} />

          {/* Header */}
          <div className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}
                >
                  <Icon size={24} style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>{plan.name}</h2>
                    {plan.badge && !isCurrentPlan && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${plan.color}25`, color: plan.color }}>
                        {plan.badge}
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(244,63,94,0.15)', color: '#F43F5E' }}>
                        <Ban size={10} /> Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{plan.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all flex-shrink-0 ml-3"
                style={{ color: '#475569', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F1F5F9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#475569'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-end gap-2">
              <div className="flex items-start">
                <span className="text-xl font-bold mt-2" style={{ color: plan.color }}>₹</span>
                <span className="text-5xl font-black font-display" style={{ color: '#F1F5F9' }}>
                  {plan.priceINR.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-base mb-2" style={{ color: '#475569' }}>
                {isFree ? 'forever' : '/ month'}
              </span>
            </div>
            {!isFree && (
              <p className="text-xs mt-1" style={{ color: '#475569' }}>
                ≈ ${plan.price} USD · Billed monthly · Cancel anytime
              </p>
            )}
          </div>

          <div className="mx-6 mt-5 h-px flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }} />

          {/* Features list */}
          <div className="p-6 pt-4 overflow-y-auto flex-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
              What's included
            </p>
            <div className="space-y-2.5">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} style={{ color: isLocked ? '#475569' : plan.color, flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: isLocked ? '#475569' : '#CBD5E1' }}>{f}</span>
                </div>
              ))}
              {plan.limits.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <X size={14} style={{ color: '#475569', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: '#475569' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-6 pb-6 pt-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            {isCurrentPlan ? (
              <div
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: `${plan.color}18`, color: plan.color, border: `1px solid ${plan.color}35` }}
              >
                <CheckCircle2 size={16} /> Your Current Plan
              </div>
            ) : isLocked ? (
              <div
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: 'rgba(244,63,94,0.08)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.25)' }}
              >
                <Ban size={16} /> Not available on your current plan
              </div>
            ) : isFree ? (
              <div
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <CheckCircle2 size={16} /> Your Default Plan
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02, opacity: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSubscribe(plan)}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-white text-base"
                  style={{ background: plan.gradient, boxShadow: `0 8px 30px ${plan.glow}` }}
                >
                  <CreditCard size={18} />
                  Subscribe with Razorpay
                  <ChevronRight size={16} />
                </motion.button>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock size={11} style={{ color: '#475569' }} />
                  <p className="text-xs" style={{ color: '#475569' }}>Secured by Razorpay · 256-bit SSL encrypted</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Razorpay Modal ───────────────────────────────────────────────
function RazorpayModal({ plan, onSuccess, onClose }) {
  const [stage, setStage] = useState('form');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  // stable random ids
  const [txnId] = useState(() => `pay_${Math.random().toString(36).substr(2, 14).toUpperCase()}`);
  const [orderId] = useState(() => `order_${Math.random().toString(36).substr(2, 14).toUpperCase()}`);

  const startPayment = () => {
    setStage('processing');
    setProgress(0);
    const start = Date.now();
    const duration = 10000;

    intervalRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(intervalRef.current);
    }, 80);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setProgress(100);
      setStage('success');
      setTimeout(() => onSuccess(txnId, orderId), 1600);
    }, 10000);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(intervalRef.current); }, []);

  if (!plan) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(18px)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
          style={{ maxWidth: 420, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}
        >
          {/* Razorpay brand header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg, #072654 0%, #0f3d9e 60%, #1a56db 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: '#fff', color: '#072654' }}>
                R
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Razorpay Checkout</p>
                <p className="text-blue-200 text-xs">FlowGen Technologies Pvt. Ltd.</p>
              </div>
            </div>
            {stage === 'form' && (
              <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Amount strip */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f0f4ff', borderBottom: '1px solid #dde3f0' }}>
            <div>
              <p className="text-xs text-gray-500 font-medium">Amount to Pay</p>
              <p className="text-2xl font-black text-gray-900 leading-tight">₹{plan.priceINR.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-700">{plan.name} Plan</p>
              <p className="text-xs text-gray-400">Monthly Subscription</p>
            </div>
          </div>

          <div className="p-5">
            {/* FORM STAGE */}
            {stage === 'form' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Test mode warning */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }}>
                  <AlertCircle size={13} className="flex-shrink-0" />
                  Test Mode — This is a demo. No real charge applies.
                </div>

                {/* UPI */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">UPI ID</label>
                  <input readOnly defaultValue="test@razorpay"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-700 font-medium"
                    style={{ background: '#f1f5f9', border: '2px solid #e2e8f0', outline: 'none' }}
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Card Number</label>
                  <input readOnly defaultValue="4111  1111  1111  1111"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-700 font-medium tracking-widest"
                    style={{ background: '#f1f5f9', border: '2px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Expiry</label>
                    <input readOnly defaultValue="12 / 29"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-700 font-medium"
                      style={{ background: '#f1f5f9', border: '2px solid #e2e8f0', outline: 'none' }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">CVV</label>
                    <input readOnly defaultValue="• • •"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-700 font-medium"
                      style={{ background: '#f1f5f9', border: '2px solid #e2e8f0', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Order meta */}
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Order ID</span>
                    <span className="font-mono text-gray-700 text-[10px]">{orderId}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Merchant</span>
                    <span className="font-semibold text-gray-700">FlowGen Technologies</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Plan</span>
                    <span className="font-semibold" style={{ color: plan.color }}>{plan.name} — Monthly</span>
                  </div>
                </div>

                {/* Pay button */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={startPayment}
                  className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-[15px]"
                  style={{ background: 'linear-gradient(135deg, #072654, #1a56db)', boxShadow: '0 4px 20px rgba(7,38,84,0.4)' }}
                >
                  <Lock size={15} />
                  Pay ₹{plan.priceINR.toLocaleString('en-IN')} Securely
                </motion.button>

                <div className="flex items-center justify-center gap-1.5">
                  <Shield size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400">Secured by Razorpay • 256-bit SSL • PCI DSS Compliant</p>
                </div>
              </motion.div>
            )}

            {/* PROCESSING STAGE */}
            {stage === 'processing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-5">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(7,38,84,0.1), rgba(26,86,219,0.15))', border: '2px solid rgba(26,86,219,0.3)' }}>
                      <Wifi size={26} style={{ color: '#1a56db' }} />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: '2px solid rgba(26,86,219,0.4)' }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <p className="font-black text-gray-800 text-lg">Processing Payment</p>
                  <p className="text-gray-500 text-sm mt-1">Please keep this window open…</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                    <span>Verifying with bank...</span>
                    <span className="font-bold" style={{ color: '#1a56db' }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #072654, #1a56db)', width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Transaction: <span className="font-mono text-gray-700 text-[10px]">{txnId}</span>
                  </p>
                </div>

                <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
                  <div className="flex items-center gap-1"><Shield size={11} /><span>SSL Secured</span></div>
                  <div className="flex items-center gap-1"><Lock size={11} /><span>Encrypted</span></div>
                  <div className="flex items-center gap-1"><Star size={11} /><span>PCI DSS</span></div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS STAGE */}
            {stage === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', boxShadow: '0 0 35px rgba(16,185,129,0.45)' }}
                >
                  <Check size={36} className="text-white" strokeWidth={3} />
                </motion.div>
                <div>
                  <p className="font-black text-gray-800 text-xl">Payment Successful! 🎉</p>
                  <p className="text-gray-500 text-sm mt-1">₹{plan.priceINR.toLocaleString('en-IN')} charged successfully</p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p className="text-xs text-green-700 font-mono">{txnId}</p>
                  <p className="text-xs text-green-600 mt-1">✓ Invoice generated · Redirecting…</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────
function PlanCard({ plan, currentPlan, onViewPlan }) {
  const Icon = plan.icon;
  const currentTier = PLANS.find(p => p.id === currentPlan)?.tier ?? 0;
  const isActive   = currentPlan === plan.id;
  const isLocked   = plan.tier < currentTier;  // lower than current → locked
  const isFree     = plan.id === 'free';

  return (
    <motion.div
      whileHover={!isLocked ? { y: -5, scale: 1.015 } : {}}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl p-6 flex flex-col"
      style={{
        background: isActive
          ? `linear-gradient(145deg, ${plan.color}18, ${plan.color}06)`
          : isLocked
          ? 'rgba(255,255,255,0.01)'
          : 'rgba(255,255,255,0.025)',
        border: isActive
          ? `2px solid ${plan.color}65`
          : isLocked
          ? '1px solid rgba(255,255,255,0.04)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? `0 0 45px ${plan.glow}` : 'none',
        opacity: isLocked ? 0.45 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Top badge */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap"
          style={{ background: plan.gradient, color: '#fff', boxShadow: `0 4px 15px ${plan.glow}` }}>
          <CheckCircle2 size={11} /> Active Plan
        </div>
      )}
      {!isActive && !isLocked && plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
          style={{ background: plan.gradient, color: '#fff', boxShadow: `0 4px 15px ${plan.glow}` }}>
          {plan.badge}
        </div>
      )}
      {isLocked && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap"
          style={{ background: 'rgba(244,63,94,0.15)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}>
          <Ban size={10} /> Not Available
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mt-2"
        style={{ background: `${plan.color}${isLocked ? '10' : '20'}`, border: `1px solid ${plan.color}${isLocked ? '20' : '35'}` }}>
        <Icon size={22} style={{ color: plan.color }} />
      </div>

      <h3 className="text-xl font-black font-display" style={{ color: isLocked ? '#334155' : '#F1F5F9' }}>{plan.name}</h3>
      <p className="text-xs mt-1 mb-4" style={{ color: '#475569' }}>{plan.description}</p>

      {/* Price */}
      <div className="flex items-end gap-1 mb-5">
        {isFree ? (
          <span className="text-4xl font-black font-display" style={{ color: isLocked ? '#334155' : '#F1F5F9' }}>Free</span>
        ) : (
          <>
            <span className="text-xl font-bold mt-1.5" style={{ color: plan.color }}>₹</span>
            <span className="text-4xl font-black font-display" style={{ color: isLocked ? '#334155' : '#F1F5F9' }}>
              {plan.priceINR.toLocaleString('en-IN')}
            </span>
            <span className="text-sm mb-1.5" style={{ color: '#475569' }}>/mo</span>
          </>
        )}
      </div>

      {/* Top 4 features */}
      <div className="space-y-2 mb-6 flex-1">
        {plan.features.slice(0, 4).map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check size={13} style={{ color: isLocked ? '#334155' : plan.color, flexShrink: 0 }} />
            <span className="text-xs" style={{ color: isLocked ? '#334155' : '#94A3B8' }}>{f}</span>
          </div>
        ))}
        {plan.features.length > 4 && (
          <p className="text-xs" style={{ color: isLocked ? '#334155' : plan.color }}>
            +{plan.features.length - 4} more features
          </p>
        )}
      </div>

      {/* CTA button */}
      <motion.button
        whileHover={!isLocked && !isActive ? { scale: 1.03 } : {}}
        whileTap={!isLocked && !isActive ? { scale: 0.97 } : {}}
        onClick={() => !isLocked && onViewPlan(plan)}
        disabled={isLocked}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        style={
          isLocked
            ? { background: 'rgba(255,255,255,0.03)', color: '#334155', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }
            : isActive
            ? { background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}45` }
            : isFree
            ? { background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }
            : { background: plan.gradient, color: '#fff', boxShadow: `0 4px 20px ${plan.glow}` }
        }
      >
        {isLocked ? (
          <><Ban size={14} /> Not Available</>
        ) : isActive ? (
          <><CheckCircle2 size={15} /> Current Plan</>
        ) : isFree ? (
          <>View Details</>
        ) : (
          <>Upgrade <ArrowRight size={15} /></>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────
function InvoiceRow({ inv }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <FileText size={14} style={{ color: '#10B981' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{inv.id}</p>
          <p className="text-xs" style={{ color: '#475569' }}>{inv.date} · {inv.plan} Plan</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-black" style={{ color: '#F1F5F9' }}>₹{inv.amount.toLocaleString('en-IN')}</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
          Paid
        </span>
        <button className="p-1.5 rounded-lg transition-all" style={{ color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          title="Download Invoice"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main BillingPage ─────────────────────────────────────────────
export default function BillingPage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentPlan, setPaymentPlan]   = useState(null);
  // invoices stored in session state (persist after payment, reset on new session)
  const [invoices, setInvoices] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('fg_invoices') || '[]'); } catch { return []; }
  });

  const { data: billing, isLoading } = useQuery({
    queryKey: ['org', 'billing'],
    queryFn: async () => (await api.get('/org/billing')).data.data,
  });

  const upgradeMutation = useMutation({
    mutationFn: (payload) => api.patch('/org/billing/upgrade', payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org', 'billing'] });
      const planName = PLANS.find(p => p.id === variables.plan)?.name || variables.plan;
      showToast.success(`🎉 You're now on the ${planName} plan!`);
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Upgrade failed'),
  });

  const handlePaymentSuccess = (txnId, orderId) => {
    const plan = paymentPlan;
    // Generate invoice
    const inv = {
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      plan: plan.name,
      amount: plan.priceINR,
      txnId,
      orderId,
    };
    const updated = [inv, ...invoices];
    setInvoices(updated);
    sessionStorage.setItem('fg_invoices', JSON.stringify(updated));

    setPaymentPlan(null);
    setSelectedPlan(null);
    upgradeMutation.mutate({
      plan: plan.id,
      razorpay_payment_id: txnId,
      razorpay_order_id: orderId,
      razorpay_signature: 'mock_signature'
    });
    setTimeout(() => navigate('/org/dashboard'), 1800);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 size={28} style={{ color: '#6366F1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Default to 'free' — never default to a paid plan
  const currentPlan = billing?.plan && ['free', 'pro', 'enterprise'].includes(billing.plan)
    ? billing.plan
    : 'free';

  const cp = PLANS.find(p => p.id === currentPlan);
  const CpIcon = cp?.icon || Zap;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* Page header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 0 20px rgba(245,158,11,0.35)' }}>
              <Crown size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>Plans & Billing</h2>
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B', marginLeft: 52 }}>
            Choose the plan that's right for you. Upgrade anytime, cancel anytime.
          </p>
        </div>

        {/* Current plan status */}
        {cp && (
          <div className="flex items-center justify-between rounded-2xl px-5 py-4"
            style={{ background: `linear-gradient(135deg, ${cp.color}12, ${cp.color}04)`, border: `1px solid ${cp.color}35` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cp.color}20` }}>
                <CpIcon size={18} style={{ color: cp.color }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#F1F5F9' }}>
                  Active Plan: <span style={{ color: cp.color }}>{cp.name}</span>
                </p>
                <p className="text-xs" style={{ color: '#475569' }}>
                  {currentPlan === 'free'
                    ? 'Upgrade to unlock powerful features'
                    : `₹${cp.priceINR.toLocaleString('en-IN')}/month · Subscription active`}
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${cp.color}25`, color: cp.color }}>
              ● Active
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} onViewPlan={setSelectedPlan} />
          ))}
        </div>

        {/* Invoice history */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-base font-semibold font-display mb-4 flex items-center gap-2" style={{ color: '#F1F5F9' }}>
            <CreditCard size={16} style={{ color: '#6366F1' }} />
            Invoice History
          </h3>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileText size={32} style={{ color: '#1E293B' }} />
              <p className="text-sm" style={{ color: '#475569' }}>No invoices yet</p>
              <p className="text-xs" style={{ color: '#334155' }}>Invoices will appear here after your first payment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pb-2">
          {[
            { icon: Shield, label: 'SSL Secured' },
            { icon: Lock, label: '256-bit Encrypted' },
            { icon: Star, label: 'PCI DSS Compliant' },
            { icon: Sparkles, label: 'Razorpay Powered' },
          ].map(({ icon: IIcon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <IIcon size={13} style={{ color: '#334155' }} />
              <span className="text-xs" style={{ color: '#334155' }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Plan Feature Modal */}
      {selectedPlan && !paymentPlan && (
        <PlanModal
          plan={selectedPlan}
          currentPlan={currentPlan}
          onClose={() => setSelectedPlan(null)}
          onSubscribe={(plan) => setPaymentPlan(plan)}
        />
      )}

      {/* Razorpay Payment Modal */}
      {paymentPlan && (
        <RazorpayModal
          plan={paymentPlan}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentPlan(null)}
        />
      )}
    </>
  );
}
