import React from 'react';

interface FeatureHighlight {
  value: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const StatsBar: React.FC = () => {
  const highlights: FeatureHighlight[] = [
    {
      value: '100%',
      label: 'Offline-Ready PWA',
      sublabel: 'Zero downtime POS sales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: '0%',
      label: 'Per-Ticket Fees',
      sublabel: 'Keep 100% of your sales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: '24/7',
      label: 'Online Booking',
      sublabel: 'Self-service client scheduling',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: 'Instant',
      label: 'WhatsApp Receipts',
      sublabel: 'Paperless digital checkout',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {highlights.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center px-6 py-6 relative">
            {i < 3 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/10 hidden md:block" />
            )}
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-3 text-amber-400">
              {item.icon}
            </div>
            <p className="text-2xl md:text-3xl font-black text-white tabular-nums">
              {item.value}
            </p>
            <p className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">{item.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{item.sublabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBar;
