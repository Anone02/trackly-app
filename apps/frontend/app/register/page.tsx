"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, UserCircle, ArrowLeft, Sun, Moon, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions';

export default function RegisterPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    
    // Panggil Server Action
    const result = await registerUser(null, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      // Kalau sukses, langsung ke login
      router.push('/login');
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 transition-colors duration-500 bg-[var(--background)] font-sans">
      
      {/* --- BACK BUTTON --- */}
      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase z-50 text-[var(--foreground)] opacity-40 hover:opacity-100 transition-all group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Login
      </Link>

      {/* --- THEME TOGGLE --- */}
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-8 right-8 p-3 rounded-2xl z-50 border-2 bg-[var(--background)] border-[var(--input-bg)] text-[var(--foreground)]">
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div key="sun" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Sun size={18} /></motion.div>
          ) : (
            <motion.div key="moon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Moon size={18} /></motion.div>
          )}
        </AnimatePresence>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] p-10 md:p-12 rounded-[32px] shadow-2xl bg-[var(--background)] border-2 border-[var(--input-bg)]">
        <header className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <UserCircle size={50} className="text-[var(--foreground)] opacity-10" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-[var(--foreground)]">
            Daftar<span className="text-[var(--primary)]">.</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40 text-[var(--foreground)]">Buat Akun Baru</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2 text-[var(--foreground)]">Username</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 text-[var(--foreground)]" />
              <input name="username" type="text" placeholder="USERNAME" required className="w-full p-5 pl-14 text-[13px] font-bold outline-none rounded-2xl border-2 bg-[var(--input-bg)] border-transparent text-[var(--foreground)] focus:border-[var(--primary)]/50 focus:bg-[var(--background)]" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2 text-[var(--foreground)]">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 text-[var(--foreground)]" />
              <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••••••" required className="w-full p-5 pl-14 pr-14 text-[13px] font-bold outline-none rounded-2xl border-2 bg-[var(--input-bg)] border-transparent text-[var(--foreground)] focus:border-[var(--primary)]/50 focus:bg-[var(--background)]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 text-[var(--foreground)]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2 text-[var(--foreground)]">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 text-[var(--foreground)]" />
              <input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••••••" required className="w-full p-5 pl-14 text-[13px] font-bold outline-none rounded-2xl border-2 bg-[var(--input-bg)] border-transparent text-[var(--foreground)] focus:border-[var(--primary)]/50 focus:bg-[var(--background)]" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full p-6 mt-4 text-[11px] font-black tracking-[0.4em] uppercase rounded-full bg-[var(--foreground)] text-[var(--background)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "CREATE ACCOUNT"}
          </button>
        </form>

        <footer className="mt-8 text-center">
          <p className="text-[11px] font-bold tracking-widest uppercase opacity-40 text-[var(--foreground)]">
            Sudah ada akun? <Link href="/login" className="text-[var(--primary)] font-black hover:underline">Login</Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}