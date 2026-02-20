
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Unit } from '../types';
import { CONFIG } from '../config';
import { formatPrice } from './UnitCard';
import { unitService } from '../services/unitService';
import { reservationService } from '../services/reservationService';
import { useToast } from './Toast';

interface ReservationViewProps {
  unit: Unit;
  onClose: () => void;
}

export const ReservationView: React.FC<ReservationViewProps> = ({ unit, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idPassport, setIdPassport] = useState('');
  const [reasonForBuying, setReasonForBuying] = useState('');
  const hasReleasedRef = useRef(false);
  const isClosingRef = useRef(false);
  
  const calculateRemaining = useCallback(() => {
    if (!unit.lockExpiresAt) return 0;
    return Math.max(0, Math.floor((unit.lockExpiresAt - Date.now()) / 1000));
  }, [unit.lockExpiresAt]);

  const [timeLeft, setTimeLeft] = useState(calculateRemaining);

  const releaseLock = useCallback(async () => {
    if (hasReleasedRef.current) return;
    hasReleasedRef.current = true;
    await unitService.releaseLock(unit.id);
  }, [unit.id]);

  const handleClose = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    
    // Call onClose immediately to trigger the transition away in the parent component
    onClose();
    
    // Release the lock in the background without awaiting to ensure smooth UI transition
    try {
      await releaseLock();
    } catch (err) {
      console.error("Failed to release lock on close:", err);
    }
  }, [releaseLock, onClose]);

  useEffect(() => {
    // If we're already closing, stop responding to unit prop updates to prevent flickering/resets
    if (isClosingRef.current) return;
    
    setTimeLeft(calculateRemaining());
    if (!unit.lockExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((unit.lockExpiresAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [unit.lockExpiresAt, calculateRemaining, handleClose]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      releaseLock();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Ensure the lock is released if we unmount for any reason (e.g., page navigation)
      if (!isClosingRef.current) {
        releaseLock();
      }
    };
  }, [releaseLock]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColors = (seconds: number) => {
    if (seconds > 420) return { main: 'bg-emerald-500', ping: 'bg-emerald-400' };
    if (seconds > 180) return { main: 'bg-amber-500', ping: 'bg-amber-400' };
    return { main: 'bg-red-500', ping: 'bg-red-400' };
  };

  const colors = getTimerColors(timeLeft);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name.trim() || !surname.trim() || !email.trim() || !phone.trim() || !idPassport.trim() || !reasonForBuying.trim()) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast('Please enter a valid email address', 'error');
      return;
    }

    // Validate phone (should be 9-10 digits after +27)
    if (phone.length < 9 || phone.length > 10) {
      toast('Please enter a valid phone number (9-10 digits)', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await reservationService.submitReservation(
        {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim(),
          phone: phone.trim(),
          idPassport: idPassport.trim(),
          reasonForBuying: reasonForBuying.trim(),
        },
        unit.id,
        unit.unitNumber
      );

      if (!response.paymentUrl) {
        toast('Payment URL not available. Please contact support.', 'error');
        setIsSubmitting(false);
        return;
      }

      toast('Redirecting to payment gateway...', 'success');
      
      // Redirect to PayFast payment page
      window.location.href = response.paymentUrl;
      
      // Note: We don't call onClose() here because the user is being redirected
      // The lock will be released when the payment completes or times out
    } catch (error: any) {
      console.error('Reservation submission error:', error);
      toast(error.message || 'Failed to submit reservation. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 sm:pt-48 pb-0 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          
          <div className="lg:col-span-2">
            <div className="w-full">
              <header className="mb-8 sm:mb-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-none">
                    Reserve Unit {unit.unitNumber}
                  </h1>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.main}`}></span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] md:text-[15px] font-medium text-zinc-500 tracking-tight flex items-center gap-2 whitespace-nowrap">
                      <span className="hidden sm:inline uppercase tracking-widest font-bold text-[10px]">Reservation Expires in</span>
                      <span className="text-white font-bold tabular-nums bg-white/5 px-3 sm:px-4 py-1.5 rounded-lg border border-white/10">
                        {formatTime(timeLeft)}
                      </span>
                    </p>
                  </div>
                </div>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5 w-full mb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Name</label>
                    <input 
                      required 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Surname</label>
                    <input 
                      required 
                      type="text" 
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">ID / Passport Number</label>
                  <input 
                    required 
                    type="text" 
                    value={idPassport}
                    onChange={(e) => setIdPassport(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Reason for Buying</label>
                  <select 
                    required 
                    value={reasonForBuying}
                    onChange={(e) => setReasonForBuying(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] pt-[13px] pb-[13px] leading-[1.25] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-zinc-900">Select reason</option>
                    <option value="Primary Residence" className="bg-zinc-900">Primary Residence</option>
                    <option value="Investment Property" className="bg-zinc-900">Investment Property</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || timeLeft <= 0}
                    className="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:shadow-none"
                  >
                    {isSubmitting ? 'PROCESSING...' : timeLeft <= 0 ? 'RESERVATION EXPIRED' : 'PROCEED TO PAYMENT'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleClose}
                    className="px-10 h-[46px] border border-white/10 text-zinc-300 text-[11px] font-black uppercase tracking-normal rounded-lg hover:bg-white/5 transition-all leading-none flex items-center justify-center"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32 flex flex-col gap-8 sm:gap-10">
              <div className="liquid-glass group !bg-white/[0.01] hover:!bg-white/[0.03] p-6 sm:p-10 relative overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 shadow-xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl transition-all"></div>
                
                <h2 className="text-lg sm:text-xl font-black text-white mb-6 sm:mb-8 tracking-tighter leading-tight group-hover:text-zinc-300 transition-colors">
                  Reservation Summary
                </h2>
                
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Unit Number</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">Unit {unit.unitNumber}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Bedrooms</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{unit.bedrooms}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Bathrooms</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{unit.bathrooms}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Parking</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{unit.parking}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Unit Type</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{unit.unitType}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Unit Size</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{unit.sizeSqm} m²</span>
                  </div>
                  <div className="flex items-center justify-between mb-6 sm:mb-8 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Selling Price</span>
                    <span className="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">R {formatPrice(unit.price)}</span>
                  </div>
                  
                  <div className="pt-6 sm:pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-base sm:text-xl tracking-tighter">Total Payable Now</span>
                      <span className="text-white text-base sm:text-xl font-black tracking-tighter text-right whitespace-nowrap">R {formatPrice(CONFIG.RESERVATION_DEPOSIT)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-2 sm:pl-2 sm:pr-20">
                <p className="text-[11px] sm:text-[12px] text-zinc-500 font-medium leading-relaxed tracking-tight text-left">
                  <span className="text-white font-black">Note:</span> This reservation deposit secures your unit for 7 days. Our sales team will contact you within 24 hours to complete the purchase process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
