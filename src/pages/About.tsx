import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  Smartphone, 
  AppWindow, 
  ChevronRight, 
  HelpCircle,
  Zap,
  Target,
  Globe,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/landing/PublicNavbar';
import AuthModal from '../components/landing/AuthModal';
import PageTransition from '../components/PageTransition';

const FAQs = [
  {
    q: "How does the Neural Tutor work?",
    a: "Our AI tutor utilizes advanced NLP and semantic mapping to build a dynamic model of your vocabulary mastery. It identifies gaps in your linguistic structure and generates personalized mnemonics and context-rich examples to ensure permanent memory linkage."
  },
  {
    q: "Can I prepare for specific exams like BCS or GRE?",
    a: "Yes. VocabX features specialized 'Linguistic Sectors' curated for major competitive exams. This includes high-yield word lists for BCS, Bank Recruitment, GRE, GMAT, and IELTS, ensuring you study only what yields results."
  },
  {
    q: "What is Spaced Repetition (SRS)?",
    a: "SRS is a scientific learning method that optimizes review intervals. Instead of mindless repetition, VocabX calculates the exact moment before you forget a word to re-introduce it, maximizing retention efficiency."
  },
  {
    q: "When are the mobile apps launching?",
    a: "Our iOS and Android architectures are currently in the final stages of neural synchronization (optimization). We expect a full deployment on the App Store and Play Store in the upcoming quarter."
  },
  {
    q: "Is there a premium tier?",
    a: "Yes, our 'Priority Access' allows users to unlock deeper AI analysis, unlimited quiz sessions, and the full competitive arena suite. This support helps us maintain the server-side neural infrastructure."
  }
];

const Niches = [
  {
    icon: Target,
    title: "BCS & Bank Jobs",
    desc: "Curated high-stakes precision lists for Bangladesh's most competitive recruitment exams."
  },
  {
    icon: Globe,
    title: "International Standard",
    desc: "Rigorous academic lexicon mapping for GRE, GMAT, and IELTS candidates."
  },
  {
    icon: ShieldCheck,
    title: "Corporate Mastery",
    desc: "Professional communication nodes for elite corporate professionals and public speakers."
  },
  {
    icon: Cpu,
    title: "Technical Lexicon",
    desc: "Specialized vocabulary for STEM professionals and technical writers."
  }
];

