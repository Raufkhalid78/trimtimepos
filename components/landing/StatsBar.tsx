import React, { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon: React.ReactNode;
}

function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return count;
}

const StatItem: React.FC<{ stat: Stat; inView: boolean; index: number }> = ({ stat, inView, index }) => {
  const count = useCountUp(stat.value, inView, 1800 + index * 200);
  return (
    <div className="flex flex-col items-center text-center px-6 py-6 relative">
      {index < 3 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/10 hidden md:block" />
      )}
      <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-3 text-amber-400">
        {stat.icon}
      </div>
      <p className="text-2xl md:text-3xl font-black text-white tabular-nums">
        {stat.prefix}{count.toLocaleString()}{stat.suffix}
      </p>
      <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</p>
    </div>
  );
};

const StatsBar: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const stats: Stat[] = [
    {
      value: 100,
      suffix: '+',
      label: 'Salons & Barbershops',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      value: 300,
      suffix: 'K+',
      label: 'Transactions Processed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      value: 99,
      suffix: '.9%',
      label: 'Platform Uptime',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      value: 1,
      suffix: '',
      prefix: '',
      label: 'WhatsApp Receipts Built-in',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={ref} className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => {
          if (i === 3) {
            // WhatsApp stat — show as a label, not count-up
            return (
              <div key={i} className="flex flex-col items-center text-center px-6 py-6 relative">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-3 text-emerald-400">
                  {stat.icon}
                </div>
                <p className="text-2xl md:text-3xl font-black text-white">✓</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          }
          return <StatItem key={i} stat={stat} inView={inView} index={i} />;
        })}
      </div>
    </div>
  );
};

export default StatsBar;
