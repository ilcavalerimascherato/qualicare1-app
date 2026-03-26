/**
 * src/utils/kpiTimeHorizon.js  —  v2
 * Orizzonte temporale rolling 12 mesi per i grafici KPI (Laser, Xray).
 * L'ultimo mese visibile è sempre il precedente (regola latenza dati).
 *
 * MODIFICHE v2:
 *  - Fix: `year` castato a Number() in ingresso.
 *    Dai `<select>` arriva come stringa; `year === today.getFullYear()`
 *    fallisce silenziosamente con strict equality su tipi diversi.
 *  - `getLastConsolidatedMonth()` esportato come helper autonomo
 *    (utile in KpiManagerModal per pre-selezionare il mese corretto).
 */

const MONTH_NAMES = [
  'Gen','Feb','Mar','Apr','Mag','Giu',
  'Lug','Ago','Set','Ott','Nov','Dic',
];

/**
 * Restituisce l'ultimo mese consolidato per l'anno dato.
 * Per l'anno corrente → mese precedente (latenza dati).
 * Per anni passati → dicembre.
 * @param {number|string} year
 * @returns {{ endYear: number, endMonthNum: number }}
 */
export function getLastConsolidatedMonth(year) {
  const y     = Number(year); // ← fix cast
  const today = new Date();
  const cy    = today.getFullYear();
  const cm    = today.getMonth() + 1; // 1-based

  if (y < cy) {
    return { endYear: y, endMonthNum: 12 };
  }

  if (y === cy) {
    if (cm === 1) {
      // Gennaio: l'ultimo mese consolidato è dicembre dell'anno precedente
      return { endYear: y - 1, endMonthNum: 12 };
    }
    return { endYear: y, endMonthNum: cm - 1 };
  }

  // Anno futuro: nessun dato disponibile → restituisce comunque dicembre
  // I componenti mostreranno semplicemente serie vuote
  return { endYear: y, endMonthNum: 12 };
}

/**
 * Genera array di 12 mesi rolling, fino all'ultimo mese consolidato.
 * @param {number|string} year - Anno selezionato (accetta sia string che number)
 * @returns {Array<{ yearNum: number, monthNum: number, label: string }>}
 */
export function getTimeHorizon(year) {
  const { endYear, endMonthNum } = getLastConsolidatedMonth(year);
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(endYear, endMonthNum - 1 - i, 1);
    months.push({
      yearNum:  d.getFullYear(),
      monthNum: d.getMonth() + 1,
      label:    `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    });
  }

  return months;
}
