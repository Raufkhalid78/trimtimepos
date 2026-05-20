
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { TRANSLATIONS } from '../constants';
import { setPageMeta } from '../utils/seo';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();
    const t = TRANSLATIONS['en'];

    useEffect(() => { setPageMeta('Reset Password', 'Reset your TrimTime account password.'); }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ 
                password: password 
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' });
            setTimeout(() => {
                navigate('/');
                // This will show the landing page, where they can click Login or see if they are auto-logged in.
                window.location.reload();
            }, 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full opacity-50"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full opacity-50"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-brand text-3xl mx-auto mb-6 shadow-xl shadow-amber-500/20">
                        T
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Reset Password</h2>
                    <p className="text-slate-400 text-sm">Create a new secure password for your account.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold text-center ${
                        message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">New Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none text-white font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Confirm New Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none text-white font-bold"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-50 mt-4 active:scale-95"
                    >
                        {loading ? 'Updating...' : 'Update Password →'}
                    </button>

                    <button 
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-4 text-slate-500 hover:text-white font-bold text-sm transition-colors"
                    >
                        Cancel & Return
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
