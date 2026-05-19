import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Share2, 
  MapPin, 
  Trophy, 
  Flame, 
  Zap, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Medal,
  Clock,
  Star,
  Target,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PageTransition from '../components/PageTransition';

interface UserData {
  displayName: string;
  photoURL: string;
  email: string;
  streak: number;
  level: number;
  points: number;
  lastActive: string;
}

const achievements = [
  { title: 'The Lexicographer', desc: 'Added 100 deep mnemonics', date: 'Oct 12, 2023', icon: Star, color: 'from-amber-400 to-orange-500' },
  { title: 'Consistency King', desc: '20 Day Learning Streak', date: 'Sep 24, 2023', icon: Flame, color: 'from-red-500 to-rose-600' },
  { title: 'Speed Demon', desc: 'Fastest Quiz Completion', date: 'Sep 08, 2023', icon: Zap, color: 'from-vocab-primary to-vocab-secondary' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid), 
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      },
      (error) => {
        console.error('Profile user sync error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const stats = [
    { label: 'Words Mastered', value: (userData?.points ? Math.floor(userData.points / 10).toString() : '0'), icon: Award, color: 'text-vocab-primary' },
    { label: 'Level', value: (userData?.level?.toString() || '1'), icon: Trophy, color: 'text-amber-400' },
    { label: 'Points', value: (userData?.points?.toString() || '0'), icon: Target, color: 'text-vocab-secondary' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 md:pb-10 font-mono z-10 relative">
      {/* Profile Header Hero */}
      <section className="relative h-80 w-full overflow-hidden border-b border-white/5">
        <img 
          alt="Abstract Header"
          className="w-full h-full object-cover brightness-[0.2] grayscale scale-110 blur-md"
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2070"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        
        <div className="absolute bottom-0 left-0 w-full px-6 md:px-10 pb-12 flex flex-col md:flex-row items-end justify-between gap-8 max-w-7xl mx-auto transform translate-y-6">
           <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto">
              <div className="relative group p-1 bg-white/5 border border-white/10 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                 <div className="w-40 h-40 rounded-none overflow-hidden border border-white/5">
                    <img 
                      alt="User Profile" 
                      className="w-full h-full object-cover grayscale opacity-80 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"
                      src={userData?.photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"} 
                    />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-none border-2 border-black flex items-center justify-center shadow-xl animate-pulse">
                    <CheckCircle className="w-4 h-4 text-black" />
                 </div>
              </div>
              <div className="flex flex-col pb-4">
                 <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2">
                    <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">{userData?.displayName || 'Operator'}</h2>
                    <span className="hidden md:block terminal-label opacity-40 text-xs">// Level {userData?.level || 1} Elite Member</span>
                 </div>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5">
                       <Flame className="w-3 h-3 text-red-400" />
                       Streak: {userData?.streak || 0} Days
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5">
                       <Clock className="w-3 h-3 text-amber-500" />
                       Last Active: {userData?.lastActive ? new Date(userData.lastActive).toLocaleDateString() : 'N/A'}
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex gap-4 pb-4 w-full md:w-auto justify-center">
              <button className="flex items-center gap-2 bg-white/5 font-bold text-[10px] uppercase tracking-[0.3em] px-8 py-4 rounded-none border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                 <Settings className="w-3 h-3" /> Config
              </button>
              <button className="p-4 rounded-none bg-vocab-primary text-vocab-surface shadow-[0_0_30px_rgba(193,193,255,0.3)] active:scale-95 hover:bg-vocab-primary/80 transition-all">
                 <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500/10 font-bold text-[10px] uppercase tracking-[0.3em] px-8 py-4 rounded-none border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
              >
                 <LogOut className="w-3 h-3" /> Sign Out
              </button>
           </div>
        </div>
      </section>

      {/* Main Profile Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-20 grid grid-cols-1 md:grid-cols-12 gap-10">
         {/* Stats Column */}
         <div className="md:col-span-8 flex flex-col gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-white/5 bg-black/40">
               {stats.map((stat, i) => (
                 <motion.div 
                   key={stat.label}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-8 flex flex-col items-center text-center group border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-all cursor-default"
                 >
                    <div className={cn("mb-4 opacity-40 group-hover:opacity-100 transition-all", 
                      stat.label.includes('Rank') ? "text-amber-500" : "text-vocab-primary"
                    )}>
                       <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold text-white uppercase tracking-tighter">{stat.value}</span>
                    <span className="terminal-label mt-2 opacity-60 text-[9px]">{stat.label}</span>
                 </motion.div>
               ))}
            </div>

            {/* Learning Activity Chart (Mocked with CSS) */}
            <section className="bg-black/40 border border-white/5 p-10 relative overflow-hidden group rounded-none">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="terminal-label flex items-center gap-3">
                     <TrendingUp className="text-vocab-primary w-4 h-4" /> Acquisition Telemetry
                  </h3>
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-vocab-primary animate-pulse" />
                        <span className="terminal-label opacity-40 text-[8px]">Network Mastery</span>
                     </div>
                     <select className="bg-white/5 border border-white/10 px-4 py-1.5 text-[8px] font-bold text-slate-400 focus:outline-none uppercase tracking-widest">
                        <option>30-DAY-LOG</option>
                        <option>180-DAY-LOG</option>
                     </select>
                  </div>
               </div>

               <div className="flex items-end justify-between h-48 gap-3 mt-12 relative border-b border-white/5 pb-1">
                  {[45, 62, 34, 78, 54, 89, 92, 100, 85, 74].map((height, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      className={cn(
                        "w-full rounded-none relative group/bar",
                        i === 7 ? "bg-vocab-primary shadow-[0_0_15px_rgba(193,193,255,0.4)]" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-2 py-1 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {height} UNITS
                       </div>
                    </motion.div>
                  ))}
               </div>
               
               <div className="flex justify-between mt-6 px-1">
                  {['T-30D', 'T-15D', 'NOW'].map((date) => (
                    <span key={date} className="terminal-label opacity-20 text-[8px]">{date}</span>
                  ))}
               </div>
            </section>
         </div>

         {/* Badges/Achievements Column */}
         <div className="md:col-span-4 flex flex-col gap-10">
            <section className="bg-black/40 border border-white/5 p-8 rounded-none">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="terminal-label flex items-center gap-3">
                     <Medal className="text-amber-500 w-4 h-4" /> Asset Inventory
                  </h3>
                  <button className="text-[9px] font-bold text-vocab-primary uppercase tracking-widest hover:text-vocab-primary/80">Expand</button>
               </div>
               
               <div className="flex flex-col gap-4">
                  {achievements.map((ach) => (
                    <div key={ach.title} className="p-4 rounded-none bg-white/5 border border-white/5 flex items-center gap-5 hover:bg-white/10 transition-all cursor-pointer group">
                       <div className={cn("w-14 h-14 rounded-none flex items-center justify-center shrink-0 border border-white/5 shadow-2xl relative", 
                         ach.title.includes('Consistency') ? "text-amber-500" : "text-cyan-400"
                        )}>
                          <ach.icon className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                          <h4 className="font-bold text-[10px] text-white uppercase tracking-widest mb-0.5">{ach.title}</h4>
                          <p className="text-[9px] text-slate-500 leading-tight mb-1.5 font-sans">{ach.desc}</p>
                          <span className="terminal-label opacity-20 text-[7px] italic">{ach.date}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="bg-black/40 border border-white/5 p-8 overflow-hidden relative">
               <div className="relative z-10 flex flex-col items-center text-center p-8 border border-white/5 bg-vocab-primary/5">
                  <Clock className="w-8 h-8 text-vocab-primary mb-4 opacity-40" />
                  <h4 className="terminal-label mb-1">Quota Status</h4>
                  <p className="text-4xl font-bold text-vocab-primary tracking-tighter mb-4 italic">14 / 20</p>
                  <div className="w-full h-1 bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-vocab-primary shadow-[0_0_10px_rgba(193,193,255,0.5)]" />
                  </div>
                  <p className="mt-6 text-[9px] font-sans font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                     Incomplete: 06 nodes remaining for secure state.
                  </p>
               </div>
            </section>
         </div>
      </div>
    </div>
    </PageTransition>
  );
}
