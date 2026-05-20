import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { setPageMeta } from '../utils/seo';

const TermsOfService: React.FC = () => {
  useEffect(() => { setPageMeta('Terms of Service', 'TrimTime terms of service — rules and guidelines for using our platform.'); }, []);

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
          <h1 className="text-4xl md:text-5xl font-black text-white font-brand mb-8 tracking-tighter">Terms of Service</h1>
          <p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">Last Updated: April 17, 2026</p>
          
          <div className="space-y-10 text-slate-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using TrimTime POS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
              <p>TrimTime provides a cloud-based Point of Sale (POS) and business management platform designed for barbershops and beauty salons. We reserve the right to modify or discontinue service features at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Payment and Billing</h2>
              <p>TrimTime is a subscription-based service. You agree to pay all fees associated with your chosen plan. Fees are non-refundable unless required by law.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
              <p>TrimTime shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
