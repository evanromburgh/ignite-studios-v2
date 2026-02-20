import React, { useState } from 'react';
import { Unit } from '../types';

interface AdminUnitFormProps {
  unit?: Unit | null;
  onSave: (unit: Unit) => void;
  onClose: () => void;
}

export const AdminUnitForm: React.FC<AdminUnitFormProps> = ({ unit, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Unit>>(unit || {
    id: Math.random().toString(36).slice(2, 11),
    unitNumber: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    sizeSqm: 50,
    price: 1500000,
    status: 'Available',
    unitType: 'A1',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.unitNumber?.trim()) newErrors.unitNumber = 'Unit number is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.bedrooms || formData.bedrooms < 0) newErrors.bedrooms = 'Must be 0 or more';
    if (!formData.bathrooms || formData.bathrooms < 0) newErrors.bathrooms = 'Must be 0 or more';
    if (!formData.parking || formData.parking < 0) newErrors.parking = 'Must be 0 or more';
    if (!formData.sizeSqm || formData.sizeSqm <= 0) newErrors.sizeSqm = 'Must be greater than 0';
    if (!formData.unitType?.trim()) newErrors.unitType = 'Unit type is required';
    if (!formData.imageUrl?.trim()) newErrors.imageUrl = 'Image URL is required';

    try {
      if (formData.imageUrl) new URL(formData.imageUrl);
    } catch {
      newErrors.imageUrl = 'Must be a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData as Unit);
    }
  };

  const fieldError = (field: string) => errors[field] ? (
    <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">{errors[field]}</span>
  ) : null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6">
      <div className="liquid-glass max-w-2xl w-full rounded-2xl p-5 sm:p-8 border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {unit ? 'Edit Architectural Asset' : 'Register New Asset'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5 sm:gap-4">
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Unit Number</label>
              <input 
                required
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.unitNumber ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.unitNumber}
                onChange={e => setFormData({ ...formData, unitNumber: e.target.value })}
              />
              {fieldError('unitNumber')}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Price (ZAR)</label>
              <input 
                required
                type="number"
                min="0"
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.price ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
              {fieldError('price')}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5 sm:gap-4">
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Beds</label>
              <input 
                type="number"
                min="0"
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.bedrooms ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.bedrooms}
                onChange={e => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
              />
              {fieldError('bedrooms')}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Baths</label>
              <input 
                type="number"
                min="0"
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.bathrooms ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.bathrooms}
                onChange={e => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
              />
              {fieldError('bathrooms')}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Parking</label>
              <input 
                type="number"
                min="0"
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.parking ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.parking}
                onChange={e => setFormData({ ...formData, parking: Number(e.target.value) })}
              />
              {fieldError('parking')}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Size (sqm)</label>
              <input 
                type="number"
                min="1"
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.sizeSqm ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.sizeSqm}
                onChange={e => setFormData({ ...formData, sizeSqm: Number(e.target.value) })}
              />
              {fieldError('sizeSqm')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:gap-4">
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Unit Type</label>
              <input 
                required
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.unitType ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.unitType}
                onChange={e => setFormData({ ...formData, unitType: e.target.value })}
              />
              {fieldError('unitType')}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Image URL</label>
              <input 
                required
                className={`w-full bg-white/[0.03] border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 outline-none transition-all ${errors.imageUrl ? 'border-red-500/50' : 'border-white/5'}`}
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              {fieldError('imageUrl')}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="submit" 
              className="flex-1 h-[46px] bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center"
            >
              Confirm Asset
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-8 h-[46px] border border-white/10 text-zinc-500 font-black uppercase tracking-widest rounded-lg hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
