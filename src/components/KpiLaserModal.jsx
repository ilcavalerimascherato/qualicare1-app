import React, { useState, useMemo } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { KPI_RULES } from '../config/kpiRules';
import { computeKpiValue } from '../utils/kpiFormulaEngine';
import { getTimeHorizon } from '../utils/kpiTimeHorizon';

const PALETTE = ['#0D3B66', '#457B9D', '#1D3557', '#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'];

export default function KpiLaserModal({ isOpen, onClose, facilities, udos = [], kpiRecords, year }) {
  const [selectedKpiTarget, setSelectedKpiTarget] = useState('Turn Over');
  const [selectedUdos, setSelectedUdos] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState({});

  const toggleUdo = (id) => setSelectedUdos(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);

  const activeRule = useMemo(() => KPI_RULES.find(r => r.kpi_target === selectedKpiTarget), [selectedKpiTarget]);
  const timeHorizon = useMemo(() => getTimeHorizon(year), [year]);

  const chartData = useMemo(() => {
    if (!activeRule) {return [];}

    let targetFacilities = facilities.filter(f => !f.is_suspended);
    if (selectedUdos.length > 0) {targetFacilities = targetFacilities.filter(f => selectedUdos.includes(f.udo_id));}

    return timeHorizon.map(t => {
      const monthData = { name: t.label };

      targetFacilities.forEach(f => {
        // Cerca il record incrociando ANNO e MESE esatti del timeHorizon
        const record = kpiRecords.find(k => String(k.facility_id) === String(f.id) && Number(k.year) === t.yearNum && Number(k.month) === t.monthNum && k.status === 'completed');

        let result = null;
        if (record && record.metrics_json) {
          result = computeKpiValue(activeRule, record.metrics_json, f);
        }
        if (result !== null) {
          monthData[f.name] = result;
        }
      });
      return monthData;
    });
  }, [facilities, selectedUdos, kpiRecords, timeHorizon, activeRule]);

  const dataKeys = useMemo(() => {
    const keys = new Set();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => { if(k !== 'name') {keys.add(k);} });
    });
    return Array.from(keys);
  }, [chartData]);

  const handleLegendClick = (e) => {
    const { dataKey } = e;
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  if (!isOpen) {return null;}

  const isPercTab = activeRule && !['NUMERI', 'ISPEZIONI'].includes(activeRule.settore);

  const getReferenceAreas = () => {
    if (!activeRule || activeRule.target_verde === null) {return null;}
    const m = isPercTab ? 100 : 1;
    const tv = activeRule.target_verde * m;
    const tr = activeRule.target_rosso * m;

    if (activeRule.direzione === 'MAX') {
      return (
        <>
          <ReferenceArea y1={tv} y2={9999} fill="#10b981" fillOpacity={0.08} />
          <ReferenceArea y1={tr} y2={tv} fill="#fbbf24" fillOpacity={0.08} />
          <ReferenceArea y1={-999} y2={tr} fill="#ef4444" fillOpacity={0.08} />
        </>
      );
    } else if (activeRule.direzione === 'MIN') {
      return (
        <>
          <ReferenceArea y1={-999} y2={tv} fill="#10b981" fillOpacity={0.08} />
          <ReferenceArea y1={tv} y2={tr} fill="#fbbf24" fillOpacity={0.08} />
          <ReferenceArea y1={tr} y2={9999} fill="#ef4444" fillOpacity={0.08} />
        </>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">

        <div className="bg-slate-950 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500 rounded-lg text-white"><TrendingUp size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Vista Laser Plurimensile</h2>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Trend Mobile 12 Mesi (Rolling Window)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={26} /></button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-6">

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Seleziona KPI</label>
              <select value={selectedKpiTarget} onChange={(e) => setSelectedKpiTarget(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-sm">
                {KPI_RULES.map((r, i) => <option key={i} value={r.kpi_target}>[{r.settore}] {r.kpi_target}</option>)}
              </select>
            </div>

            <div className="w-px h-10 bg-slate-300"></div>

            <div className="flex flex-col flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Filtro UDO</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setSelectedUdos([])} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedUdos.length === 0 ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Tutte</button>
                {udos.map(u => (
                  <button key={u.id} onClick={() => toggleUdo(u.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedUdos.includes(u.id) ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-400'}`}>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="flex-1 p-8 bg-white flex flex-col">
           {dataKeys.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <TrendingUp size={48} className="mb-4 opacity-50" />
                <p className="font-black uppercase tracking-widest">Dati non sufficienti</p>
                <p className="text-xs font-bold mt-2">Nessuna struttura filtrata ha registrato dati per "{selectedKpiTarget}" in questo periodo.</p>
             </div>
           ) : (
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                {getReferenceAreas()}

                <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold', fill: '#475569'}} />
                <YAxis tick={{fontSize: 12, fontWeight: 'bold', fill: '#475569'}} domain={['auto', 'auto']} />

                <Tooltip
                  formatter={(value) => isPercTab ? `${value}%` : value}
                  cursor={{stroke: '#cbd5e1', strokeWidth: 2}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}
                />
                <Legend
                  onClick={handleLegendClick}
                  wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  iconType="circle"
                />

                {dataKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={PALETTE[index % PALETTE.length]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    hide={hiddenSeries[key] === true}
                    connectNulls={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
           )}
        </div>
      </div>
    </div>
  );
}