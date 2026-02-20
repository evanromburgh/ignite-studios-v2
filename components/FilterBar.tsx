import React from 'react';
import { SearchFilters, ViewMode } from '../types';
import { CONFIG } from '../config';
import { formatPrice } from './UnitCard';

interface FilterBarProps {
  filters: SearchFilters;
  viewMode: ViewMode;
  onFiltersChange: (filters: SearchFilters) => void;
  onViewModeChange: (mode: ViewMode) => void;
  availableCount: number;
  totalUnits: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
  availableCount,
  totalUnits,
}) => {
  const updateFilter = (key: keyof SearchFilters, value: string | number) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.maxPrice !== 'all' || filters.bedrooms !== 'all' || filters.bathrooms !== 'all' || filters.status !== 'all';

  return (
    <div className="mb-12 sm:mb-24">
      <div className="liquid-glass-dark rounded-xl p-5 sm:p-8 md:p-12 mb-6 sm:mb-8 border-white/5 shadow-inner">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-8 w-full">
          <div>
            <label className="block text-[9px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest sm:tracking-[0.1em] mb-2 sm:mb-4 ml-1">Bedrooms</label>
            <select className="h-[42px] sm:h-[46px] w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 sm:px-6 text-zinc-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest appearance-none cursor-pointer" value={filters.bedrooms} onChange={(e) => updateFilter('bedrooms', e.target.value)}>
              <option value="all" className="bg-zinc-950">Any Beds</option>
              <option value="1" className="bg-zinc-950">1 Bed</option>
              <option value="2" className="bg-zinc-950">2 Beds</option>
              <option value="3" className="bg-zinc-950">3 Beds</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest sm:tracking-[0.1em] mb-2 sm:mb-4 ml-1">Bathrooms</label>
            <select className="h-[42px] sm:h-[46px] w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 sm:px-6 text-zinc-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest appearance-none cursor-pointer" value={filters.bathrooms} onChange={(e) => updateFilter('bathrooms', e.target.value)}>
              <option value="all" className="bg-zinc-950">Any Baths</option>
              <option value="1" className="bg-zinc-950">1 Bath</option>
              <option value="2" className="bg-zinc-950">2 Baths</option>
              <option value="3" className="bg-zinc-950">3 Baths</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest sm:tracking-[0.1em] mb-2 sm:mb-4 ml-1">Price Limit</label>
            <select className="h-[42px] sm:h-[46px] w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 sm:px-6 text-zinc-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest appearance-none cursor-pointer" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all" className="bg-zinc-950">All Prices</option>
              {CONFIG.PRICE_FILTER_OPTIONS.map(price => <option key={price} value={price} className="bg-zinc-950">Under R {formatPrice(price)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest sm:tracking-[0.1em] mb-2 sm:mb-4 ml-1">Availability</label>
            <select className="h-[42px] sm:h-[46px] w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 sm:px-6 text-zinc-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest appearance-none cursor-pointer" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="all" className="bg-zinc-950">All Units</option>
              <option value="Available" className="bg-zinc-950">Available</option>
              <option value="Reserved" className="bg-zinc-950">Reserved</option>
              <option value="Sold" className="bg-zinc-950">Sold</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest sm:tracking-[0.1em] mb-2 sm:mb-4 ml-1">View Type</label>
            <select className="h-[42px] sm:h-[46px] w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 sm:px-6 text-zinc-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest appearance-none cursor-pointer" value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)}>
              <option value={ViewMode.GRID} className="bg-zinc-950">Grid View</option>
              <option value={ViewMode.LIST} className="bg-zinc-950">List View</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-center px-1">
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">
          {availableCount} <span className="text-zinc-700">of</span> {totalUnits} <span className="text-zinc-700">units available</span>
        </div>
      </div>
    </div>
  );
};
