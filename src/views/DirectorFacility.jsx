// src/views/DirectorFacility.jsx
// Dashboard completa per il direttore di una struttura specifica.
// Tab: Panoramica · KPI · Survey · Report AI · Non Conformità · Benchmark
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  PawPrint, LogOut, ArrowLeft, Activity, BarChart3, Database,
  FileText, AlertTriangle, TrendingUp, CheckCircle2, Clock,
  Plus, Save, X, Loader2
} from 'lucide-react';

import { useAuth }                          from '../contexts/AuthContext';
import { useModals }                        from '../contexts/ModalContext';
import { useDashboardData, useInvalidate }  from '../hooks/useDashboardData';
import { enrichFacilitiesData }             from '../utils/statusCalculator';
import { supabase }                         from '../supabaseClient';

import KpiManagerModal  from '../components/KpiManagerModal';
import DataImportModal  from '../components/DataImportModal';
import AnalyticsModal   from '../components/AnalyticsModal';

const TABS = [
  { id: 'overview',         label: 'Panoramica',     Icon: Activity      },
  { id: 'kpi',              label: 'KPI Mensili',    Icon: BarChart3     },
  { id: 'surveys',          label: 'Survey',         Icon: Database      },
  { id: 'reports',          label: 'Report AI',      Icon: FileText      },
  { id: 'non_conformities', label: 'Non Conformità', Icon: AlertTriangle },
  { id: 'benchmark',        label: 'Benchmark',      Icon: TrendingUp    },
];

const NC_CATEGORIES = [
  'Sicurezza', 'Qualità delle cure', 'Documentazione',
  'Strutturale / Manutenzione', 'Personale', 'Igiene / Pulizia',
  'Gestione farmaci', 'Comunicazione', 'Altro',
];

const NC_SOURCES = [
  'Survey clienti', 'Survey operatori', 'Ispezione interna',
  'Audit esterno', 'Segnalazione interna', 'Segnalazione familiare',
  'Evento avverso',
];

export default function DirectorFacility() {
  const { facilityId }                    = useParams();
  const navigate                          = useNavigate();
  const { profile, isAdmin, signOut }     = useAuth();
  const { modals, open, close }           = useModals();
  const invalidate                        = useInvalidate();
  const [activeTab, setActiveTab]         = useState('overview');
  const [dataTarget, setDataTarget]       = useState(null);
  const year = new Date().getFullYear();

  const { data, loading } = useDashboardData(year);

  // Struttura corrente arricchita
  const facility = useMemo(() => {
    const raw = data.facilities.find(f => String(f.id) === String(facilityId));
    if (!raw) return null;
    const enriched = enrichFacilitiesData([raw], data.surveys, data.kpiRecords, year, data.udos);
    return enriched[0] || null;
  }, [data, facilityId, year]);

  // Survey della struttura corrente
  const facilitySurveys = useMemo(() =>
    data.surveys.filter(s =>
      String(s.facility_id) === String(facilityId) ||
      (!s.facility_id && s.company_id === facility?.company_id)
    ), [data.surveys, facilityId, facility]);

  const hasMultipleFacilities = (profile?.accessibleFacilityIds?.length ?? 0) > 1;

  const handleDataClick = (type) => {
    const hasData = facilitySurveys.some(s => s.type === type);
    setDataTarget({ facility, type });
    open(hasData ? 'analytics' : 'dataImport');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <span className="font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
          Caricamento...
        </span>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 font-medium mb-3">
            Struttura non trovata o accesso non autorizzato.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 font-bold text-sm hover:underline"
          >
            ← Torna alla home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow">
              <PawPrint size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {(hasMultipleFacilities || isAdmin) && (
                  <Link
                    to={isAdmin ? '/admin' : '/director'}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </Link>
                )}
                <h1
                  className="text-base font-black tracking-tight"
                  style={{ color: facility.udo_color || '#4f46e5' }}
                >
                  {facility.name}
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {facility.udo_name} {facility.region ? `· ${facility.region}` : ''}
                {facility.bed_count > 0 ? ` · ${facility.bed_count} posti letto` : ''}
              </p>
            </div>
          </div>

          {/* Semafori compatti */}
          <div className="hidden md:flex items-center gap-2">
            <StatusPill label="Survey"  isOk={facility.isGreen}    isPartial={facility.isYellow} />
            <StatusPill label="KPI"     isOk={facility.isKpiGreen} />
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Esci
          </button>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Contenuto tab */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab facility={facility} surveys={facilitySurveys} year={year} />
        )}
        {activeTab === 'kpi' && (
          <KpiTab
            facility={facility}
            kpiRecords={data.kpiRecords}
            year={year}
            onOpenManager={() => open('kpiManager')}
          />
        )}
        {activeTab === 'surveys' && (
          <SurveysTab
            facility={facility}
            surveys={facilitySurveys}
            onDataClick={handleDataClick}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab surveys={facilitySurveys} />
        )}
        {activeTab === 'non_conformities' && (
          <NonConformitiesTab
            facility={facility}
            year={year}
            profile={profile}
            onNew={() => open('nonConformity')}
          />
        )}
        {activeTab === 'benchmark' && (
          <BenchmarkTab facility={facility} year={year} />
        )}
      </main>

      {/* Modal */}
      <KpiManagerModal
        key={`kpi-${facility.id}`}
        isOpen={modals.kpiManager}
        onClose={() => close('kpiManager')}
        facility={facility}
        year={year}
        onUpdateSuccess={() => invalidate.kpiRecords(year)}
      />

      {dataTarget && (
        <>
          <DataImportModal
            isOpen={modals.dataImport}
            onClose={() => close('dataImport')}
            facility={dataTarget.facility}
            type={dataTarget.type}
            year={year}
            onUploadSuccess={() => { invalidate.surveys(year); toast.success('Dati caricati'); }}
          />
          <AnalyticsModal
            isOpen={modals.analytics}
            onClose={() => close('analytics')}
            facility={dataTarget.facility}
            type={dataTarget.type}
            surveys={facilitySurveys}
            facilities={data.facilities}
            udos={data.udos}
            onOpenImport={() => { close('analytics'); open('dataImport'); }}
            onUpdateSuccess={() => invalidate.surveys(year)}
          />
        </>
      )}

      {modals.nonConformity && (
        <NcFormModal
          facility={facility}
          year={year}
          profile={profile}
          onClose={() => close('nonConformity')}
          onSaved={() => {
            close('nonConformity');
            toast.success('Non conformità registrata');
          }}
        />
      )}
    </div>
  );
}

