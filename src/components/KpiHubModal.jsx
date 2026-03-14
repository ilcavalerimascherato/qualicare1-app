import React from 'react';
import { X, BarChart2, TrendingUp, ActivitySquare } from 'lucide-react';

export default function KpiHubModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden font-sans p-10 relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 rounded-full transition-colors bg-slate-100 hover:bg-slate-200">
          <X size={24} />
        </button>

        <div className="text-center mb-12 mt-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Centro Analisi Direzionale</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Seleziona il modello di indagine quantitativa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* OPZIONE 1: MENSILE */}
          <button onClick={() => onSelect('kpiCharts')} className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-sky-500 hover:bg-sky-50 transition-all group text-left h-full">
            <div className="p-4 bg-sky-100 text-sky-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
              <BarChart2 size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase text-center mb-3">Analisi Mensile<br/>Cross-Section</h3>
            <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">Confronta le performance di tutte le strutture in un singolo mese specifico tramite istogrammi dinamici.</p>
          </button>

          {/* OPZIONE 2: LASER (TREND) */}
          <button onClick={() => onSelect('kpiLaser')} className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">Nuovo</div>
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase text-center mb-3">Vista Laser<br/>(1 KPI / 12 Mesi)</h3>
            <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">Analizza un singolo indicatore nel tempo. Linee di trend per struttura con corridoi di tolleranza a colori (Target).</p>
          </button>

          {/* OPZIONE 3: RAGGI X (SPARKLINES) */}
          <button onClick={() => onSelect('kpiXray')} className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left h-full">
            <div className="absolute top-0 right-0 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">Spaziale</div>
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
              <ActivitySquare size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase text-center mb-3">Vista Raggi X<br/>(1 Struttura / Tutti i KPI)</h3>
            <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">Pannello di controllo globale (Sparklines) per fare l'audit di una singola struttura su tutti i 36 indicatori in parallelo.</p>
          </button>

        </div>
      </div>
    </div>
  );
}