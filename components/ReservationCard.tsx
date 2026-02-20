import React from 'react';
import { Unit } from '../types';
import { IconBed, IconBath, IconCar, IconLayout, IconSize } from './Icons';

interface ReservationCardProps {
  unit: Unit;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ unit }) => {
  return (
    <div 
      className="group relative flex flex-col sm:flex-row items-stretch sm:items-stretch gap-4 rounded-xl p-4 border border-white/5 bg-zinc-900/40 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Image - 50% width, same aspect ratio as UnitCard */}
      <div className="relative shrink-0 w-full sm:w-1/2">
        <div className="relative overflow-hidden rounded-lg aspect-[3/2] bg-white/[0.02]">
          <img 
            src={unit.imageUrl} 
            alt={`Unit ${unit.unitNumber}`}
            className="object-cover w-full h-full opacity-70 grayscale-[20%] group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      {/* Content - Unit info at top; Deposit Paid block below, grows to match image height */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 gap-4 sm:w-1/2">
        <div className="rounded-lg bg-white/[0.03] border border-white/5 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Your reservation
          </p>
          <h3 className="text-xl font-medium text-white tracking-tight leading-none mb-6">
            Unit {unit.unitNumber}
          </h3>
          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-0">
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconBed className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{unit.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconBath className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{unit.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconCar className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{unit.parking}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconLayout className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{unit.unitType}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconSize className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{unit.sizeSqm}<span className="lowercase">m²</span></span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 items-center justify-center rounded-[0.5rem] bg-emerald-500/15 px-3 py-1.5">
          <span className="text-sm font-semibold text-emerald-400">Deposit Paid</span>
        </div>
      </div>
    </div>
  );
};
