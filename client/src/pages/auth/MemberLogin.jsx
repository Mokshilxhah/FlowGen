import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, Clock } from 'lucide-react';
import FlowGenLogo from '../../components/ui/FlowGenLogo';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const roleRedirects = {
  org_admin: '/org/dashboard',
  hr: '/hr/dashboard',
  employee: '/employee/dashboard',
  intern: '/intern/dashboard',
};

export default function MemberLogin() {
  const navigate = useNavigate();
  const { login, isLoading, clearError } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [startTimer, setStartTimer] = useState(true);

  const onSubmit = async (data) => {
    clearError();
    const result = await login(data.email, data.password);
    if (result.success) {
      if (startTimer) {
        localStorage.setItem('flowgen_timer_enabled', 'true');
        localStorage.setItem('flowgen_timer_start', Date.now().toString());
      } else {
        localStorage.setItem('flowgen_timer_enabled', 'false');
        localStorage.removeItem('flowgen_timer_start');
      }
      toast.success('Welcome back!');
      navigate(roleRedirects[result.role] || '/');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#080B14' }}>
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <FlowGenLogo size={40} />
            <span className="font-bold text-xl font-display" style={{ color: '#F1F5F9' }}>FlowGen</span>
          </div>

          <h1 className="text-3xl font-bold font-display mb-2" style={{ color: '#F1F5F9' }}>Welcome back</h1>
          <p className="mb-8 text-sm" style={{ color: '#94A3B8' }}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <Input label="Company Email" type="email" icon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" icon={<Lock size={16} />} error={errors.password?.message} {...register('password')} />
            
            {/* Start Work Session Timer Option */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">Start Work Session Timer?</span>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStartTimer(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      startTimer ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartTimer(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      !startTimer ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                {startTimer ? 'Timer starts upon login and displays HH:MM in top welcome banner.' : 'Timer stays at 00:00.'}
              </p>
            </div>

            <div className="flex justify-end">
              <Link to="/auth/forgot-password" className="text-sm" style={{ color: '#6366F1' }}>Forgot password?</Link>
            </div>
            <Button type="submit" fullWidth loading={isLoading} iconRight={<ArrowRight size={16} />}>Sign In</Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
            Register your organization?{' '}
            <Link to="/auth/org" style={{ color: '#6366F1' }}>Create account</Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0E1A, #0D1117)' }}>
        <div className="absolute w-96 h-96 rounded-full top-0 right-0 opacity-10" style={{ background: '#6366F1', filter: 'blur(100px)' }} />
        <div className="absolute w-64 h-64 rounded-full bottom-0 left-0 opacity-10" style={{ background: '#8B5CF6', filter: 'blur(80px)' }} />
        <div className="absolute w-48 h-48 rounded-full top-1/2 left-1/4 opacity-8" style={{ background: '#06B6D4', filter: 'blur(60px)' }} />

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 text-center px-12 max-w-sm">
          <div className="rounded-3xl p-8 bg-white/5 border border-white/10 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold font-display mb-3" style={{ color: '#F1F5F9' }}>Clean seeded dashboards</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Use the seeded accounts from `SEED_CREDENTIALS.md` for a fresh, clean organization setup.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
