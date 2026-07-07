import { motion } from 'framer-motion';
import PortalIllustration from './PortalIllustration';
import FlowGenLogo from '../../../components/ui/FlowGenLogo';

export default function SplitLoginLayout({
  title,
  subtitle,
  role = 'employee', // Added role prop
  panelColor = '#111836', // Default dark navy
  children
}) {
  return (
    <div className="min-h-screen w-full bg-[#0a0e27] flex overflow-hidden">
      {/* LEFT PANEL - Minimal Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] p-8 lg:p-20 xl:p-28 flex flex-col justify-center bg-white relative z-10 border-r border-gray-100">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-14">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 mb-14"
            >
              <FlowGenLogo size={36} />
              <span className="text-xl font-bold font-display tracking-tight text-gray-900">FlowGen</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-display">
                {title || 'Welcome back'}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                {subtitle || 'Please enter your details'}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL - Dynamic Animated Section */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: panelColor }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Center Content */}
        <PortalIllustration role={role} color={panelColor} />

        {/* Branding Overlay */}
        <div className="absolute bottom-12 right-12 text-right">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase mb-1">Authenticated via FlowGen</p>
          <div className="h-0.5 w-12 bg-white/20 ml-auto" />
        </div>
      </div>
    </div>
  );
}
