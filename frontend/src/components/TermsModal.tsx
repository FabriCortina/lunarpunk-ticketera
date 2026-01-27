import React from 'react';
import { X } from 'lucide-react';
import { TermsContent } from './TermsContent';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#050b14] border border-lp-accent/30 w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.15)] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-title text-white">Términos y condiciones</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Cerrar términos y condiciones"
          >
            <X size={22} />
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto">
          <TermsContent />
        </div>
      </div>
    </div>
  );
};
