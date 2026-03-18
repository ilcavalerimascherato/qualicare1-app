// src/utils/statusCalculator.js
// Motore di calcolo centralizzato — agnostico rispetto a React.

const getActionableMonths = (selectedYear) => {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const sel          = Number(selectedYear);

  if (sel < currentYear)   { return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; }
  if (sel === currentYear) { return Array.from({ length: currentMonth - 1 }, (_, i) => i + 1); }
  return [];
};

export const getSurveyStatus = (surveys, facilityId, companyId, type) => {
  const relevant = surveys.filter(s =>
    s.type === type &&
    (s.facility_id === facilityId || (!s.facility_id && s.company_id === companyId))
  );
  if (relevant.length === 0) { return 'empty'; }
  const latest = relevant.sort((a, b) => b.calendar_id.localeCompare(a.calendar_id))[0];
  if (latest.ai_report_ospiti || latest.ai_report_direzione) { return 'completed'; }
  return 'pending';
};

// udos è opzionale — se passato, aggiunge udo_name e udo_color alla facility
export const enrichFacilitiesData = (facilities, surveys, kpiRecords, year, udos = []) => {
  if (!facilities?.length) { return []; }

  const actionableMonths = getActionableMonths(year);
  const selectedYear     = Number(year);

  // Mappa id→udo per lookup O(1) invece di find() ad ogni iterazione
  const udoMap = new Map(udos.map(u => [u.id, u]));

  return facilities.map(f => {
    // ── UDO color e name (calcolati qui, non nel DB) ───────
    const udo      = udoMap.get(f.udo_id);
    const udo_color = udo?.color || '#cbd5e1';
    const udo_name  = udo?.name  || '';

    // ── Survey status ──────────────────────────────────────
    const clientStatus = getSurveyStatus(surveys, f.id, f.company_id, 'client');
    const staffStatus  = getSurveyStatus(surveys, f.id, f.company_id, 'operator');

    const clientCompleted = clientStatus === 'completed';
    const staffCompleted  = staffStatus  === 'completed';

    const isGreen  = clientCompleted && staffCompleted;
    const isRed    = clientStatus === 'empty' && staffStatus === 'empty';
    const isYellow = !isGreen && !isRed;

    // ── KPI status ─────────────────────────────────────────
    const fKpis = (kpiRecords ?? []).filter(k =>
      String(k.facility_id) === String(f.id) &&
      Number(k.year) === selectedYear &&
      k.status === 'completed'
    );
    const completedMonths = fKpis.map(k => Number(k.month));
    const isKpiGreen = actionableMonths.length === 0
      ? true
      : actionableMonths.every(m => completedMonths.includes(m));

    return {
      ...f,
      bed_count:       f.bed_count ?? 0,
      udo_color,       // calcolato dall'UDO, non dalla colonna DB rimossa
      udo_name,        // comodo per DirectorFacility e FacilityCard
      isGreen,
      isYellow,
      isRed,
      isKpiGreen,
      clientCompleted,
      staffCompleted,
      clientStatus,
      staffStatus,
    };
  });
};

export const calculateDashboardStats = (enrichedFacilities, activeUdo = 'all') => {
  const active = enrichedFacilities.filter(f =>
    !f.is_suspended &&
    (activeUdo === 'all' || String(f.udo_id) === String(activeUdo))
  );
  const total = active.length || 1;

  return {
    clientPct:  Math.round((active.filter(f => f.clientCompleted).length / total) * 100),
    staffPct:   Math.round((active.filter(f => f.staffCompleted).length  / total) * 100),
    totalBeds:  active.reduce((sum, f) => sum + (f.bed_count || 0), 0),
    counts: {
      all:       active.length,
      todo:      active.filter(f => f.isRed).length,
      progress:  active.filter(f => f.isYellow).length,
      completed: active.filter(f => f.isGreen).length,
    },
  };
};
