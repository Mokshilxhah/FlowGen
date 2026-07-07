import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-deep flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center px-8">
        <div className="text-8xl font-black font-display gradient-text mb-4">404</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Page not found</h2>
        <p className="text-text-secondary mb-8">This page doesn't exist or you don't have access.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Go Back</Button>
          <Button icon={<Home size={16} />} onClick={() => navigate('/')}>Home</Button>
        </div>
      </motion.div>
    </div>
  );
}
