/**
 * src/App.js  —  v3
 * MODIFICHE v3:
 *  - Passa `onDirectorView` a FacilityCard: icona ExternalLink visibile
 *    solo per admin, naviga a /facility/:id per la vista direttore.
 *  - Passa `kpiRecords` a AnalyticsModal (necessario per staff_count operatori).
 *  - Anno futuro: FacilityCard ora mostra badge "KPI N/D" grigio
 *    grazie a _kpiFuture da statusCalculator v2.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  Settings, LogOut, ShieldCheck,
  Search, Grid2X2, Grid3X3, LayoutGrid, FileSignature, BarChart2, PawPrint
} from 'lucide-react';

import { useAuth }            from './contexts/AuthContext';
import { useModals }          from './contexts/ModalContext';
import { useDashboardData, useInvalidate } from './hooks/useDashboardData';
import { useEntityActions }   from './hooks/useEntityActions';
import { enrichFacilitiesData, calculateDashboardStats } from './utils/statusCalculator';
import { APP_CONFIG }         from './config/constants';

import Login                  from './Login';
import FacilityCard           from './components/FacilityCard';
import GlobalReportModal      from './components/GlobalReportModal';
import UdoManagerModal        from './components/UdoManagerModal';
import FacilityModal          from './components/FacilityModal';
import QuestionnaireModal     from './components/QuestionnaireModal';
import DataImportModal        from './components/DataImportModal';
import AnalyticsModal         from './components/AnalyticsModal';
import KpiManagerModal        from './components/KpiManagerModal';
import KpiDashboardModal      from './components/KpiDashboardModal';
import KpiChartsModal         from './components/KpiChartsModal';
import KpiHubModal            from './components/KpiHubModal';
import KpiLaserModal          from './components/KpiLaserModal';
import KpiXrayModal           from './components/KpiXrayModal';
import QualityDashboardModal  from './components/QualityDashboardModal';

function LoadingScreen({ message = 'Caricamento...' }) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-[0.2em]">
      {message}
    </div>
  );
}

function ProgressBar({ label, pct }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct ?? 0}%` }} />
        </div>
        <span className="text-xs font-black text-slate-700">{pct ?? 0}%</span>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { session, loading: authLoading, isAdmin, profile, signOut } = useAuth();
  const { modals, open, close } = useModals();
  const invalidate = useInvalidate();
  const actions    = useEntityActions();

  const [year, setYear]                         = useState(new Date().getFullYear());
  const [showSuspended, setShowSuspended]       = useState(false);
  const [gridCols, setGridCols]                 = useState('lg:grid-cols-4');
  const [filterUdo, setFilterUdo]               = useState('all');
  const [filterStatus, setFilterStatus]         = useState('all');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [dataTarget, setDataTarget]             = useState(null);

  const { loading: dataLoading, data, errors } = useDashboardData(year);

  useEffect(() => {
    errors.forEach(msg => toast.error(`Errore dati: ${msg}`, { id: msg }));
  }, [errors]);

  const processedData = useMemo(() => {
    const enriched = enrichFacilitiesData(data.facilities, data.surveys, data.kpiRecords, year, data.udos);
    return { list: enriched, ...calculateDashboardStats(enriched, 'all') };
  }, [data.facilities, data.surveys, data.kpiRecords, data.udos, year]);

  const filteredFacilities = useMemo(() => processedData.list.filter(f => {
    if (!showSuspended && f.is_suspended)                                     return false;
    if (!f.name.toLowerCase().includes(searchQuery.toLowerCase()))            return false;
    if (filterUdo    !== 'all' && String(f.udo_id) !== String(filterUdo))    return false;
    if (filterStatus === 'completed' && !f.isGreen)                          return false;
    if (filterStatus === 'progress'  && !f.isYellow)                         return false;
    if (filterStatus === 'todo'      && !f.isRed)                            return false;
    return true;
  }), [processedData.list, filterUdo, filterStatus, searchQuery, showSuspended]);

  const handleFacilitySave      = useCallback((d)  => actions.saveFacility(d, () => setSelectedFacility(null)), [actions]);
  const handleFacilityDelete    = useCallback((id) => actions.deleteFacility(id), [actions]);
  const handleSuspendToggle     = useCallback((f)  => actions.toggleSuspendFacility(f), [actions]);
  const handleQuestionnaireSave = useCallback((p)  => actions.saveQuestionnaire(p, year), [actions, year]);
  const handleUdoSave           = useCallback((d)  => actions.saveUdo(d), [actions]);
  const handleUdoDelete         = useCallback((id) => actions.deleteUdo(id), [actions]);

  const handleDataClick = useCallback((facility, type) => {
    const hasData = data.surveys.some(s =>
      s.type === type &&
      (s.facility_id === facility.id || (!s.facility_id && s.company_id === facility.company_id))
    );
    setDataTarget({ facility, type });
    open(hasData ? 'analytics' : 'dataImport');
  }, [data.surveys, open]);

  const handleEditFacility = useCallback((f) => {
    const fresh = data.facilities.find(x => x.id === f.id) || f;
    setSelectedFacility(fresh);
    open('facility');
  }, [data.facilities, open]);

  const handleKpiClick = useCallback((facility) => {
    setSelectedFacility(facility);
    open('kpiManager');
  }, [open]);

  // Naviga alla vista direttore per la struttura selezionata (solo admin)
  const handleDirectorView = useCallback((f) => {
    navigate(`/facility/${f.id}`);
  }, [navigate]);

  if (authLoading) return <LoadingScreen />;
  if (!session)    return <Login />;

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900 font-sans">
      <Toaster position="top-right" />

      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center mb-6 relative">
          <div className="flex items-center gap-4 w-1/3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
              <PawPrint size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter italic">
              QualiCAVA <span className="text-emerald-600 italic">GRUPPO OVER</span>
            </h1>
          </div>

          <div className="w-1/3" />

          <div className="flex items-center justify-end gap-3 w-1/3">
            <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm">
              <input type="checkbox" checked={showSuspended} onChange={e => setShowSuspended(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 cursor-pointer" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sospese</span>
            </label>

            <button onClick={() => open('globalReport')}
              className="bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2">
              <FileSignature size={16} /> Report
            </button>

            <button onClick={() => open('qualityDashboard')}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-emerald-100 transition-colors flex items-center gap-2">
              <ShieldCheck size={16} /> Qualità
            </button>

            <button onClick={() => open('kpiHub')}
              className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-2">
              <BarChart2 size={16} /> KPI
            </button>

            {isAdmin && (
              <>
                <button onClick={() => open('udo')}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-emerald-100 transition-colors flex items-center gap-2">
                  <Settings size={16} /> UDO
                </button>
                <button onClick={() => { setSelectedFacility(null); open('facility'); }}
                  className="bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2">
                  + Struttura
                </button>
              </>
            )}

            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="text-sm font-black bg-slate-50 px-3 py-3 rounded-xl border border-slate-200 outline-none cursor-pointer">
              {APP_CONFIG.YEARS_AVAILABLE.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest max-w-[80px] truncate">
                {profile?.full_name?.split(' ')[0] ?? 'Utente'}
              </span>
              <button onClick={signOut} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Barra filtri */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" placeholder="Cerca struttura..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <select value={filterUdo} onChange={e => setFilterUdo(e.target.value)}
            className="text-[16px] font-black bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 uppercase outline-none shadow-sm cursor-pointer">
            <option value="all">Tutte le UDO</option>
            {data.udos.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-[16px] font-black bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 uppercase outline-none shadow-sm cursor-pointer">
            <option value="all">Tutti ({processedData.counts?.all ?? 0})</option>
            <option value="todo">⚪ Da iniziare ({processedData.counts?.todo ?? 0})</option>
            <option value="progress">🟣 In corso ({processedData.counts?.progress ?? 0})</option>
            <option value="completed">🟢 Completati ({processedData.counts?.completed ?? 0})</option>
          </select>

          <div className="flex items-center gap-4 px-2">
            <ProgressBar label="Clienti" pct={processedData.clientPct} />
            <ProgressBar label="Staff"   pct={processedData.staffPct} />
          </div>

          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 px-6 py-3 rounded-2xl ml-2 shadow-sm">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-tight text-right">
              Posti Letto<br />Attivi
            </span>
            <span className="text-3xl font-black text-emerald-600">{processedData.totalBeds}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-200 p-2 rounded-2xl ml-auto">
            {[
              { cols: 'lg:grid-cols-4', Icon: Grid2X2 },
              { cols: 'lg:grid-cols-6', Icon: Grid3X3 },
              { cols: 'lg:grid-cols-8', Icon: LayoutGrid },
            ].map(({ cols, Icon }) => (
              <button key={cols} onClick={() => setGridCols(cols)}
                className={`p-3 rounded-xl transition-all ${gridCols === cols ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-500'}`}>
                <Icon size={24} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-10 py-12">
        {dataLoading ? (
          <div className="flex items-center justify-center py-32 text-slate-400 font-black uppercase tracking-widest">
            Caricamento strutture...
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="flex items-center justify-center py-32 text-slate-400 font-black uppercase tracking-widest">
            Nessuna struttura trovata
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridCols} gap-10`}>
            {filteredFacilities.map(f => (
              <FacilityCard
                key={f.id}
                f={f}
                gridCols={gridCols}
                onEdit={handleEditFacility}
                onSuspendToggle={handleSuspendToggle}
                onKpiClick={handleKpiClick}
                onDataClick={handleDataClick}
                onDirectorView={isAdmin ? handleDirectorView : undefined}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <UdoManagerModal isOpen={modals.udo} onClose={() => close('udo')} udos={data.udos} onSave={handleUdoSave} onDelete={handleUdoDelete} />
      <FacilityModal isOpen={modals.facility} onClose={() => close('facility')} udos={data.udos} facility={selectedFacility} onSave={handleFacilitySave} onDelete={handleFacilityDelete} />
      <QuestionnaireModal isOpen={modals.questionnaire} onClose={() => close('questionnaire')} info={selectedFacility} year={year} questionnaires={data.questionnaires} onSave={handleQuestionnaireSave} />

      {selectedFacility && (
        <KpiManagerModal key={`kpi-${selectedFacility.id}`} isOpen={modals.kpiManager} onClose={() => close('kpiManager')} facility={selectedFacility} year={year} onUpdateSuccess={() => invalidate.kpiRecords(year)} />
      )}

      {dataTarget && (
        <>
          <DataImportModal isOpen={modals.dataImport} onClose={() => close('dataImport')} facility={dataTarget.facility} type={dataTarget.type} year={year} onUploadSuccess={() => invalidate.surveys(year)} />
          <AnalyticsModal
            isOpen={modals.analytics}
            onClose={() => close('analytics')}
            facility={dataTarget.facility}
            type={dataTarget.type}
            surveys={data.surveys}
            facilities={data.facilities}
            udos={data.udos}
            kpiRecords={data.kpiRecords}
            onOpenImport={() => { close('analytics'); open('dataImport'); }}
            onUpdateSuccess={() => invalidate.surveys(year)}
          />
        </>
      )}

      <KpiChartsModal isOpen={modals.kpiCharts} onClose={() => close('kpiCharts')} facilities={data.facilities} udos={data.udos} kpiRecords={data.kpiRecords} year={Number(year)} />
      <GlobalReportModal isOpen={modals.globalReport} onClose={() => close('globalReport')} facilities={data.facilities} udos={data.udos} surveys={data.surveys} kpiRecords={data.kpiRecords} />
      <KpiDashboardModal isOpen={modals.kpiDashboard} onClose={() => close('kpiDashboard')} facilities={data.facilities} udos={data.udos} kpiRecords={data.kpiRecords} year={Number(year)} />
      <KpiHubModal isOpen={modals.kpiHub} onClose={() => close('kpiHub')} onSelect={(view) => { close('kpiHub'); open(view); }} />
      <KpiLaserModal isOpen={modals.kpiLaser} onClose={() => close('kpiLaser')} facilities={data.facilities} udos={data.udos} kpiRecords={data.kpiRecords} year={Number(year)} />
      <KpiXrayModal isOpen={modals.kpiXray} onClose={() => close('kpiXray')} facilities={data.facilities} kpiRecords={data.kpiRecords} year={Number(year)} />
      <QualityDashboardModal isOpen={modals.qualityDashboard} onClose={() => close('qualityDashboard')} facilities={data.facilities} udos={data.udos} kpiRecords={data.kpiRecords} surveys={data.surveys} year={Number(year)} isSuperAdmin={profile?.role === 'superadmin'} />
    </div>
  );
}
