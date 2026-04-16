
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { verifyPassword } from '../services/passwordService';
import { Staff, Language } from '../types';
import { TRANSLATIONS } from '../constants';

const StaffLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { loginStaff } = useAuth();
  const { fetchPublicTenantBySlug, staff: tenantStaff, settings } = useData();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState<any>(null);

  const t = TRANSLATIONS['en'];

  useEffect(() => {
    const loadTenant = async () => {
      if (slug) {
        const tenantData = await fetchPublicTenantBySlug(slug);
        if (tenantData) {
          setTenant(tenantData);
        } else {
          setError('Shop not found or inactive.');
        }
      }
    };
    loadTenant();
  }, [slug, fetchPublicTenantBySlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantStaff.length) {
      setError('Staff records not found.');
      return;
    }

    setLoading(true);
    setError('');

    const potentialUsers = tenantStaff.filter(s => s.username === username);
    let matchedUser: Staff | null = null;
    
    for (const user of potentialUsers) {
      if (await verifyPassword(password, user.password || '')) {
        matchedUser = user;
        break;
      }
    }
    
    if (matchedUser) {
      // 12-hour expiry for staff shift logins
      const expiry = Date.now() + 12 * 60 * 60 * 1000;
      loginStaff(matchedUser, expiry); 
      navigate('/dashboard');
    } else {
      setError(t.invalidLogin);
      setLoading(false);
    }
  };

  if (!tenant && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"></div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <motion.div whileHover={{ rotate: 12, scale: 1.1 }} className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center font-brand text-5xl text-slate-950 mx-auto mb-8 shadow-2xl shadow-amber-500/40">
            {(tenant?.business_name || 'T').charAt(0)}
          </motion.div>
          <h1 className="text-5xl font-extrabold font-brand text-white tracking-tighter mb-3">{tenant?.business_name || 'TrimTime'}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Staff Shift Login</p>
        </div>

        <motion.div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required
                className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
                  className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 pr-12 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-wider py-3 px-4 rounded-xl text-center">{error}</div>}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xl py-5 rounded-[1.5rem] shadow-xl shadow-amber-500/10 mt-4 disabled:opacity-60">{loading ? 'Verifying...' : 'Staff Login'}</motion.button>
          </form>
        </motion.div>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          Logged in sessions expire after 12 hours for security.
        </p>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
