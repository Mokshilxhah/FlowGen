import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import SplitLoginLayout from './components/SplitLoginLayout';
import LoginForm from './components/LoginForm';
import toast from 'react-hot-toast';

export default function HRLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (email, password) => {
    const result = await login(email, password, 'member');
    if (result.success) {
      if (result.user.role === 'hr') {
        toast.success('HR Access Verified');
        navigate('/hr/dashboard');
      } else {
        toast.error('Unauthorized portal access');
      }
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
  };

  return (
    <SplitLoginLayout
      title="Welcome HR"
      subtitle="Manage your organization and talent with ease."
      role="hr"
      panelColor="#0891b2"
    >
      <LoginForm role="hr" accentColor="#0891b2" onSubmit={handleLogin} showSignUp={false} />
    </SplitLoginLayout>
  );
}
