import React, { useState, useMemo, useEffect } from 'react';
import { X, ActivitySquare } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip, ReferenceArea } from 'recharts';

// I 36 KPI UFFICIALI
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

export default function KpiXrayModal({ isOpen, onClose, facilities, kpiRecords, year }) {
  const [selectedFacilityId, setSelectedFacilityId] = useState('');

  const activeFacilities = useMemo(() => facilities.filter(f => !f.is_suspended).sort((a,b) => a.name.localeCompare(b.name)), [facilities]);

  useEffect(() => {
    if (isOpen && !selectedFacilityId && activeFacilities.length > 0) {
      setSelectedFacilityId(activeFacilities[0].id);
    }
  }, [isOpen, selectedFacilityId, activeFacilities]);

  const selectedFacility = useMemo(() => activeFacilities.find(f => String(f.id) === String(selectedFacilityId)), [activeFacilities, selectedFacilityId]);

  // CALCOLO ORIZZONTE TEMPORALE (Identico alla Vista Laser)
  const timeHorizon = useMemo(() => {
    const months = [];
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const today = new Date();
    
    let endYear = year;
    let endMonthNum; 
    
    if (year === today.getFullYear()) {
      if (today.getMonth() === 0) {
        endMonthNum = 12;
        endYear = year - 1;
      } else {
        endMonthNum = today.getMonth(); 
      }
    } else {
      endMonthNum = 12;
    }

    for (let i = 11; i >= 0; i--) {
      let d = new Date(endYear, endMonthNum - 1 - i, 1);
      months.push({ yearNum: d.getFullYear(), monthNum: d.getMonth() + 1, label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
    }
    return months;
  }, [year]);

  // CALCOLO DI TUTTI I 36 KPI PER LA SINGOLA STRUTTURA SUI 12 MESI
  const xrayData = useMemo(() => {
    if (!selectedFacility) return [];

    return KPI_RULES.map(rule => {
      const isPerc = !['NUMERI', 'ISPEZIONI'].includes(rule.settore);
      let hasData = false;

      const trend = timeHorizon.map(t => {
        const record = kpiRecords.find(k => String(k.facility_id) === String(selectedFacility.id) && Number(k.year) === t.yearNum && Number(k.month) === t.monthNum && k.status === 'completed');
        
        let result = null;
        if (record && record.metrics_json) {
          let parsedFormula = rule.calcolo.toUpperCase();
          const variables = rule.calcolo.match(/\[(.*?)\]/g) || [];
          let canCalculate = true;
          
          variables.forEach(v => {
            const varName = v.replace(/[\[\]]/g, '').trim().toUpperCase();
            let val = 0;
            if (varName === 'POSTI LETTO ATTIVI' || varName === 'POSTILETTO') {
              val = selectedFacility.bed_count || selectedFacility.posti_letto || 1;
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
              result = isPerc ? Math.round(rawResult * 1000) / 10 : Math.round(rawResult * 10) / 10;
              hasData = true; // Se almeno un mese ha un numero, accendiamo il grafico
            } catch(e) {}
          }
        }
        return { name: t.label, value: result };
      });

      return { rule, trend, hasData, isPerc };
    });
  }, [selectedFacility, kpiRecords, timeHorizon]);

  if (!isOpen) return null;

  // Render per il singolo Mini-Grafico (Sparkline)
  const renderSparkline = (item) => {
    const { rule, trend, hasData, isPerc } = item;
    
    // Se non c'è mai stato un dato in 12 mesi, mostriamo un placeholder
    if (!hasData) {
      return (
        <div key={rule.kpi_target} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-32 opacity-60">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-[11px] font-black text-slate-700 uppercase leading-tight line-clamp-2">{rule.kpi_target}</h4>
            <span className="text-[8px] font-black px-2 py-0.5 bg-slate-200 text-slate-500 rounded uppercase tracking-widest">{rule.settore}</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nessun Dato</div>
        </div>
      );
    }

    const m = isPerc ? 100 : 1;
    const tv = rule.target_verde !== null ? rule.target_verde * m : null;
    const tr = rule.target_rosso !== null ? rule.target_rosso * m : null;

    return (
      <div key={rule.kpi_target} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-32 shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="flex justify-between items-start mb-2 z-10">
          <h4 className="text-[11px] font-black text-slate-800 uppercase leading-tight line-clamp-2 pr-2" title={rule.indicatore}>{rule.kpi_target}</h4>
          <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded uppercase tracking-widest shrink-0">{rule.settore}</span>
        </div>
        
        <div className="flex-1 w-full min-h-0 relative -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                formatter={(val) => [isPerc ? `${val}%` : val, 'Valore']}
                labelStyle={{fontSize: '10px', fontWeight: 'bold', color: '#64748b'}}
                contentStyle={{padding: '4px 8px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'black'}}
              />
              
              {/* Sfondo di Tolleranza */}
              {tv !== null && tr !== null && rule.direzione === 'MAX' && (
                <>
                  <ReferenceArea y1={tv} y2={9999} fill="#10b981" fillOpacity={0.15} />
                  <ReferenceArea y1={tr} y2={tv} fill="#fbbf24" fillOpacity={0.15} />
                  <ReferenceArea y1={-999} y2={tr} fill="#ef4444" fillOpacity={0.15} />
                </>
              )}
              {tv !== null && tr !== null && rule.direzione === 'MIN' && (
                <>
                  <ReferenceArea y1={-999} y2={tv} fill="#10b981" fillOpacity={0.15} />
                  <ReferenceArea y1={tv} y2={tr} fill="#fbbf24" fillOpacity={0.15} />
                  <ReferenceArea y1={tr} y2={9999} fill="#ef4444" fillOpacity={0.15} />
                </>
              )}

              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* HEADER */}
        <div className="bg-slate-950 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-lg text-white"><ActivitySquare size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Audit Raggi X</h2>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Elettrocardiogramma Struttura (Trend 12 Mesi)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={26} /></button>
        </div>

        {/* TOOLBAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col flex-1 max-w-md">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Seleziona Struttura per l'Ispezione</label>
              <select value={selectedFacilityId} onChange={(e) => setSelectedFacilityId(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
                {activeFacilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            
            <div className="ml-auto flex gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Legenda Sfondi:</span>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600"><div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500"></div> OK</div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600"><div className="w-3 h-3 rounded-sm bg-amber-400/30 border border-amber-400"></div> Allerta</div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600"><div className="w-3 h-3 rounded-sm bg-rose-500/30 border border-rose-500"></div> Critico</div>
            </div>
          </div>
        </div>

        {/* GRIGLIA SPARKLINES */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {xrayData.map(renderSparkline)}
          </div>
        </div>

      </div>
    </div>
  );
}