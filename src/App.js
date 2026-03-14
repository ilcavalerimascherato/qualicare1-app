import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Users, UserCog, Calendar, Settings, LogOut, Search, Grid2X2, Grid3X3, LayoutGrid, FileSignature, BarChart2, PawPrint } from 'lucide-react';
import GlobalReportModal from './components/GlobalReportModal';
import { supabase } from './supabaseClient';
import { udoService, facilityService } from './services/supabaseService';
import Login from './Login';
import UdoManagerModal from './components/UdoManagerModal';
import FacilityModal from './components/FacilityModal';
import QuestionnaireModal from './components/QuestionnaireModal';
import FacilityCard from './components/FacilityCard';
import DataImportModal from './components/DataImportModal';
import AnalyticsModal from './components/AnalyticsModal';
import KpiManagerModal from './components/KpiManagerModal';
import KpiDashboardModal from './components/KpiDashboardModal';
import KpiChartsModal from './components/KpiChartsModal';
import KpiHubModal from './components/KpiHubModal';
import KpiLaserModal from './components/KpiLaserModal';
import KpiXrayModal from './components/KpiXrayModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeUdo, setActiveUdo] = useState('all');
  const [showSuspended, setShowSuspended] = useState(false);
  
  const [data, setData] = useState({ facilities: [], surveys: [], udos: [], kpiRecords: [] });
  const [modals, setModals] = useState({ udo: false, facility: false, q: false, dataImport: false, analytics: false, kpi: false, globalReport: false, kpiDashboard:false, kpiCharts: false, kpiHub: false, kpiLaser: false, kpiXray: false });
  const [selected, setSelected] = useState({ facility: null, q: null, dataTarget: null });

  // TOGGLE SOSPENSIONE STRUTTURA
  const handleSuspendToggle = async (facility) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ is_suspended: !facility.is_suspended })
        .eq('id', facility.id);
      if (error) throw error;
      fetchAll();
    } catch (err) {
      alert("Errore sospensione: " + err.message);
    }
  };

  // CALCOLO PERCENTUALI COMPLETAMENTO (Relazioni AI Archiviate)
  const activeFacilities = data.facilities.filter(f => !f.is_suspended && (activeUdo === 'all' || f.udo_id === activeUdo));
  const totalActive = activeFacilities.length || 1;

  const clientDone = activeFacilities.filter(f => 
    data.surveys.some(s => s.type === 'client' && (s.facility_id === f.id || (!s.facility_id && s.company_id === f.company_id)) && (s.ai_report_ospiti || s.ai_report_direzione))
  ).length;

  const staffDone = activeFacilities.filter(f => 
    data.surveys.some(s => s.type === 'operator' && (s.facility_id === f.id || (!s.facility_id && s.company_id === f.company_id)) && (s.ai_report_ospiti || s.ai_report_direzione))
  ).length;

  const clientPct = Math.round((clientDone / totalActive) * 100);
  const staffPct = Math.round((staffDone / totalActive) * 100);

  // Filtro Finale per la griglia
  const displayedFacilities = data.facilities.filter(f => {
    if (activeUdo !== 'all' && f.udo_id !== activeUdo) return false;
    if (!showSuspended && f.is_suspended) return false;
    return true;
  });

  const [gridCols, setGridCols] = useState('lg:grid-cols-8');
  const [filterUdo, setFilterUdo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setLoading(false); });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!session) return;
    try {
      // Sparo 5 query in parallelo per la massima velocità
      const [uRes, fRes, qRes, sRes, kRes] = await Promise.all([
        supabase.from('udos').select('*').order('name', { ascending: true }),
        supabase.from('facilities').select('*').order('name', { ascending: true }), 
        supabase.from('questionnaires').select('*').like('calendar_id', `${year}-%`),
        supabase.from('survey_data').select('*').like('calendar_id', `${year}-%`),
        supabase.from('fact_kpi_monthly').select('*').in('year', [year, year - 1])
      ]);
      
      setData({ 
        udos: uRes.data || [], 
        facilities: fRes.data || [], 
        questionnaires: qRes.data || [], 
        surveys: sRes.data || [],
        kpiRecords: kRes.data || [] // <--- SALVATAGGIO STATO QUI
      });
    } catch (err) { console.error("Fetch error:", err); }
  }, [session, year]);

  useEffect(() => { if (session) fetchAll(); }, [session, fetchAll]);

