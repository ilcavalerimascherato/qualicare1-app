/**
 * src/utils/kpiFormulaEngine.js
 * Motore centralizzato per calcolo KPI: sostituzione variabili e valutazione formule.
 * Sostituisce eval() con Function() per sicurezza (no-eval ESLint compliant).
 * Usato da: KpiChartsModal, KpiLaserModal, KpiDashboardModal, KpiXrayModal
 */

const VARIABLE_REGEX = /\[([^\]]*)\]/g;

/**
 * Valuta una formula KPI sostituendo le variabili [NOME] con i valori da metricsJson/facility.
 * @param {string} calcolo - Formula con variabili [NOME]
 * @param {Object} metricsJson - Oggetto { NOME: { value: number } }
 * @param {Object} facility - Struttura con bed_count/posti_letto
 * @returns {{ result: number | null, canCalculate: boolean }}
 */
export function evaluateKpiFormula(calcolo, metricsJson, facility = {}) {
  let parsedFormula = calcolo.toUpperCase();
  const variables = calcolo.match(VARIABLE_REGEX) || [];
  let canCalculate = true;

  for (const v of variables) {
    const varName = v.slice(1, -1).trim().toUpperCase();
    let val = 0;
    if (varName === 'POSTI LETTO ATTIVI' || varName === 'POSTILETTO') {
      val = facility.bed_count ?? facility.posti_letto ?? 1;
    } else {
      const actualKey = Object.keys(metricsJson || {}).find(k => k.toUpperCase() === varName);
      if (actualKey && metricsJson[actualKey]) {
        val = parseFloat(metricsJson[actualKey].value) || 0;
      } else {
        canCalculate = false;
      }
    }
    parsedFormula = parsedFormula.replace(v, val);
  }

  if (!canCalculate) {
    return { result: null, canCalculate: false };
  }

  try {
    // eslint-disable-next-line no-new-func -- Formula parser sicuro: solo aritmetica, no accesso scope
    const fn = new Function('return (' + parsedFormula + ')');
    const raw = fn();
    return { result: typeof raw === 'number' && !Number.isNaN(raw) ? raw : null, canCalculate: true };
  } catch {
    return { result: null, canCalculate: false };
  }
}

/**
 * Calcola il valore KPI formattato (percentuale o decimale) dato un rule.
 * @param {Object} rule - { calcolo, settore, kpi_target }
 * @param {Object} metricsJson
 * @param {Object} facility
 * @returns {number | null}
 */
export function computeKpiValue(rule, metricsJson, facility) {
  const { result, canCalculate } = evaluateKpiFormula(rule.calcolo, metricsJson, facility);
  if (!canCalculate || result === null) {
    return null;
  }

  const isPerc = !['NUMERI', 'ISPEZIONI'].includes(rule.settore);
  return isPerc ? Math.round(result * 1000) / 10 : Math.round(result * 10) / 10;
}

/**
 * Valuta il punteggio semaforo (GREEN/YELLOW/RED/NEUTRAL/N/A) dato value e target.
 * @param {number} value
 * @param {number|null} target_verde
 * @param {number|null} target_rosso
 * @param {string|null} direzione - 'MAX' | 'MIN'
 * @returns {'GREEN'|'YELLOW'|'RED'|'NEUTRAL'|'N/A'}
 */
export function evaluateScore(value, target_verde, target_rosso, direzione) {
  if (value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  if (!direzione || target_verde === null) {
    return 'NEUTRAL';
  }
  if (direzione === 'MAX') {
    if (value >= target_verde) {
      return 'GREEN';
    }
    if (value <= target_rosso) {
      return 'RED';
    }
    return 'YELLOW';
  }
  if (value <= target_verde) {
    return 'GREEN';
  }
  if (value >= target_rosso) {
    return 'RED';
  }
  return 'YELLOW';
}
