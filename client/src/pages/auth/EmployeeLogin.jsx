import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import SplitLoginLayout from './components/SplitLoginLayout';
import LoginForm from './components/LoginForm';
import toast from 'react-hot-toast';

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (email, password) => {
    const result = await login(email, password, 'member');
    if (result.success) {
      if (result.user.role === 'employee') {
        toast.success('Workspace unlocked');
        navigate('/employee/dashboard');
      } else {
        toast.error('Role mismatch for this portal');
      }
    } else {
      throw new Error(result.error || 'Login failed');
    }
  };

  return (
    <SplitLoginLayout
      title="Welcome Employee"
      subtitle="Your hub for daily productivity and collaboration."
      role="employee"
      panelColor="#059669"
    >
      <LoginForm role="employee" accentColor="#059669" onSubmit={handleLogin} showSignUp={false} />
    </SplitLoginLayout>
  );
}
