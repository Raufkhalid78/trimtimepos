import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IOSInstallGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Detect if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detect if running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    // Check if user dismissed the guide previously
    const isDismissed = localStorage.getItem('trimtime_ios_pwa_dismissed') === 'true';

    // Show guide only for iOS visitors who are not standalone and haven't dismissed it
    if (isIOS && !isStandalone && !isDismissed) {
      // Delay slightly to improve landing experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('trimtime_ios_pwa_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[85vh] scrollbar-hide"
          >
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"
              aria-label="Dismiss guide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* App Branding */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-2xl font-black text-slate-950 font-brand">TT</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight">Install TrimTime App</h3>
                <p className="text-xs text-slate-400">Add to your Home Screen for full offline capabilities and a native iOS app experience.</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-5 text-sm text-slate-300 border-t border-white/5 pt-6">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black shrink-0">1</div>
                <p className="leading-relaxed">
                  Tap the <strong className="text-white">Share</strong> button in the bottom Safari toolbar (looks like{' '}
                  <span className="inline-block p-1 bg-white/10 rounded border border-white/10 mx-1">
                    <svg className="w-4 h-4 text-amber-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span>
                  ).
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black shrink-0">2</div>
                <p className="leading-relaxed">
                  Scroll down the share menu list and select <strong className="text-white">Add to Home Screen</strong> (usually represented by a{' '}
                  <span className="inline-block p-1 bg-white/10 rounded border border-white/10 mx-1">
                    <svg className="w-4 h-4 text-amber-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  icon).
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black shrink-0">3</div>
                <p className="leading-relaxed">
                  Tap <strong className="text-white">Add</strong> in the top-right corner of the system prompt to finalize the installation.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleDismiss}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-center"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IOSInstallGuide;
