import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface FooterProps {
  onGoToLogin: () => void;
  onGoToSignUp: () => void;
}

const Footer: React.FC<FooterProps> = ({ onGoToLogin, onGoToSignUp }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-14">

          {/* Brand col (4 cols) */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                T
              </div>
              <span className="text-xl font-black tracking-tight text-white">TrimTime</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              The complete business management platform built exclusively for barbers and beauty professionals.
            </p>
            {/* Social icons (uncomment and add links when available)
            <div className="flex items-center gap-3">
              {[
                {
                  label: 'Twitter / X',
                  href: '#',
                  icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  label: 'Instagram',
                  href: '#',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 20.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" />
                    </svg>
                  ),
                },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 bg-slate-800 border border-white/8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
            */}
          </div>

          {/* Product col (2 cols) */}
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5">Product</h3>
            <ul className="space-y-3">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account col (2 cols) */}
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/signup"
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium text-left inline-block"
                >
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium text-left inline-block"
                >
                  Business Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal col (2 cols) */}
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium">Terms of Service</Link></li>
              <li>
                <a href="mailto:support@trimtimepos.com" className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-medium">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* CTA col (2 cols) */}
          <div className="md:col-span-2">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Free Trial</p>
              <p className="text-sm text-slate-300 mb-4 leading-snug">Start today — no card required.</p>
              <Link
                to="/signup"
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 inline-block text-center"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
            TrimTime © {year} · All Rights Reserved
          </span>
          <div className="flex items-center gap-5">
            {['🔒 SSL Secured', '☁️ Supabase Cloud', '📱 PWA Ready'].map(badge => (
              <span key={badge} className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
