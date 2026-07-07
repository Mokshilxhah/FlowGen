import { motion } from 'framer-motion';
import { 
  Users, Briefcase, BarChart, Settings, 
  MessageSquare, Calendar, CheckSquare,
  TrendingUp, Globe, Clock
} from 'lucide-react';

const iconsByRole = {
  org_admin: [BarChart, Globe, CheckSquare, Settings, BarChart, Globe],
  hr: [Users, MessageSquare, Briefcase, Calendar, Users, CheckSquare],
  employee: [CheckSquare, Clock, Calendar, MessageSquare, TrendingUp, Briefcase],
  intern: [TrendingUp, Globe, MessageSquare, CheckSquare, Globe, MessageSquare],
};

export default function PortalIllustration({ role, color }) {
  const icons = iconsByRole[role] || iconsByRole.employee;

  return (
    <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
      {/* Floating Icons Cloud */}
      <div className="absolute inset-0 z-20">
        {icons.map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
              x: [0, index % 2 === 0 ? 10 : -10, 0]
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut"
            }}
            className="absolute text-white/40"
            style={{
              top: `${15 + ((index * 13) % 30)}%`,
              left: `${15 + ((index * 29) % 70)}%`,
            }}
          >
            <Icon size={24 + (index % 3) * 8} strokeWidth={1} />
          </motion.div>
        ))}
      </div>

      {/* The Monitor / Device Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[80%] h-[60%] bg-[#0d122b] rounded-2xl border-b-[8px] border-black/20 shadow-2xl overflow-hidden flex flex-col"
        style={{ border: `2px solid ${color}40` }}
      >
        {/* Screen Content */}
        <div className="flex-1 bg-black/40 relative">
          {/* Stylized Person Silhouette */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 20 }}
            transition={{ delay: 0.5, duration: 1, ease: "circOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[90%] bg-gradient-to-t from-white/20 to-white/5 rounded-t-full border-t border-white/20"
          >
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] rounded-2xl bg-white/5" />
          </motion.div>
          
          {/* Scanning Line */}
          <motion.div
            animate={{ y: [0, 200, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-px bg-white/10 blur-sm z-30"
          />
        </div>
        
        {/* Monitor Base */}
        <div className="h-4 bg-black/40 border-t border-white/05 flex items-center px-4 gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
        </div>
      </motion.div>

      {/* Glow Effects */}
      <div 
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[90%] h-[40%] blur-[100px] opacity-30 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      {/* Platform/Stand */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[30%] h-3 bg-black/40 rounded-full blur-sm" />
    </div>
  );
}
