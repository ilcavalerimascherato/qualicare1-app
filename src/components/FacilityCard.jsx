import React from 'react';
import { Settings, Database, BarChart3, Activity, Archive, ArchiveRestore, CheckCircle2 } from 'lucide-react';

export default function FacilityCard({ f, surveys, udos = [], gridCols, onEdit, onDataClick, onSuspendToggle, onKpiClick }) {
  
  const udo = udos.find(u => u.id === f.udo_id);
  const udoColor = udo?.color || '#cbd5e1';

  // Stato di completamento: Verde se esiste ALMENO una relazione IA, Indaco se ci sono dati ma no relazione
  const getStatus = (type) => {
    const targetSurveys = surveys.filter(s => s.type === type && (s.facility_id === f.id || (!s.facility_id && s.company_id === f.company_id)));
    if (targetSurveys.length === 0) return 'empty';
    
    const latestSurvey = targetSurveys.sort((a, b) => b.calendar_id.localeCompare(a.calendar_id))[0];
    if (latestSurvey.ai_report_ospiti || latestSurvey.ai_report_direzione) return 'completed';
    
    return 'pending';
  };

  const iconStyles = {
    empty: "bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 border-slate-200",
    pending: "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-200 shadow-sm",
    completed: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200 shadow-sm"
  };

  const renderBtn = (type, IconComponent, label) => {
    const status = getStatus(type);
    return (
      <button 
        onClick={() => onDataClick(f, type)}
        className={`flex items-center justify-center w-8 h-7 rounded-md border transition-all ${iconStyles[status]}`}
        title={`${label} - ${status === 'empty' ? 'Carica Dati' : status === 'completed' ? 'Relazione OK' : 'Da Elaborare'}`}
      >
        <IconComponent size={14} className={status === 'empty' ? 'opacity-50' : 'opacity-100'} />
      </button>
    );
  };

  const isCompact = gridCols && (gridCols.includes('6') || gridCols.includes('8'));
  const isUltraCompact = gridCols && gridCols.includes('8');

  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col relative group hover:shadow-md transition-all duration-200 ${f.is_suspended ? 'opacity-50 grayscale' : ''}`}
      style={{ borderTopWidth: '5px', borderTopColor: f.is_suspended ? '#94a3b8' : udoColor }}
    >
      
      {/* Bottoni in alto a destra (Appaiono all'hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onSuspendToggle(f)} 
          className={`p-1.5 rounded-lg transition-all ${f.is_suspended ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
          title={f.is_suspended ? "Riattiva Struttura" : "Sospendi Struttura"}
        >
          {f.is_suspended ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button onClick={onEdit} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
          <Settings size={14} />
        </button>
      </div>

      <div className="mb-2 pr-12 flex-1">
        <h3 className={`text-sm font-black leading-tight line-clamp-2 ${f.is_suspended ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {f.name}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {f.type} • {f.city}
        </p>
        
        <div className="mt-2 text-[11px] font-medium text-slate-500 space-y-0.5">
          {!isUltraCompact && f.address && <p className="truncate">{f.address}</p>}
          {!isCompact && f.referent && <p className="truncate text-slate-400">Ref: {f.referent}</p>}
        </div>
      </div>

      {/* FOOTER DELLA CARD: KPI a sinistra, Questionari a destra */}
      <div className="mt-2 flex justify-between items-center pt-3 border-t border-slate-50">
        
        {/* TASTO KPI COMPATTO (Sinistra) */}
        <button 
          onClick={() => onKpiClick(f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all group shadow-sm ${f.isKpiGreen ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
          title={f.isKpiGreen ? "Dati in regola. Nessuna azione richiesta." : "Gestione KPI Mensili"}
        >
          {f.isKpiGreen ? <CheckCircle2 size={13} /> : <Activity size={13} className="group-hover:animate-pulse" />}
          <span className="text-[10px] font-black uppercase tracking-wider">KPI</span>
        </button>

        {/* QUESTIONARI (Destra) */}
        <div className="flex gap-1.5">
          {renderBtn('client', BarChart3, 'Clienti')}
          {renderBtn('operator', Database, 'Operatori')}
        </div>
      </div>
    </div>
  );
}