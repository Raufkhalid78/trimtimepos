import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { setPageMeta } from '../utils/seo';

const TermsOfService: React.FC = () => {
  useEffect(() => { 
    setPageMeta('Terms of Service', 'TrimTime terms of service — rules and guidelines for using our business management and POS platform.'); 
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
          <h1 className="text-4xl md:text-5xl font-black text-white font-brand mb-8 tracking-tighter">Terms of Service</h1>
          <p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">Last Updated: June 27, 2026</p>
          
          <div className="space-y-10 text-slate-400 leading-relaxed text-sm">
            <p className="text-slate-300">
              Welcome to TrimTime. These Terms of Service ("Terms") govern your access to and use of the TrimTime website, Point of Sale (POS) application, online booking portals, and associated services (collectively, the "Services"). By registering for an account, accessing, or using our Services, you agree to be bound by these Terms. If you are entering into these Terms on behalf of a company or other legal entity (such as a salon or barbershop), you represent that you have the authority to bind such entity to these Terms.
            </p>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Acceptance and Eligibility</h2>
              <p>
                By using our Services, you represent and warrant that you are at least 18 years of age and possess the legal capacity to enter into a binding contract. You agree to use the Services in compliance with all applicable local, national, and international laws, regulations, and tax requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Description of Services</h2>
              <p>
                TrimTime provides a cloud-based multi-tenant business management and POS platform designed for hair salons, barbershops, and beauty professionals. The Services include sales tracking, appointment scheduling, online client booking, staff commission reporting, payroll assistance, customer relationship management (CRM), and inventory tracking. We reserve the right to modify, update, or temporarily restrict access to parts of the Services to perform maintenance or release new features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Registration and Account Security</h2>
              <p className="mb-4">
                To access the app, you must create a business tenant account. You agree to provide accurate, current, and complete business and personal details.
              </p>
              <p className="mb-4">
                <strong>Owner Credentials:</strong> You are responsible for safeguarding your login credentials (and Google authentication access). Any actions taken under your account are deemed authorized by you.
              </p>
              <p>
                <strong>Staff Access:</strong> Owners can create sub-accounts with PINs/passwords for their employees. You are responsible for ensuring your staff complies with these Terms and maintains credential security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Subscriptions, Trial Periods, and Billing</h2>
              <div className="space-y-4">
                <div>
                  <strong className="text-white block mb-1">A. Trial Period</strong>
                  <p>We offer a 1-month free trial period to new businesses. No credit card is required to start the trial. At the end of the trial period, your access to core POS features will be locked until a paid subscription is selected.</p>
                </div>
                <div>
                  <strong className="text-white block mb-1">B. Subscription Plans and Pricing</strong>
                  <p>Subscriptions are billed monthly ($15/month) or annually ($150/year). All fees are processed securely via Polar.sh and are billed in advance. We reserve the right to adjust subscription rates upon 30 days' notice.</p>
                </div>
                <div>
                  <strong className="text-white block mb-1">C. Cancellation and Refunds</strong>
                  <p>You can cancel your subscription at any time within the Settings tab. Upon cancellation, you will retain access to the Services until the end of your current paid billing period. Active subscription fees are non-refundable.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Acceptable Use and Restrictions</h2>
              <p className="mb-2">You agree NOT to utilize the Services to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process payments or store data that violates local laws or financial regulations.</li>
                <li>Bypass, reverse-engineer, or attempt to compromise the security and data isolation (RLS) of our Supabase backend database.</li>
                <li>Send unsolicited spam messages, marketing materials, or unauthorized receipt notifications via WhatsApp or other messaging integrations.</li>
                <li>Exceed fair-use API limits or execute malicious scripts that degrade platform performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Data Ownership and Intellectual Property</h2>
              <p className="mb-4">
                <strong>Your Data:</strong> You retain full ownership, title, and intellectual property rights in all data, customer profiles, catalog details, and transaction logs entered into your TrimTime instance. We make no claim of ownership over your business data.
              </p>
              <p>
                <strong>TrimTime IP:</strong> TrimTime owns all rights, title, and interest in the software code, database design, animations, landing page assets, logos, and trademarks. You are granted a limited, non-exclusive, non-transferable license to access the app during your active subscription period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Service Availability (SLA) and Warranties</h2>
              <p className="mb-4">
                We strive to maintain a 99.9% uptime for active tenant platforms. However, the Services are provided on an "as is" and "as available" basis. We disclaim all warranties of any kind, whether express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p>
                Because TrimTime relies on third-party cloud infrastructure (Supabase, Vercel), we are not responsible for service outages caused by these providers, internet connection dropouts on your devices, or local hardware issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, in no event shall TrimTime, its developers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, data, or other intangible losses, resulting from: (a) your use or inability to use the Services; (b) unauthorized access to or alteration of your transmissions or data; or (c) any other matter relating to the Services. Our total cumulative liability to you for any claims shall not exceed the subscription fees paid by you to TrimTime in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">9. Business Entity, Governing Law and Disputes</h2>
              <p className="mb-4">
                These Terms and Conditions constitute a legally binding agreement between you and <strong>TechyDez</strong> (the parent company operating TrimTime). Our registered business address is Jhelum, Punjab, Pakistan.
              </p>
              <p>
                These terms are governed by the laws of the Islamic Republic of Pakistan and you agree that the courts of Jhelum will have exclusive jurisdiction in any dispute.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">10. Complaint Handling Mechanism & Contact Us</h2>
              <p className="mb-4">
                In order to resolve a complaint regarding our services, if you have any problems placing your order, or require support, please contact us immediately:
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

export default TermsOfService;