// NUOVO MOTORE STATI (Basato su IA e Dati Survey)
  const processedData = useMemo(() => {
    const list = displayedFacilities.map(f => {
      // Cerca i dati del questionario per questa struttura (o per la sua società)
      const cSurveys = data.surveys.filter(s => s.type === 'client' && (s.facility_id === f.id || (!s.facility_id && s.company_id === f.company_id)));
      const oSurveys = data.surveys.filter(s => s.type === 'operator' && (s.facility_id === f.id || (!s.facility_id && s.company_id === f.company_id)));

      const cSurvey = cSurveys.sort((a,b) => b.calendar_id.localeCompare(a.calendar_id))[0];
      const oSurvey = oSurveys.sort((a,b) => b.calendar_id.localeCompare(a.calendar_id))[0];

      const hasClientData = !!cSurvey;
      const hasStaffData = !!oSurvey;

      const clientCompleted = cSurvey && (cSurvey.ai_report_ospiti || cSurvey.ai_report_direzione);
      const staffCompleted = oSurvey && (oSurvey.ai_report_ospiti || oSurvey.ai_report_direzione);

      // Logica del semaforo IA
      const isGreen = clientCompleted && staffCompleted;
      const isRed = !hasClientData && !hasStaffData;
      const isYellow = !isGreen && !isRed; // Indaco (Dati presenti ma non tutte le relazioni IA sono archiviate)

      // CALCOLO SEMAFORO KPI
      const currentYearNum = new Date().getFullYear();
      const selectedYearNum = Number(year);
      const currentMonth = new Date().getMonth() + 1;
      
      let actionableMonths = [];
      if (selectedYearNum < currentYearNum) {
        actionableMonths = [1,2,3,4,5,6,7,8,9,10,11,12];
      } else if (selectedYearNum === currentYearNum) {
        for(let i=1; i<currentMonth; i++) actionableMonths.push(i);
      }

      // Filtro forzando la conversione in stringa per gli ID e numero per i Mesi
      const fKpis = data.kpiRecords?.filter(k => 
        String(k.facility_id) === String(f.id) && 
        Number(k.year) === selectedYearNum && 
        k.status === 'completed'
      ) || [];
      
      const completedMonths = fKpis.map(k => Number(k.month));
      
      // Se non ci sono mesi azionabili (es. siamo a Gennaio 2026), diamo il verde di default.
      const isKpiGreen = actionableMonths.length === 0 ? true : actionableMonths.every(m => completedMonths.includes(m));
      
      // Aggiungi isKpiGreen al return
      return { ...f, isGreen, isYellow, isRed, isKpiGreen };

      return { ...f, isGreen, isYellow, isRed };
    });

    // Calcoliamo i contatori SOLO sulle strutture NON sospese
    const activeList = list.filter(f => !f.is_suspended);
    const totalBeds = activeList.reduce((sum, f) => sum + (f.bed_count || f.posti_letto || 0), 0);

    return {
      list,
      counts: {
        all: activeList.length,
        todo: activeList.filter(x => x.isRed).length,
        progress: activeList.filter(x => x.isYellow).length,
        completed: activeList.filter(x => x.isGreen).length
      },
      totalBeds
    };
  }, [displayedFacilities, data.surveys]);

  const filteredFacilities2 = useMemo(() => {
    return processedData.list.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchUdo = filterUdo === 'all' || String(f.udo_id) === String(filterUdo);
      if (!matchSearch || !matchUdo) return false;
      
      // Controllo semaforo questionari
      if (filterStatus === 'completed' && !f.isGreen) return false;
      if (filterStatus === 'progress' && !f.isYellow) return false;
      if (filterStatus === 'todo' && !f.isRed) return false;
      
      return true;
    });
  }, [processedData.list, filterUdo, filterStatus, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-[0.2em]">Caricamento...</div>;
  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900 font-sans">
      
<header className="bg-white border-b px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-6 relative">
          
          {/* SINISTRA: LOGO */}
          <div className="flex items-center gap-4 w-1/3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><PawPrint size={24} /></div>
            <h1 className="text-xl font-black tracking-tighter italic">Qualità <span className="text-indigo-600 italic">GRUPPO OVER</span></h1>
          </div>

          {/* CENTRO: BARRE AI (Ora perfettamente bilanciate in mezzo) */}
          <div className="hidden lg:flex items-center justify-center gap-8 w-1/3 border-x border-slate-100 px-4">
            <div className="flex flex-col items-center" title="Relazioni Clienti/Ospiti Archiviate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Clienti</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${clientPct || 0}%` }}></div>
                </div>
                <span className="text-xs font-black text-slate-700">{clientPct || 0}%</span>
              </div>
            </div>
            <div className="flex flex-col items-center" title="Relazioni Staff Archiviate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Staff</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${staffPct || 0}%` }}></div>
                </div>
                <span className="text-xs font-black text-slate-700">{staffPct || 0}%</span>
              </div>
            </div>
          </div>

          {/* PLANCIA DI COMANDO (DESTRA) */}
          <div className="flex items-center justify-end gap-3 w-1/3">
            <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm">
              <input type="checkbox" checked={showSuspended} onChange={(e) => setShowSuspended(e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sospese</span>
            </label>

            {/* ---> TASTO RELAZIONI GLOBALI <--- */}
            <button 
              onClick={() => setModals({...modals, globalReport: true})} 
              className="bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2"
              title="Centro Relazioni Direzionali"
            >
              <FileSignature size={16} /> Report
            </button>

            {/* TASTO HUB ANALITICO */}
            <button 
              onClick={() => setModals({...modals, kpiHub: true})} 
              className="bg-slate-100 text-slate-600 p-3 rounded-xl shadow-sm hover:bg-slate-200 transition-colors flex items-center justify-center"
              title="Centro di Analisi Quantitativa"
            >
              <LayoutGrid size={20} />
            </button>

            <button onClick={() => { setSelected({...selected, facility: null}); setModals({...modals, facility: true}); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-indigo-700 transition-colors">
              Nuova Struttura
            </button>
            
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
              <Calendar size={18} className="text-indigo-600" />
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-transparent font-black text-slate-700 outline-none cursor-pointer">
                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <button onClick={() => setModals({...modals, udo: true})} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <Settings size={22}/>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-rose-500 p-3 hover:bg-rose-50 rounded-xl transition-colors">
              <LogOut size={22}/>
            </button>
          </div>
        </div>

        {/* BARRA FILTRI E RICERCA */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="flex items-center gap-6 grow max-w-6xl">
            <div className="relative flex-1">
              <Search size={22} className="absolute left-4 top-3.5 text-slate-400" />
              <input type="text" placeholder="Cerca struttura..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-[16px] font-bold bg-slate-50 pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 transition-all shadow-inner" />
            </div>
            <select value={filterUdo} onChange={e => setFilterUdo(e.target.value)} className="text-[16px] font-black bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 uppercase outline-none">
              <option value="all">Tutte le UDO</option>
              {data.udos.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-[16px] font-black bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 uppercase outline-none shadow-sm cursor-pointer">
              <option value="all">Tutti ({processedData.counts.all})</option>
              <option value="todo">⚪ Da Iniziare ({processedData.counts.todo})</option>
              <option value="progress">🟣 In Corso ({processedData.counts.progress})</option>
              <option value="completed">🟢 Completati ({processedData.counts.completed})</option>
            </select>
          </div>
          
          {/* BOX POSTI LETTO ATTIVI */}
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 px-6 py-3 rounded-2xl ml-6 shadow-sm">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-tight text-right">Posti Letto<br/>Attivi</span>
            <span className="text-3xl font-black text-indigo-700">{processedData.totalBeds}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-200 p-2 rounded-2xl ml-8">
            <button onClick={() => setGridCols('lg:grid-cols-4')} className={`p-3 rounded-xl transition-all ${gridCols === 'lg:grid-cols-4' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-500'}`}><Grid2X2 size={24}/></button>
            <button onClick={() => setGridCols('lg:grid-cols-6')} className={`p-3 rounded-xl transition-all ${gridCols === 'lg:grid-cols-6' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-500'}`}><Grid3X3 size={24}/></button>
            <button onClick={() => setGridCols('lg:grid-cols-8')} className={`p-3 rounded-xl transition-all ${gridCols === 'lg:grid-cols-8' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-500'}`}><LayoutGrid size={24}/></button>
          </div>
        </div>
      </header>

      <main className="px-10 py-12">
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridCols} gap-10`}>
          {filteredFacilities2.map(f => (
            <FacilityCard 
              key={f.id} 
              f={f} 
              surveys={data.surveys}
              udos={data.udos}
              gridCols={gridCols} 
              onEdit={() => { setSelected({...selected, facility: f}); setModals({...modals, facility: true}); }} 
              onSuspendToggle={handleSuspendToggle}
              
              /* ---> INSERISCI QUI IL PUNTO 3 <--- */
              onKpiClick={(facility) => { setSelected({...selected, facility}); setModals({...modals, kpi: true}); }}
              
              onDataClick={(facility, type) => { 
                const hasData = data.surveys.some(s => 
                  s.type === type && 
                  (s.facility_id === facility.id || (!s.facility_id && s.company_id === facility.company_id))
                );
                setSelected({...selected, dataTarget: {facility, type}}); 
                if (hasData) {
                  setModals({...modals, analytics: true});
                } else {
                  setModals({...modals, dataImport: true});
                }
              }}
            />
          ))}
        </div>
      </main>

      {/* TUTTI I MODAL (INALTERATI) */}
      <UdoManagerModal isOpen={modals.udo} onClose={() => setModals({...modals, udo: false})} udos={data.udos} onSave={async (d) => { await udoService.save(d); fetchAll(); }} onDelete={async (id) => { if(window.confirm("Eliminare?")) { await udoService.delete(id); fetchAll(); }}} />
      <FacilityModal isOpen={modals.facility} onClose={() => setModals({...modals, facility: false})} udos={data.udos} facility={selected.facility} onSave={async (d) => { await facilityService.save(d); setModals({...modals, facility: false}); fetchAll(); }} onDelete={async (id) => { if(window.confirm("Eliminare?")) { await facilityService.delete(id); setModals({...modals, facility: false}); fetchAll(); }}} />
      
      <QuestionnaireModal 
        isOpen={modals.q} 
        onClose={() => setModals({...modals, q: false})} 
        info={selected.q} 
        year={year} 
        questionnaires={data.questionnaires} 
        onSave={async (p) => { 
          try { 
            const { error } = await supabase.from('questionnaires').upsert({
              facility_id: p.facility_id,
              year: p.year,
              type: p.type,
              calendar_id: `${p.year}-12`,
              start_date: p.start_date || null,
              end_date: p.end_date || null,
              esiti_pdf: p.esiti_pdf || null
            }, { onConflict: 'facility_id, type, calendar_id' });
            if (error) throw error; 
            await fetchAll(); 
            setModals(m => ({...m, q: false}));
          } catch (err) { alert("Errore DB: " + err.message); } 
        }} 
      />

      {/* MODAL GESTIONE KPI */}
      {selected.facility && (
        <KpiManagerModal
          key={`kpi-modal-${selected.facility.id}`} /* <--- IL SIGILLO: Distrugge e ricrea la modale per ogni struttura */
          isOpen={modals.kpi}
          onClose={() => setModals({...modals, kpi: false})}
          facility={selected.facility}
          year={year}
          onUpdateSuccess={fetchAll}
        />
      )}

      {selected.dataTarget && (
        <DataImportModal
          isOpen={modals.dataImport}
          onClose={() => setModals({...modals, dataImport: false})}
          facility={selected.dataTarget.facility}
          type={selected.dataTarget.type}
          year={year} 
          onUploadSuccess={fetchAll} 
        />
      )}

      {selected.dataTarget && (
        <AnalyticsModal
          isOpen={modals.analytics}
          onClose={() => setModals({...modals, analytics: false})}
          facility={selected.dataTarget.facility}
          type={selected.dataTarget.type}
          surveys={data.surveys}
          facilities={data.facilities}
          udos={data.udos}
          onOpenImport={() => {
            setModals({...modals, analytics: false, dataImport: true});
          }}
          onUpdateSuccess={fetchAll}
        />
      )}

       {/* MODAL ISTOGRAMMI (Recharts) */}
       <KpiChartsModal
        isOpen={modals.kpiCharts}
        onClose={() => setModals({...modals, kpiCharts: false})}
        facilities={data.facilities}
        udos={data.udos}
        kpiRecords={data.kpiRecords || []}
        year={Number(year)}
      />
       
       <GlobalReportModal
        isOpen={modals.globalReport}
        onClose={() => setModals({...modals, globalReport: false})}
        facilities={data.facilities}
        udos={data.udos}
        surveys={data.surveys}
      />

       {/* MODAL HEATMAP KPI */}
       <KpiDashboardModal
        isOpen={modals.kpiDashboard}
        onClose={() => setModals({...modals, kpiDashboard: false})}
        facilities={data.facilities}
        kpiRecords={data.kpiRecords || []}
        year={Number(year)}
      />

       <KpiHubModal
        isOpen={modals.kpiHub}
        onClose={() => setModals({...modals, kpiHub: false})}
        onSelect={(view) => {
          setModals({...modals, kpiHub: false, [view]: true});
        }}
      />

       <KpiLaserModal
        isOpen={modals.kpiLaser}
        onClose={() => setModals({...modals, kpiLaser: false})}
        facilities={data.facilities}
        udos={data.udos}
        kpiRecords={data.kpiRecords || []}
        year={Number(year)}
      />

       <KpiXrayModal
        isOpen={modals.kpiXray}
        onClose={() => setModals({...modals, kpiXray: false})}
        facilities={data.facilities}
        kpiRecords={data.kpiRecords || []}
        year={Number(year)}
      />
    </div>
  );
}