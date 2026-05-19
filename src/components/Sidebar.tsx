import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Layers, 
  Swords, 
  Bot, 
  User, 
  Crown,
  LogOut,
  Moon,
  Sun,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Learn', path: '/learn' },
  { icon: Layers, label: 'Flashcards', path: '/flashcards' },
  { icon: Swords, label: 'Quiz Arena', path: '/quiz' },
  { icon: Bot, label: 'AI Tutor', path: '/ai-tutor' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Info, label: 'About', path: '/about' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col p-6 gap-6 bg-black/40 backdrop-blur-md border-r border-white/5 z-40">
      <div className="flex items-center gap-4 mb-8 px-2">
        <div className="w-8 h-8 rounded-sm bg-vocab-primary shadow-[0_0_15px_rgba(193,193,255,0.5)] flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-black"></div>
        </div>
        <div>
          <h1 className="font-mono font-bold text-lg text-white uppercase tracking-[0.2em] leading-none">VocabX</h1>
          <p className="terminal-label mt-1">Control Center</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <h2 className="terminal-label px-4 mb-2">Navigation</h2>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 group relative",
              isActive 
                ? "bg-vocab-primary/10 text-vocab-primary border border-vocab-primary/20 shadow-[inset_0_0_15px_rgba(193,193,255,0.1)]" 
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-vocab-primary rounded-r-full shadow-[0_0_10px_rgba(193,193,255,0.8)]" />}
                <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="font-mono text-[11px] uppercase tracking-wider">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-md">
           <div className="flex justify-between text-[10px] uppercase font-mono mb-2">
              <span className="text-slate-500 text-[10px]">Sync Status</span>
              <span className="text-vocab-primary">Stable</span>
           </div>
           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-vocab-primary w-[94%] shadow-[0_0_10px_rgba(193,193,255,0.5)]"></div>
           </div>
        </div>
        
        <button 
          onClick={toggleHighContrast}
          className="w-full bg-white/5 border border-white/10 text-slate-300 py-3 rounded-md font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
        >
          {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{highContrast ? 'Immersive Mode' : 'High Contrast'}</span>
        </button>

        <button className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 py-3 rounded-md font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all active:scale-95 shadow-xl">
          <Crown className="w-4 h-4" />
          <span>Priority Access</span>
        </button>

        <button 
          onClick={handleSignOut}
          className="w-full text-slate-500 hover:text-red-400 py-3 rounded-md font-mono text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
