
import React, { useState } from 'react';
import { Unit } from '../types';

interface BulkSyncModalProps {
  currentUnits: Unit[];
  onImport: (units: Unit[]) => void;
  onClose: () => void;
}

export const BulkSyncModal: React.FC<BulkSyncModalProps> = ({ currentUnits, onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(currentUnits, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCopyTemplate = () => {
    const template = [{
      id: "unique-id-1",
      unitNumber: "101",
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      sizeSqm: 85,
      price: 2500000,
      status: "Available",
      unitType: "TYPE-A",
      imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200"
    }];
    setJsonInput(JSON.stringify(template, null, 2));
    setError(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(currentUnits, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ignite-inventory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Data must be an array of units.");
      
      const isValid = parsed.every(u => u.unitNumber && u.price && u.id && u.imageUrl);
      if (!isValid) throw new Error("Some units are missing required fields (id, unitNumber, price, imageUrl).");

      onImport(parsed);
      setIsSuccess(true);
      setError(null);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid JSON format.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-3 sm:p-6">
      <div className="liquid-glass max-w-4xl w-full rounded-2xl p-5 sm:p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Inventory Bulk Sync</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Populate your cloud database with real property data</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={handleCopyTemplate}
              className="px-6 h-[46px] bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
            >
              Get Data Template
            </button>
            <button 
              onClick={handleExport}
              className="px-6 h-[46px] bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center"
            >
              Export Current Cloud Data
            </button>
            <button 
              onClick={() => setJsonInput('[]')}
              className="px-6 h-[46px] bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center"
            >
              Wipe Editor
            </button>
          </div>

          <div className="relative flex-1 min-h-0 group">
            <textarea 
              className="w-full h-full bg-black/50 border border-white/5 rounded-xl p-8 font-mono text-base sm:text-[9px] text-emerald-500/80 focus:border-emerald-500/30 outline-none resize-none overflow-y-auto custom-scrollbar transition-all"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck={false}
            />
            <div className="absolute top-4 right-6 text-[9px] font-black text-zinc-800 uppercase tracking-widest pointer-events-none group-focus-within:text-emerald-900 transition-colors">JSON MASTER SOURCE</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}
          {isSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">Sync Successful. Cloud database updated.</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={handleImport}
              className="flex-1 h-[46px] bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-[0.99] flex items-center justify-center"
            >
              Commit to Cloud
            </button>
            <button 
              onClick={onClose}
              className="px-10 h-[46px] border border-white/10 text-zinc-500 font-black uppercase tracking-widest rounded-xl hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
