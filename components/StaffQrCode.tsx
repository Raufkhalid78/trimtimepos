import React, { useState } from 'react';

interface StaffQrCodeProps {
  slug: string;
  staffName: string;
}

/**
 * StaffQrCode — generates a scannable QR code linking to the staff login page.
 *
 * How it works:
 *  1. Builds the full staff login URL:  /staff-login/{slug}
 *  2. Renders a QR code image via the free api.qrserver.com API (no library needed)
 *  3. Provides a "Download" button so it can be printed and placed at the counter
 *
 * Usage:
 *   <StaffQrCode slug={currentTenant.slug} staffName="Ahmed" />
 */
const StaffQrCode: React.FC<StaffQrCodeProps> = ({ slug, staffName }) => {
  const [copied, setCopied] = useState(false);

  const loginUrl = `${window.location.origin}/staff-login/${slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loginUrl)}&bgcolor=0f172a&color=f59e0b&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(loginUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    // Download hi-res version
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(loginUrl)}&bgcolor=0f172a&color=f59e0b&margin=20&format=png`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `trimtime-staff-login-${slug}.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xs">
      {/* Title */}
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">Staff Login QR</p>
        <p className="text-sm text-slate-400">Scan to access the POS</p>
      </div>

      {/* QR Code */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
        <img
          src={qrApiUrl}
          alt={`Staff login QR code for ${staffName}`}
          width={200}
          height={200}
          className="rounded-lg"
        />
      </div>

      {/* URL preview */}
      <div className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
        <p className="text-[10px] text-slate-500 font-mono truncate">{loginUrl}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-2 text-xs font-bold border border-slate-600 text-slate-300 rounded-xl hover:border-amber-500/50 hover:text-amber-400 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Download PNG
        </button>
      </div>

      <p className="text-[10px] text-slate-600 text-center">
        Print and place at the counter for quick staff access
      </p>
    </div>
  );
};

export default StaffQrCode;
