
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { TRANSLATIONS } from '../constants';
import { setPageMeta } from '../utils/seo';
import { Language } from '../types';

const resetPasswordTranslations = {
  en: {
    resetHeader: "Reset Password",
    resetDesc: "Create a new secure password for your account.",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password →",
    updating: "Updating...",
    cancelReturn: "Cancel & Return",
    passwordsDoNotMatch: "Passwords do not match.",
    successRedirect: "Password updated successfully! Redirecting to login...",
    failedUpdate: "Failed to update password."
  },
  ur: {
    resetHeader: "پاس ورڈ دوبارہ ترتیب دیں",
    resetDesc: "اپنے اکاؤنٹ کے لیے ایک نیا محفوظ پاس ورڈ بنائیں۔",
    newPassword: "نیا پاس ورڈ",
    confirmNewPassword: "پاس ورڈ کی تصدیق کریں",
    updatePassword: "پاس ورڈ اپ ڈیٹ کریں ←",
    updating: "اپ ڈیٹ ہو رہا ہے...",
    cancelReturn: "منسوخ کریں اور واپس جائیں",
    passwordsDoNotMatch: "پاس ورڈ مطابقت نہیں رکھتے۔",
    successRedirect: "پاس ورڈ کامیابی سے اپ ڈیٹ ہو گیا! لاگ ان پر ری ڈائریکٹ ہو رہا ہے...",
    failedUpdate: "پاس ورڈ اپ ڈیٹ کرنے میں ناکامی۔"
  },
  ar: {
    resetHeader: "إعادة تعيين كلمة المرور",
    resetDesc: "أنشئ كلمة مرور جديدة آمنة لحسابك.",
    newPassword: "كلمة المرور الجديدة",
    confirmNewPassword: "تأكيد كلمة المرور الجديدة",
    updatePassword: "تحديث كلمة المرور ←",
    updating: "جاري التحديث...",
    cancelReturn: "إلغاء والعودة",
    passwordsDoNotMatch: "كلمات المرور غير متطابقة.",
    successRedirect: "تم تحديث كلمة المرور بنجاح! جاري إعادة التوجيه إلى تسجيل الدخول...",
    failedUpdate: "فشل تحديث كلمة المرور."
  },
  hi: {
    resetHeader: "पासवर्ड रीसेट करें",
    resetDesc: "अपने खाते के लिए एक नया सुरक्षित पासवर्ड बनाएं।",
    newPassword: "नया पासवर्ड",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    updatePassword: "पासवर्ड अपडेट करें ←",
    updating: "अपडेट हो रहा है...",
    cancelReturn: "रद्द करें और वापस जाएं",
    passwordsDoNotMatch: "पासवर्ड मेल नहीं खाते।",
    successRedirect: "पासवर्ड सफलतापूर्वक अपडेट हो गया! लॉगिन पर रीडायरेक्ट किया जा रहा है...",
    failedUpdate: "पासवर्ड अपडेट करने में विफल।"
  }
};

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();
    const savedLang = (localStorage.getItem('trimtime_lang') || 'en') as Language;
    const t = TRANSLATIONS[savedLang];
    const localT = resetPasswordTranslations[savedLang] || resetPasswordTranslations['en'];

    useEffect(() => { setPageMeta('Reset Password', 'Reset your TrimTime account password.'); }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: localT.passwordsDoNotMatch });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ 
                password: password 
            });

            if (error) throw error;

            setMessage({ type: 'success', text: localT.successRedirect });
            setTimeout(() => {
                navigate('/');
                // This will show the landing page, where they can click Login or see if they are auto-logged in.
                window.location.reload();
            }, 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || localT.failedUpdate });
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
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{localT.resetHeader}</h2>
                    <p className="text-slate-400 text-sm">{localT.resetDesc}</p>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">{localT.newPassword}</label>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">{localT.confirmNewPassword}</label>
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
                        {loading ? localT.updating : localT.updatePassword}
                    </button>

                    <button 
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-4 text-slate-500 hover:text-white font-bold text-sm transition-colors"
                    >
                        {localT.cancelReturn}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
