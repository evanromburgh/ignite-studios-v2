import React, { useState, useMemo } from 'react';
import { authService } from '../services/authService';
import { CONFIG } from '../config';

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= CONFIG.PASSWORD_MIN_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
};

export const AuthPortal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for signup
    if (!isLogin) {
      if (!firstName.trim()) {
        setError('Name is required.');
        return;
      }
      if (!lastName.trim()) {
        setError('Surname is required.');
        return;
      }
      if (!email.trim()) {
        setError('Email is required.');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < CONFIG.PASSWORD_MIN_LENGTH) {
        setError(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters.`);
        return;
      }
    }

    // Validation for login
    if (isLogin) {
      if (!email.trim()) {
        setError('Email is required.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        const fullName = `${firstName} ${lastName}`.trim();
        await authService.signUp(email, password, fullName, firstName, lastName, phone);
      }
    } catch (err: any) {
      console.error('AuthPortal error:', err);
      // Show more detailed error message
      let errorMessage = "An authentication error occurred.";
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center px-5 py-6 overflow-y-auto">
      <div className={`w-full relative z-10 my-auto transition-all duration-500 ${isLogin ? 'max-w-[28rem]' : 'max-w-[38rem]'}`}>
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center">
            <span className="text-2xl sm:text-4xl font-black tracking-tighter text-white leading-none">IGNITE</span>
            <div className="h-4 sm:h-6 w-[1px] bg-zinc-800 mx-3 sm:mx-4"></div>
            <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
          </div>
        </div>

        {/* Animated Border Beam Container */}
        <div className="border-beam-container rounded-2xl shadow-2xl overflow-hidden group">
          <div className="border-beam-inner bg-[#0b0b0b] liquid-glass border-none rounded-[calc(1rem-1px)] p-6 sm:p-10 relative z-10 w-full h-full transition-all duration-500">
            {/* Decorative element matching cost analysis block - Static */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Name</label>
                      <input 
                        required 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Surname</label>
                      <input 
                        required 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Phone</label>
                      <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-lg h-[46px] focus-within:border-zinc-500 transition-all overflow-hidden">
                        <span className="text-base sm:text-[0.875rem] text-zinc-400 pl-6 select-none flex-shrink-0">+27</span>
                        <input 
                          required
                          type="tel" 
                          value={phone}
                          onChange={(e) => {
                            let digits = e.target.value.replace(/\D/g, '');
                            // Remove leading 0 if present (since +27 is already prefixed)
                            if (digits.startsWith('0')) {
                              digits = digits.substring(1);
                            }
                            setPhone(digits);
                          }}
                          maxLength={10}
                          className="flex-1 bg-transparent h-[46px] py-0 leading-[46px] pr-6 pl-1 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem]" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Email</label>
                      <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                      />
                    </div>
                  </div>
                </>
              )}

              {isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Email</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">{isLogin ? 'Password' : 'Create Password'}</label>
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={isLogin ? undefined : CONFIG.PASSWORD_MIN_LENGTH}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                />
                {!isLogin && password.length > 0 && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength.score ? passwordStrength.color : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center py-3 px-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[46px] bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center disabled:opacity-50 !mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-4 text-center relative z-10">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-[12px] group inline-flex items-center hover:text-zinc-400 transition-colors"
              >
                <span className="font-normal text-zinc-600">
                  {isLogin ? 'Need an account?' : 'Already have an account?'}
                </span>
                <span className="ml-1 font-bold text-zinc-400">
                  {isLogin ? 'Create one' : 'Sign In'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center opacity-30">
          <p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">
            &copy; {new Date().getFullYear()} Ignite Studios
          </p>
        </div>
      </div>
    </div>
  );
};