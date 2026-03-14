import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';

// IL MOTORE KPI (Puoi inserire tutti i 36 qui)
const KPI_RULES = [
  { indicatore: "Ospiti assistiti nel mese", settore: "ECONOMICO", calcolo: "[OSPITI ASSISTITI NEL MESE] / [POSTI LETTO ATTIVI]", kpi_target: "Turn Over", target_verde: 0.98, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ospiti inviati al PS", settore: "PS", calcolo: "[OSPITI INVIATI AL PS] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Invii PS", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Valutazione del dolore", settore: "SANITARI", calcolo: "[VALUTAZIONE DEL DOLORE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Val Dolore", target_verde: 1.0, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ricoveri in seguito ad invio in PS", settore: "PS", calcolo: "[RICOVERI IN SEGUITO AD INVIO IN PS] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ricoveri da PS", target_verde: 0.95, target_rosso: 0.8, direzione: "MAX" },
  { indicatore: "Rilevazione parametri quindicinale", settore: "SANITARI", calcolo: "[RILEVAZIONE PARAMETRI QUINDICINALE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Parametri 15gg", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Numero ospiti con lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO OSPITI CON LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ospiti con Lesioni", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Lesioni", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione superiori al III stadio", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE SUPERIORI AL III STADIO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Lesioni > III Stadio", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione insorte in struttura", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE INSORTE IN STRUTTURA] / [NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO]", kpi_target: "Lesioni Insorte", target_verde: 0.1, target_rosso: 0.15, direzione: "MIN" },
  { indicatore: "Ospiti caduti", settore: "CADUTE", calcolo: "[OSPITI CADUTI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ospiti Caduti", target_verde: 0.45, target_rosso: 0.5, direzione: "MIN" },
  { indicatore: "Cadute totali", settore: "CADUTE", calcolo: "[CADUTE TOTALI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute Totali", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Cadute gravi", settore: "CADUTE", calcolo: "[CADUTE GRAVI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute Gravi", target_verde: 0.03, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Cadute con invio in Pronto Soccorso", settore: "PS", calcolo: "[CADUTE CON INVIO IN PRONTO SOCCORSO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute invio PS", target_verde: 0.1, target_rosso: 0.15, direzione: "MIN" },
  { indicatore: "Mortalita", settore: "NUMERI", calcolo: "[MORTALITA]", kpi_target: "Morti", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "Morti inattese", settore: "NUMERI", calcolo: "[MORTI INATTESE]", kpi_target: "Morti Inattese", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "Errore gestione farmaci", settore: "NUMERI", calcolo: "[ERRORE GESTIONE FARMACI]", kpi_target: "Errori Farmaci", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "numero farmaci mediamente assunti in una giornata campione", settore: "NUMERI", calcolo: "[NUMERO FARMACI MEDIAMENTE ASSUNTI IN UNA GIORNATA CAMPIONE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Farmaci Die", target_verde: 0.05, target_rosso: 0.13, direzione: "MIN" },
  { indicatore: "numero ospiti con almeno una contenzione prescritta", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON ALMENO UNA CONTENZIONE PRESCRITTA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Contenzioni", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "numero ospiti con solo spondine a letto", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON SOLO SPONDINE A LETTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cont. solo Spondine", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Ospiti con valutazione stato nutrizionale", settore: "SANITARI", calcolo: "[OSPITI CON VALUTAZIONE STATO NUTRIZIONALE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Val. Nutrizionale", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero ospiti con disfagia", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON DISFAGIA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Disfagia", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero ospiti che necessitano di assistenza per essere alimentati", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CHE NECESSITANO DI ASSISTENZA PER ESSERE ALIMENTATI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Assistenza Alim.", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero ospiti con alimentazione enterale con sonda", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON ALIMENTAZIONE ENTERALE CON SONDA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Alim. Sonda", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero ospiti con incontinenza (singola o doppia)", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON INCONTINENZA (SINGOLA O DOPPIA)] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Incontinenza", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Ospiti con PI PAI redatto entro 30 gg dall ingresso", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI REDATTO ENTRO 30 GG DALL INGRESSO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "PI PAI 30gg", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ospiti con PI PAI aggiornato entro 180 gg", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI AGGIORNATO ENTRO 180 GG] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "PI PAI 180gg", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero segnalazioni per reclami aperte nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI APERTE NEL MESE]", kpi_target: "Reclami Aperti", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero segnalazioni per reclami chiuse nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI CHIUSE NEL MESE]", kpi_target: "Reclami Chiusi", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero totale dipendenti soggetti a formazione sicurezza", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", kpi_target: "Dipendenti Sicurezza", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero dipendenti con formazione sicurezza valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE SICUREZZA VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", kpi_target: "Form. Sicurezza", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Numero totale dipendenti soggetti a formazione HACCP", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", kpi_target: "Addetti Cucina", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero dipendenti con formazione HACCP valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE HACCP VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", kpi_target: "Form. HACCP", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero incident reporting interni e near miss", settore: "NUMERI", calcolo: "[NUMERO INCIDENT REPORTING INTERNI E NEAR MISS]", kpi_target: "IR e Near Miss", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero audit interni ricevuti (giornate) da Sede", settore: "ISPEZIONI", calcolo: "[NUMERO AUDIT INTERNI RICEVUTI (GIORNATE) DA SEDE]", kpi_target: "Audit Interni", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero di ispezioni ricevute da Enti esterni (ATS, NAS, ecc)", settore: "ISPEZIONI", calcolo: "[NUMERO DI ISPEZIONI RICEVUTE DA ENTI ESTERNI (ATS, NAS, ECC)]", kpi_target: "Ispezioni Esterne", target_verde: null, target_rosso: null, direzione: null }
];

const PALETTE = ['#0D3B66', '#457B9D', '#1D3557', '#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'];

export default function KpiLaserModal({ isOpen, onClose, facilities, udos = [], kpiRecords, year }) {
  const [selectedKpiTarget, setSelectedKpiTarget] = useState("Turn Over");
  const [selectedUdos, setSelectedUdos] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState({});

  const toggleUdo = (id) => setSelectedUdos(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);

  const activeRule = useMemo(() => KPI_RULES.find(r => r.kpi_target === selectedKpiTarget), [selectedKpiTarget]);

  // GENERATORE DINAMICO ROLLING 12-MONTHS
  const timeHorizon = useMemo(() => {
    const months = [];
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const today = new Date();
    
    let endYear = year;
    let endMonthNum; // 1-12
    
    // Regola della Latenza: Il mese "corrente" non è mai consolidato. L'ultimo mese visibile è il PRECEDENTE.
    if (year === today.getFullYear()) {
      if (today.getMonth() === 0) {
        // Se siamo a Gennaio, l'ultimo dato consolidato appartiene a Dicembre dell'anno precedente
        endMonthNum = 12;
        endYear = year - 1;
      } else {
        // getMonth() va da 0 a 11, quindi equivale esattamente al mese numerico precedente (1-12)
        endMonthNum = today.getMonth(); 
      }
    } else {
      endMonthNum = 12;
    }

    for (let i = 11; i >= 0; i--) {
      // Sottraiamo i mesi partendo dalla fine. JS gestisce da solo lo scavalcamento dell'anno.
      let d = new Date(endYear, endMonthNum - 1 - i, 1);
      months.push({
        yearNum: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
      });
    }
    return months;
  }, [year]);

  const chartData = useMemo(() => {
    if (!activeRule) return [];
    
    let targetFacilities = facilities.filter(f => !f.is_suspended);
    if (selectedUdos.length > 0) targetFacilities = targetFacilities.filter(f => selectedUdos.includes(f.udo_id));

    return timeHorizon.map(t => {
      let monthData = { name: t.label };

      targetFacilities.forEach(f => {
        // Cerca il record incrociando ANNO e MESE esatti del timeHorizon
        const record = kpiRecords.find(k => String(k.facility_id) === String(f.id) && Number(k.year) === t.yearNum && Number(k.month) === t.monthNum && k.status === 'completed');
        
        let result = null;
        if (record && record.metrics_json) {
          let parsedFormula = activeRule.calcolo.toUpperCase();
          const variables = activeRule.calcolo.match(/\[(.*?)\]/g) || [];
          let canCalculate = true;
          
          variables.forEach(v => {
            const varName = v.replace(/[\[\]]/g, '').trim().toUpperCase();
            let val = 0;
            if (varName === 'POSTI LETTO ATTIVI' || varName === 'POSTILETTO') {
              val = f.bed_count || f.posti_letto || 1;
            } else {
              const actualKey = Object.keys(record.metrics_json).find(k => k.toUpperCase() === varName);
              if (actualKey && record.metrics_json[actualKey]) {
                val = parseFloat(record.metrics_json[actualKey].value) || 0;
              } else {
                canCalculate = false; 
              }
            }
            parsedFormula = parsedFormula.replace(v, val);
          });

          if (canCalculate) {
            try {
              let rawResult = eval(parsedFormula);
              const isPerc = !['NUMERI', 'ISPEZIONI'].includes(activeRule.settore);
              result = isPerc ? Math.round(rawResult * 1000) / 10 : Math.round(rawResult * 10) / 10;
            } catch(e) {}
          }
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
      Object.keys(d).forEach(k => { if(k !== 'name') keys.add(k); });
    });
    return Array.from(keys);
  }, [chartData]);

  const handleLegendClick = (e) => {
    const { dataKey } = e;
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  if (!isOpen) return null;

  const isPercTab = activeRule && !['NUMERI', 'ISPEZIONI'].includes(activeRule.settore);

  const getReferenceAreas = () => {
    if (!activeRule || activeRule.target_verde === null) return null;
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