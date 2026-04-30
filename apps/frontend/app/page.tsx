"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Variant untuk animasi staggered
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  // Variant untuk teks
  const textVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] as any 
      },
    },
  };

  return (
    <div className="relative min-h-screen font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div key="cave" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <div className="absolute top-0 left-[15%] w-[1px] h-[30vh] bg-gradient-to-b from-slate-800 to-transparent opacity-60" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 blur-[120px] rounded-full" />
            </motion.div>
          ) : (
            <motion.div key="nature" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/40 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 flex items-end gap-3 px-12">
                {[...Array(8)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [60, 90, 60], rotate: [-1, 2, -1] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                    className="w-[2px] bg-emerald-900/20 rounded-full origin-bottom"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between p-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-black tracking-[0.4em] uppercase text-primary transition-colors duration-1000"
        >
          Trackly<span className="dark:text-white text-emerald-950">.</span>
        </motion.div>

        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-full bg-slate-500/10 border border-slate-500/20 transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
                  <Sun size={18} className="text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
                  <Moon size={18} className="text-emerald-900" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <Link href="/login" className="text-[10px] font-black tracking-widest uppercase py-2 px-6 border border-current rounded-full hover:bg-current hover:text-[var(--background)] transition-all">
            Login
          </Link>
        </div>
      </nav>

      {/* --- HERO CONTENT --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl"
          >
            <motion.h1 variants={textVariants} className="text-5xl md:text-[85px] font-black tracking-[-0.04em] leading-[1.1] mb-8">
              {theme === 'dark' ? (
                <span className="text-white">Lamaran Kerja,<br/><span className="text-slate-600 italic">Terorganisir Sempurna.</span></span>
              ) : (
                <span className="text-emerald-950">Lamaran Kerja,<br/><span className="text-emerald-700/40 font-light">Terorganisir Sempurna.</span></span>
              )}
            </motion.h1>

            <motion.p 
              variants={textVariants}
              className="max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed mb-12 dark:text-slate-400 text-emerald-900 opacity-70"
            >
              Dashboard pintar untuk melacak setiap tahap lamaran kerja Anda.<br className="hidden md:block" />
              Dari kirim CV hingga offering letter.
            </motion.p>

            <motion.div variants={textVariants} className="relative group inline-block">
              <div className="absolute -inset-1 bg-primary rounded-full blur opacity-0 group-hover:opacity-20 transition duration-1000"></div>
              <Link 
                href="/register" 
                className="relative px-16 py-6 bg-[var(--foreground)] text-[var(--background)] text-xs font-black tracking-[0.2em] uppercase rounded-full overflow-hidden shadow-2xl block transition-transform group-hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">Gabung Sekarang</span>
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-primary opacity-20 rounded-full"
                />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- FOOTER --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        className="absolute bottom-10 right-10 flex items-center gap-4"
      >
        <div className="w-12 h-[1px] bg-current" />
        <span className="text-[10px] font-black tracking-widest uppercase">Your Career Portal</span>
      </motion.div>
    </div>
  );
}