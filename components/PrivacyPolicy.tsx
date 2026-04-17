import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-500 font-bold mb-12 hover:gap-3 transition-all">
          <span>←</span> Back to Home
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-10 md:p-16 backdrop-blur-xl shadow-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white font-brand mb-8 tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">Last Updated: April 17, 2026</p>
          
          <div className="space-y-10 text-slate-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p>TrimTime collects information necessary to provide our POS and management services. This includes business names, staff member names (for login purposes), and contact information provided during registration. We do not sell or trade your personal or business data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. How We Use Data</h2>
              <p>Your data is used strictly for operating your specific tenant instance on TrimTime. This includes processing transactions, managing staff commissions, and generating financial reports for your business oversight.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Data Security</h2>
              <p>We utilize enterprise-grade security via Supabase and cloud storage to protect your information. All sensitive data is transmitted via encrypted HTTPS channels.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Cookies</h2>
              <p>We use essential cookies to maintain your login session and store your language and theme preferences. These are necessary for the application to function correctly.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at support@trimtimepos.com.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
