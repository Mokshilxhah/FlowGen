import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { showToast, toastHelpers } from '../../../utils/toast';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginForm({ role, accentColor, onSubmit, showSignUp = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
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
          <label className="text-xs font-bold text-gray-700 ml-0.5">
            Email address
          </label>
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
            <label className="text-xs font-bold text-gray-700">
              Password
            </label>
            {role === 'org_admin' && (
              <Link to="/auth/forgot-password" title="Recover password" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.99] disabled:opacity-70 mt-2 shadow-lg shadow-gray-200"
          style={{
            background: accentColor || '#111827'
          }}
        >
          {loading ? 'Verifying...' : 'Sign in'}
        </button>
      </form>

      {/* Conditional Signup Link */}
      {showSignUp && (
        <div className="text-center pt-2">
          <p className="text-sm text-gray-400 font-medium">
            Don't have an account? <Link to="/auth/org" className="text-gray-900 font-bold hover:underline transition-all">Sign up</Link>
          </p>
        </div>
      )}
    </div>
  );
}
