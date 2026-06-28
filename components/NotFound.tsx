import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setPageMeta } from '../utils/seo';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    setPageMeta('404 Not Found', 'The page you are looking for does not exist on TrimTime.');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full opacity-50 pointer-events-none"></div>
      
      {/* Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/50 border border-white/5 p-10 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10 text-center backdrop-blur-xl"
      >
        {/* Animated Icon */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-brand text-4xl mx-auto mb-8 shadow-xl shadow-amber-500/10"
        >
          404
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          It looks like the page you are trying to reach has been trimmed away, moved, or never existed in the first place.
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all"
          >
            Back to Home
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-slate-800/50 border border-slate-700/30 text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-800 hover:text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
