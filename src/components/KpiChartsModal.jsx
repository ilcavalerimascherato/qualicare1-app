import React, { useState, useMemo } from 'react';
import { X, LayoutGrid, Filter, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// IL VERO MOTORE KPI: Formule, Nomi Target e Regole di Percentuale
const KPI_RULES = [
  { indicatore: "Ospiti assistiti nel mese", settore: "ECONOMICO", calcolo: "[OSPITI ASSISTITI NEL MESE] / [POSTI LETTO ATTIVI]", kpi_target: "Turn Over" },
  { indicatore: "Ospiti inviati al PS", settore: "PS", calcolo: "[OSPITI INVIATI AL PS] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Invii PS" },
  { indicatore: "Valutazione del dolore", settore: "SANITARI", calcolo: "[VALUTAZIONE DEL DOLORE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Val Dolore" },
  { indicatore: "Ricoveri in seguito ad invio in PS", settore: "PS", calcolo: "[RICOVERI IN SEGUITO AD INVIO IN PS] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ricoveri da PS" },
  { indicatore: "Rilevazione parametri quindicinale", settore: "SANITARI", calcolo: "[RILEVAZIONE PARAMETRI QUINDICINALE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Parametri 15gg" },
  { indicatore: "Numero ospiti con lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO OSPITI CON LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ospiti con Lesioni" },
  { indicatore: "Numero lesioni da pressione in trattamento", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Lesioni" },
  { indicatore: "Numero lesioni da pressione superiori al III stadio", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE SUPERIORI AL III STADIO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Lesioni > III Stadio" },
  { indicatore: "Numero lesioni da pressione insorte in struttura", settore: "LESIONI", calcolo: "[NUMERO LESIONI DA PRESSIONE INSORTE IN STRUTTURA] / [NUMERO LESIONI DA PRESSIONE IN TRATTAMENTO]", kpi_target: "Lesioni Insorte" },
  { indicatore: "Ospiti caduti", settore: "CADUTE", calcolo: "[OSPITI CADUTI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Ospiti Caduti" },
  { indicatore: "Cadute totali", settore: "CADUTE", calcolo: "[CADUTE TOTALI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute Totali" },
  { indicatore: "Cadute gravi", settore: "CADUTE", calcolo: "[CADUTE GRAVI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute Gravi" },
  { indicatore: "Cadute con invio in Pronto Soccorso", settore: "PS", calcolo: "[CADUTE CON INVIO IN PRONTO SOCCORSO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cadute invio PS" },
  { indicatore: "Mortalita", settore: "NUMERI", calcolo: "[MORTALITA]", kpi_target: "Morti" },
  { indicatore: "Morti inattese", settore: "NUMERI", calcolo: "[MORTI INATTESE]", kpi_target: "Morti Inattese" },
  { indicatore: "Errore gestione farmaci", settore: "NUMERI", calcolo: "[ERRORE GESTIONE FARMACI]", kpi_target: "Errori Farmaci" },
  { indicatore: "numero farmaci mediamente assunti in una giornata campione", settore: "NUMERI", calcolo: "[NUMERO FARMACI MEDIAMENTE ASSUNTI IN UNA GIORNATA CAMPIONE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Farmaci Die" },
  { indicatore: "numero ospiti con almeno una contenzione prescritta", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON ALMENO UNA CONTENZIONE PRESCRITTA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Contenzioni" },
  { indicatore: "numero ospiti con solo spondine a letto", settore: "CONTENZIONI", calcolo: "[NUMERO OSPITI CON SOLO SPONDINE A LETTO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Cont. solo Spondine" },
  { indicatore: "Ospiti con valutazione stato nutrizionale", settore: "SANITARI", calcolo: "[OSPITI CON VALUTAZIONE STATO NUTRIZIONALE] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Val. Nutrizionale" },
  { indicatore: "numero ospiti con disfagia", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON DISFAGIA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Disfagia" },
  { indicatore: "numero ospiti che necessitano di assistenza per essere alimentati", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CHE NECESSITANO DI ASSISTENZA PER ESSERE ALIMENTATI] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Assistenza Alim." },
  { indicatore: "numero ospiti con alimentazione enterale con sonda", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON ALIMENTAZIONE ENTERALE CON SONDA] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Alim. Sonda" },
  { indicatore: "Numero ospiti con incontinenza (singola o doppia)", settore: "ASSISTENZA", calcolo: "[NUMERO OSPITI CON INCONTINENZA (SINGOLA O DOPPIA)] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "Incontinenza" },
  { indicatore: "Ospiti con PI PAI redatto entro 30 gg dall ingresso", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI REDATTO ENTRO 30 GG DALL INGRESSO] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "PI PAI 30gg" },
  { indicatore: "Ospiti con PI PAI aggiornato entro 180 gg", settore: "COMPLIANCE", calcolo: "[OSPITI CON PI PAI AGGIORNATO ENTRO 180 GG] / [OSPITI ASSISTITI NEL MESE]", kpi_target: "PI PAI 180gg" },
  { indicatore: "numero segnalazioni per reclami aperte nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI APERTE NEL MESE]", kpi_target: "Reclami Aperti" },
  { indicatore: "numero segnalazioni per reclami chiuse nel mese", settore: "ISPEZIONI", calcolo: "[NUMERO SEGNALAZIONI PER RECLAMI CHIUSE NEL MESE]", kpi_target: "Reclami Chiusi" },
  { indicatore: "Numero totale dipendenti soggetti a formazione sicurezza", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", kpi_target: "Dipendenti Sicurezza" },
  { indicatore: "Numero dipendenti con formazione sicurezza valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE SICUREZZA VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA]", kpi_target: "Form. Sicurezza" },
  { indicatore: "Numero totale dipendenti soggetti a formazione HACCP", settore: "NUMERI", calcolo: "[NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", kpi_target: "Addetti Cucina" },
  { indicatore: "Numero dipendenti con formazione HACCP valida", settore: "COMPLIANCE", calcolo: "[NUMERO DIPENDENTI CON FORMAZIONE HACCP VALIDA] / [NUMERO TOTALE DIPENDENTI SOGGETTI A FORMAZIONE HACCP]", kpi_target: "Form. HACCP" },
  { indicatore: "numero incident reporting interni e near miss", settore: "NUMERI", calcolo: "[NUMERO INCIDENT REPORTING INTERNI E NEAR MISS]", kpi_target: "IR e Near Miss" },
  { indicatore: "numero audit interni ricevuti (giornate) da Sede", settore: "ISPEZIONI", calcolo: "[NUMERO AUDIT INTERNI RICEVUTI (GIORNATE) DA SEDE]", kpi_target: "Audit Interni" },
  { indicatore: "Numero di ispezioni ricevute da Enti esterni (ATS, NAS, ecc)", settore: "ISPEZIONI", calcolo: "[NUMERO DI ISPEZIONI RICEVUTE DA ENTI ESTERNI (ATS, NAS, ECC)]", kpi_target: "Ispezioni Esterne" }
];

const SECTORS = [...new Set(KPI_RULES.map(r => r.settore))];
const PALETTE = ['#0D3B66', '#A8DADC', '#457B9D', '#2A9D8F', '#136F63', '#1D3557', '#e76f51', '#f4a261', '#e9c46a', '#264653'];

export default function KpiChartsModal({ isOpen, onClose, facilities, udos = [], kpiRecords, year }) {
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() === 0 ? 12 : new Date().getMonth())); 
  const [selectedUdos, setSelectedUdos] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [activeTab, setActiveTab] = useState('ASSET'); 
  const [hiddenSeries, setHiddenSeries] = useState({}); // Stato per accendere/spegnere la legenda

  const availableRegions = useMemo(() => {
    const regs = facilities.map(f => f.areageografica || f.region || f.regione).filter(Boolean);
    return [...new Set(regs)].sort();
  }, [facilities]);

  const toggleUdo = (id) => setSelectedUdos(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  const toggleRegion = (reg) => setSelectedRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);

  // 1. FILTRAGGIO STRUTTURE BASE (Nessuna duplicazione temporale)
  const filteredFacilities = useMemo(() => {
    let list = facilities.filter(f => !f.is_suspended);
    if (selectedUdos.length > 0) list = list.filter(f => selectedUdos.includes(f.udo_id));
    if (selectedRegions.length > 0) list = list.filter(f => selectedRegions.includes(f.areageografica || f.region || f.regione));
    return list;
  }, [facilities, selectedUdos, selectedRegions]);

  // 2. DATI PER TAB "ASSET"
  const assetData = useMemo(() => {
    const byUdo = {};
    const byRegion = {};
    
    filteredFacilities.forEach(f => {
      const udoName = udos.find(u => String(u.id) === String(f.udo_id))?.name || 'N/A';
      const regName = f.areageografica || f.region || f.regione || 'N/A';
      const beds = f.bed_count || f.posti_letto || 0;
      
      byUdo[udoName] = (byUdo[udoName] || 0) + beds;
      byRegion[regName] = (byRegion[regName] || 0) + beds;
    });

    return {
      udo: Object.entries(byUdo).map(([name, value]) => ({ name, value })).filter(d => d.value > 0),
      region: Object.entries(byRegion).map(([name, value]) => ({ name, value })).filter(d => d.value > 0),
      totalBeds: filteredFacilities.reduce((sum, f) => sum + (f.bed_count || f.posti_letto || 0), 0)
    };
  }, [filteredFacilities, udos]);

  // 3. DATI PER ISTOGRAMMI (Normalizzazione Matematica)
  const chartData = useMemo(() => {
    const list = filteredFacilities.map(f => {
      const udoName = udos.find(u => String(u.id) === String(f.udo_id))?.name || 'N/A';
      const record = kpiRecords.find(k => String(k.facility_id) === String(f.id) && Number(k.year) === year && Number(k.month) === selectedMonth && k.status === 'completed');
      
      // La property 'name' ora include la UDO per raggruppamento visivo sull'asse X
      let dataPoint = { rawName: f.name, name: `[${udoName}] ${f.name}`, udo: udoName, PostiLetto: f.bed_count || f.posti_letto || 0 };
      
      if (record && record.metrics_json) {
        // OVERVIEW HR
        const dipendentiKey = Object.keys(record.metrics_json).find(k => k.toUpperCase().includes('DIPENDENTI SOGGETTI A FORMAZIONE SICUREZZA') || k.toUpperCase() === 'DIPENDENTI');
        dataPoint['Dipendenti'] = dipendentiKey ? parseFloat(record.metrics_json[dipendentiKey].value) || 0 : 0;
        
        // CALCOLO KPI REALI
        KPI_RULES.forEach(rule => {
          let parsedFormula = rule.calcolo.toUpperCase();
          const variables = rule.calcolo.match(/\[(.*?)\]/g) || [];
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
              let result = eval(parsedFormula);
              const isPerc = !['NUMERI', 'ISPEZIONI'].includes(rule.settore);
              if (isPerc) {
                result = Math.round(result * 1000) / 10; // Converti in percentuale con 1 decimale (es. 98.5)
              } else {
                result = Math.round(result * 10) / 10;
              }
              dataPoint[rule.kpi_target] = result;
            } catch(e) {}
          }
        });
      }
      return dataPoint;
    });

    // Ordinamento rigoroso: Prima per UDO, poi per Nome Struttura
    list.sort((a, b) => {
      if (a.udo < b.udo) return -1;
      if (a.udo > b.udo) return 1;
      return a.rawName.localeCompare(b.rawName);
    });

    return list;
  }, [filteredFacilities, udos, kpiRecords, year, selectedMonth]);

  // Identifica quali colonne mostrare in base al TAB
  const currentChartKeys = useMemo(() => {
    if (activeTab === 'ASSET') return [];
    if (activeTab === 'OVERVIEW') return ['PostiLetto', 'Dipendenti'];
    
    const sectorRules = KPI_RULES.filter(r => r.settore === activeTab);
    const expectedKeys = sectorRules.map(r => r.kpi_target);
    
    const availableKeys = new Set();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (expectedKeys.includes(k)) availableKeys.add(k);
      });
    });
    return Array.from(availableKeys);
  }, [activeTab, chartData]);

  // Gestione clic sulla legenda
  const handleLegendClick = (e) => {
    const { dataKey } = e;
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  if (!isOpen) return null;

  const isPercTab = activeTab !== 'ASSET' && activeTab !== 'OVERVIEW' && !['NUMERI', 'ISPEZIONI'].includes(activeTab);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        <div className="bg-slate-950 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-sky-600 rounded-lg text-white"><LayoutGrid size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Dashboard Quantitativa Normalizzata</h2>
              <p className="text-xs text-sky-400 font-bold uppercase tracking-widest">Confronto Performance tra Strutture</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={26} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* SIDEBAR SINISTRA: FILTRI */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={14}/> Periodo</h3>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-sky-500 cursor-pointer shadow-sm">
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m} {year}</option>)}
              </select>
            </div>

            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Filtro UDO</h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => setSelectedUdos([])} className={`text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedUdos.length === 0 ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Tutte le UDO</button>
                {udos.map(u => (
                  <button key={u.id} onClick={() => toggleUdo(u.id)} className={`text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedUdos.includes(u.id) ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:border-sky-400'}`}>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Filtro Regione</h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => setSelectedRegions([])} className={`text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedRegions.length === 0 ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Tutte le Regioni</button>
                {availableRegions.map(reg => (
                  <button key={reg} onClick={() => toggleRegion(reg)} className={`text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedRegions.includes(reg) ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:border-sky-400'}`}>
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AREA PRINCIPALE: TABS E GRAFICI */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            
            <div className="flex gap-2 p-4 border-b border-slate-100 overflow-x-auto custom-scrollbar shrink-0 bg-slate-50/50">
              <button onClick={() => setActiveTab('ASSET')} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'ASSET' ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <PieIcon size={14} /> Asset
              </button>
              <button onClick={() => setActiveTab('OVERVIEW')} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'OVERVIEW' ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <BarChart2 size={14} /> Overview HR
              </button>
              <div className="w-px h-8 bg-slate-300 mx-2 self-center"></div>
              {SECTORS.map(s => (
                <button key={s} onClick={() => setActiveTab(s)} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === s ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8">
              
              {/* TAB ASSET (Torte con Totale Centrale) */}
              {activeTab === 'ASSET' && (
                <div className="flex h-full gap-8">
                  <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 p-6 relative">
                    <h3 className="text-center text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Posti Letto per UDO</h3>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-6">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
                       <span className="text-3xl font-black text-slate-800">{assetData.totalBeds}</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={assetData.udo} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={2} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                          {assetData.udo.map((entry, index) => <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 p-6 relative">
                    <h3 className="text-center text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Posti Letto per Regione</h3>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-6">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
                       <span className="text-3xl font-black text-slate-800">{assetData.totalBeds}</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={assetData.region} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={2} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                          {assetData.region.map((entry, index) => <Cell key={`cell-${index}`} fill={PALETTE[(index + 4) % PALETTE.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB ISTOGRAMMI */}
              {activeTab !== 'ASSET' && (
                currentChartKeys.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <BarChart2 size={48} className="mb-4 opacity-50" />
                    <p className="font-black uppercase tracking-widest">Nessun indicatore calcolabile per "{activeTab}"</p>
                    <p className="text-xs font-bold mt-2">Le strutture filtrate non hanno consolidato questi dati nel mese selezionato.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      {/* Asse X: Mostra [UDO] Nome Struttura per chiarire il raggruppamento */}
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{fontSize: 10, fontWeight: 'bold', fill: '#475569'}} interval={0} />
                      <YAxis tick={{fontSize: 10, fontWeight: 'bold', fill: '#475569'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        formatter={(value) => isPercTab ? `${value}%` : value}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px' }} 
                      />
                      <Legend 
                        onClick={handleLegendClick}
                        wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }} 
                        iconType="circle" 
                      />
                      
                      {currentChartKeys.map((key, index) => (
                        <Bar 
                          key={key} 
                          dataKey={key} 
                          fill={PALETTE[index % PALETTE.length]} 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={60}
                          hide={hiddenSeries[key] === true}
                        >
                          <LabelList 
                            dataKey={key} 
                            position="top" 
                            style={{ fontSize: '10px', fontWeight: '900', fill: '#334155' }} 
                            formatter={(val) => isPercTab ? `${val}%` : val} 
                          />
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}