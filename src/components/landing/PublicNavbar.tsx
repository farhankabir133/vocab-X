import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';

export default function PublicNavbar({ onSignIn }: { onSignIn: () => void }) {
  const { highContrast, toggleHighContrast } = useTheme();
  const { loading } = useAuth();
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (isAboutPage) {
        navigate('/' + href);
      } else {
        const id = href.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const offset = 80; // Navbar height
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 transition-all duration-300",
      scrolled 
        ? "bg-black/80 backdrop-blur-md border-b border-white/5" 
        : "bg-transparent backdrop-blur-[2px]"
    )}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <Link to="/" className="font-black text-3xl tracking-tighter text-white italic uppercase mix-blend-difference">VocabX</Link>
      </motion.div>
      
      <nav className="hidden lg:flex items-center gap-12">
        {[
          { name: 'Features', href: '#features' },
          { name: 'Intelligence', href: '#intelligence' },
          { name: 'Pricing', href: '#pricing' },
          { name: 'About', href: isAboutPage ? '/about' : '#about' }
        ].map((item) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {item.href.startsWith('#') ? (
              <a 
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 hover:text-vocab-primary transition-colors hover:cursor-pointer"
              >
                {item.name}
              </a>
            ) : (
              <Link 
                to={item.href}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 hover:text-vocab-primary transition-colors"
              >
                {item.name}
              </Link>
            )}
          </motion.div>
        ))}
      </nav>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-8"
      >
        <button 
          onClick={toggleHighContrast}
          className="p-2 text-white/40 hover:text-vocab-primary transition-colors"
        >
          {highContrast ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button 
          onClick={onSignIn}
          disabled={loading}
          className="bg-white text-black px-8 py-3 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
        >
          {loading ? 'SYNCING...' : 'Initialize'}
        </button>
      </motion.div>
    </header>
  );
}