export default function About() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-vocab-surface relative overflow-x-hidden selection:bg-vocab-primary/30 font-sans pb-24 md:pb-12 pt-12 md:pt-12">
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <PublicNavbar onSignIn={handleSignIn} />

        {/* Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-vocab-primary/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-vocab-secondary/5 blur-[100px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-white/5" />
        </div>

        <div className="max-w-6xl mx-auto px-6 space-y-32">
          
          {/* Header Section */}
          <section className="relative pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-16">
                <div className="space-y-4">
                  <span className="terminal-label text-vocab-primary px-3 py-1 bg-vocab-primary/5 border border-vocab-primary/20">ARCHIVE_PROTOCOL_LIB_01</span>
                  <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
                    Approaches <br/> & <span className="text-vocab-primary">Niches</span>
                  </h1>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 backdrop-blur-md max-w-xs">
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed">
                    System Revision V.3.8.4_STABLE <br/> 
                    Latency: 24ms <br/>
                    Neural Nodes Active: 142K+
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <p className="text-xl text-vocab-on-surface-variant font-serif italic leading-relaxed">
                    VocabX is not just another dictionary app. It is a high-performance cognitive environment engineered to re-wire how you acquire, store, and deploy language in high-stakes situations.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/5">
                      <div className="text-vocab-primary font-bold text-xs uppercase mb-1">Methodology</div>
                      <div className="text-[10px] text-slate-500 uppercase">Spaced Repetition V4</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5">
                      <div className="text-vocab-secondary font-bold text-xs uppercase mb-1">Intelligence</div>
                      <div className="text-[10px] text-slate-500 uppercase">Neural AI Synthesis</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Niches.map((n, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      className="p-6 bg-white/5 border border-white/5 space-y-4 transition-all group"
                    >
                      <n.icon className="w-8 h-8 text-vocab-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-2">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase">{n.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Mobile Ecosystem Section */}
          <section className="relative group grayscale hover:grayscale-0 transition-all duration-1000">
            <div className="absolute -inset-4 bg-vocab-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-vocab-surface-container-lowest border border-white/10 p-8 md:p-20 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                 <Smartphone className="w-64 h-64 text-vocab-primary" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div className="space-y-10 relative z-10">
                  <div>
                    <span className="terminal-label text-vocab-secondary mb-4 block">Deployment Matrix</span>
                    <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">Mobile <br/> Synchronicity</h3>
                  </div>
                  
                  <p className="text-lg text-vocab-on-surface-variant font-sans leading-relaxed italic">
                    The VocabX experience is expanding. Soon, you will carry the full weight of our neural architecture in your pocket. Seamless sync across all devices.
                  </p>

                  <div className="flex flex-wrap gap-12 pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-white/40" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-xs uppercase tracking-widest">iOS Architecture</div>
                          <div className="text-vocab-primary text-[8px] font-black uppercase tracking-[0.2em] mt-1 animate-pulse">Syncing Development...</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center">
                          <AppWindow className="w-6 h-6 text-white/40" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-xs uppercase tracking-widest">Android Core</div>
                          <div className="text-vocab-secondary text-[8px] font-black uppercase tracking-[0.2em] mt-1 animate-pulse">Core Integration...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative aspect-square md:aspect-auto md:h-[400px] bg-black/40 border border-white/5 p-8 flex items-center justify-center group/screen overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(138,180,248,0.1),transparent)]" />
                  <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-full max-w-[240px] aspect-[9/19] bg-vocab-surface-container border-[6px] border-slate-800 rounded-[3rem] p-4 flex flex-col items-center justify-center gap-4 shadow-2xl"
                  >
                    <div className="w-12 h-1 bg-slate-800 rounded-full mb-8" />
                    <div className="w-16 h-16 bg-vocab-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(138,180,248,0.4)]">
                      <Layers className="w-8 h-8 text-black" />
                    </div>
                    <div className="space-y-2 text-center">
                      <div className="w-20 h-2 bg-white/10 rounded-full mx-auto" />
                      <div className="w-12 h-2 bg-white/5 rounded-full mx-auto" />
                    </div>
                    <div className="mt-auto mb-4 w-1.5 h-1.5 bg-vocab-primary rounded-full animate-ping" />
                  </motion.div>
                  
                  <div className="absolute top-0 left-0 w-full h-full bg-vocab-primary/5 opacity-0 group-hover/screen:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="text-[10px] font-black text-vocab-primary uppercase tracking-[0.5em] -rotate-45">Holographic Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Knowledge Base Section */}
          <section className="py-20 px-4 md:px-0">
            <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
              <div className="space-y-4">
                <span className="terminal-label text-vocab-tertiary">Neural Knowledge Repository</span>
                <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none italic">
                  General <br/> <span className="text-vocab-tertiary">Facts</span> & Intel
                </h3>
              </div>
              <div className="max-w-xs">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] leading-relaxed italic">
                  Deciphering common queries related to the VocabX ecosystem and linguistic deployment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/10">
              {FAQs.map((faq, i) => (
                <div 
                  key={i} 
                  className="group relative bg-vocab-surface p-10 md:p-16 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-8">
                    <span className="text-vocab-primary font-mono text-xs opacity-20 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                    <div className="space-y-6">
                      <h4 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight group-hover:text-vocab-primary transition-colors">
                        {faq.q}
                      </h4>
                      <p className="text-sm text-vocab-on-surface-variant leading-relaxed italic font-sans pl-6 border-l border-white/10">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-vocab-primary transition-all duration-700 group-hover:w-full" />
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="text-center pb-32">
            <Link 
              to="/dashboard"
              className="group relative inline-flex items-center gap-4 px-16 py-6 bg-white text-black font-black text-xs uppercase tracking-[0.5em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Return to Terminal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
}
