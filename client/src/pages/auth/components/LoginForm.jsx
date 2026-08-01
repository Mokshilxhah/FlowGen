import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { showToast } from '../../../utils/toast';

export default function LoginForm({ role, accentColor, onSubmit, showSignUp = false, showTimer = true }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [startTimer, setStartTimer]     = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Write timer preference to localStorage before login navigates away
      if (showTimer) {
        if (startTimer) {
          localStorage.setItem('flowgen_timer_enabled', 'true');
          localStorage.setItem('flowgen_timer_start', Date.now().toString());
        } else {
          localStorage.setItem('flowgen_timer_enabled', 'false');
          localStorage.removeItem('flowgen_timer_start');
        }
      }
      await onSubmit(email, password);
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      showToast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 ml-0.5">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all text-sm"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between ml-0.5">
            <label className="text-xs font-bold text-gray-700">Password</label>
            {role === 'org_admin' && (
              <Link to="/auth/forgot-password" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
                Forgot password
              </Link>
            )}
          </div>
          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Session Timer Toggle — only for HR / Employee / Intern */}
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: (accentColor || '#6366f1') + '20' }}
                >
                  <Clock size={14} style={{ color: accentColor || '#6366f1' }} />
                </div>
                <span className="text-xs font-bold text-gray-700">Work Timer</span>
              </div>

              {/* Yes / No pill toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStartTimer(true)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-md transition-all"
                  style={startTimer ? { background: accentColor || '#6366f1', color: '#fff' } : { color: '#9CA3AF' }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setStartTimer(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-md transition-all"
                  style={!startTimer ? { background: '#111827', color: '#fff' } : { color: '#9CA3AF' }}
                >
                  No
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.99] disabled:opacity-70 mt-2 shadow-lg"
          style={{ background: accentColor || '#111827' }}
        >
          {loading ? 'Verifying...' : 'Sign in'}
        </button>
      </form>

      {/* Conditional Signup Link */}
      {showSignUp && (
        <div className="text-center pt-2">
          <p className="text-sm text-gray-400 font-medium">
            Don't have an account?{' '}
            <Link to="/auth/org" className="text-gray-900 font-bold hover:underline transition-all">Sign up</Link>
          </p>
        </div>
      )}
    </div>
  );
}
