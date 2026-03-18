/**
 * src/utils/kpiTimeHorizon.js
 * Orizzonte temporale rolling 12 mesi per i grafici KPI (Laser, Xray).
 * L'ultimo mese visibile è sempre il precedente (regola latenza).
 */

const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

/**
 * Genera array di 12 mesi rolling, fino all'ultimo mese consolidato.
 * @param {number} year - Anno selezionato
 * @returns {Array<{yearNum: number, monthNum: number, label: string}>}
 */
export function getTimeHorizon(year) {
  const months = [];
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
    const d = new Date(endYear, endMonthNum - 1 - i, 1);
    months.push({
      yearNum: d.getFullYear(),
      monthNum: d.getMonth() + 1,
      label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
    });
  }
  return months;
}
