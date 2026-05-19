import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  Target, 
  Zap, 
  CheckCircle, 
  XCircle,
  Trophy,
  History,
  Repeat,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateNextReview } from '../lib/spacedRepetition';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

type QuestionState = 'idle' | 'correct' | 'wrong';

interface MasteredWord {
  id: string;
  word: string;
  masteryLevel: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  analysis: {
    definition: string;
    synonyms: string[];
  };
}

interface Question {
  word: string;
  options: { text: string; correct: boolean }[];
  originalId: string;
}

export default function QuizArena() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'results'>('lobby');
  const [words, setWords] = useState<MasteredWord[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const [score, setScore] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);
  const [results, setResults] = useState<{ word: string; status: 'Stabilized' | 'Divergent'; def: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchWords = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'masteredWords'));
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MasteredWord[];
        setWords(fetched);
        
        if (fetched.length >= 4) {
          generateQuestions(fetched);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [user]);

  const generateQuestions = (allWords: MasteredWord[]) => {
    const totalQ = Math.min(allWords.length, 10);
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const newQuestions: Question[] = [];

    for (let i = 0; i < totalQ; i++) {
      const qWord = shuffled[i];
      const correctSynonym = qWord.analysis.synonyms[0] || 'Unknown';
      
      // Get 3 fake synonyms from other words
      const diffWords = allWords.filter(w => w.id !== qWord.id);
      const fakeSynonyms = diffWords
        .map(w => w.analysis.synonyms[0] || 'Unknown')
        .filter(s => s !== correctSynonym)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [
        { text: correctSynonym, correct: true },
        ...fakeSynonyms.map(s => ({ text: s, correct: false }))
      ].sort(() => Math.random() - 0.5);

      newQuestions.push({
        word: qWord.word,
        options,
        originalId: qWord.id
      });
    }

    setQuestions(newQuestions);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleNextQuestion(false);
          return 15;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, currentQuestionIndex]);

  const handleNextQuestion = async (isCorrect: boolean) => {
    if (!user) return;
    
    const currentQ = questions[currentQuestionIndex];
    const originalWord = words.find(w => w.id === currentQ.originalId);
    
    if (originalWord) {
      const quality = isCorrect ? (timer > 10 ? 5 : 4) : 0;
      const srUpdate = calculateNextReview(quality, {
        interval: originalWord.interval || 0,
        easeFactor: originalWord.easeFactor || 2.5,
        repetitions: originalWord.repetitions || 0,
        masteryLevel: originalWord.masteryLevel
      });

      try {
        const wordRef = doc(db, 'users', user.uid, 'masteredWords', originalWord.id);
        await updateDoc(wordRef, srUpdate);
        
        setResults(prev => [...prev, {
          word: originalWord.word,
          status: isCorrect ? 'Stabilized' : 'Divergent',
          def: originalWord.analysis.definition
        }]);

        if (isCorrect) {
          const points = quality * 10;
          setScore(s => s + points);
          setXpEarned(x => x + points);
        }
      } catch (error) {
        console.error('Update failed:', error);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(v => v + 1);
      setSelection(null);
      setTimer(15);
    } else {
      setGameState('results');
      // Update global user sync
      await updateDoc(doc(db, 'users', user.uid), {
        points: increment(xpEarned),
        lastActive: new Date().toISOString()
      });
    }
  };

  const handleSelect = (idx: number, isCorrect: boolean) => {
    setSelection(idx);
    setTimeout(() => {
      handleNextQuestion(isCorrect);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-vocab-surface gap-4">
        <Loader2 className="w-10 h-10 text-vocab-primary animate-spin" />
        <span className="terminal-label text-vocab-primary animate-pulse">Syncing Neural Memory...</span>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-vocab-surface text-center font-mono">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
          <Zap className="w-10 h-10 text-vocab-primary" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 uppercase tracking-tighter italic">Linguistic Arena</h1>
        <p className="text-slate-500 max-w-sm mx-auto mb-12 font-sans italic">Test your semantic recognition. Fast responses yield high XP sync rates.</p>
        
        {words.length < 4 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-none mb-10">
            <p className="text-amber-500 text-xs uppercase tracking-widest leading-relaxed">
              Insufficient Data. Acquire at least 4 nodes in Explorer to initialize the arena.
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setGameState('playing')}
            className="bg-vocab-primary text-vocab-surface font-bold text-sm uppercase tracking-[0.3em] px-12 py-5 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-105"
          >
            Start Initialization
          </button>
        )}
      </div>
    );
  }

  if (gameState === 'results') {
    return (
       <div className="min-h-screen relative flex flex-col items-center justify-center p-6 md:p-10 font-mono z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-cyan-500/5 blur-[130px] -z-10 rounded-full" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/80 w-full max-w-4xl border border-white/10 overflow-hidden shadow-2xl relative z-20 rounded-none shadow-[0_0_50px_rgba(0,0,0,1)]"
          >
            <div className="p-8 md:p-16 text-center flex flex-col items-center space-y-8 border-b border-white/5 relative">
              <div className="absolute top-0 right-0 p-4 terminal-label opacity-40">Session Complete</div>
              <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px] tracking-[0.4em] uppercase">
                Challenge Concluded
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter uppercase">Optimal Output Logged</h2>

              <div className="text-center">
                  <div className="text-5xl md:text-7xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] mb-4">+{score} XP</div>
                  <div className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2 rounded-none font-bold text-[10px] uppercase tracking-widest">
                    <Trophy className="w-3 h-3" />
                    <span>Combat Sequence Terminated</span>
                  </div>
              </div>
            </div>

            <div className="px-10 py-10">
              <h3 className="terminal-label mb-8 flex items-center gap-3">
                <LayoutDashboard className="text-cyan-400 w-4 h-4" /> Neural Acquisition Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {results.map((r, i) => (
                    <div key={i} className={cn(
                      "p-6 rounded-none relative group border",
                      r.status === 'Divergent' ? "bg-amber-500/5 border-amber-500/20" : "bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10 transition-all cursor-crosshair"
                    )}>
                      <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">{r.word}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans mb-6 italic line-clamp-2">{r.def}</p>
                      <div className={cn(
                        "inline-block px-2 py-0.5 rounded-none font-bold text-[8px] uppercase tracking-[0.2em] border",
                        r.status === 'Stabilized' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {r.status}
                      </div>
                    </div>
                 ))}
              </div>
            </div>

            <div className="px-10 py-10 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                 <button onClick={() => {
                   setGameState('lobby');
                   setCurrentQuestionIndex(0);
                   setScore(0);
                   setResults([]);
                 }} className="bg-cyan-500 text-black px-10 py-4 rounded-none font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all">
                    <Repeat className="w-4 h-4" /> Re-Initialize
                 </button>
                 <button onClick={() => navigate('/dashboard')} className="bg-transparent border border-white/20 text-white px-10 py-4 rounded-none font-bold text-[10px] tracking-widest uppercase hover:bg-white/5 active:scale-95 transition-all">
                    Link Dashboard
                 </button>
              </div>
            </div>
          </motion.div>
       </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <PageTransition>
      <main className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-10 overflow-hidden font-mono z-10">
      {/* Top Navigation */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-24 flex justify-between items-center px-10 bg-black/40 backdrop-blur-md border-b border-white/5 z-40">
        <div className="flex items-center gap-8">
          <div className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-none border transition-all duration-300",
            timer < 5 ? "bg-amber-500/20 border-amber-500/40 text-amber-500 animate-pulse" : "bg-white/5 border-white/10 text-cyan-400"
          )}>
            <Timer className="w-4 h-4" />
            <span className="text-xl font-bold uppercase tracking-tighter">{timer}S</span>
          </div>
          <div className="terminal-label flex items-center gap-3">
             <span className="opacity-40">Segment</span>
             <div className="flex items-center gap-2">
                <span className="text-white text-lg">{currentQuestionIndex + 1}</span>
                <span className="opacity-20">/</span>
                <span className="opacity-20">{questions.length}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
             <span className="terminal-label text-[8px] opacity-40 mb-1">XP Accumulation</span>
             <span className="text-2xl font-bold text-white uppercase tracking-tighter">{score.toLocaleString()} XP</span>
          </div>
          <div className="w-12 h-12 border border-white/5 flex items-center justify-center group hover:border-cyan-500/40 transition-all bg-white/5">
             <Zap className="w-5 h-5 text-amber-500 opacity-60" fill="currentColor" />
          </div>
        </div>
      </header>

      {/* Quiz Card */}
      <div className="max-w-4xl w-full flex flex-col gap-10 z-10 pt-24">
        <motion.section 
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/60 border border-white/10 rounded-none p-12 md:p-16 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500/40" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-500/40" />
          
          <div className="flex justify-between items-start mb-12">
            <div className="flex flex-col gap-2">
               <span className="terminal-label text-cyan-400 border border-cyan-400/20 px-3 py-1 bg-cyan-400/5">Synonym Vector Challenge</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500 animate-pulse">
              <Zap className="w-5 h-5" fill="currentColor" />
              <span className="font-bold text-[10px] tracking-[0.2em] uppercase italic">2X Multiplier [Active]</span>
            </div>
          </div>

          <div className="text-center py-8">
            <p className="terminal-label opacity-40 mb-4 uppercase tracking-[0.2em] text-[10px]">Identify Nearest Linguistic Neighbor [Synonym]</p>
            <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter italic border-y border-white/5 py-8">{currentQ?.word}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            {currentQ?.options.map((opt, i) => (
              <button 
                key={i}
                disabled={selection !== null}
                onClick={() => handleSelect(i, opt.correct)}
                className={cn(
                  "p-8 rounded-none border text-left transition-all duration-300 flex items-center justify-between group disabled:cursor-not-allowed",
                  selection === i 
                    ? opt.correct 
                      ? "bg-cyan-500/20 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]" 
                      : "bg-amber-500/10 border-amber-500"
                    : "border-white/5 hover:border-white/20 hover:bg-white/5 active:scale-95"
                )}
              >
                <div className="flex items-center gap-6">
                   <div className={cn(
                     "w-10 h-10 border flex items-center justify-center font-bold text-sm transition-all",
                     selection === i 
                       ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                       : "bg-white/5 border-white/10 text-slate-600 group-hover:border-cyan-500/40 group-hover:text-cyan-400"
                   )}>
                      {`0${i + 1}`}
                   </div>
                   <span className={cn(
                     "text-xl font-bold tracking-tight uppercase transition-colors",
                     selection === i ? "text-white" : "text-slate-500 group-hover:text-white"
                   )}>
                      {opt.text}
                   </span>
                </div>
                {selection === i && opt.correct && (
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                )}
                {selection === i && !opt.correct && (
                  <XCircle className="w-6 h-6 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Progress Display */}
        <div className="flex flex-col gap-4">
           <div className="w-full h-1 bg-white/5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" 
              />
           </div>
           <div className="flex justify-between w-full terminal-label opacity-40 italic">
              <span>Sequence Progress</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Finalized</span>
           </div>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}

