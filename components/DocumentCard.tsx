
import React from 'react';
import { DocumentAsset } from '../types';
import { GlassContainer } from './GlassContainer';
import { useToast } from './Toast';

interface DocumentCardProps {
  doc: DocumentAsset;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc }) => {
  const { toast } = useToast();
  return (
    <GlassContainer className="group !bg-white/[0.01] hover:!bg-white/[0.03] !p-6 sm:!p-10 border-white/5 hover:border-white/10 transition-all duration-500">
      <div className="flex flex-col h-full">
        <div className="mb-10 flex justify-between items-start">
          <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all">
            {doc.type}
          </div>
          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">{doc.size}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tighter leading-tight group-hover:text-zinc-300 transition-colors">
          {doc.title}
        </h3>
        
        <p className="text-zinc-500 text-[13px] font-normal mb-10 leading-relaxed min-h-[3rem]">
          {doc.description}
        </p>

        <button 
          onClick={() => toast(`Downloading ${doc.title}...`, 'info')}
          className="mt-auto h-[46px] w-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:bg-white hover:text-black hover:border-white transition-all rounded-lg flex items-center justify-center"
        >
          Download
        </button>
      </div>
    </GlassContainer>
  );
};
