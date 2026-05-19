import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Bookmark, 
  Volume2, 
  Brain,
  History,
  Gauge,
  CheckCircle,
  Star,
  Edit2,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateNextReview, SpacedRepetitionData } from '../lib/spacedRepetition';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

interface MasteredWord {
  id: string;
  word: string;
  masteryLevel: number;
  lastReviewed: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  analysis: {
    pronunciation: string;
    definition: string;
    mnemonic: string;
    examples: string[];
    synonyms: string[];
    bengaliTranslation: string;
  };
}

export default function Flashcards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [words, setWords] = useState<MasteredWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchWords = async () => {
      setLoading(true);
      try {
        const wordsRef = collection(db, 'users', user.uid, 'masteredWords');
        // Simple fetch for now, we could filter by nextReview in production
        // const q = query(wordsRef, where('nextReview', '<=', new Date().toISOString()));
        const querySnapshot = await getDocs(wordsRef);
        const fetchedWords = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MasteredWord[];
        
        // Filter in memory for simplicity if server-side filtering is complex with composite indexes
        const dueWords = fetchedWords.filter(w => new Date(w.nextReview) <= new Date());
        
        setWords(dueWords.length > 0 ? dueWords : fetchedWords.slice(0, 5)); // Show some even if none due for demo
      } catch (error) {
        console.error('Failed to fetch words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [user]);

  const handleReview = async (quality: number) => {
    if (!user || words.length === 0) return;

    const currentWord = words[currentIndex];
    const srUpdate = calculateNextReview(quality, {
      interval: currentWord.interval || 0,
      easeFactor: currentWord.easeFactor || 2.5,
      repetitions: currentWord.repetitions || 0,
      masteryLevel: currentWord.masteryLevel
    });

    try {
      const wordRef = doc(db, 'users', user.uid, 'masteredWords', currentWord.id);
      await updateDoc(wordRef, {
        ...srUpdate,
        lastReviewed: new Date().toISOString()
      });

      // Update user points
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: increment(quality * 2),
        lastActive: new Date().toISOString()
      });

      // Move to next word or finish
      if (currentIndex < words.length - 1) {
        setCurrentIndex(v => v + 1);
        setIsFlipped(false);
      } else {
        // Finished all words
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to update word:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vocab-surface">
        <div className="w-12 h-12 border-4 border-vocab-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-vocab-surface text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
          <CheckCircle className="w-10 h-10 text-vocab-primary" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter">Deck Clear</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-10 font-sans italic">All neural nodes are currently stabilized. No reviews requested at this time.</p>
        <button 
          onClick={() => navigate('/learn')}
          className="bg-vocab-primary text-vocab-surface font-bold text-[10px] uppercase tracking-widest px-10 py-4 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)]"
        >
          Acquire New Nodes
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <PageTransition>
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 md:p-10 overflow-hidden z-10">
      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-8 z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-sm bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="terminal-label">Transmission Progress</span>
              <span className="font-mono text-xs text-cyan-400 tracking-tight">{currentIndex + 1} / {words.length} Nodes</span>
            </div>
            <div className="w-full h-1 bg-slate-900 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" 
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-sm border border-white/10 shadow-xl">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-tighter text-slate-300">Sync Active</span>
          </div>
        </div>
      </div>

      {/* Flashcard Component */}
      <div className="w-full max-w-xl perspective-1000 relative mt-12 md:mt-0">
        <motion.div
          className="relative w-full aspect-[4/5] cursor-pointer preserve-3d transition-transform duration-700 ease-in-out"
          onClick={() => setIsFlipped(!isFlipped)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-sm p-10 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(34,211,238,0.05)] group">
            <div className="absolute top-8 right-8">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsBookmarked(!isBookmarked); }}
                className={cn(
                  "p-3 rounded-sm border border-white/5 transition-all active:scale-90",
                  isBookmarked ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "text-slate-600 hover:text-slate-300"
                )}
              >
                <Bookmark className="w-6 h-6" fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mb-12 w-full">
              <div className="terminal-label mb-2 opacity-60 uppercase tracking-[0.2em] text-[10px]">Term for Decryption</div>
              <motion.h2 className="font-sans text-5xl md:text-7xl font-bold text-white mb-4 tracking-tighter uppercase line-clamp-2 break-all">{currentWord.word}</motion.h2>
              <div className="inline-flex items-center gap-3 terminal-data text-sm bg-cyan-400/5 px-6 py-2 border border-cyan-400/10">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>{currentWord.analysis?.pronunciation || '/.../'}</span>
              </div>
            </div>

            <div className="mt-12 p-8 bg-indigo-950/20 border border-indigo-500/10 w-full max-w-sm relative overflow-hidden group-hover:bg-indigo-900/20 transition-colors">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/50" />
              <div className="flex items-center justify-center gap-2 text-indigo-400 mb-3 font-mono">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Neural Assist Mnemonic</span>
              </div>
              <p className="font-sans text-lg italic text-slate-300 leading-relaxed line-clamp-3">
                "{currentWord.analysis?.mnemonic || 'No mnemonic recorded.'}"
              </p>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center text-slate-600 animate-pulse">
              <p className="text-[10px] font-mono uppercase tracking-[0.4em]">Initialize Flip Sequence</p>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden bg-[#050505] backdrop-blur-2xl border border-cyan-500/20 rounded-sm p-10 flex flex-col shadow-2xl overflow-y-auto rotate-y-180">
             <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <span className="terminal-label text-cyan-400 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Mastery level: {currentWord.masteryLevel}%
                </span>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 text-slate-600 hover:text-cyan-400 transition-all rounded-sm hover:bg-white/5 active:scale-95 border border-transparent hover:border-white/10"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
             </div>

             <div className="space-y-8 font-mono">
                <section>
                  <h3 className="terminal-label mb-3 text-[10px] opacity-40">Primary Meaning</h3>
                  <div className="space-y-3">
                    <p className="font-sans text-2xl font-bold text-white tracking-tight uppercase leading-snug">{currentWord.analysis?.definition}</p>
                    <p className="text-xl font-bold text-cyan-400/80">{currentWord.analysis?.bengaliTranslation}</p>
                  </div>
                </section>

                <section>
                  <h3 className="terminal-label mb-3 text-[10px] opacity-40">Related Nodes</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.analysis?.synonyms.slice(0, 4).map(tag => (
                      <span key={tag} className="border border-white/10 px-3 py-1.5 rounded-sm text-[9px] uppercase font-bold text-slate-500 hover:border-cyan-500/30 hover:text-white transition-all cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="terminal-label mb-3 text-[10px] opacity-40">Contextual log</h3>
                  <div className="space-y-2">
                    {currentWord.analysis?.examples.slice(0, 1).map((ex, i) => (
                      <blockquote key={i} className="border-l-2 border-cyan-500/30 pl-4 py-3 italic text-slate-300 font-sans text-sm leading-relaxed bg-white/5 relative">
                        "{ex}"
                      </blockquote>
                    ))}
                  </div>
                </section>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] p-6 md:p-12 z-30"
          >
            <div className="max-w-3xl mx-auto flex gap-3 md:gap-6 justify-center pointer-events-auto">
              {[
                { label: 'Reset', quality: 0, icon: RotateCcw, color: 'text-red-500 border-red-500/20 hover:bg-red-500 hover:text-black', desc: 'FAIL' },
                { label: 'Struggle', quality: 2, icon: Gauge, color: 'text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-black', desc: 'HARD' },
                { label: 'Success', quality: 4, icon: CheckCircle, color: 'text-cyan-400 border-cyan-400/20 hover:bg-cyan-400 hover:text-black', desc: 'GOOD' },
                { label: 'Master', quality: 5, icon: Star, color: 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black', desc: 'EASY' },
              ].map((btn) => (
                <button 
                  key={btn.label} 
                  disabled={loading}
                  onClick={(e) => { e.stopPropagation(); handleReview(btn.quality); }}
                  className="flex-1 max-w-[120px] flex flex-col items-center gap-2 group transition-opacity disabled:opacity-50"
                >
                  <div className={cn(
                    "w-full h-12 md:h-16 rounded-sm border flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 bg-black/60",
                    btn.color
                  )}>
                    <btn.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex flex-col items-center font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{btn.label}</span>
                    <span className="text-[7px] font-bold opacity-40 mt-0.5 uppercase tracking-tighter">{btn.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}

