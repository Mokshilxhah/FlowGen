import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Lock, Crown, ArrowLeft, Sparkles } from 'lucide-react';

export default function PlanLockGuard({ children }) {
  const { organization, user } = useAuthStore();
  const navigate = useNavigate();

  const isFreePlan = !organization?.plan || organization?.plan === 'free';
  const isAdmin = user?.role === 'org_admin';

  if (!isFreePlan) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[70vh] w-full flex items-center justify-center p-6 overflow-hidden rounded-3xl bg-slate-950/40 border border-indigo-500/10 backdrop-blur-md">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-purple-500/10 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-md mx-auto space-y-6">
        {/* Animated Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-600/15 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/5">
          <div className="relative">
            <Lock className="w-8 h-8 text-indigo-400" />
            <Crown className="w-4 h-4 text-amber-400 absolute -top-2 -right-2 rotate-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-[#F1F5F9] font-display flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Premium Feature Locked
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            This module (analytics, AI assistance, sprints, and attendance tracking) is exclusive to our <span className="font-bold text-indigo-400">Pro & Enterprise</span> plans.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-semibold transition-all bg-white/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <button
              onClick={() => navigate('/org/billing')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer border-none"
            >
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 bg-slate-900/50 rounded-xl p-3 border border-white/5">
              Please contact your organization administrator (Admin) to upgrade the plan and enable this feature.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-semibold transition-all bg-white/5 cursor-pointer mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
