import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { CONFIG } from '../config';
import { IconBed, IconBath, IconCar, IconLayout, IconSize, IconHeart } from './Icons';
import { getViewersForUnit, subscribeToViewersUpdates } from '../services/viewersStore';

interface UnitCardProps {
  unit: Unit;
  onSelect: (unit: Unit) => void;
  onReserve: (unit: Unit) => void;
  isWishlisted: boolean;
  onToggleWishlist: (unitId: string) => void;
  isAdmin?: boolean;
  /** When true (e.g. on My Reservations page), hide the RESERVED overlay so the unit is visible. Buttons stay disabled. */
  hideReservedOverlay?: boolean;
  onStatusChange?: (id: string, status: Unit['status']) => void;
  onEdit?: (unit: Unit) => void;
  onDelete?: (id: string) => void;
  serverClockOffsetMs?: number;
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price).replace(/,/g, ' ');
};

export const UnitCard: React.FC<UnitCardProps> = ({ 
  unit, 
  onSelect, 
  onReserve,
  isWishlisted, 
  onToggleWishlist,
  isAdmin = false,
  hideReservedOverlay = false,
  onStatusChange,
  onEdit,
  onDelete,
  serverClockOffsetMs = 0
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [, setTick] = useState(0);
  const viewers = getViewersForUnit(unit.id) || unit.viewers || {};

  useEffect(() => {
    return subscribeToViewersUpdates(() => setTick((t) => t + 1));
  }, []);

  useEffect(() => {
    if (!unit.lockExpiresAt) {
      setTimeLeft(0);
    } else {
      const effectiveNow = () => Date.now() + serverClockOffsetMs;
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((unit.lockExpiresAt! - effectiveNow()) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [unit.lockExpiresAt, serverClockOffsetMs]);

  useEffect(() => {
    const presenceTicker = setInterval(() => {
      setTick(t => t + 1);
    }, CONFIG.PRESENCE_TICK_MS);
    return () => clearInterval(presenceTicker);
  }, []);

  const isLocked = timeLeft > 0 && unit.status === 'Available';
  const isAvailable = unit.status === 'Available' && !isLocked;
  const showOverlay = !isAvailable && !isAdmin && !hideReservedOverlay;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (unit.status === 'Sold') return `Unit ${unit.unitNumber} is Sold`;
    if (unit.status === 'Reserved') return `Unit ${unit.unitNumber} is Reserved`;
    if (isLocked) return `Reservation in progress (${formatTime(timeLeft)})`;
    
    const count = Object.keys(viewers).length;
    return `${count} currently viewing`;
  };

  const getIndicatorColorClass = () => {
    if (unit.status === 'Sold') return 'bg-red-500';
    if (unit.status === 'Reserved') return 'bg-amber-500';
    if (isLocked) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse';
    return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse';
  };

  return (
    <div 
      className={`group relative flex flex-col h-full rounded-xl p-4 border border-white/5 transition-all duration-500 overflow-hidden bg-zinc-900/40 select-none cursor-default ${(isAvailable || isAdmin) ? 'hover:bg-zinc-800/60 hover:border-white/10' : ''}`} 
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {showOverlay && (
        <div className="absolute inset-0 z-20 bg-black/60 pointer-events-none transition-opacity duration-500" />
      )}

      {isAdmin && (
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(unit); }}
            className="w-[46px] h-[46px] rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(unit.id); }}
            className="w-[46px] h-[46px] rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      )}

      <div className={`flex flex-col h-full relative z-10 transition-all duration-700 ${showOverlay ? 'opacity-30' : ''}`}>
        <div className="relative overflow-hidden rounded-lg aspect-[3/2] mb-6 bg-white/[0.02]">
          <img 
            src={unit.imageUrl} 
            alt={`Unit ${unit.unitNumber}`}
            loading="lazy" 
            className={`object-cover w-full h-full transition-all duration-700 ${(isAvailable || isAdmin || hideReservedOverlay) ? 'opacity-70 grayscale-[20%] group-hover:opacity-100' : 'opacity-40 grayscale'}`} 
          />
          {(isAvailable || isAdmin || hideReservedOverlay) && (
            <button 
              className={`absolute top-3 right-3 w-[36px] h-[36px] flex items-center justify-center backdrop-blur-md rounded-full border border-white/10 transition-all ${isWishlisted ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-black/40 text-zinc-400 hover:text-red-400'}`}
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(unit.id); }}
            >
              <IconHeart className="w-4 h-4" filled={isWishlisted} />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-baseline mb-6 px-4">
            <h3 className="text-xl font-medium text-white tracking-tight leading-none">Unit {unit.unitNumber}</h3>
            <span className="text-2xl font-black text-zinc-100 leading-none">R {formatPrice(unit.price)}</span>
          </div>

          <div className="mb-6 py-6 border-y border-white/5 px-4">
            <div className="flex items-center justify-between whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider"><IconBed className="w-5 h-5 text-zinc-500 flex-shrink-0" /> <span>{unit.bedrooms}</span></div>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider"><IconBath className="w-5 h-5 text-zinc-500 flex-shrink-0" /> <span>{unit.bathrooms}</span></div>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider"><IconCar className="w-5 h-5 text-zinc-500 flex-shrink-0" /> <span>{unit.parking}</span></div>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider"><IconLayout className="w-5 h-5 text-zinc-500 flex-shrink-0" /> <span>{unit.unitType}</span></div>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider"><IconSize className="w-5 h-5 text-zinc-500 flex-shrink-0" /> <span>{unit.sizeSqm}<span className="lowercase">m²</span></span></div>
            </div>
          </div>

          <div className="mb-6 px-4 flex items-center justify-center text-[10px] text-zinc-500 font-black tracking-wide uppercase h-4">
            <span className={`w-2 h-2 aspect-square rounded-full mr-2.5 flex-shrink-0 block ${getIndicatorColorClass()}`} />
            <span className={`leading-none ${isLocked ? 'text-orange-500 font-bold' : ''}`}>{getStatusText()}</span>
          </div>

          {isAdmin && onStatusChange && (
            <div className="mb-6 flex gap-2 justify-center px-4 relative z-50">
              <button onClick={(e) => { e.stopPropagation(); onStatusChange(unit.id, 'Available'); }} className={`flex-1 h-[46px] text-[8px] font-black rounded border transition-all flex items-center justify-center ${unit.status === 'Available' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-zinc-600'}`}>AVAILABLE</button>
              <button onClick={(e) => { e.stopPropagation(); onStatusChange(unit.id, 'Reserved'); }} className={`flex-1 h-[46px] text-[8px] font-black rounded border transition-all flex items-center justify-center ${unit.status === 'Reserved' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-zinc-600'}`}>RESERVED</button>
              <button onClick={(e) => { e.stopPropagation(); onStatusChange(unit.id, 'Sold'); }} className={`flex-1 h-[46px] text-[8px] font-black rounded border transition-all flex items-center justify-center ${unit.status === 'Sold' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-zinc-600'}`}>SOLD</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-auto px-0 relative z-50">
            <button 
              disabled={!isAvailable && !isAdmin}
              onClick={(e) => { e.stopPropagation(); onSelect(unit); }} 
              className={`h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center transition-colors px-2 ${(!isAvailable && !isAdmin) ? 'opacity-20 pointer-events-none' : 'hover:bg-white/5'}`}
            >
              LEARN MORE
            </button>
            <button 
              disabled={!isAvailable && !isAdmin} 
              onClick={(e) => { e.stopPropagation(); onReserve(unit); }}
              className={`h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center transition-all px-2 ${(isAvailable || isAdmin) ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl' : 'bg-zinc-800 text-zinc-500 pointer-events-none opacity-50'}`}
            >
              {(isAvailable || isAdmin) ? 'RESERVE NOW' : isLocked ? 'LOCKED' : unit.status}
            </button>
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="px-10 h-[46px] flex items-center justify-center bg-zinc-950/90 rounded-lg border border-white/10 shadow-2xl">
               <span className={`text-[12px] font-black uppercase tracking-[0.15em] leading-none ${unit.status === 'Sold' ? 'text-red-500' : isLocked ? 'text-orange-500' : 'text-amber-500'}`}>
                  {isLocked ? 'Reservation In Progress' : unit.status}
               </span>
            </div>
            
            {isLocked && (
              <div className="absolute top-full mt-3 text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] whitespace-nowrap">
                <span className="tabular-nums">{formatTime(timeLeft)}</span>
                <span className="font-medium">remaining</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};