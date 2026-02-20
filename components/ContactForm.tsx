
import React, { useState } from 'react';
import { useToast } from './Toast';

export const ContactForm: React.FC = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Thank you. Our concierge will contact you shortly.", 'success');
  };

  return (
    <div id="contact" className="mt-0 mb-0">
      <div className="liquid-glass rounded-2xl p-6 sm:p-10 md:p-16 border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 sm:mb-8">SECURE YOUR<br/><span className="text-zinc-500">LEGACY</span></h2>
            <p className="text-base sm:text-lg text-zinc-400 font-light leading-relaxed max-w-md">
              Speak with our senior portfolio consultants to discuss your requirements and arrange a private tour of the Ignite ecosystem.
            </p>
            
            <div className="mt-8 sm:mt-12 space-y-6">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Direct Line</p>
                <p className="text-base sm:text-xl font-medium text-zinc-200">+27 11 000 1234</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm sm:text-xl font-medium text-zinc-200 break-all sm:break-normal">concierge@ignitestudios.co.za</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-4">
              <div className="space-y-2">
                <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Name</label>
                <input required type="text" className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Surname</label>
                <input required type="text" className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-4">
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
                <input required type="email" className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Message</label>
              <textarea required rows={4} className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 py-4 leading-[1.5] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all resize-none" />
            </div>
            <button type="submit" className="w-full h-[46px] bg-zinc-100 text-zinc-950 font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-xl active:scale-[0.98] flex items-center justify-center">
              Send Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
