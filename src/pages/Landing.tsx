import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Target, 
  Brain, 
  Sparkles, 
  Smartphone, 
  BarChart3,
  Layers,
  Newspaper,
  Shield,
  Star,
  Sun,
  Moon,
  ChevronDown,
  Users
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import PublicNavbar from '../components/landing/PublicNavbar';
import Hero3D from '../components/landing/Hero3D';
import SmoothScroll from '../components/landing/SmoothScroll';
import AuthModal from '../components/landing/AuthModal';
import gsap from 'gsap';

import PageTransition from '../components/PageTransition';

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.div
      style={{ position: "relative" }}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

function TiltCard({ children, className, ...props }: { children: React.ReactNode, className?: string } & any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      {...props}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
        ...props.style
      }}
      className={className}
    >
      <div
        style={{
          transform: "translateZ(75px)",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 800);
      }
    }
  }, [location.hash]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const textParallaxX = useTransform(springX, [-500, 500], [-15, 15]);
  const textParallaxY = useTransform(springY, [-500, 500], [-15, 15]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroRotate = useTransform(scrollYProgress, [0, 0.5], [0, 45]);

  return (
    <PageTransition>
      <SmoothScroll>
        <div ref={containerRef} className="relative min-h-screen bg-vocab-surface selection:bg-vocab-primary/30 font-sans overflow-x-hidden">
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <Hero3D />
        
        <PublicNavbar onSignIn={handleSignIn} />

        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center">
          <motion.div 
            style={{ scale, opacity }}
            className="max-w-6xl mx-auto z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-vocab-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-vocab-primary">Neural Learning Active</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ x: textParallaxX, y: textParallaxY }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-9xl font-black text-white leading-[0.9] mb-12 uppercase tracking-tighter"
            >
              Master <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vocab-primary via-white to-vocab-secondary italic">Semantic</span> <br/>
              Precision
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ x: useTransform(textParallaxX, (v: number) => v * 0.5), y: useTransform(textParallaxY, (v: number) => v * 0.5) }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-lg md:text-xl text-vocab-on-surface-variant max-w-2xl mx-auto mb-16 font-medium leading-relaxed tracking-tight"
            >
              Level up your vocabulary for high-stakes exams. Scientific spaced-repetition meets futuristic AI tutors in a cinematic learning environment.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:row items-center justify-center gap-8"
            >
              <Magnetic>
                <button 
                  onClick={handleSignIn}
                  className="group relative px-12 py-6 bg-vocab-primary text-black font-black text-xs uppercase tracking-[0.4em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(138,180,248,0.4)]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Acquisition <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </Magnetic>
              
              <div className="flex items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white" />
                  <span className="font-bold text-[10px] tracking-widest text-white uppercase italic">Security Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-vocab-primary" />
                  <span className="font-bold text-[10px] tracking-widest text-white uppercase italic">Ultra Low Latency</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
          >
            <ChevronDown className="w-10 h-10 text-white/20" />
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <section className="container mx-auto px-6 py-64" id="features">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-12 mb-16 px-4">
              <span className="terminal-label text-vocab-primary mb-4 block">Core Modules</span>
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase italic">Redefining Mental Capacity</h2>
            </div>

            {/* AI Assistant */}
            <TiltCard 
              id="intelligence"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="md:col-span-8 group relative bg-vocab-surface-container-low border border-white/5 p-16 overflow-hidden rounded-sm"
            >
              <div className="absolute top-0 right-0 p-8">
                <Brain className="w-16 h-16 text-vocab-primary/10 group-hover:text-vocab-primary/40 transition-colors" />
              </div>
              <div className="relative z-10 max-w-md">
                <h3 className="text-4xl font-bold text-white mb-6 uppercase tracking-tighter">Omniscient <br/> AI Architecture</h3>
                <p className="text-vocab-on-surface-variant text-lg leading-relaxed mb-10 font-sans italic">
                  Beyond simple definitions. Our neural network correlates word usage across decades of competitive exam patterns.
                </p>
                <div className="flex gap-4">
                  <div className="px-5 py-2 bg-vocab-primary/5 border border-vocab-primary/20 text-vocab-primary text-[10px] font-bold uppercase tracking-widest">BCS Core</div>
                  <div className="px-5 py-2 bg-vocab-secondary/5 border border-vocab-secondary/20 text-vocab-secondary text-[10px] font-bold uppercase tracking-widest">Bank Specialized</div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-vocab-primary/5 blur-[100px] rounded-full group-hover:bg-vocab-primary/10 transition-all duration-1000" />
            </TiltCard>

            {/* Spaced Repetition */}
            <TiltCard 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:col-span-4 bg-vocab-surface-container-low border border-white/5 p-16 flex flex-col justify-between rounded-sm"
            >
              <div>
                <Layers className="w-10 h-10 text-vocab-tertiary mb-8" />
                <h3 className="text-3xl font-bold text-white mb-6 uppercase tracking-tighter">Temporal <br/> Recall</h3>
                <p className="text-vocab-on-surface-variant text-sm font-sans leading-relaxed">
                  Scientific logic that optimizes learning intervals based on your biological memory curve.
                </p>
              </div>
              <div className="mt-12 h-1 bg-white/5 overflow-hidden">
                <motion.div 
                   animate={{ x: ['-100%', '100%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="w-1/2 h-full bg-vocab-tertiary" 
                />
              </div>
            </TiltCard>

            {/* Analytics */}
            <TiltCard 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="md:col-span-4 bg-vocab-surface-container-low border border-white/5 p-16 rounded-sm"
            >
              <BarChart3 className="w-10 h-10 text-vocab-secondary mb-8" />
              <h3 className="text-3xl font-bold text-white mb-6 uppercase tracking-tighter">Quantized <br/> Mastery</h3>
              <p className="text-vocab-on-surface-variant text-sm font-sans leading-relaxed mb-10">
                Visualizing your linguistic ascent through high-precision data vectors.
              </p>
              <div className="flex gap-4 items-end h-20">
                <div className="flex-1 bg-vocab-secondary/20 rounded-t-sm h-[40%]" />
                <div className="flex-1 bg-vocab-secondary/20 rounded-t-sm h-[70%]" />
                <div className="flex-1 bg-vocab-secondary h-[100%]" />
                <div className="flex-1 bg-vocab-secondary/20 rounded-t-sm h-[60%]" />
              </div>
            </TiltCard>

            {/* Exam Prep */}
            <TiltCard 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:col-span-8 bg-vocab-surface-container-low border border-white/5 p-16 relative overflow-hidden rounded-sm"
            >
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                  <Target className="w-10 h-10 text-white mb-8" />
                  <h3 className="text-4xl font-bold text-white mb-6 uppercase tracking-tighter">Precision <br/> Simulation</h3>
                  <p className="text-vocab-on-surface-variant text-lg font-sans leading-relaxed italic">
                    Real-time battle arenas simulating pressure environments of actual recruitment tests.
                  </p>
                </div>
                <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-vocab-surface to-vocab-surface-container-low border border-white/10 rounded-full flex items-center justify-center p-8">
                  <div className="w-full h-full border-2 border-dashed border-vocab-primary/20 rounded-full animate-spin-slow flex items-center justify-center">
                    <div className="w-24 h-24 bg-vocab-primary shadow-[0_0_50px_rgba(138,180,248,0.5)] rounded-full flex items-center justify-center">
                       <Zap className="w-8 h-8 text-black" />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* Cinematic Stats Section */}
        <section className="py-64 border-y border-white/5 overflow-hidden">
          <div className="container mx-auto px-6 text-center">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
              {[
                { label: 'Words Processed', val: '5M+', icon: Newspaper },
                { label: 'Successful Candidates', val: '50K+', icon: Users },
                { label: 'Accuracy Gain', val: '92%', icon: BarChart3 },
                { label: 'Global Ranking', val: 'TOP 1%', icon: Star },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <stat.icon className="w-8 h-8 text-vocab-primary mx-auto mb-6 opacity-40" />
                  <div className="text-6xl font-black text-white mb-3 tracking-tighter">{stat.val}</div>
                  <div className="terminal-label">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-64 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-32 gap-12">
              <div className="max-w-2xl">
                <span className="terminal-label text-vocab-primary mb-4 block">Feedback Loop</span>
                <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85]">Neural <br/> Resonance</h2>
              </div>
              <p className="text-vocab-on-surface-variant max-w-sm text-lg italic font-sans">
                Voices from those who have successfully re-wired their linguistic hardware.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/10">
              {[
                { name: 'Sarah Ahmed', role: 'BCS 41st Batch', quote: 'The spatial memory anchors in VocabX changed how I process information. It is not just about words; it is about cognitive clarity.' },
                { name: 'David Chen', role: 'IELTS 8.5 Scorer', quote: 'I have tried every app. VocabX is the only one that feels like it belongs in the 21st century. The AI tutor is scarily precise.' },
                { name: 'Rahat Islam', role: 'Senior Civil Servant', quote: 'The competitive arena kept me sharp. My vocabulary changed from functional to formidable in just six months of consistent use.' },
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  className="p-16 flex flex-col justify-between group transition-colors"
                >
                  <div className="mb-12">
                    <Star className="w-6 h-6 text-vocab-primary mb-8 opacity-20 group-hover:opacity-100 transition-opacity" />
                    <blockquote className="text-2xl font-serif text-white/90 leading-relaxed italic">
                      "{t.quote}"
                    </blockquote>
                  </div>
                  <div>
                    <div className="font-bold text-white uppercase tracking-widest text-xs mb-1">{t.name}</div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-vocab-primary opacity-60">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-px bg-vocab-primary/10 blur-sm pointer-events-none" />
        </section>

        {/* Pricing */}
        <section className="container mx-auto px-6 py-64" id="pricing">
          <div className="text-center mb-32">
             <span className="terminal-label text-vocab-primary mb-4 block">Deployment Cost</span>
             <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85]">Invest in <br/> Excellence</h2>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 shadow-2xl relative">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-vocab-secondary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-vocab-primary/5 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Free */}
            <TiltCard 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-vocab-surface-container-lowest p-12 md:p-20 flex flex-col hover:bg-vocab-surface-container-low transition-colors duration-700 relative z-10"
            >
               <div className="mb-20">
                  <h3 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter">Standard Node</h3>
                  <div className="text-7xl font-black text-white mb-4 italic">$0</div>
                  <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">Base Intelligence Access</p>
               </div>
               <ul className="space-y-6 mb-20 flex-1 font-sans">
                  {['500 High-Yield Nodes', 'Spaced Repetition V1', 'Daily Newsletter Access', 'Community Protocol'].map(item => (
                    <li key={item} className="flex items-center gap-4 text-vocab-on-surface-variant font-medium text-sm">
                      <div className="w-1.5 h-1.5 bg-vocab-on-surface-variant/30 rounded-full" /> {item}
                    </li>
                  ))}
               </ul>
               <button onClick={handleSignIn} className="w-full py-6 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all active:scale-95 group">
                  <span className="flex items-center justify-center gap-3">
                    Begin Sequence <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
               </button>
            </TiltCard>

            {/* Pro */}
            <TiltCard 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-vocab-surface-container-lowest p-12 md:p-20 flex flex-col relative overflow-hidden group hover:bg-vocab-surface-container-low transition-colors duration-700 z-10"
            >
               <div className="absolute top-0 right-0 p-8">
                  <Zap className="w-12 h-12 text-vocab-primary/20 group-hover:text-vocab-primary transition-colors duration-1000" />
               </div>
               <div className="mb-20">
                  <h3 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter">Elite Operator</h3>
                  <div className="text-7xl font-black text-white mb-4 italic">$12</div>
                  <p className="text-vocab-primary font-mono text-[10px] uppercase tracking-[0.2em]">Full Semantic Dominance</p>
               </div>
               <ul className="space-y-6 mb-20 flex-1 font-sans">
                  {['10,000+ Exam Vectors', 'Unlimited AI Architecture', 'Battle Arena Access', 'Offline Node Sync', 'Priority Neural Support'].map(item => (
                    <li key={item} className="flex items-center gap-4 text-white font-medium text-sm italic">
                      <Sparkles className="w-4 h-4 text-vocab-primary shadow-glow" /> {item}
                    </li>
                  ))}
               </ul>
               <button onClick={handleSignIn} className="w-full py-6 bg-vocab-primary text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(138,180,248,0.3)] hover:scale-[1.02] transition-all active:scale-95">
                  Upgrade Capacity
               </button>
            </TiltCard>
          </div>
        </section>

        {/* About Preview Section */}
        <section className="container mx-auto px-6 py-64 border-t border-white/5" id="about">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="terminal-label text-vocab-primary mb-4 block">The Methodology</span>
              <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85] mb-12">Cognitive <br/> Engineering</h2>
              <p className="text-vocab-on-surface-variant text-lg font-sans leading-relaxed mb-12 italic">
                VocabX is not just an application; it is a systematic approach to linguistic mastery designed for high-stakes environments. We bridge the gap between rote memorization and true cognitive acquisition.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                {[
                  { icon: Brain, title: "Neural Sync", desc: "AI-driven mapping" },
                  { icon: Target, title: "Precision", desc: "Exam-aligned vectors" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <item.icon className="w-6 h-6 text-vocab-primary opacity-40" />
                    <h4 className="text-white font-bold text-xs uppercase tracking-widest">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link 
                to="/about"
                className="inline-flex items-center gap-3 text-vocab-primary font-black text-[10px] uppercase tracking-[0.3em] hover:gap-6 transition-all group"
              >
                Access Full Manifesto <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
               <div className="absolute inset-0 bg-vocab-primary/5 blur-[100px] rounded-full" />
               <div className="relative z-10 w-full h-full border border-white/10 rounded-sm bg-black/40 p-12 flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-start">
                     <Smartphone className="w-12 h-12 text-vocab-primary/40" />
                     <div className="text-right">
                        <span className="terminal-label text-vocab-secondary block mb-1">Mobile Arch</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Coming Soon</span>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-3xl font-bold text-white uppercase tracking-tighter">iOS / Android <br/> Deployment</h3>
                     <p className="text-vocab-on-surface-variant text-sm italic font-sans">
                        Our native mobile ecosystems are under heavy development. Expect full ecosystem integration in the upcoming quarter.
                     </p>
                  </div>
                  <div className="pt-8 border-t border-white/5 flex gap-4">
                     <div className="flex-1 h-1 bg-white/10 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: '65%' }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-vocab-primary" 
                        />
                     </div>
                     <span className="text-[8px] font-bold text-vocab-primary uppercase text-right w-20">65% Synced</span>
                  </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-vocab-surface-container-lowest border-t border-white/5 py-40">
           <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
                 <div className="md:col-span-1">
                    <span className="font-black text-4xl tracking-tighter text-white italic uppercase block mb-10">VocabX</span>
                    <p className="text-vocab-on-surface-variant text-sm font-sans italic leading-relaxed">
                       Pioneering the future of linguistic acquisition for the elite professionals of tomorrow.
                    </p>
                 </div>
                 {['System', 'Module', 'Network', 'Info'].map((col, i) => (
                   <div key={i}>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mb-10">{col}</h4>
                      <ul className="space-y-6 text-[10px] text-vocab-on-surface-variant font-bold uppercase tracking-[0.2em]">
                         {col === 'Info' ? (
                            <>
                              <li><Link to="/about" className="hover:text-vocab-primary transition-colors">About Us</Link></li>
                              <li><a href="#" className="hover:text-vocab-primary transition-colors">Privacy</a></li>
                              <li><a href="#" className="hover:text-vocab-primary transition-colors">Terms</a></li>
                            </>
                         ) : (
                            <>
                              <li><a href="#" className="hover:text-vocab-primary transition-colors">Architecture</a></li>
                              <li><a href="#" className="hover:text-vocab-primary transition-colors">Protocols</a></li>
                              <li><a href="#" className="hover:text-vocab-primary transition-colors">Interface</a></li>
                            </>
                         )}
                      </ul>
                   </div>
                 ))}
              </div>
              <div className="pt-20 border-t border-white/5 flex flex-col md:row items-center justify-between gap-10">
                 <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">© 2024 VocabX Systems LLC. v3.0_CYBER</p>
                 <div className="flex gap-12 grayscale opacity-40">
                    <Smartphone className="w-6 h-6 text-white" />
                    <BarChart3 className="w-6 h-6 text-white" />
                    <Zap className="w-6 h-6 text-white" />
                 </div>
              </div>
           </div>
        </footer>
      </div>
    </SmoothScroll>
    </PageTransition>
  );
}
