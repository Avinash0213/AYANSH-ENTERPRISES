import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    } else {
      setSuccess(false);
      setError('');
      setForm(f => ({ ...f, password: '' }));
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/me');
      setForm({ name: data.name, email: data.email, password: '' });
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await api.put('/users/me', {
        name: form.name,
        email: form.email,
        password: form.password || undefined
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm(f => ({ ...f, password: '' }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border dark:border-neutral-800"
        >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-800/30">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-red-600" />
              My Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium border border-rose-100 dark:border-rose-900/30">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm font-medium border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile updated successfully!
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Modify Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Leave blank to maintain current password"
                      className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl pl-10 pr-12 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-750 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
