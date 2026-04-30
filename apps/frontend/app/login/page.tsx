"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, UserCircle, ArrowLeft, Sun, Moon, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Tambahan buat pindah page
import { loginUser } from '@/app/actions';

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // Inisialisasi router
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    
    try {
      // Panggil server action
      const result = await loginUser(null, formData);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Jika sukses, kita paksa pindah halaman dari sisi client
        // Ini solusi paling ampuh buat ngatasi 'stuck' di handleSubmit manual
        router.push("/dashboard");
        router.refresh(); 
      }
    } catch (e) {
      console.error("Login Client Error:", e);
      setError("Terjadi kesalahan koneksi.");
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 transition-colors duration-500 bg-[var(--background)] font-sans selection:bg-[var(--primary)]/30">
      
      {/* BACK BUTTON */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase z-50 
                   text-[var(--foreground)] opacity-40 hover:opacity-100 transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Home
      </Link>

      {/* THEME TOGGLE */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-8 right-8 p-3 rounded-2xl z-50 transition-all active:scale-95 border-2
                   bg-[var(--background)] border-[var(--input-bg)] text-[var(--foreground)] shadow-sm"
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
              <Sun size={18} />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
              <Moon size={18} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* LOGIN CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px] p-10 md:p-12 rounded-[32px] shadow-2xl transition-all duration-500
                   bg-[var(--background)] border-2 border-[var(--input-bg)]"
      >
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <UserCircle size={64} className="text-[var(--foreground)] opacity-10" strokeWidth={1} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-[var(--foreground)]">
            Masuk<span className="text-[var(--primary)]">.</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--foreground)] opacity-40">
            Gunakan Username Kamu
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2 text-[var(--foreground)]">
              Username
            </label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 group-focus-within:opacity-100 group-focus-within:text-[var(--primary)] transition-all text-[var(--foreground)]" />
              <input 
                name="username" 
                type="text" 
                required
                placeholder="USERNAME"
                className="w-full p-6 pl-14 text-[13px] font-bold outline-none transition-all rounded-2xl border-2
                           bg-[var(--input-bg)] border-transparent text-[var(--foreground)]
                           focus:border-[var(--primary)]/50 focus:bg-[var(--background)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2 text-[var(--foreground)]">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 group-focus-within:opacity-100 group-focus-within:text-[var(--primary)] transition-all text-[var(--foreground)]" />
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••••••"
                className="w-full p-6 pl-14 pr-14 text-[13px] font-bold outline-none transition-all rounded-2xl border-2
                           bg-[var(--input-bg)] border-transparent text-[var(--foreground)]
                           focus:border-[var(--primary)]/50 focus:bg-[var(--background)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--foreground)] opacity-20 hover:opacity-100 transition-opacity"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full p-6 mt-4 text-[11px] font-black tracking-[0.4em] uppercase rounded-full shadow-lg transition-all
                       bg-[var(--foreground)] text-[var(--background)] hover:scale-[1.02] active:scale-[0.98]
                       flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "SIGN IN"}
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-[11px] font-bold tracking-widest uppercase opacity-40 text-[var(--foreground)]">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[var(--primary)] font-black hover:underline underline-offset-4">
              Daftar Sekarang
            </Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}