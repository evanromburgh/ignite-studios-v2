
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { CONFIG } from '../config';
import { formatPrice } from './UnitCard';
import { IconBed, IconBath, IconCar, IconSize, IconLayout, IconHeart } from './Icons';

interface UnitListRowProps {
  unit: Unit;
  onSelect: (unit: Unit) => void;
  onReserve: (unit: Unit) => void;
  isWishlisted: boolean;
  onToggleWishlist: (unitId: string) => void;
  isAdmin?: boolean;
  /** When true (e.g. on My Reservations page), show full opacity so the unit is visible. Buttons stay disabled. */
  hideReservedOverlay?: boolean;
}

export const UnitListRow: React.FC<UnitListRowProps> = ({ unit, onSelect, onReserve, isWishlisted, onToggleWishlist, isAdmin = false, hideReservedOverlay = false }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [, setTick] = useState(0); // Dummy state to force re-render
  
  useEffect(() => {
    // 1. Reservation timer
    if (!unit.lockExpiresAt) {
      setTimeLeft(0);
    } else {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((unit.lockExpiresAt! - now) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [unit.lockExpiresAt]);

  useEffect(() => {
    const presenceTicker = setInterval(() => {
      setTick(t => t + 1);
    }, CONFIG.PRESENCE_TICK_MS);
    return () => clearInterval(presenceTicker);
  }, []);

  const isLocked = timeLeft > 0 && unit.status === 'Available';
  const isAvailable = unit.status === 'Available' && !isLocked;
  const showDimmed = !isAvailable && !isAdmin && !hideReservedOverlay;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (unit.status === 'Sold') return `Unit ${unit.unitNumber} is Sold`;
    if (unit.status === 'Reserved') return `Unit ${unit.unitNumber} is Reserved`;
    if (isLocked) return `Reservation in progress (${formatTime(timeLeft)})`;
    
    // Count active heartbeats (last 45s)
    const now = Date.now();
    const viewers = unit.viewers || {};
    const count = Object.values(viewers).filter(t => {
      const timestamp = typeof t === 'number' ? t : Number(t);
      return now - timestamp < CONFIG.VIEWER_TIMEOUT_MS;
    }).length;
    
    return `${count} currently viewing`;
  };

  const getIndicatorColorClass = () => {
    if (unit.status === 'Sold') return 'bg-red-500';
    if (unit.status === 'Reserved') return 'bg-amber-500';
    if (isLocked) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse';
  };

  const getBadgeStyles = () => {
    if (unit.status === 'Sold') return 'text-red-500 border-red-500/30';
    if (unit.status === 'Reserved') return 'text-amber-500 border-amber-500/30';
    if (isLocked) return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
    return 'text-zinc-500 border-white/10';
  };

  return (
    <div 
      className={`relative liquid-glass rounded-xl p-4 sm:px-6 sm:py-0 sm:h-24 mb-4 flex items-center overflow-hidden border-none transition-all duration-500 bg-clip-padding cursor-default ${(isAvailable || isAdmin) ? 'hover:bg-white/[0.05]' : ''}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-700 w-full z-10 gap-4 sm:gap-0">
        
        {/* Unit name + price */}
        <div className={`flex items-center justify-between sm:flex-col sm:items-start w-full sm:w-auto shrink-0 sm:min-w-[10rem] lg:w-[12rem] transition-opacity duration-500 ${showDimmed ? 'opacity-20 select-none pointer-events-none' : ''}`}>
          <span className="text-base sm:text-xl font-medium text-white tracking-tight leading-none">Unit {unit.unitNumber}</span>
          <div className="text-lg sm:text-2xl font-black text-zinc-100 leading-none tracking-tight whitespace-nowrap sm:mt-2">R {formatPrice(unit.price)}</div>
        </div>
        
        {/* Specs row */}
        <div className={`flex items-center gap-x-4 sm:gap-x-6 xl:gap-x-8 shrink-0 lg:w-[24rem] transition-opacity duration-500 ${showDimmed ? 'opacity-20 select-none pointer-events-none' : ''}`}>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 font-medium uppercase tracking-wider whitespace-nowrap">
            <IconBed className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 flex-shrink-0" />
            <span>{unit.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 font-medium uppercase tracking-wider whitespace-nowrap">
            <IconBath className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 flex-shrink-0" />
            <span>{unit.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 font-medium uppercase tracking-wider whitespace-nowrap">
            <IconCar className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 flex-shrink-0" />
            <span>{unit.parking}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 font-medium uppercase tracking-wider whitespace-nowrap">
            <IconLayout className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 flex-shrink-0" />
            <span>{unit.unitType}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 font-medium uppercase tracking-wider whitespace-nowrap">
            <IconSize className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 flex-shrink-0" />
            <span>{unit.sizeSqm}<span className="lowercase">m²</span></span>
          </div>
        </div>

        {/* Status */}
        <div className={`hidden lg:flex flex-col items-start justify-center shrink-0 lg:w-[15rem] transition-opacity duration-500 ${showDimmed ? 'opacity-20 select-none pointer-events-none' : ''}`}>
          <div className="text-[10px] text-zinc-500 font-black tracking-wide flex items-center uppercase whitespace-nowrap h-4">
            <span className={`w-2 h-2 aspect-square rounded-full mr-4 flex-shrink-0 block ${getIndicatorColorClass()}`} />
            <span className={`leading-none ${isLocked ? 'text-orange-500 font-bold' : ''}`}>{getStatusText()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto shrink-0 lg:w-[25rem]">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-initial">
            <button 
              disabled={!isAvailable && !isAdmin}
              className={`flex-1 sm:flex-initial sm:w-32 lg:w-40 h-10 sm:h-[46px] border border-white/10 text-zinc-300 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-normal transition-all text-center whitespace-nowrap flex items-center justify-center ${showDimmed ? 'opacity-20 pointer-events-none' : 'hover:bg-white/5 hover:text-white'}`}
              onClick={(e) => { e.stopPropagation(); onSelect(unit); }}
            >
              LEARN MORE
            </button>
            
            <div className="flex-1 sm:flex-initial sm:w-32 lg:w-40 h-10 sm:h-[46px] relative">
              {isAvailable ? (
                <button 
                  className="w-full h-full bg-zinc-100 text-zinc-950 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-normal hover:bg-white transition-all shadow-lg text-center whitespace-nowrap flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); onReserve(unit); }}
                >
                  RESERVE NOW
                </button>
              ) : (
                <div className={`px-2 sm:px-4 w-full h-full flex items-center justify-center rounded-lg border bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-normal transition-all z-[110] text-center ${getBadgeStyles()}`}>
                  {isLocked ? 'RESERVING' : unit.status}
                </div>
              )}
            </div>
          </div>
          
          <button 
            disabled={!isAvailable && !isAdmin}
            className={`w-9 h-9 sm:w-[36px] sm:h-[36px] flex-shrink-0 flex items-center justify-center backdrop-blur-md rounded-full border border-white/10 transition-all ${showDimmed ? 'opacity-20 pointer-events-none' : ''} ${isWishlisted ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-black/40 text-zinc-400 hover:text-red-400'}`}
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(unit.id); }}
          >
            <IconHeart className="w-4 h-4" filled={isWishlisted} />
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-[100] pointer-events-none rounded-xl ring-1 ring-inset ring-white/10" />
    </div>
  );
};
