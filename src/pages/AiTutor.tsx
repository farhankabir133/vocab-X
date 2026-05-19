import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Bot, 
  Send, 
  Paperclip, 
  Mic, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  User,
  Menu,
  X,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  FirestoreError
} from 'firebase/firestore';
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
  throw error;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: any;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: any;
  lastMessage?: string;
}

export default function AiTutor() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, show: boolean}>({ message: '', show: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Fetch Sessions
  useEffect(() => {
    if (!user) return;

    const sessionsPath = `users/${user.uid}/chatSessions`;
    const q = query(
      collection(db, sessionsPath),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData: ChatSession[] = [];
      snapshot.forEach((doc) => {
        sessionData.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      setSessions(sessionData);
      
      // Auto-select first session if none active
      if (sessionData.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, sessionsPath);
    });

    return () => unsubscribe();
  }, [user, activeSessionId]);

  // Fetch Messages for active session
  useEffect(() => {
    if (!user || !activeSessionId) {
      setMessages([{
        role: 'assistant',
        text: 'System Initialized. Awaiting your command. I am the Neural Tutor, ready to optimize your linguistic capacity.',
        timestamp: new Date()
      }]);
      return;
    }

    const messagesPath = `users/${user.uid}/chatSessions/${activeSessionId}/messages`;
    const q = query(
      collection(db, messagesPath),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageData.push({ 
          id: doc.id, 
          role: data.role, 
          text: data.text, 
          timestamp: data.createdAt?.toDate() || new Date() 
        });
      });
      if (messageData.length > 0) {
        setMessages(messageData);
      } else {
        setMessages([{
          role: 'assistant',
          text: 'Neural Channel established. How shall we begin our analysis today?',
          timestamp: new Date()
        }]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [user, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewChat = async () => {
    if (!user) return;
    
    const sessionsPath = `users/${user.uid}/chatSessions`;
    try {
      const docRef = await addDoc(collection(db, sessionsPath), {
        title: 'New Neural Channel',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setActiveSessionId(docRef.id);
      setMessages([]);
      setInput('');
      setIsSidebarOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, sessionsPath);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    let sessionId = activeSessionId;
    
    // Create new session if none exists
    const sessionsPath = `users/${user.uid}/chatSessions`;
    if (!sessionId) {
      try {
        const docRef = await addDoc(collection(db, sessionsPath), {
          title: input.slice(0, 30) + '...',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        sessionId = docRef.id;
        setActiveSessionId(sessionId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, sessionsPath);
        return;
      }
    }

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    try {
      // 1. Save User Message to Firestore
      const messagesPath = `users/${user.uid}/chatSessions/${sessionId}/messages`;
      await addDoc(collection(db, messagesPath), {
        role: 'user',
        text: userMessage,
        createdAt: serverTimestamp()
      });

      // 2. Update Session last message
      const sessionRef = doc(db, 'users', user.uid, 'chatSessions', sessionId!);
      await updateDoc(sessionRef, {
        lastMessage: userMessage,
        updatedAt: serverTimestamp(),
        // Simple heuristic: update title if it's still default
        ...(sessions.find(s => s.id === sessionId)?.title === 'New Neural Channel' && { 
          title: userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '') 
        })
      });

      // 3. Get AI Response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.text }]
          }))
        })
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Neural processors are overloaded. Mission standby.');
        }
        throw new Error('Comms Channel Interrupted. Signal Lost.');
      }

      const data = await response.json();
      
      if (data.text) {
        // 4. Save Assistant Response to Firestore
        await addDoc(collection(db, messagesPath), {
          role: 'assistant',
          text: data.text,
          createdAt: serverTimestamp()
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      if (error instanceof FirestoreError) {
        // Already handled by addDoc/updateDoc try-catch if we had one there, 
        // but here we catch all for the block
        console.error('Firestore Error in Send Flow:', error);
      }
      setToast({ message: error.message || 'Signal Error Encoutered', show: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex h-screen overflow-hidden z-10 relative">
      {/* Inbox Sidebar */}
      <section className={cn(
        "absolute lg:static flex flex-col w-80 h-full p-6 bg-[#030712] border-r border-white/5 z-50 transition-all duration-300 ease-in-out",
        isSidebarOpen 
          ? "translate-x-0 opacity-100 visible" 
          : "-translate-x-full lg:-ml-80 opacity-0 lg:opacity-0 invisible"
      )}>
        <div className="flex lg:hidden justify-end mb-4">
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <button 
          onClick={handleNewChat}
          className="flex items-center justify-between w-full p-4 mb-8 bg-vocab-primary/10 rounded-sm border border-vocab-primary/20 text-vocab-primary hover:bg-vocab-primary/20 transition-all group active:scale-95 shadow-[inset_0_0_15px_rgba(193,193,255,0.1)]"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">New Comms Channel</span>
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        </button>
        
        <h3 className="terminal-label mb-6">Comms Log Archival</h3>
        
        <div className="flex-grow overflow-y-auto chat-scroll flex flex-col gap-2">
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "p-4 rounded-sm cursor-pointer transition-all duration-300 border",
                activeSessionId === session.id 
                  ? "bg-white/5 border-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
                  : "border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              <p className="font-sans font-bold text-xs truncate mb-1 uppercase tracking-tight">{session.title}</p>
              <p className="terminal-label opacity-60 text-[8px]">
                {session.updatedAt?.toDate() ? new Date(session.updatedAt.toDate()).toLocaleDateString() : 'Active'}
              </p>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
              <Bot className="w-8 h-8 text-slate-800" />
              <p className="text-[10px] font-mono text-slate-700 italic uppercase tracking-widest leading-relaxed">
                No encrypted logs found in sector.
              </p>
              <button 
                onClick={handleNewChat}
                className="text-[10px] font-bold text-vocab-primary uppercase tracking-[0.2em] hover:underline"
              >
                Initialize Primary Link
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 rounded-sm bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/40" />
          <p className="text-[9px] font-mono font-bold text-amber-500 mb-2 uppercase tracking-[0.3em]">Clearance Required</p>
          <p className="font-sans font-bold text-white text-xs mb-4 leading-relaxed tracking-tight group">Upgrade to Pro to unlock higher bandwidth neural processing.</p>
          <button className="w-full bg-amber-500 text-black font-bold text-[10px] py-3 rounded-sm hover:bg-amber-400 transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)]">Level Up Clearance</button>
        </div>
      </section>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        {/* Header */}
        <header className="sticky top-0 w-full flex justify-between items-center px-6 md:px-10 py-5 bg-black/20 backdrop-blur-md border-b border-white/5 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-white/5 rounded-sm transition-colors text-vocab-primary group relative"
              title="Toggle History"
            >
              <History className={cn("w-6 h-6 transition-transform", isSidebarOpen ? "rotate-0" : "rotate-12")} />
              {!isSidebarOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-vocab-primary rounded-full animate-pulse" />
              )}
            </button>
            <button 
              onClick={handleNewChat}
              className="p-2 hover:bg-white/5 rounded-sm transition-colors text-vocab-primary group"
              title="New Chat"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
            <div>
              <h2 className="font-mono text-lg font-bold text-white uppercase tracking-[0.2em] leading-none">Neural Tutor</h2>
              <p className="terminal-label mt-1">Linguistic Logic Interface [V.2.4]</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="terminal-label opacity-60">System Uptime</span>
              <div className="flex items-center gap-2 terminal-data">
                <span className="text-sm">12 Days</span> 
                <div className="w-1.5 h-1.5 rounded-full bg-vocab-primary animate-pulse" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-sm border border-white/10 p-0.5 bg-white/5 shadow-xl relative">
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black z-10" />
              <img 
                alt="Operator Profile" 
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
              />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-6 md:px-10 py-10 flex flex-col gap-10 max-w-4xl mx-auto w-full font-mono">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex gap-6 items-start w-full group",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center shrink-0 mt-1 border",
                m.role === 'user' ? "bg-slate-800 border-slate-700" : "bg-vocab-primary shadow-[0_0_15px_rgba(193,193,255,0.5)] border-transparent"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-black" />}
              </div>
              <div className={cn(
                "flex flex-col max-w-[85%]",
                m.role === 'user' ? "items-end text-right" : "items-start text-left"
              )}>
                <div className="terminal-label mb-2 px-1 opacity-40">
                  {m.role === 'user' ? '[Operator Input]' : '[Interface Signal]'}
                </div>
                <div className={cn(
                  "p-6 rounded-sm text-sm leading-relaxed tracking-tight border shadow-2xl relative",
                  m.role === 'user' 
                    ? "bg-white/5 border-white/5 text-slate-300" 
                    : "bg-cyan-950/20 backdrop-blur-md border-cyan-500/20 text-cyan-50 shadow-[inset_0_0_30px_rgba(6,182,212,0.05)]"
                )}>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/10" />
                  
                  <div className="markdown-body prose prose-invert max-w-none text-sm font-sans">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  
                  {!activeSessionId && m.role === 'assistant' && (
                    <button 
                      onClick={handleNewChat}
                      className="mt-6 flex items-center gap-2 px-4 py-2 bg-vocab-primary text-black font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Initialize Neural Connection
                    </button>
                  )}
                  
                  {m.role === 'assistant' && activeSessionId && (
                    <div className="flex gap-3 mt-6 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button className="text-slate-500 hover:text-vocab-primary transition-all">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="text-slate-500 hover:text-red-400 transition-all">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      <button className="text-slate-500 hover:text-vocab-primary transition-all">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 items-start w-full">
              <div className="w-8 h-8 rounded-sm bg-vocab-primary flex items-center justify-center shrink-0 mt-1 animate-pulse">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div className="flex flex-col">
                <div className="terminal-label mb-2 px-1 text-vocab-primary animate-pulse">[Decrypting...]</div>
                <div className="bg-vocab-primary-container/20 border border-vocab-primary/20 p-6 rounded-sm flex gap-2">
                  <div className="w-1.5 h-1.5 bg-vocab-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-vocab-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-vocab-primary rounded-full animate-bounce" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="px-6 md:px-10 py-8 bg-black/40 backdrop-blur-md border-t border-white/5">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative bg-white/5 border border-white/10 rounded-sm p-4 flex items-end gap-4 focus-within:border-vocab-primary/40 transition-all">
              <button className="p-2 text-slate-600 hover:text-vocab-primary transition-all active:scale-95">
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-grow bg-transparent border-none focus:ring-0 text-slate-200 p-2 resize-none max-h-48 font-mono text-sm placeholder:text-slate-700" 
                placeholder="INPUT DATA PACKET COMMAND..." 
                rows={1}
              />

              <div className="flex items-center gap-3 pb-1 pr-1">
                <button className="p-2 text-slate-600 hover:text-vocab-primary transition-all active:scale-95">
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-12 h-12 rounded-sm flex items-center justify-center transition-all active:scale-95",
                    input.trim() ? "bg-vocab-primary text-vocab-surface shadow-[0_0_20px_rgba(193,193,255,0.4)]" : "bg-white/5 text-slate-800 cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-center mt-4 text-[8px] font-mono uppercase tracking-[0.5em] text-slate-600">Caution: Interface may produce non-nominal linguistic vectors.</p>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-vocab-surface border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)] flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}
