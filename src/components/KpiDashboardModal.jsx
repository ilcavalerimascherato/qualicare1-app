import React, { useState, useMemo } from 'react';
import { X, LayoutGrid, CheckCircle2, AlertTriangle, XCircle, BarChart2 } from 'lucide-react';

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// REGOLE MATEMATICHE ESTESE
const KPI_RULES = [
  { indicatore: "Ospiti assistiti nel mese", settore: "ECONOMICO", calcolo: "[OSPITI ASSISTITI NEL MESE] / [POSTI LETTO ATTIVI]", target_verde: 0.98, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ospiti inviati al PS", settore: "PS", calcolo: "[OSPITI INVIATI AL PS] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Valutazione del dolore", settore: "SANITARI", calcolo: "[VALUTAZIONE DEL DOLORE] / [OSPITI ASSISTITI NEL MESE]", target_verde: 1.0, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ricoveri in seguito ad invio in PS", settore: "PS", calcolo: "[RICOVERI IN SEGUITO AD INVIO IN PS] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.95, target_rosso: 0.8, direzione: "MAX" },
  { indicatore: "Rilevazione parametri quindicinale", settore: "SANITARI", calcolo: "[RILEVAZIONE PARAMETRI QUINDICINALE] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Numero ospiti con lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO OSPITI CON LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione superiori al III stadio", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE SUPERIORI AL III STADIO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Numero lesioni da pressione insorte in struttura", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE INSORTE IN STRUTTURA] / [NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO]", target_verde: 0.1, target_rosso: 0.15, direzione: "MIN" },
  { indicatore: "Lesioni da pressione guarite", settore: "LESIONI", calcolo: "[LESIONI DA PRESSIONE GUARITE] / [NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Ospiti caduti", settore: "CADUTE", calcolo: "[OSPITI CADUTI] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.45, target_rosso: 0.5, direzione: "MIN" },
  { indicatore: "Cadute totali", settore: "CADUTE", calcolo: "[CADUTE TOTALI] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Cadute gravi", settore: "CADUTE", calcolo: "[CADUTE GRAVI] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.03, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Cadute con invio in Pronto Soccorso", settore: "PS", calcolo: "[CADUTE CON INVIO IN PRONTO SOCCORSO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.1, target_rosso: 0.15, direzione: "MIN" },
  { indicatore: "Mortalita", settore: "NUMERI", calcolo: "[MORTALITA]", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "Morti inattese", settore: "NUMERI", calcolo: "[MORTI INATTESE]", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "Errore gestione farmaci", settore: "NUMERI", calcolo: "[ERRORE GESTIONE FARMACI]", target_verde: 0.1, target_rosso: 0.3, direzione: "MIN" },
  { indicatore: "numero farmaci mediamente assunti in una giornata campione", settore: "NUMERI", calcolo: "[NUMERO FARMACI MEDIAMENTE ASSUNTI IN UNA GIORNATA CAMPIONE] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.05, target_rosso: 0.13, direzione: "MIN" },
  { indicatore: "numero ospiti con almeno una contenzione prescritta", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON ALMENO UNA CONTENZIONE PRESCRITTA] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "numero ospiti con solo spondine a letto", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON SOLO SPONDINE A LETTO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.01, target_rosso: 0.05, direzione: "MIN" },
  { indicatore: "Ospiti con valutazione stato nutrizionale", settore: "SANITARI", calcolo: "[OSPITI CON VALUTAZIONE STATO NUTRIZIONALE] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero ospiti con disfagia", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON DISFAGIA] / [OSPITI ASSISTITI NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero ospiti che necessitano di assistenza per essere alimentati", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CHE NECESSITANO DI ASSISTENZA PER ESSERE ALIMENTATI] / [OSPITI ASSISTITI NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero ospiti con alimentazione enterale con sonda", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON ALIMENTAZIONE ENTERALE CON SONDA] / [OSPITI ASSISTITI NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero ospiti con incontinenza (singola o doppia)", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON INCONTINENZA (SINGOLA O DOPPIA)] / [OSPITI ASSISTITI NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Ospiti con PI PAI redatto entro 30 gg dall ingresso", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI REDATTO ENTRO 30 GG DALL INGRESSO] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Ospiti con PI PAI aggiornato entro 180 gg", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI AGGIORNATO ENTRO 180 GG] / [OSPITI ASSISTITI NEL MESE]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero segnalazioni per reclami aperte nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI APERTE NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero segnalazioni per reclami chiuse nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI CHIUSE NEL MESE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero totale dipendenti soggetti a formazione sicurezza", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero dipendenti con formazione sicurezza valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE SICUREZZA VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "Numero totale dipendenti soggetti a formazione HACCP", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero dipendenti con formazione HACCP valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE HACCP VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", target_verde: 0.95, target_rosso: 0.9, direzione: "MAX" },
  { indicatore: "numero incident reporting interni e near miss", settore: "NUMERI", calcolo: "[NUMERO INCIDENT REPORTING INTERNI E NEAR MISS]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "numero audit interni ricevuti (giornate) da Sede", settore: "ISPEZIONI", calcolo: "[NUMERO AUDIT INTERNI RICEVUTI (GIORNATE) DA SEDE]", target_verde: null, target_rosso: null, direzione: null },
  { indicatore: "Numero di ispezioni ricevute da Enti esterni (ATS, NAS, ecc)", settore: "ISPEZIONI", calcolo: "[NUMERO DI ISPEZIONI RICEVUTE DA ENTI ESTERNI (ATS, NAS, ECC)]", target_verde: null, target_rosso: null, direzione: null }
];

export default function KpiDashboardModal({ isOpen, onClose, facilities, udos = [], kpiRecords, year }) {
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() === 0 ? 12 : new Date().getMonth())); 
  const [selectedUdo, setSelectedUdo] = useState('ALL');

  const evaluateScore = (value, target_verde, target_rosso, direzione) => {
    if (value === null || isNaN(value)) return 'N/A';
    if (!direzione || target_verde === null) return 'NEUTRAL';
    if (direzione === 'MAX') {
      if (value >= target_verde) return 'GREEN';
      if (value <= target_rosso) return 'RED';
      return 'YELLOW';
    } else {
      if (value <= target_verde) return 'GREEN';
      if (value >= target_rosso) return 'RED';
      return 'YELLOW';
    }
  };

  const heatmapData = useMemo(() => {
    let targetFacilities = facilities.filter(f => !f.is_suspended);
    
    // FILTRO UDO ATTIVO
    if (selectedUdo !== 'ALL') {
      targetFacilities = targetFacilities.filter(f => String(f.udo_id) === String(selectedUdo));
    }

    const sectors = [...new Set(KPI_RULES.map(r => r.settore))];

    const matrix = targetFacilities.map(f => {
      const record = kpiRecords.find(k => String(k.facility_id) === String(f.id) && Number(k.year) === year && Number(k.month) === selectedMonth && k.status === 'completed');
      const row = { facility: f, hasData: !!record, sectors: {} };

      if (record && record.metrics_json) {
        sectors.forEach(sector => {
          const rules = KPI_RULES.filter(r => r.settore === sector);
          let scorePoints = 0;
          let validKpis = 0;

          rules.forEach(rule => {
            let parsedFormula = rule.calcolo.toUpperCase();
            const variables = rule.calcolo.match(/\[(.*?)\]/g) || [];
            
            let canCalculate = true;
            variables.forEach(v => {
              const varName = v.replace(/[\[\]]/g, '').trim().toUpperCase();
              let val = 0;
              if (varName === 'POSTI LETTO ATTIVI') {
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
                const result = eval(parsedFormula);
                const grade = evaluateScore(result, rule.target_verde, rule.target_rosso, rule.direzione);
                if (grade !== 'N/A' && grade !== 'NEUTRAL') {
                  validKpis++;
                  if (grade === 'GREEN') scorePoints += 2;
                  if (grade === 'YELLOW') scorePoints += 1;
                }
              } catch(e) {}
            }
          });

          if (validKpis > 0) {
            const avg = scorePoints / (validKpis * 2);
            if (avg >= 0.8) row.sectors[sector] = 'GREEN';
            else if (avg >= 0.4) row.sectors[sector] = 'YELLOW';
            else row.sectors[sector] = 'RED';
          } else {
            row.sectors[sector] = 'N/A';
          }
        });
      }
      return row;
    });

    return { matrix, sectors };
  }, [facilities, kpiRecords, year, selectedMonth, selectedUdo]);

  if (!isOpen) return null;

  const colorMap = {
    'GREEN': 'bg-emerald-500 shadow-emerald-200 border-emerald-600',
    'YELLOW': 'bg-amber-400 shadow-amber-200 border-amber-500',
    'RED': 'bg-rose-500 shadow-rose-200 border-rose-600',
    'N/A': 'bg-slate-100 border-slate-200 opacity-50'
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        <div className="bg-slate-950 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-lg text-white"><BarChart2 size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Business Intelligence KPI</h2>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Matrice Direzionale di Compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={26} /></button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center gap-6 shrink-0">
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mese di Analisi</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer">
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m} {year}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Filtro UDO</label>
            <select value={selectedUdo} onChange={(e) => setSelectedUdo(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer">
              <option value="ALL">Tutte le UDO</option>
              {udos.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          
          <div className="ml-auto flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Target OK</div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><div className="w-3 h-3 rounded-sm bg-amber-400"></div> Allerta</div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><div className="w-3 h-3 rounded-sm bg-rose-500"></div> Critico</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 sticky top-0 bg-white z-10 border-b-2 border-slate-800">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800">Struttura</span>
                </th>
                {heatmapData.sectors.map(s => {
                  // TOOLTIP: Mostra quali KPI compongono questo settore
                  const relatedKpis = KPI_RULES.filter(r => r.settore === s).map(r => r.indicatore).join('\n• ');
                  return (
                    <th 
                      key={s} 
                      className="text-center py-4 px-2 sticky top-0 bg-white z-10 border-b-2 border-slate-800 w-28 cursor-help"
                      title={`INDICATORI VALUTATI IN QUESTO SETTORE:\n\n• ${relatedKpis}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block transform -rotate-45 translate-y-2 origin-left hover:text-indigo-600 transition-colors">{s}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {heatmapData.matrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${row.hasData ? 'bg-indigo-500' : 'bg-slate-200'}`}></span>
                    <span className={`text-xs font-bold ${row.hasData ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{row.facility.name}</span>
                  </td>
                  {heatmapData.sectors.map(s => (
                    <td key={s} className="py-2 px-2">
                      <div className={`w-full h-8 rounded border ${colorMap[row.sectors[s] || 'N/A']} transition-all hover:scale-105 cursor-pointer shadow-sm mx-auto`}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {heatmapData.matrix.filter(m => !m.hasData).length > 0 && (
             <p className="mt-8 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">
               * Le strutture barrate non hanno consolidato i dati KPI per il mese selezionato.
             </p>
          )}
        </div>

      </div>
    </div>
  );
}