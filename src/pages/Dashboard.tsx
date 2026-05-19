import React, { useEffect, useState } from 'react';
import { 
  Flame, 
  Star, 
  Trophy, 
  Bot, 
  ArrowRight, 
  Bookmark,
  PlayCircle,
  Bolt,
  Activity,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { doc, onSnapshot, FirestoreError } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error Status: ', JSON.stringify(errInfo, null, 2));
  throw error;
}
import ProgressChart from '../components/dashboard/ProgressChart';
import PageTransition from '../components/PageTransition';

interface UserData {
  displayName: string;
  streak: number;
  level: number;
  points: number;
}


const words = [
  { 
    tag: 'Academic', 
    word: 'Ephemeral', 
    ipa: '/əˈfem(ə)rəl/', 
    def: 'Lasting for a very short time; fleeting and momentary in nature.',
    color: 'primary'
  },
  { 
    tag: 'Literary', 
    word: 'Mellifluous', 
    ipa: '/məˈliflo͞oəs/', 
    def: '(of a voice or words) sweet or musical; pleasant to hear.',
    color: 'secondary'
  },
  { 
    tag: 'SAT Prep', 
    word: 'Sagacious', 
    ipa: '/səˈɡāSHəs/', 
    def: 'Having or showing keen mental discernment and good judgment; shrewd.',
    color: 'tertiary'
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) return;

    const userPath = `users/${user.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, userPath), 
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, userPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = [
    { icon: Flame, color: 'text-orange-400', label: `${userData?.streak || 0} Days`, sub: 'Streak' },
    { icon: Star, color: 'text-vocab-primary', label: `${userData?.points || 0} XP`, sub: 'Total' },
    { icon: Trophy, color: 'text-vocab-secondary', label: 'Rank', sub: `Level ${userData?.level || 1}` },
  ];
  return (
    <PageTransition>
      <div className="p-6 md:p-10 pb-24 md:pb-10 min-h-screen max-w-7xl mx-auto z-10 relative">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-mono text-xs uppercase tracking-[0.4em] text-vocab-primary mb-2"
            >
              Mission Status: Operational
            </motion.h2>
            <h1 className="font-sans text-4xl font-bold text-white tracking-tight">System Overview: {userData?.displayName || 'Operator'}</h1>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/5 px-6 py-3 rounded-sm flex items-center gap-4 shrink-0 backdrop-blur-md"
              >
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <div className="flex flex-col">
                  <span className="terminal-data text-lg leading-none">{stat.label}</span>
                  <span className="terminal-label mt-1">{stat.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono">
          {/* Neural Growth Analysis (Bento Large) */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-8 glass-card rounded-none p-8 relative overflow-hidden group border-t-2 border-t-vocab-primary/50"
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-vocab-primary" />
                    <h3 className="terminal-label">Neural Growth Analysis</h3>
                  </div>
                  <p className="text-white text-xl font-bold uppercase tracking-widest">Mastery Trajectory</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-5xl font-bold text-vocab-primary italic leading-none">14<span className="text-2xl text-slate-500">/20</span></span>
                  <div className="flex items-center gap-2 mt-3 p-1 px-2 bg-green-500/10 border border-green-500/20 rounded-sm">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] text-green-500 font-bold">+12.4% vs Last Cycle</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[180px] mb-8">
                <ProgressChart />
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-slate-900 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-vocab-primary shadow-[0_0_15px_rgba(138,180,248,0.8)]"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Uptime', value: '24:12', icon: Activity },
                  { label: 'Precision', value: '92.4%', icon: Zap },
                  { label: 'Community', value: 'Top 5%', icon: Users },
                  { label: 'Historical', value: 'Alpha-X', icon: TrendingUp },
                ].map((stat) => (
                  <div key={stat.label} className="border-l border-white/10 pl-4 py-2 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-3 h-3 text-vocab-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                      <span className="terminal-label block mb-1 opacity-60">{stat.label}</span>
                    </div>
                    <span className="text-white text-lg font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-vocab-primary/20 pointer-events-none" />
          </motion.section>

          {/* AI Tutor Quick Access (Bento Small) */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 bg-vocab-primary-container/20 border border-vocab-primary/20 rounded-none p-8 flex flex-col justify-between relative overflow-hidden group shadow-[inset_0_0_50px_rgba(193,193,255,0.05)]"
          >
            <div className="z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-vocab-primary/10 text-vocab-primary text-[9px] font-bold uppercase tracking-[0.2em] mb-4 border border-vocab-primary/20">
                 Neural Interface Active
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight uppercase tracking-tight">Lexical Logic Processor</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-sans">Initialize AI core for contextual decoding and mnemonic synthesis.</p>
            </div>
            <button className="z-10 mt-6 bg-vocab-primary text-vocab-surface py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-vocab-primary/80 transition-all active:scale-95 shadow-[0_0_20px_rgba(193,193,255,0.3)]">
              Initialize Comms
            </button>
            <Bot className="absolute -bottom-6 -right-6 w-32 h-32 text-vocab-primary/5 rotate-12" />
          </motion.section>

          {/* Vocabulary Cards Section */}
          <section className="md:col-span-12 mt-6">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h3 className="terminal-label">Recent Acquisitions</h3>
              <button className="text-vocab-primary font-bold text-xs flex items-center gap-2 hover:text-vocab-secondary transition-colors uppercase tracking-widest group">
                Central Log <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {words.map((w, i) => (
                <motion.div 
                  key={w.word}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-black/40 border border-white/5 p-6 rounded-none group hover:border-vocab-primary/30 transition-all duration-300 backdrop-blur-sm relative"
                >
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 group-hover:border-vocab-primary/50 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="terminal-label opacity-40">#{1024 + i}</span>
                    <button className="text-slate-600 hover:text-vocab-primary transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-white mb-1 uppercase tracking-wider">{w.word}</h4>
                  <div className="terminal-data text-[10px] mb-4 opacity-70 italic">{w.ipa}</div>
                  
                  <div className="p-4 bg-white/5 border-l-2 border-vocab-primary/30 mb-6 group-hover:bg-vocab-primary/5 transition-all">
                    <p className="text-slate-300 text-sm leading-relaxed font-sans">{w.def}</p>
                  </div>
                  
                  <div className="flex gap-2 font-sans font-bold">
                     <button className="flex-1 py-2 text-[10px] uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">Mnemonics</button>
                     <button className="flex-1 py-2 text-[10px] uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">Usage</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quiz Arena Teaser */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="md:col-span-12 mt-6"
          >
            <div className="relative w-full rounded-none overflow-hidden min-h-[300px] flex items-center p-8 md:p-20 group border border-white/5">
              <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                 <img 
                  alt="Tactical view" 
                  className="w-full h-full object-cover opacity-20 brightness-50 group-hover:scale-105 transition-transform duration-[20s]" 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072" 
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,8,0.9)_100%)]" />
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
              </div>
              
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-red-500 text-[10px] uppercase font-bold tracking-[0.4em]">Combat Simulation Active</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase leading-none">Arena: Blitz Protocol</h2>
                <p className="text-slate-400 text-lg mb-8 font-sans">Engage in high-velocity lexical recall with 450+ concurrent operators.</p>
                <button className="bg-white text-black px-10 py-4 rounded-sm font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-vocab-primary transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <Bolt className="w-4 h-4" fill="currentColor" /> Initiate Mission
                </button>
              </div>
              
              <div className="absolute top-1/2 right-20 -translate-y-1/2 hidden lg:block opacity-40">
                 <div className="w-64 h-64 border border-vocab-primary/20 rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="w-48 h-48 border border-dashed border-vocab-primary/30 rounded-full" />
                 </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageTransition>
  );
}
