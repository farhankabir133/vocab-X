import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-vocab-surface-container-lowest border border-white/10 p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-vocab-primary" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-2">
                {isLogin ? 'Initialize Session' : 'Create Identity'}
              </h2>
              <p className="text-vocab-on-surface-variant text-xs font-bold uppercase tracking-[0.2em]">
                {isLogin ? 'Access your neural archives' : 'Begin your linguistic ascent'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mb-8">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-vocab-primary transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="EMAIL ADDRESS"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white font-mono text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:border-vocab-primary transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-vocab-primary transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="PASSWORD"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-12 py-4 text-white font-mono text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:border-vocab-primary transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center px-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-vocab-primary text-black font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'PROCESSING...' : (isLogin ? 'Authorize login' : 'Construct Identity')}
              </button>
            </form>

            <div className="relative flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em]">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full py-4 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Chrome className="w-4 h-4" />
              Continue with Global Identity
            </button>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-bold text-vocab-on-surface-variant hover:text-vocab-primary uppercase tracking-[0.2em] transition-colors"
              >
                {isLogin ? "No identity detected? Construct one here." : "Already have an identity? Re-sync here."}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
