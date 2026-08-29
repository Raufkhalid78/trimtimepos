import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { setPageMeta } from '../utils/seo';

const PrivacyPolicy: React.FC = () => {
  useEffect(() => { 
    setPageMeta('Privacy Policy', 'TrimTime privacy policy — how we collect, use, and protect your personal data in compliance with GDPR.'); 
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
          <h1 className="text-4xl md:text-5xl font-black text-white font-brand mb-8 tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-500 mb-12 font-bold uppercase tracking-widest text-xs">Last Updated: June 27, 2026</p>
          
          <div className="space-y-10 text-slate-400 leading-relaxed text-sm">
            <p className="text-slate-300">
              At TrimTime ("we", "our", or "us"), we are committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, disclose, and protect personal data belonging to business owners, staff members, and customers in connection with our Point of Sale (POS) and business management platform, in compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Data Controller and Processor</h2>
              <p className="mb-4">
                <strong>Data Controller:</strong> For the personal data of business owners and staff members who register accounts directly with TrimTime, TrimTime operates as the Data Controller.
              </p>
              <p>
                <strong>Data Processor:</strong> For the personal data of end customers (salon or barbershop clients) entered into the platform by business owners, the business owner acts as the Data Controller, and TrimTime acts as the Data Processor. The business owner is responsible for ensuring they have a legal basis to collect and process their clients' personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Types of Data We Process</h2>
              <div className="space-y-4">
                <div>
                  <strong className="text-white block mb-1">A. Owner / Account Creator Data</strong>
                  <p>When you register a business, we collect your name, email address, business name, business type, and payment information (processed securely through our sub-processors).</p>
                </div>
                <div>
                  <strong className="text-white block mb-1">B. Staff / Employee Data</strong>
                  <p>Business administrators create accounts for their staff. We store staff names, usernames, role permissions, salaries, commission rates, availability schedules, and securely hashed passwords (using bcrypt).</p>
                </div>
                <div>
                  <strong className="text-white block mb-1">C. Customer Data</strong>
                  <p>When businesses record sales or clients use the public booking portal, we process customer names, phone numbers, appointment histories, transaction histories, loyalty points, and custom notes.</p>
                </div>
                <div>
                  <strong className="text-white block mb-1">D. Usage and Technical Data</strong>
                  <p>We automatically collect technical data, including IP addresses, browser types, device information, PWA installation metrics, and usage activity, to ensure service stability, performance, and security.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Legal Bases for Processing (GDPR Article 6)</h2>
              <p className="mb-2">We process personal data under the following legal grounds:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Performance of a Contract:</strong> To set up, operate, and maintain your TrimTime instance, charge subscriptions, and process customer bookings.</li>
                <li><strong>Legitimate Interests:</strong> To improve our platform functionality, secure the network against fraudulent activities, and optimize performance.</li>
                <li><strong>Consent:</strong> When you or your customers explicitly opt-in to marketing communications or when customers utilize the public booking system.</li>
                <li><strong>Legal Obligation:</strong> To comply with legal, tax, and accounting requirements (e.g., tax invoicing on sales transactions).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Sub-Processors and Data Transfers</h2>
              <p className="mb-4">
                To deliver our services, we share data with selected third-party service providers (sub-processors) who comply with strict data security standards:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase Inc.</strong> — Cloud database, authentication, and hosting infrastructure. Data is isolated per tenant.</li>
                <li><strong>Vercel Inc.</strong> — Frontend hosting and application delivery network.</li>
                <li><strong>Creem.io</strong> — Merchant of record, payment processing, checkout infrastructure, and subscription billing. We do not store full credit card details on our servers.</li>
                <li><strong>Google LLC</strong> — OAuth login infrastructure and fonts rendering.</li>
              </ul>
              <p className="mt-4">
                Whenever personal data is transferred outside the European Economic Area (EEA), we ensure appropriate safeguards (such as Standard Contractual Clauses) are in place.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Data Retention</h2>
              <p>
                We retain personal data only as long as necessary to fulfill the purposes for which it was collected, including satisfying legal, regulatory, or reporting requirements. Business owner and staff data is preserved for the duration of the active subscription. In the event of account cancellation, all tenant-related data is purged or anonymized within 30 days, except for transaction records which may be retained longer to meet tax compliance obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Your Rights Under the GDPR</h2>
              <p className="mb-2">Under the GDPR, you have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your data under specific conditions.</li>
                <li><strong>Right to Restriction:</strong> Request that we restrict processing of your data.</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data to another provider in a structured format.</li>
                <li><strong>Right to Object:</strong> Object to processing of your data based on legitimate interests.</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time where processing is based on consent.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please email us at <a href="mailto:support@trimtimepos.com" className="text-amber-500 hover:underline">support@trimtimepos.com</a>. If you are an end customer of a business using TrimTime, please contact the business owner (the Data Controller) directly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Cookies and Local Storage</h2>
              <p>
                We use essential local storage keys (such as session tokens, language choices, and theme options) to run the application, maintain staff sessions, and load user preferences. These do not track you across other websites. If you disable cookies or local storage in your browser, some core functionalities of the POS will not be available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Account Deletion and Purges</h2>
              <p>
                Administrators can delete specific records (such as customers, services, or staff members) directly inside the app. For full store deletion, administrators can purge all sales data or delete the entire store tenant within the "Danger Zone" in Settings. This triggers a permanent cascade delete of all branches, staff records, catalogs, and financials from our active databases.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">9. Contact and Inquiries</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, or wish to file a complaint, please contact us at:
              </p>
              <p className="mt-2 font-bold text-white">TrimTime Privacy & DPO Team</p>
              <p>Email: <a href="mailto:support@trimtimepos.com" className="text-amber-500 hover:underline">support@trimtimepos.com</a></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
