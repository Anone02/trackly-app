"use client";

import React, { useState, useEffect, useActionState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ChevronDown, Search, LayoutDashboard, Briefcase, Settings, 
  Sun, Moon, User as UserIcon, Plus, X,
  Calendar, Target, Edit2, Trash2, Save,
  Link as LinkIcon, MapPin, Clock, DollarSign, MessageSquare
} from "lucide-react";
import { logoutUser, addApplication, updateProfile, deleteApplication, getApplications } from "@/app/actions";


export default function DashboardContent({ initialStats }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [isUpdating, startUpdateTransition] = React.useTransition();
  const [filteredApps, setFilteredApps] = useState(initialStats.allData || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(addApplication, null);

  useEffect(() => {
    setMounted(true);
    if (state?.success) {
        setIsModalOpen(false);
        setEditingApp(null);
    }
  }, [state]);

  useEffect(() => {
    const loadData = async () => {
      // Panggil server action yang kita buat tadi
      const data = await getApplications(search, statusFilter);
      setFilteredApps(data);
    };
    
    // Debounce biar gak nge-lag pas ngetik
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  

  if (!mounted) return null;

  // --- LOGIKA DASHBOARD VISUAL ---
  const statusCounts = initialStats.allData?.reduce((acc: any, app: any) => {
    acc[app.applicationStatus] = (acc[app.applicationStatus] || 0) + 1;
    return acc;
  }, {});
  
  const pipelineData = [
    { label: 'Applied', val: statusCounts?.['Applied'] || 0 },
    { label: 'Interview', val: statusCounts?.['Interview'] || 0 },
    { label: 'Test', val: statusCounts?.['Technical Test'] || 0 },
    { label: 'Offer', val: statusCounts?.['Offering Letter'] || 0 },
    { label: 'Rejected', val: statusCounts?.['Rejected'] || 0 },
  ];
  const maxVal = Math.max(...pipelineData.map(d => d.val), 1);

  // Reminder Interview
  const upcomingInterviews = initialStats.allData?.filter((app: any) => 
    app.applicationStatus === 'Interview'
  ).slice(0, 3);

  const handleEdit = (app: any) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row font-sans selection:bg-blue-500">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 flex md:flex-col justify-between bg-[var(--background)] overflow-x-auto">
        <div className="flex md:flex-col gap-6 md:gap-0">
          <div className="mb-0 md:mb-10 px-2 flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">T</div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic hidden md:block">TRACKLY<span className="text-blue-500">.</span></h1>
          </div>
          <nav className="flex md:flex-col gap-2 space-y-0 md:space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'applications', icon: Briefcase, label: 'Applications' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-3 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
              >
                <tab.icon size={18} /> <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="hidden md:flex flex-col space-y-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase opacity-40">Theme</span>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => logoutUser()} className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl font-bold text-sm transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em]">CORE / {activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[9px] font-black opacity-30 uppercase tracking-widest leading-none">Identity</p>
                <p className="text-sm font-black text-blue-500 italic">@{initialStats.user?.username}</p>
            </div>
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white border border-blue-400/20">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        {/* --- 1. DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { l: "Total Apps", v: initialStats.total, c: "text-blue-500" },
                { l: "Interviews", v: initialStats.interview, c: "text-green-500" },
                { l: "Applied", v: initialStats.applied, c: "text-orange-500" },
                { l: "Rejected", v: initialStats.rejected, c: "text-red-500" }
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
                  <p className="text-[10px] font-black opacity-40 uppercase mb-4 tracking-widest">{s.l}</p>
                  <h3 className={`text-5xl font-black tracking-tighter ${s.c}`}>{s.v}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[550px]">
              <div className="md:col-span-2 bg-white/[0.02] p-10 rounded-[40px] border border-white/5 flex flex-col flex-1">
                <h4 className="text-[10px] font-black uppercase opacity-30 mb-10 italic tracking-widest">Pipeline Visualization</h4>
                <div className="flex-1 flex items-end gap-6 pb-4">
                  {pipelineData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                        <div className="w-full bg-blue-600/5 rounded-t-2xl relative flex items-end overflow-hidden h-full">
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: `${(d.val / maxVal) * 100}%` }} 
                            className="w-full bg-blue-600 rounded-t-xl" 
                          />
                        </div>
                        <span className="text-[9px] font-black opacity-30 uppercase">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600 p-10 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-blue-600/20">
                <div>
                  <Calendar className="mb-6 opacity-40" size={32} />
                  <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-2">Upcoming Interviews</h4>
                  <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Don't miss the chance</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-6 custom-scrollbar max-h-[400px]">
                    {initialStats.allData
                        ?.filter((app: any) => app.applicationStatus === 'Interview')
                        .map((app: any) => (
                        <div key={app.id} className="bg-black/10 p-5 rounded-2xl border border-white/10 hover:bg-black/20 transition-all">
                            <p className="font-black text-sm italic uppercase tracking-tight">{app.companyName}</p>
                            <p className="text-[10px] opacity-70 font-bold uppercase mb-2">{app.jobTitle}</p>
                            <div className="flex items-center gap-2 opacity-50">
                            <Clock size={10} />
                            <span className="text-[9px] font-black uppercase">
                                {new Date(app.applicationDate).toLocaleDateString()}
                            </span>
                            </div>
                        </div>
                        ))
                    }
                    
                    {/* 3. Fallback kalau kosong */}
                    {initialStats.allData?.filter((a:any) => a.applicationStatus === 'Interview').length === 0 && (
                        <p className="text-xs font-bold opacity-40 italic text-center mt-40">No scheduled interviews.</p>
                    )}
                    </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  Data Engine<span className="text-blue-500">.</span>
                </h2>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">
                  Comprehensive Management Console
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 items-center">
                {/* SEARCH BOX: Dikasih background abu tipis (light) agar kelihatan shape-nya */}
                <div className="relative group w-full md:w-64">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={14} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="SEARCH_ENTITY..." 
                    className="w-full bg-slate-100 dark:bg-blue/5 border border-slate-200 dark:border-blue/10 p-3 pl-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-blue-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* SELECT BOX: Biru Solid & Rounded */}
                <div className="relative w-full md:w-64">
                  <button 
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-blue-600 border border-blue-500 p-3 px-6 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-between text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <span>{statusFilter === 'All' ? 'ALL_STATUS' : statusFilter}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Overlay buat nutup pas klik luar */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      
                      {/* List menu melengkung parah */}
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[25px] shadow-2xl overflow-hidden z-20 p-2 animate-in fade-in zoom-in duration-200">
                        {['All', 'Applied', 'Interview', 'Technical Test', 'Offering Letter', 'Rejected'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setStatusFilter(status);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left p-3 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all text-slate-600 dark:text-slate-300"
                          >
                            {status === 'All' ? 'ALL_STATUS' : status}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* REGISTER BUTTON: Tetap Biru Konsisten */}
                <button 
                  onClick={() => { setEditingApp(null); setIsModalOpen(true); }} 
                  className="w-full md:w-auto bg-blue-600 p-4 px-8 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all whitespace-nowrap text-white border border-blue-500"
                >
                  <Plus size={16}/> REGISTER NEW APP
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-[40px] border border-white/5 overflow-x-auto shadow-2xl">
              <table className="w-full text-left min-w-[2000px]">
                <thead className="bg-white/5 text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="p-6">#</th>
                    <th className="p-6">Entity / Role</th>
                    <th className="p-6">Location</th>
                    <th className="p-6">Type</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">App Date</th>
                    <th className="p-6">Follow-Up</th>
                    <th className="p-6">Recruiter</th>
                    <th className="p-6">Salary (IDR)</th>
                    <th className="p-6">Source</th>
                    <th className="p-6">Notes</th>
                    <th className="p-6 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* MENGGUNAKAN filteredApps UNTUK PENCARIAN REAL-TIME */}
                  {filteredApps?.map((app: any, idx: number) => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="p-6 text-[10px] font-black opacity-20">{idx + 1}</td>
                      <td className="p-6">
                        <div className="font-black text-sm italic uppercase tracking-tighter">{app.companyName}</div>
                        <div className="text-[10px] opacity-40 font-bold">{app.jobTitle}</div>
                      </td>
                      <td className="p-6 text-[10px] font-bold opacity-60 italic">{app.location || 'Remote'}</td>
                      <td className="p-6 text-[9px] font-black opacity-30 uppercase tracking-widest">{app.jobType}</td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded-lg uppercase border border-blue-500/20 italic">
                          {app.applicationStatus}
                        </span>
                      </td>
                      <td className="p-6 text-[10px] font-bold opacity-60">
                        {new Date(app.applicationDate).toLocaleDateString()}
                      </td>
                      <td className="p-6">
                        {app.followUpDate ? (
                          <div className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-1">
                            <Clock size={10}/> {new Date(app.followUpDate).toLocaleDateString()}
                          </div>
                        ) : <span className="opacity-10">---</span>}
                      </td>
                      <td className="p-6 text-[10px] font-bold opacity-60">{app.contactPerson || '---'}</td>
                      <td className="p-6 font-mono text-xs font-bold tracking-tighter">
                        {app.salary ? app.salary: '---'}
                      </td>
                      <td className="p-6">
                        {app.sourceLink ? (
                          <a href={app.sourceLink} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 text-[10px] font-bold">
                            <LinkIcon size={12}/> Link
                          </a>
                        ) : '---'}
                      </td>
                      <td className="p-6">
                        <div className="max-w-[150px] truncate text-[10px] opacity-30 font-bold italic">{app.notes || '---'}</div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(app)} className="p-2 bg-white/5 rounded-lg hover:text-blue-500 transition-colors">
                            <Edit2 size={14}/>
                          </button>
                          <button onClick={() => deleteApplication(app.id)} className="p-2 bg-white/5 rounded-lg hover:text-red-500 transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Fallback kalau hasil cari kosong */}
              {filteredApps?.length === 0 && (
                <div className="p-20 text-center opacity-20 font-black italic uppercase tracking-[0.5em] text-xs">
                  NO_MATCHING_RECORDS_FOUND
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 3. SETTINGS TAB (UPDATED: TOTAL REWORK) --- */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-2xl">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Core Config<span className="text-blue-500">.</span></h2>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em] mb-10">System & Notification Identity</p>
                
                <form action={async (formData: FormData) => {
                const username = formData.get("username") as string;
                const password = formData.get("password") as string;
                const telegramId = formData.get("telegramId") as string;
                
                // Bungkus panggilannya pake ini biar status "Operating" bisa selesai
                startUpdateTransition(async () => {
                    const res = await updateProfile({ username, password, telegramId });
                    if(res.success) {
                    alert("SYSTEM_RECONFIGURED! 🚀");
                    // JANGAN pake window.location.reload() biar gak stuck
                    } else {
                    alert(res.error);
                    }
                });
                }} className="space-y-8">
                
                <div className="group">
                    <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Identity / Username</label>
                    <input name="username" defaultValue={initialStats.user?.username} className="w-full bg-black/20 p-5 mt-2 rounded-2xl border border-white/5 font-bold outline-none focus:ring-1 ring-blue-500 text-white" />
                </div>

                <div className="group">
                    <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Security / New Password</label>
                    <input name="password" type="password" className="w-full bg-black/20 p-5 mt-2 rounded-2xl border border-white/5 font-bold outline-none focus:ring-1 ring-blue-500 text-white" placeholder="Leave blank to keep current" />
                </div>

                <div className="group">
                    <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Integration / Telegram ID</label>
                    <input name="telegramId" defaultValue={initialStats.user?.telegramId} className="w-full bg-black/20 p-5 mt-2 rounded-2xl border border-white/5 font-bold outline-none focus:ring-1 ring-blue-500 text-white" placeholder="Example: 12345678" />
                </div>

                <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="w-full bg-blue-600 p-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                    {isUpdating ? "OPERATING..." : "COMMIT_CHANGES"}
                </button>
                </form>
            </div>
            )}
      </main>

      {/* --- FULL FORM MODAL (Logic Edit + Add) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 w-full max-w-3xl p-10 rounded-[40px] border border-white/10 relative">
                <button onClick={() => {setIsModalOpen(false); setEditingApp(null);}} className="absolute top-10 right-10 opacity-30 hover:opacity-100"><X /></button>
                <h2 className="text-3xl font-black italic mb-8 uppercase tracking-tighter">{editingApp ? "Modify Record" : "New Register"}<span className="text-blue-500">.</span></h2>
                
                <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* HIDDEN ID FOR EDITING */}
                  <input type="hidden" name="id" value={editingApp?.id || ""} />
                  
                  <div className="space-y-4">
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Company Name</label>
                      <input name="companyName" defaultValue={editingApp?.companyName} placeholder="Google" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" required />
                    </div>
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Job Title</label>
                      <input name="jobTitle" defaultValue={editingApp?.jobTitle} placeholder="DevOps" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Location</label>
                        <input name="location" defaultValue={editingApp?.location} placeholder="Jakarta" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" />
                      </div>
                      <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Type</label>
                        <select name="jobType" defaultValue={editingApp?.jobType || "Full-time"} className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none">
                          <option value="Full-time">Full-time</option><option value="Contract">Contract</option><option value="Freelance">Freelance</option><option value="Internship">Internship</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Source/Link</label>
                      <input name="sourceLink" defaultValue={editingApp?.sourceLink} placeholder="https://linkedin.com/..." className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">App Date</label>
                        <input name="appDate" type="date" defaultValue={editingApp ? new Date(editingApp.applicationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" required />
                      </div>
                      <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Ping Date</label>
                        <input name="followUpDate" type="date" defaultValue={editingApp?.followUpDate ? new Date(editingApp.followUpDate).toISOString().split('T')[0] : ""} className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" />
                      </div>
                    </div>
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Status</label>
                      <select name="status" defaultValue={editingApp?.applicationStatus || "Applied"} className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none">
                        <option value="Applied">Applied</option><option value="Interview">Interview</option><option value="Offering Letter">Offering Letter</option><option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Recruiter</label>
                      <input name="contactPerson" defaultValue={editingApp?.contactPerson} placeholder="Name or LinkedIn" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" />
                    </div>
                    <div><label className="text-[9px] font-black opacity-30 uppercase ml-1">Salary (IDR)</label>
                      <input name="salary" type="text" defaultValue={editingApp?.salary} placeholder="15000000" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] font-black opacity-30 uppercase ml-1">Internal Notes</label>
                    <textarea name="notes" defaultValue={editingApp?.notes} placeholder="Any specific details..." className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-bold outline-none h-20 resize-none" />
                  </div>

                  <button type="submit" className="col-span-2 bg-blue-600 p-6 rounded-[24px] font-black text-xs tracking-[0.4em] uppercase shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all">
                     {isPending ? "OPERATING..." : editingApp ? "UPDATE_RECORD" : "EXECUTE_REGISTRATION"}
                  </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}