import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  Layers, 
  Bot, 
  User,
  LogOut,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';

const navItems = [
  { icon: LayoutDashboard, path: '/dashboard' },
  { icon: Search, path: '/learn' },
  { icon: Layers, path: '/flashcards' },
  { icon: Bot, path: '/ai-tutor' },
  { icon: User, path: '/profile' },
  { icon: Info, path: '/about' },
];

export function MobileNav() {
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
    <nav className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/5 md:hidden flex items-center justify-around p-3 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "p-3 rounded-md transition-all",
            isActive ? "text-vocab-primary bg-vocab-primary/10" : "text-slate-500"
          )}
        >
          <item.icon className="w-6 h-6" />
        </NavLink>
      ))}
      <button 
        onClick={toggleHighContrast}
        className="p-3 text-slate-500 hover:text-vocab-primary"
      >
        {highContrast ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
      <button 
        onClick={handleSignOut}
        className="p-3 text-slate-500 hover:text-red-400"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </nav>
  );
}
