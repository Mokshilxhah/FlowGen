import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import SplitLoginLayout from './components/SplitLoginLayout';
import LoginForm from './components/LoginForm';
import toast from 'react-hot-toast';

export default function InternLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (email, password) => {
    const result = await login(email, password, 'member');
    if (result.success) {
      if (result.user.role === 'intern') {
        toast.success('Learning portal access granted');
        navigate('/intern/dashboard');
      } else {
        toast.error('Incorrect portal for your role');
      }
    } else {
      throw new Error(result.error || 'Access denied');
    }
  };

  return (
    <SplitLoginLayout
      title="Welcome Intern"
      subtitle="Kickstart your career and explore new opportunities."
      role="intern"
      panelColor="#7c3aed"
    >
      <LoginForm role="intern" accentColor="#7c3aed" onSubmit={handleLogin} showSignUp={false} />
    </SplitLoginLayout>
  );
}
