import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { setPageMeta } from '../utils/seo';

const ShippingPolicy: React.FC = () => {
  useEffect(() => { 
    setPageMeta('Shipping Policy', 'TrimTime shipping and digital delivery policy.'); 
  }, []);

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
          <h1 className="text-4xl md:text-5xl font-black text-white font-brand mb-8 tracking-tighter">Shipping Policy</h1>
          <p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-10 text-slate-400 leading-relaxed text-sm">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Digital Delivery Only</h2>
              <p className="mb-4">
                TrimTime (a product of TechyDez) operates as a digital POS platform and software service. All features, access, and service provisions granted through our platform are 100% digital.
              </p>
              <p>
                <strong>We do not sell, ship, or deliver any physical goods.</strong> Therefore, no physical shipping takes place. 
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Instant Access</h2>
              <p>
                Upon successful payment or subscription via our payment gateways, access to the respective digital features on your TrimTime account is granted instantly. You will receive an email confirmation of your transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
              <p className="mb-4">
                If you experience any issues accessing your digital purchase, please contact us immediately:
              </p>
              <p><strong>Phone:</strong> <a href="tel:+447517879333" className="text-amber-500 hover:underline">+447517879333</a></p>
              <p><strong>Email:</strong> <a href="mailto:hello@techydez.com" className="text-amber-500 hover:underline">hello@techydez.com</a></p>
              <p><strong>Address:</strong> Jhelum, Punjab, Pakistan</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
