
import React, { useMemo, useEffect, useState } from 'react';
import { Unit } from '../types';
import { CONFIG } from '../config';
import { IconBed, IconBath, IconCar, IconSize, IconLayout } from './Icons';
import { formatPrice } from './UnitCard';
import { unitService } from '../services/unitService';

interface UnitDetailsProps {
  unit: Unit;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onReserve: (unit: Unit) => void;
}

export const UnitDetails: React.FC<UnitDetailsProps> = ({ unit, onClose, isWishlisted, onToggleWishlist, onReserve }) => {
  // Generate a unique session ID for this view session
  const sessionId = useMemo(() => Math.random().toString(36).substring(2, 15), []);
  const [, setTick] = useState(0); 

  // Financial Calculations
  const costs = useMemo(() => {
    const bondPayment = unit.price * CONFIG.BOND_RATE;
    const ratesAndTaxes = CONFIG.RATES_BASE + (unit.price * CONFIG.RATES_MULTIPLIER);
    const levies = unit.sizeSqm * CONFIG.LEVY_PER_SQM;
    const total = bondPayment + ratesAndTaxes + levies;

    return {
      bond: Math.round(bondPayment),
      rates: Math.round(ratesAndTaxes),
      levies: Math.round(levies),
      total: Math.round(total)
    };
  }, [unit.price, unit.sizeSqm]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Initial heartbeat
    unitService.updateHeartbeat(unit.id, sessionId);

    const heartbeatInterval = setInterval(() => {
      unitService.updateHeartbeat(unit.id, sessionId);
    }, CONFIG.HEARTBEAT_INTERVAL_MS);

    const localTicker = setInterval(() => {
      setTick(t => t + 1);
    }, CONFIG.PRESENCE_TICK_MS);

    const cleanup = () => {
      clearInterval(heartbeatInterval);
      clearInterval(localTicker);
      unitService.removeViewer(unit.id, sessionId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        unitService.updateHeartbeat(unit.id, sessionId);
      }
    };

    window.addEventListener('beforeunload', cleanup);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unit.id, sessionId]);

  const getIndicatorColorClass = () => {
    if (unit.status === 'Sold') return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    if (unit.status === 'Reserved') return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse';
  };

  const getStatusDisplay = () => {
    if (unit.status !== 'Available') return unit.status;
    const now = Date.now();
    const activeViewers = Object.values(unit.viewers || {}).filter(timestamp => now - (timestamp as number) < CONFIG.VIEWER_TIMEOUT_MS).length;
    const count = Math.max(1, activeViewers);
    return `${count} currently viewing`;
  };

  return (
    <div className="min-h-screen pt-32 sm:pt-48 pb-0 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          
          <div className="lg:col-span-2 space-y-0">
            <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-zinc-900 group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
              <img 
                src={unit.imageUrl} 
                alt={`Unit ${unit.unitNumber}`}
                loading="lazy" 
                className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-[3s] ease-out"
              />
            </div>

            <div className="px-0 sm:px-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between w-full gap-2 sm:gap-6 py-8 sm:py-16">
                <span className="text-2xl sm:text-4xl md:text-5xl font-semibold text-zinc-400 tracking-tight leading-none">Unit {unit.unitNumber}</span>
                <div className="text-left sm:text-right">
                  <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-white tracking-tighter leading-none">
                    R {formatPrice(unit.price)}
                  </h1>
                </div>
              </div>

              <div className="py-8 sm:py-16 border-y border-white/5">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-4 w-full">
                  <div className="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all">
                      <IconBed className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2">{unit.bedrooms}</span>
                      <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest">Beds</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all">
                      <IconBath className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2">{unit.bathrooms}</span>
                      <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest">Baths</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all">
                      <IconCar className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2">{unit.parking || 1}</span>
                      <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest">Parking</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all">
                      <IconLayout className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2">{unit.unitType}</span>
                      <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest">Type</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all">
                      <IconSize className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2">{unit.sizeSqm}m²</span>
                      <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest">Area</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 sm:pt-16 pb-0">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => onToggleWishlist(unit.id)}
                    className={`w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all ${isWishlisted ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl'}`}
                  >
                    {isWishlisted ? 'REMOVE WISHLIST' : 'ADD TO WISHLIST'}
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none hover:bg-white/5 transition-all"
                  >
                    RETURN TO LIST
                  </button>
                </div>
                
                <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 sm:pt-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getIndicatorColorClass()}`}></span>
                  <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                    {getStatusDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 relative">
            <div className="lg:sticky lg:top-32 flex flex-col gap-8 sm:gap-10">
              <div className="liquid-glass group !bg-white/[0.01] hover:!bg-white/[0.03] p-6 sm:p-10 relative overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 shadow-xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl transition-all"></div>
                
                <h2 className="text-lg sm:text-xl font-black text-white mb-6 sm:mb-8 tracking-tighter leading-tight group-hover:text-zinc-300 transition-colors">
                  Estimated Monthly Costs
                </h2>
                
                <div className="flex flex-col mb-8 sm:mb-10">
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Bond Payment</span>
                    <span className="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]">R {formatPrice(costs.bond)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Rates & Taxes</span>
                    <span className="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]">R {formatPrice(costs.rates)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-6 sm:mb-8 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span className="text-zinc-500 font-medium text-sm transition-colors tracking-tight">Levies</span>
                    <span className="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]">R {formatPrice(costs.levies)}</span>
                  </div>
                  
                  <div className="pt-6 sm:pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-base sm:text-xl uppercase tracking-tighter">Total Monthly</span>
                      <span className="text-white text-base sm:text-xl font-black tracking-tighter text-right">R {formatPrice(costs.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  <button 
                    disabled={unit.status !== 'Available'}
                    className={`w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all ${unit.status === 'Available' ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                    onClick={() => unit.status === 'Available' && onReserve(unit)}
                  >
                    RESERVE UNIT
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none hover:bg-white/5 transition-all"
                  >
                    ENQUIRE NOW
                  </button>
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
