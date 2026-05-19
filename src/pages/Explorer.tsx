import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Bookmark, 
  Volume2, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Target,
  Flame,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  Languages,
  GitCompare,
  ArrowLeftRight,
  Plus,
  Globe,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { doc, setDoc, updateDoc, increment, getDoc, collection, query, onSnapshot, deleteDoc, FirestoreError } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

import PageTransition from '../components/PageTransition';

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
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  throw error; // Re-throw to maintain existing component logic
}

interface AnalysisResult {
  pronunciation: string;
  ipa?: string;
  definition: string;
  mnemonic: string;
  examples: string[];
  synonyms: string[];
  bengaliTranslation: string;
}

const wordCards = [
  {
    tag: 'BCS High Frequency',
    word: 'Ameliorate',
    type: 'Verb',
    ipa: '/əˈmiːliəreɪt/',
    en: 'To make something better; to improve a bad situation.',
    bn: 'উন্নত করা / অবস্থার উন্নতি ঘটানো',
    learned: '12k',
    saved: false,
    color: 'primary'
  },
  {
    tag: 'IELTS Essential',
    word: 'Ubiquitous',
    type: 'Adjective',
    ipa: '/juːˈbɪkwɪtəs/',
    en: 'Present, appearing, or found everywhere.',
    bn: 'সর্বব্যাপী / সর্বত্র বিদ্যমান',
    learned: '8k',
    saved: true,
    color: 'secondary'
  },
  {
    tag: 'GRE Advanced',
    word: 'Ephemeral',
    type: 'Adjective',
    ipa: '/ɪˈfɛmərəl/',
    en: 'Lasting for a very short time.',
    bn: 'ক্ষণস্থায়ী / স্বল্পস্থায়ী',
    learned: '5k',
    saved: false,
    color: 'tertiary'
  },
  {
    tag: 'BCS High Frequency',
    word: 'Meticulous',
    type: 'Adjective',
    ipa: '/məˈtɪkjʊləs/',
    en: 'Showing great attention to detail; very careful and precise.',
    bn: 'খুঁতখুঁতে / অত্যন্ত সতর্ক',
    learned: '15k',
    saved: false,
    color: 'primary'
  }
];

