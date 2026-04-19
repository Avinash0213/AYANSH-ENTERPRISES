import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      setTimeout(() => navigate('/customers'), 300);
    } catch {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] relative overflow-hidden selection:bg-red-500/30 font-sans">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-red-900/10 rounded-full blur-[140px]"
        />
        {/* Grain/Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none brightness-150"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] p-6 relative z-10"
      >
        <div className="bg-[#0A0A0A]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 md:p-14 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative mb-7"
            >
              <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
              <img src="/logo.svg" alt="AYANSH" className="w-20 h-20 relative z-10 drop-shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
            </motion.div>
            
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">AYANSH</h1>
            <p className="text-red-500 font-black tracking-[0.5em] uppercase text-[10px] opacity-90">ENTERPRISES</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium text-center"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-500 ml-1">Email Identity</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-red-500 transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/50 transition-all placeholder:text-gray-700 text-sm"
                  placeholder="admin@bms.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium text-gray-500 ml-1">Secure Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-red-500 transition-colors" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/50 transition-all placeholder:text-gray-700 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 group focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="text-sm">Authorize Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Security Indicator */}
      <div className="absolute bottom-8 flex items-center gap-3 px-6 py-2 bg-white/[0.02] border border-white/5 rounded-full backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[9px] text-gray-400 font-medium tracking-[0.2em] uppercase">Encrypted Connection</span>
      </div>
    </div>
  );
}
