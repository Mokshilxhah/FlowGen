import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import SplitLoginLayout from './components/SplitLoginLayout';
import LoginForm from './components/LoginForm';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Check, X, Eye, EyeOff } from 'lucide-react';

// ── Password strength helpers ──────────────────────────────────────
const passwordRules = [
  { id: 'length',  label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',              test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getPasswordStrength(password) {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
  if (passed === 1) return { level: 1, label: 'Weak',      color: '#EF4444' };
  if (passed === 2) return { level: 2, label: 'Fair',      color: '#F59E0B' };
  if (passed === 3) return { level: 3, label: 'Strong',    color: '#10B981' };
  return              { level: 4, label: 'Very Strong', color: '#6366F1' };
}

export default function OrgLogin() {
  const navigate = useNavigate();
  const { login, requestRegisterOtp, verifyRegisterOtp, isLoading } = useAuthStore();
  const [mode, setMode] = useState('login'); // login | register
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regData, setRegData] = useState({
    orgName: '',
    domain: '',
    industry: 'Technology',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'free',
    address: '',
    city: '',
    country: '',
    phone: '',
    taxId: '',
  });

  const strength = getPasswordStrength(regData.adminPassword);
  const ruleResults = passwordRules.map((r) => ({ ...r, passed: r.test(regData.adminPassword) }));
  const canContinueStep2 =
    regData.adminName.trim() &&
    regData.adminEmail.trim() &&
    strength.level >= 2 &&
    regData.adminPassword === confirmPassword;

  const handleLogin = async (email, password) => {
    const result = await login(email, password, 'org');
    if (result.success) {
      toast.success('Admin Session Started');
      navigate('/org/dashboard');
    } else {
      throw new Error(result.error || 'Invalid credentials');
    }
  };

  return (
    <SplitLoginLayout
      title={mode === 'login' ? "Welcome Admin" : "Join FlowGen"}
      subtitle={mode === 'login' ? "Command your organization's workspace." : "Transform your workforce management today."}
      role="org_admin"
      panelColor="#0a0e27"
    >
      <div className="flex gap-2 mb-8 p-1 bg-gray-50 rounded-xl border border-gray-100 max-w-sm">
        {['login', 'register'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setConfirmPassword(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize ${mode === m ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
            {m === 'login' ? 'Sign in' : 'Register'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <LoginForm role="org_admin" accentColor="#111827" onSubmit={handleLogin} showSignUp={false} showTimer={false} />
          </motion.div>
        ) : (
          <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="w-full max-w-sm space-y-4">

            {/* ── Step 1: Org Info ──────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <Input label="Organization Name" placeholder="Your company" value={regData.orgName} onChange={(e) => setRegData((d) => ({ ...d, orgName: e.target.value }))} />
                <Input label="Custom Domain" placeholder="your-domain" value={regData.domain} onChange={(e) => setRegData((d) => ({ ...d, domain: e.target.value }))} />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Industry</label>
                  <select
                    value={regData.industry}
                    onChange={(e) => setRegData(d => ({ ...d, industry: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 transition-all"
                  >
                    {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'].map(i => (
                      <option key={i} value={i} className="text-gray-900">{i}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                >
                  Next Step
                </button>
              </div>
            )}

            {/* ── Step 2: Admin Credentials with password strength ─ */}
            {step === 2 && (
              <div className="space-y-4">
                <Input label="Admin Name" placeholder="Alex Rivera" value={regData.adminName} onChange={(e) => setRegData((d) => ({ ...d, adminName: e.target.value }))} />
                <Input label="Admin Email" type="email" placeholder="alex@company.com" value={regData.adminEmail} onChange={(e) => setRegData((d) => ({ ...d, adminEmail: e.target.value }))} />

                {/* Password with strength indicator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={regData.adminPassword}
                      onChange={(e) => setRegData((d) => ({ ...d, adminPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar indicator (visual only) */}
                  {regData.adminPassword.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                      <div className="flex gap-1.5 flex-1">
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ background: strength.level >= seg ? strength.color : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-11 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all ${
                        confirmPassword && confirmPassword !== regData.adminPassword
                          ? 'border-red-300 focus:border-red-400'
                          : confirmPassword && confirmPassword === regData.adminPassword
                          ? 'border-emerald-300 focus:border-emerald-400'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== regData.adminPassword && (
                    <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={!canContinueStep2}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Location Info ─────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <Input label="Headquarters Address" placeholder="123 Tech Lane" value={regData.address} onChange={(e) => setRegData((d) => ({ ...d, address: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" placeholder="San Francisco" value={regData.city} onChange={(e) => setRegData((d) => ({ ...d, city: e.target.value }))} />
                  <Input label="Country" placeholder="USA" value={regData.country} onChange={(e) => setRegData((d) => ({ ...d, country: e.target.value }))} />
                </div>
                <Input
                  label="Organization Phone"
                  placeholder="Enter 10 digits"
                  maxLength={10}
                  value={regData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setRegData((d) => ({ ...d, phone: val }));
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={async () => {
                      if (regData.phone && regData.phone.length !== 10) {
                        toast.error('Organization phone number must be exactly 10 digits');
                        return;
                      }
                      const result = await requestRegisterOtp(regData);
                      if (result.success) {
                        toast.success('Verification code sent to your email!');
                        setStep(4);
                      } else {
                        toast.error(result.error);
                      }
                    }}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: OTP Verify ────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-xs text-indigo-700">
                    We sent a 6-digit verification code to <span className="font-bold">{regData.adminEmail}</span>. Enter it below to complete registration.
                  </p>
                </div>
                <Input
                  label="Verification Code"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep(3); setOtp(''); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={isLoading || otp.length !== 6}
                    onClick={async () => {
                      const result = await verifyRegisterOtp(regData.adminEmail, otp);
                      if (result.success) {
                        toast.success('Email Verified & Workspace Created!');
                        navigate('/org/dashboard');
                      } else {
                        toast.error(result.error);
                        if (result.error.includes('Too many failed attempts') || result.error.includes('expired')) {
                          setStep(3);
                          setOtp('');
                        }
                      }
                    }}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Launch'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SplitLoginLayout>
  );
}
