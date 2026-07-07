import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import FlowGenLogo from '../../components/ui/FlowGenLogo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { showToast, toastHelpers } from '../../utils/toast';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!email.trim()) {
      toastHelpers.validationError('Email is required');
      return;
    }
    // Simulate API call
    showToast.success('Password reset link sent to your email');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <FlowGenLogo size={36} />
          <span className="font-bold text-xl font-display">FlowGen</span>
        </div>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold font-display mb-2">Reset your password</h1>
            <p className="text-text-secondary mb-6">Enter your email and we'll send a reset link.</p>
            <div className="space-y-4">
              <Input label="Email" type="email" icon={<Mail size={16} />} value={email} onChange={e => setEmail(e.target.value)} />
              <Button fullWidth onClick={handleSubmit}>Send Reset Link</Button>
            </div>
          </>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent-emerald/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-accent-emerald" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Check your email</h2>
            <p className="text-text-secondary text-sm mb-6">We sent a reset link to {email}</p>
          </motion.div>
        )}

        <Link to="/org/login" className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mt-6 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