export default function Explorer() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());
  const [examFocus, setExamFocus] = useState<string>('ALL');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showWebSearchModal, setShowWebSearchModal] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchResponse, setWebSearchResponse] = useState<{text: string, sources: {uri: string, title: string}[]} | null>(null);
  const [compareWords, setCompareWords] = useState<{word: string, analysis: AnalysisResult}[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [nuanceAnalysis, setNuanceAnalysis] = useState<string | null>(null);
  const [loadingNuance, setLoadingNuance] = useState(false);
  const [userStats, setUserStats] = useState<{points: number, streak: number, masteredCount: number}>({ points: 0, streak: 0, masteredCount: 0 });
  const [toast, setToast] = useState<{message: string, show: boolean}>({ message: '', show: false });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (!user) return;

    // Listen to Saved Words
    const savedWordsPath = `users/${user.uid}/savedWords`;
    const qSaved = query(collection(db, savedWordsPath));
    const unsubSaved = onSnapshot(qSaved, (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach(doc => ids.add(doc.id));
      setSavedWordIds(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, savedWordsPath);
    });

    // Listen to User Global Stats
    const userPath = `users/${user.uid}`;
    const userRef = doc(db, userPath);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserStats(prev => ({
          ...prev,
          points: data.points || 0,
          streak: data.streak || 0
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
    });

    // Listen to Mastered Words count
    const masteredWordsPath = `users/${user.uid}/masteredWords`;
    const qMastered = query(collection(db, masteredWordsPath));
    const unsubMastered = onSnapshot(qMastered, (snapshot) => {
      setUserStats(prev => ({
        ...prev,
        masteredCount: snapshot.size
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, masteredWordsPath);
    });

    return () => {
      unsubSaved();
      unsubUser();
      unsubMastered();
    };
  }, [user]);

  const toggleBookmark = async (word: string, data?: any) => {
    if (!user) return;
    
    const wordId = word.toLowerCase();
    const docRef = doc(db, 'users', user.uid, 'savedWords', wordId);
    
    try {
      if (savedWordIds.has(wordId)) {
        await deleteDoc(docRef);
        setToast({ message: `Node Removed: ${word}`, show: true });
      } else {
        await setDoc(docRef, {
          word,
          tag: data?.tag || 'General',
          type: data?.type || 'Noun',
          en: data?.en || '',
          bn: data?.bn || '',
          savedAt: new Date().toISOString()
        });
        setToast({ message: `Node Linked: ${word}`, show: true });
      }
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    }
  };

  const isSaved = (word: string) => savedWordIds.has(word.toLowerCase());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    analyzeWord(searchQuery);
  };

  const handleManualAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    analyzeWord(manualInput);
    setShowManualModal(false);
    setManualInput('');
  };

  const handleWebSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setWebSearchLoading(true);
    setShowWebSearchModal(true);
    setWebSearchResponse(null);
    setWebSearchQuery(queryToSearch);
    
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToSearch }),
      });
      
      if (!response.ok) throw new Error('Search Protocol Failure');
      const data = await response.json();
      setWebSearchResponse(data);
    } catch (error: any) {
      console.error('Web search failed:', error);
      setToast({ message: 'Linguistic Deep Search Failed', show: true });
    } finally {
      setWebSearchLoading(false);
    }
  };

  const analyzeWord = async (word: string) => {
    setAnalyzing(true);
    setActiveWord(word);
    setAnalysisResult(null);
    
    try {
      const response = await fetch('/api/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Neural processors are at capacity. Please try again in a moment.');
        }
        throw new Error('Analysis Protocol Failed. System offline.');
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setToast({ message: error.message || 'System Error Encountered', show: true });
      setActiveWord(null);
      setAnalysisResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  };

  const handleAddToMastered = async () => {
    if (!user || !activeWord || !analysisResult) return;
    
    setSaving(true);
    try {
      const wordRef = doc(db, 'users', user.uid, 'masteredWords', activeWord.toLowerCase());
      await setDoc(wordRef, {
        word: activeWord,
        masteryLevel: 10,
        lastReviewed: new Date().toISOString(),
        nextReview: new Date(Date.now() + 86400000).toISOString(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        analysis: analysisResult
      });
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: increment(10),
        lastActive: new Date().toISOString()
      });
      
      setAnalysisResult(null);
      setAnalyzing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const [comparing, setComparing] = useState<Set<string>>(new Set());

  const toggleCompare = async (word: string, analysis?: AnalysisResult) => {
    const isAlreadyComparing = compareWords.some(w => w.word.toLowerCase() === word.toLowerCase());
    
    if (isAlreadyComparing) {
      setCompareWords(prev => prev.filter(w => w.word.toLowerCase() !== word.toLowerCase()));
      return;
    }

    if (compareWords.length >= 3) {
      setToast({ message: 'Comparison Limit Reached [3/3]', show: true });
      return;
    }

    if (analysis) {
      setCompareWords(prev => [...prev, { word, analysis }]);
    } else {
      // Fetch analysis if not provided
      setComparing(prev => new Set(prev).add(word.toLowerCase()));
      try {
        const response = await fetch('/api/analyze-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word }),
        });
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        setCompareWords(prev => [...prev, { word, analysis: data }]);
      } catch (err) {
        setToast({ message: `Failed to load comparison data for ${word}`, show: true });
      } finally {
        setComparing(prev => {
          const next = new Set(prev);
          next.delete(word.toLowerCase());
          return next;
        });
      }
    }
  };

  const isInCompare = (word: string) => compareWords.some(w => w.word.toLowerCase() === word.toLowerCase());

  const fetchNuanceAnalysis = async () => {
    if (compareWords.length < 2) return;
    setLoadingNuance(true);
    setNuanceAnalysis(null);
    try {
      const response = await fetch('/api/compare-nuances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: compareWords.map(w => w.word) }),
      });
      if (!response.ok) throw new Error('Nuance fetch failed');
      const data = await response.json();
      setNuanceAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to generate semantic contrast.', show: true });
    } finally {
      setLoadingNuance(false);
    }
  };

  useEffect(() => {
    if (showCompareModal && compareWords.length >= 2 && !nuanceAnalysis && !loadingNuance) {
      fetchNuanceAnalysis();
    }
  }, [showCompareModal, compareWords.length]);

  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [addWordForm, setAddWordForm] = useState({
    word: '',
    ipa: '',
    definition: '',
    mnemonic: '',
    examples: '',
    synonyms: '',
    bengaliTranslation: ''
  });

  const handleManualWordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addWordForm.word) return;

    setSaving(true);
    try {
      const wordId = addWordForm.word.toLowerCase().trim();
      const wordRef = doc(db, 'users', user.uid, 'masteredWords', wordId);
      
      const analysis: AnalysisResult = {
        pronunciation: addWordForm.ipa || '',
        ipa: addWordForm.ipa,
        definition: addWordForm.definition,
        mnemonic: addWordForm.mnemonic,
        examples: addWordForm.examples.split('\n').filter(ex => ex.trim()),
        synonyms: addWordForm.synonyms.split(',').map(s => s.trim()).filter(s => s),
        bengaliTranslation: addWordForm.bengaliTranslation
      };

      await setDoc(wordRef, {
        word: addWordForm.word,
        masteryLevel: 20, // Start with a slight boost for manual entry
        lastReviewed: new Date().toISOString(),
        nextReview: new Date(Date.now() + 86400000).toISOString(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        analysis: analysis,
        manualEntry: true,
        createdAt: new Date().toISOString()
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: increment(15), // Bonus for manual effort
        lastActive: new Date().toISOString()
      });

      setToast({ message: `Linguistic Node Added: ${addWordForm.word}`, show: true });
      setShowAddWordModal(false);
      setAddWordForm({
        word: '',
        ipa: '',
        definition: '',
        mnemonic: '',
        examples: '',
        synonyms: '',
        bengaliTranslation: ''
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      setToast({ message: 'Memory Linkage Failure', show: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 md:pb-10 font-mono z-10 relative overflow-x-hidden">
      {/* Manual Add Word Modal */}
      <AnimatePresence>
        {showAddWordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/90 scrollbar-hide overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-2xl bg-vocab-surface border border-vocab-primary/30 p-1 relative my-8"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-vocab-primary/10 blur-3xl pointer-events-none" />
              
              <div className="bg-black/60 p-6 md:p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="terminal-label text-vocab-primary">MANUAL_ARCHIVE_PROTOCOL</h2>
                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mt-2">New Vocabulary Node</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddWordModal(false)}
                    className="p-2 hover:bg-white/5 transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleManualWordSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry Identifier (Word)</label>
                      <input 
                        required
                        type="text"
                        value={addWordForm.word}
                        onChange={(e) => setAddWordForm(prev => ({ ...prev, word: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-vocab-primary transition-all font-mono uppercase tracking-widest"
                        placeholder="E.G. SAGACIOUS"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phonetic Data (IPA)</label>
                      <input 
                        type="text"
                        value={addWordForm.ipa}
                        onChange={(e) => setAddWordForm(prev => ({ ...prev, ipa: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-vocab-primary transition-all font-mono"
                        placeholder="/səˈɡeɪʃəs/"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core Definition</label>
                    <textarea 
                      required
                      value={addWordForm.definition}
                      onChange={(e) => setAddWordForm(prev => ({ ...prev, definition: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-vocab-primary transition-all font-sans text-sm min-h-[80px]"
                      placeholder="Describing someone who is wise and has good judgment..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bengali Map</label>
                      <input 
                        required
                        type="text"
                        value={addWordForm.bengaliTranslation}
                        onChange={(e) => setAddWordForm(prev => ({ ...prev, bengaliTranslation: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-vocab-primary font-bold focus:outline-none focus:border-vocab-primary transition-all text-lg"
                        placeholder="বিচক্ষণ / পণ্ডিত"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Semantic Neighbors (Comma Separated)</label>
                      <input 
                        type="text"
                        value={addWordForm.synonyms}
                        onChange={(e) => setAddWordForm(prev => ({ ...prev, synonyms: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-slate-300 focus:outline-none focus:border-vocab-primary transition-all text-xs uppercase"
                        placeholder="WISE, JUDICIOUS, ASTUTE"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mnemonic Anchor</label>
                    <input 
                      type="text"
                      value={addWordForm.mnemonic}
                      onChange={(e) => setAddWordForm(prev => ({ ...prev, mnemonic: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-amber-200/70 focus:outline-none focus:border-amber-500/50 transition-all italic text-sm"
                      placeholder="Sage (wise person) is sagacious..."
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usage Patterns (One per line)</label>
                      <span className="text-[8px] text-slate-600 font-mono tracking-tighter">Enter each example sentence on a new line</span>
                    </div>
                    <textarea 
                      value={addWordForm.examples}
                      onChange={(e) => setAddWordForm(prev => ({ ...prev, examples: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-slate-400 focus:outline-none focus:border-vocab-primary transition-all font-sans text-xs min-h-[100px] italic"
                      placeholder="The sagacious leader made a brilliant strategic move..."
                    />
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit"
                      disabled={saving || !addWordForm.word || !addWordForm.definition || !addWordForm.bengaliTranslation}
                      className="flex-1 py-4 bg-vocab-primary text-vocab-surface font-black text-xs uppercase tracking-[0.3em] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          SYNCING_MEMORY...
                        </>
                      ) : (
                        'PERMANENT_RECORD_INIT'
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddWordModal(false)}
                      className="px-6 py-4 border border-white/10 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      ABORT
                    </button>
                  </div>
                </form>

                <div className="pt-4 flex items-center gap-3 text-slate-700">
                  <div className="w-2 h-2 bg-vocab-primary rounded-full animate-pulse" />
                  <p className="text-[8px] uppercase tracking-[0.2em] font-medium">Validating linguistic parameters for database integrity</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word Analysis Modal */}
      <AnimatePresence>
        {(analyzing || analysisResult) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setAnalysisResult(null); setAnalyzing(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60 cursor-pointer overflow-y-auto scrollbar-hide"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-vocab-surface border border-white/10 p-1 md:p-1 relative cursor-default my-8 flex flex-col"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-vocab-primary/5 blur-3xl pointer-events-none" />
              
              <div className="border border-white/5 bg-black/40 p-6 md:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-8 sticky top-0 bg-black/80 backdrop-blur-md p-4 -m-4 z-10 border-b border-white/5">
                  <div>
                    <h2 className="terminal-label text-vocab-primary flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> NEURAL_LINGUISTIC_PROFILE
                    </h2>
                    <h3 className="text-4xl font-bold text-white uppercase tracking-tighter mt-1">{activeWord}</h3>
                    {analysisResult && (
                      <p className="text-slate-500 text-xs mt-2 font-mono tracking-widest">{analysisResult.pronunciation}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => { setAnalysisResult(null); setAnalyzing(false); }}
                    className="p-2 hover:bg-white/5 transition-colors group"
                    title="Close Analysis"
                  >
                    <X className="w-5 h-5 text-slate-500 group-hover:text-white" />
                  </button>
                </div>

                {analyzing ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-vocab-primary animate-spin" />
                    <p className="terminal-label text-vocab-primary animate-pulse uppercase tracking-[0.2em]">Extracting semantic weights...</p>
                  </div>
                ) : analysisResult && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <section>
                          <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                            <BookOpen className="w-3 h-3 text-vocab-primary" /> CORE_DEFINITION
                          </h4>
                          <p className="text-white text-sm leading-relaxed bg-white/5 p-4 border-l border-vocab-primary/50 font-sans italic">
                            {analysisResult.definition}
                          </p>
                        </section>
                        
                        <section>
                          <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                            <Volume2 className="w-3 h-3 text-vocab-primary" /> PHONETIC_DATA
                          </h4>
                          <div className="flex items-center gap-3">
                            <p className="text-vocab-primary font-mono text-lg tracking-wider bg-vocab-primary/5 px-3 py-1 border border-vocab-primary/10">
                              {analysisResult.ipa || analysisResult.pronunciation}
                            </p>
                            <button 
                              onClick={() => handleSpeak(activeWord || '')}
                              className="p-2 hover:bg-white/5 text-slate-500 hover:text-vocab-primary transition-colors"
                              title="Audio Feedback"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <section>
                          <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                            <Lightbulb className="w-3 h-3 text-amber-500" /> MNEMONIC_ANCHOR
                          </h4>
                          <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-amber-200/80 text-xs italic font-serif leading-relaxed">
                            "{analysisResult.mnemonic}"
                          </div>
                        </section>

                        <section>
                          <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                            <Languages className="w-3 h-3 text-vocab-primary" /> LOCAL_MAPPING [BN]
                          </h4>
                          <p className="text-vocab-primary text-xl font-bold tracking-tight">
                            {analysisResult.bengaliTranslation}
                          </p>
                        </section>
                      </div>
                    </div>

                    <section className="pt-6 border-t border-white/5">
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
                        <ArrowRight className="w-3 h-3 text-vocab-primary" /> USAGE_PATTERNS
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisResult.examples?.map((ex, i) => (
                          <li key={i} className="text-slate-400 text-[11px] font-sans leading-snug p-3 bg-white/[0.02] border border-white/5 italic">
                            "{ex}"
                          </li>
                        ))}
                        {(!analysisResult.examples || analysisResult.examples.length === 0) && (
                          <p className="text-[10px] text-slate-600 italic">No usage patterns recorded in database.</p>
                        )}
                      </ul>
                    </section>

                    <section>
                      <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                        <TrendingUp className="w-3 h-3 text-vocab-primary" /> SEMANTIC_NEIGHBORS
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.synonyms?.map(syn => (
                          <span key={syn} className="px-3 py-1 bg-white/5 text-[9px] text-slate-300 uppercase tracking-widest hover:bg-vocab-primary/10 hover:text-vocab-primary transition-colors cursor-default border border-white/5">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </section>

                    <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-white/5">
                      <button 
                        onClick={handleAddToMastered}
                        disabled={saving}
                        className="flex-1 py-4 bg-vocab-primary text-vocab-surface font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-[0_0_30px_rgba(193,193,255,0.2)] disabled:opacity-50"
                      >
                        {saving ? 'SYNCING_PROTOCOL...' : 'ADD_TO_MASTERED_CORE'}
                      </button>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => analysisResult && toggleCompare(activeWord || '', analysisResult)}
                          className={cn(
                            "px-6 py-4 border transition-all active:scale-95 flex items-center gap-2",
                            activeWord && isInCompare(activeWord)
                              ? "bg-amber-500/10 border-amber-500 text-amber-500"
                              : "border-white/10 text-slate-500 hover:text-white hover:bg-white/5"
                          )}
                          title="Toggle Comparison Mode"
                        >
                          <GitCompare className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {activeWord && isInCompare(activeWord) ? 'SHARED' : 'COMPARE'}
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => toggleBookmark(activeWord || '')}
                          className={cn(
                            "px-6 py-4 border transition-all active:scale-95",
                            activeWord && isSaved(activeWord) 
                              ? "bg-vocab-primary/20 border-vocab-primary text-vocab-primary shadow-[0_0_20px_rgba(138,180,248,0.3)]" 
                              : "border-white/10 text-slate-500 hover:text-white hover:bg-white/5"
                          )}
                          title={activeWord && isSaved(activeWord) ? "Remove from Vault" : "Save to Vault"}
                        >
                          <motion.div
                            key={activeWord && isSaved(activeWord) ? 'saved' : 'unsaved'}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Bookmark className="w-4 h-4" fill={activeWord && isSaved(activeWord) ? "currentColor" : "none"} />
                          </motion.div>
                        </button>

                        <button 
                          onClick={() => { setAnalysisResult(null); setAnalyzing(false); }}
                          className="px-6 py-4 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-[10px] uppercase tracking-widest"
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Input Modal */}
      <AnimatePresence>
        {showManualModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-vocab-surface border border-vocab-primary/20 p-1 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vocab-primary to-transparent animate-pulse" />
              
              <div className="bg-black/60 p-8 md:p-12">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="terminal-label text-vocab-primary">MANUAL_ENTRY_PROTOCOL</h2>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest mt-1">Linguistic Input Console</h3>
                  </div>
                  <button 
                    onClick={() => setShowManualModal(false)}
                    className="p-2 hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleManualAnalyze} className="space-y-6">
                  <div className="relative">
                    <p className="text-[10px] text-slate-500 mb-3 font-mono uppercase tracking-[0.2em]">&gt; Awaiting Word Parameter...</p>
                    <input 
                      autoFocus
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="ENTER TARGET WORD..."
                      className="w-full bg-white/5 border border-white/10 p-5 text-white text-lg font-black tracking-[0.2em] uppercase focus:outline-none focus:border-vocab-primary focus:bg-vocab-primary/5 transition-all"
                    />
                    <div className="mt-4 flex items-center gap-4 text-slate-600">
                      <div className="w-2 h-2 bg-vocab-primary animate-pulse" />
                      <span className="text-[8px] uppercase tracking-widest font-bold">Neural Engine Operational</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="flex-1 py-5 bg-vocab-primary text-vocab-surface font-black text-xs uppercase tracking-[0.3em] hover:bg-vocab-primary/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                    >
                      Initiate Analysis
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowManualModal(false);
                        handleWebSearch(manualInput);
                      }}
                      disabled={!manualInput.trim()}
                      className="px-6 border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-20 flex items-center justify-center"
                      title="System Deep Search (Web)"
                    >
                      <Globe className="w-5 h-5" />
                    </button>
                  </div>
                </form>

                <p className="mt-8 text-[9px] text-slate-700 leading-relaxed font-mono uppercase italic text-center">
                  Notice: Manual queries interact directly with the Gemini Linguistic Core. 
                  High-frequency results will be cached for database synchronization.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCompareModal(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-7xl bg-vocab-surface border border-white/10 p-1 overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="bg-black/60 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="terminal-label text-vocab-primary flex items-center gap-2">
                      <ArrowLeftRight className="w-3 h-3" /> MULTI_NODE_COMPARISON
                    </h2>
                    <h3 className="text-2xl font-bold text-white uppercase tracking-widest mt-1">Side-by-Side Analysis</h3>
                  </div>
                  <button 
                    onClick={() => setShowCompareModal(false)}
                    className="p-2 hover:bg-white/5 transition-colors group"
                  >
                    <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {compareWords.map(({ word, analysis }) => (
                    <div key={word} className="bg-white/5 border border-white/5 p-6 space-y-6 relative group flex flex-col">
                      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 group-hover:border-vocab-primary/30 transition-colors" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{word}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-vocab-primary font-mono text-xs">{analysis.ipa || analysis.pronunciation}</p>
                            <button onClick={() => handleSpeak(word)} className="text-slate-600 hover:text-vocab-primary transition-colors">
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleCompare(word, analysis)}
                          className="p-1 hover:bg-white/10 transition-colors text-slate-700 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <section className="flex-1">
                        <section className="mb-6">
                          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2">
                            <BookOpen className="w-3 h-3" /> Definition
                          </h5>
                          <p className="text-slate-300 text-xs italic leading-relaxed bg-white/5 p-3 border-l border-vocab-primary/40">
                            {analysis.definition}
                          </p>
                        </section>

                        <section className="mb-6">
                          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3 text-amber-500" /> Mnemonic
                          </h5>
                          <p className="text-amber-200/60 text-[11px] italic font-serif leading-relaxed px-3">
                            "{analysis.mnemonic}"
                          </p>
                        </section>

                        <section className="mb-6">
                          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2">
                            <Languages className="w-3 h-3" /> Bengali
                          </h5>
                          <p className="text-vocab-primary font-bold text-lg">{analysis.bengaliTranslation}</p>
                        </section>

                        <section>
                          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> Usage
                          </h5>
                          <ul className="space-y-1.5">
                            {analysis.examples.slice(0, 2).map((ex, i) => (
                              <li key={i} className="text-[10px] text-slate-500 font-sans leading-snug list-disc ml-4 italic">
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </section>
                    </div>
                  ))}

                  {compareWords.length < 3 && (
                    <div className="border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center gap-4 bg-white/[0.02]">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Selection</p>
                        <p className="text-[10px] text-slate-700 mt-1">Add another word nodes to compare semantic variance.</p>
                      </div>
                    </div>
                  )}
                </div>

                {compareWords.length >= 2 && (
                  <div className="bg-vocab-primary/5 border border-vocab-primary/20 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-vocab-primary/5 blur-3xl" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-vocab-primary/10 border border-vocab-primary/30">
                          <Sparkles className="w-5 h-5 text-vocab-primary" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-vocab-primary uppercase tracking-[0.4em]">AI_NUANCE_SYNTHESIS</h4>
                          <p className="text-white text-lg font-bold tracking-tight">Semantic Contrast Analysis</p>
                        </div>
                      </div>

                      {loadingNuance ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 text-vocab-primary animate-spin" />
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Calculating semantic distance...</p>
                        </div>
                      ) : nuanceAnalysis ? (
                        <div className="prose prose-invert prose-xs max-w-none prose-slate">
                          <div className="text-slate-400 text-xs leading-relaxed font-sans">
                            <Markdown>{nuanceAnalysis}</Markdown>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={fetchNuanceAnalysis}
                          className="px-6 py-2 bg-vocab-primary/10 border border-vocab-primary/30 text-vocab-primary text-[10px] font-bold uppercase tracking-widest hover:bg-vocab-primary/20 transition-all"
                        >
                          Generate Contrast
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Tracker FAB */}
      <AnimatePresence>
        {compareWords.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-vocab-surface border border-vocab-primary/30 p-1 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
               <div className="bg-black/60 px-6 py-3 flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <GitCompare className="w-4 h-4 text-vocab-primary animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Comparison Stack: {compareWords.length}/3</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {compareWords.map(w => (
                      <div key={w.word} className="px-2 py-1 bg-vocab-primary/10 border border-vocab-primary/20 text-[9px] text-vocab-primary font-bold uppercase overflow-hidden max-w-[80px] truncate">
                        {w.word}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => setShowCompareModal(true)}
                      disabled={compareWords.length < 2}
                      className="px-6 py-2 bg-vocab-primary text-vocab-surface text-[10px] font-black uppercase tracking-widest hover:bg-vocab-primary/80 transition-all disabled:opacity-30"
                    >
                      Compare Now
                    </button>
                    <button 
                      onClick={() => setCompareWords([])}
                      className="p-2 hover:bg-white/5 text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Web Search Modal */}
      <AnimatePresence>
        {showWebSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-12 backdrop-blur-3xl bg-black/85"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-vocab-surface border border-white/10 p-1 overflow-hidden relative max-h-[90vh] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="bg-black/60 p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-vocab-primary/10 flex items-center justify-center border border-vocab-primary/30">
                      <Globe className="w-6 h-6 text-vocab-primary" />
                    </div>
                    <div>
                      <h2 className="terminal-label text-vocab-primary">WORLD_WEB_SEARCH_PROTOCOL</h2>
                      <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mt-1">
                        {webSearchQuery || 'Deep Linguistic Exploration'}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <input 
                        type="text"
                        placeholder="SEARCH CONCEPT..."
                        className="w-full bg-white/5 border border-white/10 px-4 py-2 text-xs text-white focus:outline-none focus:border-vocab-primary transition-all font-mono uppercase tracking-widest"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleWebSearch((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                    </div>
                    <button 
                      onClick={() => setShowWebSearchModal(false)}
                      className="p-3 hover:bg-white/5 transition-colors group"
                    >
                      <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
                    </button>
                  </div>
                </div>

                {!webSearchLoading && !webSearchResponse && !webSearchQuery && (
                  <div className="py-24 flex flex-col items-center justify-center gap-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-full bg-vocab-primary/5 flex items-center justify-center border border-vocab-primary/10">
                      <Globe className="w-10 h-10 text-vocab-primary opacity-40" />
                    </div>
                    <div className="max-w-md space-y-4">
                      <h4 className="text-white text-xl font-bold uppercase tracking-widest">Global Memory Interface</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Access the decentralized linguistic web to retrieve context, etymology, and usage patterns for any word or semantic concept.
                      </p>
                      <div className="pt-4">
                        <p className="text-[10px] text-vocab-primary font-mono uppercase tracking-widest animate-pulse">
                          &gt; Awaiting Search Query for Uplink...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {webSearchLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-vocab-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-vocab-primary/40" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="terminal-label text-vocab-primary animate-pulse uppercase tracking-[0.3em]">Establishing Satellite Uplink...</p>
                      <p className="text-[10px] text-slate-600 font-mono italic">Querying Global Semantic Databases [v3.0]</p>
                    </div>
                  </div>
                ) : webSearchResponse && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="prose prose-invert prose-slate max-w-none">
                      <div className="bg-white/[0.03] border border-white/5 p-8 font-sans leading-relaxed text-slate-300 text-base shadow-inner">
                        <Markdown>{webSearchResponse.text}</Markdown>
                      </div>
                    </div>

                    {webSearchResponse.sources.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                          <span className="w-8 h-px bg-slate-800" />
                          VERIFIED_SOURCES
                          <span className="w-full h-px bg-slate-800" />
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {webSearchResponse.sources.map((source, i) => (
                            <a 
                              key={i} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-vocab-primary/40 hover:bg-vocab-primary/[0.02] transition-all"
                            >
                              <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="text-[10px] font-bold text-white uppercase truncate tracking-wider">
                                  {source.title || "Linguistic Resource"}
                                </span>
                                <span className="text-[8px] text-slate-600 font-mono truncate transition-colors group-hover:text-vocab-primary/60">
                                  {source.uri}
                                </span>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-700 shrink-0 group-hover:text-vocab-primary transition-colors" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    <div className="py-10 border-t border-white/5 text-center">
                      <p className="text-[10px] text-slate-700 font-mono uppercase italic tracking-widest">
                        Information retrieved via Gemini Live Grounding Engine. Accuracy subject to source data.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-black/80 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowWebSearchModal(false)}
                  className="px-10 py-3 border border-vocab-primary/30 text-vocab-primary font-black text-[10px] uppercase tracking-[0.3em] hover:bg-vocab-primary/10 transition-all"
                >
                  Terminate Connection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-vocab-surface border border-vocab-primary/30 shadow-[0_0_40px_rgba(138,180,248,0.2)] flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 bg-vocab-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vocab-primary w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH VOCABULARY DATABASE [5,000+ NODES]..."
              className="w-full bg-black/40 border border-white/5 rounded-none py-4 pl-12 pr-4 text-white text-xs placeholder:text-slate-700 focus:outline-none focus:border-vocab-primary focus:shadow-[0_0_25px_rgba(138,180,248,0.1)] transition-all font-mono tracking-widest"
            />
            {analyzing && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vocab-primary animate-spin" />}
          </form>
          
          <button 
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 bg-vocab-primary/10 border border-vocab-primary/30 px-6 py-4 text-vocab-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vocab-primary/20 transition-all active:scale-95 group shrink-0"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Neural Console
          </button>

          <button 
            onClick={() => {
              setWebSearchQuery('');
              setWebSearchResponse(null);
              setShowWebSearchModal(true);
            }}
            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-6 py-4 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-500/20 transition-all active:scale-95 group shrink-0"
          >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Web Search
          </button>

          <button 
            onClick={() => setShowAddWordModal(true)}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-6 py-4 text-green-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-500/20 transition-all active:scale-95 group shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Add Manual
          </button>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <select className="bg-white/5 border border-white/5 rounded-none px-4 py-3 text-[10px] font-bold text-slate-400 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors uppercase tracking-widest">
              <option>Complexity</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select 
              value={examFocus}
              onChange={(e) => setExamFocus(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-none px-4 py-3 text-[10px] font-bold text-slate-400 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors uppercase tracking-widest"
            >
              <option value="ALL">Exam Domain</option>
              <option value="IELTS">IELTS-SYS</option>
              <option value="GRE">GRE-SYS</option>
              <option value="BCS">BCS-GOV</option>
            </select>
            <div className="flex items-center gap-2 text-vocab-primary font-bold bg-vocab-primary/5 px-4 py-3 rounded-none border border-vocab-primary/20 ml-auto md:ml-0">
              <Flame className="w-4 h-4" fill="currentColor" />
              <span className="text-xs">{userStats.streak}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Stats Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 bg-vocab-surface-dim border border-white/5 p-8 relative overflow-hidden group rounded-none"
          >
            <div className="relative z-10">
              <h2 className="terminal-label text-vocab-primary mb-2">Continuum Status</h2>
              <h1 className="text-3xl font-bold text-white mb-3 uppercase tracking-tighter">Linguistic Mastery Pipeline</h1>
              <p className="text-slate-500 max-w-md mb-8 font-sans text-sm leading-relaxed">System recorded {userStats.masteredCount} successful acquisitions this cycle. Optimal trajectory for GRE-Target-X.</p>
              <div className="flex gap-4">
                <button className="px-8 py-3 bg-vocab-primary text-vocab-surface rounded-none font-bold text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(193,193,255,0.3)] hover:bg-vocab-primary/80 transition-all">Resume Stream</button>
                <button className="px-8 py-3 border border-white/10 text-slate-400 rounded-none font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Telemetry</button>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-vocab-primary/5 blur-[100px] rounded-full" />
            <TrendingUp className="absolute top-8 right-8 w-12 h-12 text-vocab-primary/10" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-vocab-surface-dim border border-white/5 p-8 flex flex-col justify-center items-center text-center group rounded-none"
          >
            <div className="w-16 h-16 border border-vocab-primary/20 rounded-none flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8 text-vocab-primary opacity-60" />
            </div>
            <h3 className="terminal-label text-white mb-2">Neural Points</h3>
            <p className="text-5xl font-bold text-vocab-primary italic tracking-tighter mb-2">{userStats.points.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em]">Tier-{Math.floor(userStats.points / 500) + 1} Elite Operator</p>
          </motion.div>
        </div>

        {/* Neural Suggestions [NEW FEATURE] */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-vocab-primary/20 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-1.5 bg-vocab-primary/5 border border-vocab-primary/20 rounded-full">
              <Sparkles className="w-3 h-3 text-vocab-primary" />
              <span className="text-[9px] font-black uppercase text-vocab-primary tracking-[0.2em]">Neural Transmission Analysis</span>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-vocab-primary/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { word: 'Loquacious', tag: 'Logic-X', reason: 'Semantic Match: Communication', ipa: '/ləˈkweɪʃəs/' },
              { word: 'Pragmatic', tag: 'Core-5', reason: 'High-Yield Pattern detected', ipa: '/præɡˈmætɪk/' },
              { word: 'Voracious', tag: 'Vital-2', reason: 'Expansion Opportunity', ipa: '/vəˈreɪʃəs/' },
              { word: 'Alacrity', tag: 'Pro-V', reason: 'Expert Complexity Tier', ipa: '/əˈlækrəti/' }
            ].map((s, i) => (
              <motion.div 
                key={s.word}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => analyzeWord(s.word)}
                className="group relative bg-[#0b1326]/40 border border-white/5 p-4 cursor-pointer hover:border-vocab-primary/30 hover:bg-vocab-primary/5 transition-all overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-bold text-vocab-primary/60 uppercase tracking-widest">{s.tag}</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-vocab-primary/40 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-vocab-primary transition-colors">{s.word}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-white/20 font-mono text-[7px]">{s.ipa}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleBookmark(s.word, { tag: s.tag, ipa: s.ipa });
                      }}
                      className={cn(
                        "transition-all active:scale-150 duration-300 p-1 rounded-full",
                        isSaved(s.word) 
                          ? "text-vocab-primary bg-vocab-primary/10 ring-1 ring-vocab-primary/30 shadow-[0_0_10px_rgba(138,180,248,0.3)]" 
                          : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
                      )}
                      title={isSaved(s.word) ? "Remove from Vault" : "Save to Vault"}
                    >
                      <motion.div
                        key={isSaved(s.word) ? 'saved' : 'unsaved'}
                        initial={{ scale: 0.8, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Bookmark 
                          className="w-3 h-3" 
                          fill={isSaved(s.word) ? "currentColor" : "none"} 
                        />
                      </motion.div>
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-sans italic opacity-0 group-hover:opacity-100 transition-opacity">
                  {s.reason}
                </p>
                
                {/* Subtle Glow Effect */}
                <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-vocab-primary/5 blur-xl group-hover:bg-vocab-primary/20 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Word Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/5 pb-4 gap-4">
          <div>
            <h3 className="terminal-label">Database Explorer</h3>
            <p className="text-white text-lg font-bold uppercase tracking-widest">Active Data Stream</p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1 border border-white/5">
            {['ALL', 'BCS', 'IELTS', 'GRE'].map((exam) => (
              <button
                key={exam}
                onClick={() => setExamFocus(exam)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all",
                  examFocus === exam 
                    ? "bg-vocab-primary text-vocab-surface" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                {exam}
              </button>
            ))}
          </div>

          <button className="hidden md:flex items-center gap-2 text-vocab-primary font-bold text-[10px] hover:text-vocab-secondary transition-all uppercase tracking-widest group">
            Expansion Port <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {wordCards
              .filter(w => examFocus === 'ALL' || w.tag.startsWith(examFocus))
              .map((w, i) => (
              <motion.div 
                key={w.word}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => analyzeWord(w.word)}
                className="bg-black/60 border border-white/10 p-6 group cursor-pointer hover:border-vocab-primary/30 transition-all duration-300 flex flex-col rounded-none relative"
              >
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/5 group-hover:border-vocab-primary/30 transition-colors" />
                
                <div className="flex justify-between items-start mb-6">
                  <span className={cn(
                    "px-2 py-0.5 rounded-none text-[8px] font-bold uppercase tracking-widest border",
                    w.color === 'primary' && "bg-vocab-primary/10 text-vocab-primary border-vocab-primary/20",
                    w.color === 'secondary' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    w.color === 'tertiary' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                  )}>
                    {w.tag}
                  </span>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleBookmark(w.word, w);
                    }}
                    className={cn(
                      "transition-all active:scale-150 duration-300 p-2 rounded-full",
                      isSaved(w.word) 
                        ? "text-vocab-primary bg-vocab-primary/20 ring-2 ring-vocab-primary/40 shadow-[0_0_20px_rgba(138,180,248,0.4)]" 
                        : "text-slate-600 hover:text-white hover:bg-white/10"
                    )}
                    title={isSaved(w.word) ? "Remove from Vault" : "Save to Vault"}
                  >
                    <motion.div
                      key={isSaved(w.word) ? 'saved' : 'unsaved'}
                      initial={{ scale: 0.7, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Bookmark 
                        className="w-4 h-4" 
                        fill={isSaved(w.word) ? "currentColor" : "none"} 
                      />
                    </motion.div>
                  </button>
                </div>

                <h4 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">{w.word}</h4>
                <div className="flex items-center gap-2 mb-6">
                  <div className="terminal-data text-[10px] opacity-60 italic">{w.type}</div>
                  <div className="h-1 w-1 bg-white/20 rounded-full" />
                  <div className="text-vocab-primary font-mono text-[10px]">{w.ipa}</div>
                </div>
                
                <div className="space-y-4 flex-grow mb-8 font-sans">
                  <div className="p-4 bg-white/5 border-l-2 border-white/10 group-hover:bg-white/10 transition-all">
                    <p className="terminal-label text-[8px] mb-1 opacity-60">Entry-EN</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{w.en}</p>
                  </div>
                  <div className="p-4 bg-vocab-primary-container/10 border-l-2 border-vocab-primary/30">
                    <p className="terminal-label text-[8px] text-vocab-primary/60 mb-1">Entry-BN</p>
                    <p className="text-slate-100 font-bold text-sm tracking-tight">{w.bn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCompare(w.word); }}
                    className={cn(
                      "p-2 rounded-none transition-all",
                      isInCompare(w.word)
                        ? "text-amber-500 bg-amber-500/10"
                        : "text-slate-600 hover:text-amber-500 hover:bg-white/5"
                    )}
                    title={isInCompare(w.word) ? "Remove from Comparison" : "Add to Comparison"}
                  >
                    {comparing.has(w.word.toLowerCase()) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <GitCompare className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSpeak(w.word); }}
                    className="p-2 hover:bg-white/5 rounded-none transition-colors text-slate-600 hover:text-vocab-primary"
                    title="Hear Pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-none transition-colors text-slate-600 hover:text-amber-500">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1" />
                  <span className="text-[8px] text-slate-700 uppercase font-bold tracking-tighter group-hover:text-vocab-primary/60 transition-colors">
                    {analyzing && activeWord === w.word ? 'Analyzing...' : 'View Details'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