// ── Componenti Tab ────────────────────────────────────────────

function StatusPill({ label, isOk, isPartial }) {
  const cfg = isOk
    ? { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', state: 'OK' }
    : isPartial
    ? { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  state: 'Parziale' }
    : { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400',     state: 'Da fare' };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {label}: {cfg.state}
    </div>
  );
}

function OverviewTab({ facility: f, surveys, year }) {
  const clientSurvey   = surveys.filter(s => s.type === 'client').sort((a,b) => b.calendar_id.localeCompare(a.calendar_id))[0];
  const operatorSurvey = surveys.filter(s => s.type === 'operator').sort((a,b) => b.calendar_id.localeCompare(a.calendar_id))[0];

  const cards = [
    {
      label:  'Survey Clienti',
      value:  f.clientStatus === 'completed' ? 'Completata' : f.clientStatus === 'pending' ? 'In elaborazione' : 'Da avviare',
      isOk:   f.clientStatus === 'completed',
      detail: clientSurvey ? `Caricata: ${new Date(clientSurvey.created_at).toLocaleDateString('it')}` : 'Nessun dato',
    },
    {
      label:  'Survey Operatori',
      value:  f.staffStatus === 'completed' ? 'Completata' : f.staffStatus === 'pending' ? 'In elaborazione' : 'Da avviare',
      isOk:   f.staffStatus === 'completed',
      detail: operatorSurvey ? `Caricata: ${new Date(operatorSurvey.created_at).toLocaleDateString('it')}` : 'Nessun dato',
    },
    {
      label:  'KPI Mensili',
      value:  f.isKpiGreen ? 'In regola' : 'Mesi mancanti',
      isOk:   f.isKpiGreen,
      detail: `Anno ${year}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-white rounded-2xl border p-5 ${c.isOk ? 'border-emerald-200' : 'border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{c.label}</p>
            <div className="flex items-center gap-2 mb-1">
              {c.isOk ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Clock size={18} className="text-amber-500" />}
              <span className="font-black text-slate-800">{c.value}</span>
            </div>
            <p className="text-xs text-slate-400">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-black text-slate-700 mb-4">Dettagli struttura</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            ['Nome',         f.name],
            ['Tipo (UDO)',   f.udo_name],
            ['Regione',      f.region],
            ['Indirizzo',    f.address],
            ['Direttore',    f.director],
            ['Referente Q.', f.referent],
            ['Posti letto',  f.bed_count || null],
          ].filter(([,v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-400 font-medium">{k}</dt>
              <dd className="font-bold text-slate-700">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function KpiTab({ facility, kpiRecords, year, onOpenManager }) {
  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const now    = new Date();
  const currentMonth  = now.getMonth() + 1;
  const isCurrentYear = Number(year) === now.getFullYear();

  const facilityKpis = kpiRecords.filter(k =>
    String(k.facility_id) === String(facility.id) && Number(k.year) === year
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-black text-slate-800 text-lg">KPI Mensili {year}</h2>
          <p className="text-sm text-slate-400 mt-0.5">Inserisci i dati per ogni mese completato</p>
        </div>
        <button
          onClick={onOpenManager}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow"
        >
          <Activity size={15} /> Gestisci KPI
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {months.map((m, i) => {
          const monthNum  = i + 1;
          const isFuture  = isCurrentYear && monthNum >= currentMonth;
          const record    = facilityKpis.find(k => Number(k.month) === monthNum);
          const isDone    = record?.status === 'completed';
          const isDraft   = record?.status === 'draft';

          return (
            <button
              key={m}
              onClick={!isFuture ? onOpenManager : undefined}
              disabled={isFuture}
              className={`rounded-xl p-3 border text-center transition-all ${
                isFuture ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                : isDone  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                : isDraft ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                :           'bg-white border-rose-200 hover:border-rose-400 hover:shadow-sm'
              }`}
            >
              <p className="text-xs font-bold text-slate-500 uppercase">{m}</p>
              <div className="mt-2 flex justify-center">
                {isFuture  ? <Clock size={16} className="text-slate-300" />
                : isDone   ? <CheckCircle2 size={16} className="text-emerald-500" />
                : isDraft  ? <Clock size={16} className="text-amber-500" />
                :            <AlertTriangle size={16} className="text-rose-500" />}
              </div>
              <p className={`text-[10px] font-bold mt-1 ${
                isFuture ? 'text-slate-300'
                : isDone  ? 'text-emerald-600'
                : isDraft ? 'text-amber-600'
                :           'text-rose-600'
              }`}>
                {isFuture ? '—' : isDone ? 'OK' : isDraft ? 'Bozza' : 'Mancante'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SurveysTab({ facility, surveys, onDataClick }) {
  const clientSurveys   = surveys.filter(s => s.type === 'client').sort((a,b) => b.calendar_id.localeCompare(a.calendar_id));
  const operatorSurveys = surveys.filter(s => s.type === 'operator').sort((a,b) => b.calendar_id.localeCompare(a.calendar_id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SurveySection
        title="Survey Clienti / Ospiti"
        Icon={BarChart3}
        surveys={clientSurveys}
        color="indigo"
        onDataClick={() => onDataClick('client')}
      />
      <SurveySection
        title="Survey Operatori / Staff"
        Icon={Database}
        surveys={operatorSurveys}
        color="purple"
        onDataClick={() => onDataClick('operator')}
      />
    </div>
  );
}

function SurveySection({ title, Icon, surveys, color, onDataClick }) {
  const latest = surveys[0];
  const C = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700' },
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className={`${C.bg} ${C.border} border-b px-5 py-4 flex items-center gap-3`}>
        <Icon size={18} className={C.text} />
        <h3 className={`font-black ${C.text} text-sm`}>{title}</h3>
      </div>
      <div className="p-5 space-y-4">
        {latest ? (
          <div className="text-sm space-y-1">
            <p className="text-slate-600">
              <span className="font-bold">Ultimo caricamento:</span>{' '}
              {new Date(latest.created_at).toLocaleDateString('it', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            {(latest.ai_report_ospiti || latest.ai_report_direzione) && (
              <p className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Report AI disponibile
              </p>
            )}
            <p className="text-xs text-slate-400">{surveys.length} caricamento{surveys.length !== 1 ? 'i' : ''} totali</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nessun dato caricato.</p>
        )}
        <button
          onClick={onDataClick}
          className={`flex items-center gap-2 ${C.btn} text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors`}
        >
          <Plus size={13} /> {latest ? 'Gestisci dati' : 'Carica dati'}
        </button>
      </div>
    </div>
  );
}

function ReportsTab({ surveys }) {
  const withReport = surveys
    .filter(s => s.ai_report_ospiti || s.ai_report_direzione)
    .sort((a,b) => b.calendar_id.localeCompare(a.calendar_id));

  if (withReport.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <FileText size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">Nessun report AI disponibile.</p>
        <p className="text-slate-400 text-sm mt-1">I report vengono generati dopo il caricamento dei dati survey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-black text-slate-800 text-lg">Report AI generati</h2>
      {withReport.map(s => (
        <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              s.type === 'client' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
            }`}>
              {s.type === 'client' ? 'Clienti / Ospiti' : 'Operatori / Staff'}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(s.created_at).toLocaleDateString('it', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          {s.ai_report_ospiti && (
            <div className="mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Report ospiti/staff</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
                {s.ai_report_ospiti}
              </p>
            </div>
          )}
          {s.ai_report_direzione && (
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Report direzione</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
                {s.ai_report_direzione}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NonConformitiesTab({ facility, year, profile, onNew }) {
  const [ncs, setNcs]         = useState([]);
  const [ncLoading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('non_conformities')
      .select('*')
      .eq('facility_id', facility.id)
      .eq('year', year)
      .order('opened_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setNcs(data || []);
        setLoading(false);
      });
  }, [facility.id, year]);

  const statusCfg = {
    aperta:         { label: 'Aperta',         bg: 'bg-red-50',     text: 'text-red-700'     },
    in_lavorazione: { label: 'In lavorazione', bg: 'bg-amber-50',   text: 'text-amber-700'   },
    risolta:        { label: 'Risolta',        bg: 'bg-emerald-50', text: 'text-emerald-700' },
    respinta:       { label: 'Respinta',       bg: 'bg-slate-100',  text: 'text-slate-600'   },
    chiusa:         { label: 'Chiusa',         bg: 'bg-slate-100',  text: 'text-slate-600'   },
  };

  const severityCfg = {
    bassa:   'bg-slate-100 text-slate-600',
    media:   'bg-amber-50 text-amber-700',
    alta:    'bg-orange-50 text-orange-700',
    critica: 'bg-red-100 text-red-700 font-black',
  };

  const aperte = ncs.filter(n => n.status === 'aperta' || n.status === 'in_lavorazione').length;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-black text-slate-800 text-lg">Non Conformità {year}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {ncs.length} registrate · {aperte} aperte
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow"
        >
          <Plus size={15} /> Nuova NC
        </button>
      </div>

      {ncLoading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse font-bold">Caricamento...</div>
      ) : ncs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Nessuna non conformità per il {year}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ncs.map(nc => {
            const sc = statusCfg[nc.status] || statusCfg.aperta;
            return (
              <div key={nc.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${severityCfg[nc.severity]}`}>
                        {nc.severity}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {nc.category}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800">{nc.title}</h4>
                    {nc.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{nc.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Aperta il {new Date(nc.opened_at).toLocaleDateString('it')}
                    </p>
                  </div>
                  {nc.due_date && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Scadenza</p>
                      <p className={`text-sm font-black ${
                        new Date(nc.due_date) < new Date() && nc.status !== 'risolta'
                          ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {new Date(nc.due_date).toLocaleDateString('it')}
                      </p>
                    </div>
                  )}
                </div>
                {nc.hq_note && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-indigo-600 mb-1">Nota HQ</p>
                    <p className="text-xs text-slate-600">{nc.hq_note}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BenchmarkTab({ facility, year }) {
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase
      .from('v_benchmark_anonymous')
      .select('*')
      .eq('year', year)
      .then(({ data, error }) => {
        if (!error) setBenchData(data || []);
        setLoading(false);
      });
  }, [year]);

  // Filtra solo il proprio tipo UDO
  const relevant = benchData.filter(b => b.udo_name === facility.udo_name);

  const kpiBenchmark = [
    { label: 'Turn Over',        key: 'turn_over',    avg: 'turn_over_avg',  median: 'turn_over_median',  min: 'turn_over_min',  max: 'turn_over_max',  perc: true },
    { label: 'Invii PS',         key: 'invii_ps',     avg: 'invii_ps_avg',   median: 'invii_ps_median',   min: null, max: null,  perc: true },
    { label: 'Val. Dolore',      key: 'val_dolore',   avg: 'val_dolore_avg', median: 'val_dolore_median', min: null, max: null,  perc: true },
    { label: 'Parametri 15gg',   key: 'parametri',    avg: 'parametri_avg',  median: 'parametri_median',  min: null, max: null,  perc: true },
    { label: 'Form. Sicurezza',  key: 'form_sic',     avg: 'form_sic_avg',   median: null,                min: null, max: null,  perc: true },
    { label: 'Form. HACCP',      key: 'form_haccp',   avg: 'form_haccp_avg', median: null,                min: null, max: null,  perc: true },
  ];

  const fmt = (v, perc) => v == null ? '—' : perc ? `${(v * 100).toFixed(1)}%` : v.toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-black text-slate-800 text-lg">Benchmark {year}</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Confronto anonimo con strutture dello stesso tipo ({facility.udo_name || '—'}).
          Visibile solo con almeno 3 strutture comparabili.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse font-bold">Caricamento...</div>
      ) : relevant.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <TrendingUp size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Dati benchmark non disponibili.</p>
          <p className="text-slate-400 text-sm mt-1">
            Servono almeno 3 strutture dello stesso tipo con dati inseriti.
          </p>
        </div>
      ) : (
        relevant.map(b => (
          <div key={`${b.year}-${b.month}`} className="space-y-3">
            <h3 className="font-black text-slate-600 text-sm uppercase tracking-widest">
              {['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][b.month - 1]} {b.year}
              <span className="ml-2 text-xs font-medium text-slate-400 normal-case">
                · {b.n_strutture} strutture
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {kpiBenchmark.map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{k.label}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {k.min && (
                      <div>
                        <p className="text-[10px] text-slate-400">Min</p>
                        <p className="text-sm font-black text-red-600">{fmt(b[k.min], k.perc)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-slate-400">Media</p>
                      <p className="text-sm font-black text-slate-700">{fmt(b[k.avg], k.perc)}</p>
                    </div>
                    {k.median && (
                      <div>
                        <p className="text-[10px] text-slate-400">Mediana</p>
                        <p className="text-sm font-black text-amber-600">{fmt(b[k.median], k.perc)}</p>
                      </div>
                    )}
                    {k.max && (
                      <div>
                        <p className="text-[10px] text-slate-400">Max</p>
                        <p className="text-sm font-black text-emerald-600">{fmt(b[k.max], k.perc)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Modal Non Conformità inline ───────────────────────────────
const INPUT_CLS = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 transition-all';

function NcFormModal({ facility, year, profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    category: '', severity: 'media', title: '', description: '', source: '', action_plan: '', due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState({});

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    const e = {};
    if (!form.category)       e.category = 'Obbligatorio';
    if (!form.title.trim())   e.title    = 'Obbligatorio';
    if (Object.keys(e).length) { setErr(e); return; }

    setSaving(true);
    const { error } = await supabase.from('non_conformities').insert([{
      facility_id:    facility.id,
      company_id:     facility.company_id,
      year,
      opened_by:      profile?.id,
      opened_by_role: profile?.role || 'director',
      category:       form.category,
      severity:       form.severity,
      title:          form.title.trim(),
      description:    form.description.trim() || null,
      source:         form.source || null,
      action_plan:    form.action_plan.trim() || null,
      due_date:       form.due_date || null,
      status:         'aperta',
    }]);
    setSaving(false);
    if (error) { setErr({ _g: error.message }); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800">Nuova Non Conformità</h2>
              <p className="text-xs text-slate-400">{facility.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {err._g && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{err._g}</div>}

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Severità</p>
            <div className="grid grid-cols-4 gap-2">
              {['bassa','media','alta','critica'].map(s => (
                <button key={s} type="button" onClick={() => setForm(p => ({ ...p, severity: s }))}
                  className={`py-2 rounded-xl border-2 text-xs font-black uppercase transition-all ${
                    form.severity === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Categoria *</label>
            <select value={form.category} onChange={set('category')} className={INPUT_CLS}>
              <option value="">Seleziona...</option>
              {NC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {err.category && <p className="text-xs text-red-600 mt-1">{err.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Titolo *</label>
            <input type="text" value={form.title} onChange={set('title')} className={INPUT_CLS} placeholder="Descrizione breve del problema" />
            {err.title && <p className="text-xs text-red-600 mt-1">{err.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Descrizione</label>
            <textarea rows={3} value={form.description} onChange={set('description')} className={INPUT_CLS + ' resize-none'} placeholder="Dettagli..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fonte</label>
            <select value={form.source} onChange={set('source')} className={INPUT_CLS}>
              <option value="">Seleziona...</option>
              {NC_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Piano d'azione</label>
            <textarea rows={2} value={form.action_plan} onChange={set('action_plan')} className={INPUT_CLS + ' resize-none'} placeholder="Azioni previste..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Scadenza</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} min={new Date().toISOString().split('T')[0]} className={INPUT_CLS} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 shadow transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Salvataggio...' : 'Registra NC'}
          </button>
        </div>
      </div>
    </div>
  );
}
