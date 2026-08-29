import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * PaymentSuccess — Creem.io redirects here after a successful checkout.
 *
 * URL will look like:
 *   /payment-success?checkout_id=ch_xxxxx&plan=monthly
 *
 * The subscription is activated by the Creem webhook (async), so we poll
 * for a few seconds then send the user to their dashboard.
 */
const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const checkoutId = searchParams.get('checkout_id');
  const plan = searchParams.get('plan') ?? 'monthly';

  // Auto-redirect to dashboard after countdown
  useEffect(() => {
    if (countdown <= 0) {
      // Hard reload so AuthContext re-fetches the now-active subscription
      window.location.href = '/dashboard';
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-slate-400 mb-2 leading-relaxed">
          Welcome to TrimTime {plan === 'yearly' ? 'Pro (Yearly)' : 'Monthly'}. Your account is now active.
        </p>

        {checkoutId && (
          <p className="text-slate-600 text-xs mb-8 font-mono">
            Order: {checkoutId}
          </p>
        )}

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <p className="text-slate-300 text-sm leading-relaxed">
            Your subscription is being activated. You'll be redirected to your dashboard in a moment.
          </p>
        </div>

        {/* Countdown button */}
        <button
          onClick={() => { window.location.href = '/dashboard'; }}
          className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-lg shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-500 transition-all"
        >
          Go to Dashboard ({countdown})
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
