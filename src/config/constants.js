/**
 * src/config/constants.js
 * UNICA FONTE DI VERITÀ PER LE COSTANTI GLOBALI DELL'APPLICAZIONE
 */

export const APP_CONFIG = {
  YEARS_AVAILABLE: [2024, 2025, 2026, 2027, 2028],
  DEFAULT_COLOR: '#cbd5e1', // Slate-300
  COMPANY_NAME: 'QualiCAVA SECURE'
};

export const SURVEY_TYPES = {
  CLIENT: 'client',
  OPERATOR: 'operator'
};

export const STATUS_TYPES = {
  TODO: 'todo',
  PROGRESS: 'progress',
  COMPLETED: 'completed'
};

// Mappatura semantica dei colori per mantenere coerenza visiva in tutta l'app
export const PALETTE = {
  primary: '#4f46e5',    // Indigo-600
  primaryHover: '#4338ca',// Indigo-700
  danger: '#f43f5e',     // Rose-500
  dangerHover: '#e11d48', // Rose-600
  success: '#10b981',    // Emerald-500
  warning: '#f59e0b',    // Amber-500
  background: '#f8fafc', // Slate-50
  surface: '#ffffff',    // White
  text: '#0f172a',       // Slate-900
  textMuted: '#64748b',  // Slate-500
  border: '#e2e8f0',     // Slate-200

  // Colori specifici per i semafori IA/KPI
  trafficLight: {
    green: '#22c55e',    // Completato
    yellow: '#a855f7',   // In corso (Purple/Indaco come hai richiesto)
    red: '#ef4444'       // Da iniziare
  }
};

// Struttura dati complessa per i mesi, ottimizzata per calcoli, grafici e UI
export const MONTHS = [
  { id: 1, name: 'Gennaio', short: 'Gen', q: 1 },
  { id: 2, name: 'Febbraio', short: 'Feb', q: 1 },
  { id: 3, name: 'Marzo', short: 'Mar', q: 1 },
  { id: 4, name: 'Aprile', short: 'Apr', q: 2 },
  { id: 5, name: 'Maggio', short: 'Mag', q: 2 },
  { id: 6, name: 'Giugno', short: 'Giu', q: 2 },
  { id: 7, name: 'Luglio', short: 'Lug', q: 3 },
  { id: 8, name: 'Agosto', short: 'Ago', q: 3 },
  { id: 9, name: 'Settembre', short: 'Set', q: 3 },
  { id: 10, name: 'Ottobre', short: 'Ott', q: 4 },
  { id: 11, name: 'Novembre', short: 'Nov', q: 4 },
  { id: 12, name: 'Dicembre', short: 'Dic', q: 4 }
];

export const REGIONI_ITALIANE = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
  'Toscana', 'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
];

// Helper funzioni pre-compilate per le costanti
export const getMonthById = (id) => MONTHS.find(m => m.id === id);
export const getMonthsByQuarter = (q) => MONTHS.filter(m => m.q === q);