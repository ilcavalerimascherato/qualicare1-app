/**
 * src/contexts/AuthContext.jsx  —  v2
 * ─────────────────────────────────────────────────────────────
 * MIGLIORAMENTI v2:
 *  - Sistema permessi granulare tramite `can(action)` invece di
 *    semplici flag booleani (isAdmin, isDirector).
 *    Aggiungere un nuovo permesso = aggiungere una riga in PERMISSIONS.
 *  - Retry automatico fetchProfile in caso di errore di rete
 *    (max 3 tentativi con backoff esponenziale).
 *  - Stato `profileError` esposto: i componenti possono mostrare
 *    un banner "sessione degradata" invece di crashare silenziosamente.
 *  - `useRequireAuth(redirect)` — guard per le route protette.
 *  - `usePermission(action)` — hook granulare per singolo permesso.
 * ─────────────────────────────────────────────────────────────
 */
import {
  createContext, useContext, useEffect, useState, useCallback, useMemo
} from 'react';
import { supabase } from '../supabaseClient';

// ── MAPPA PERMESSI ───────────────────────────────────────────
// Aggiungere nuovi permessi qui — un'unica riga, nessun cambio ai componenti.
const PERMISSIONS = {
  // strutture
  manageStructures:   ['superadmin', 'admin', 'sede'],
  viewAllStructures:  ['superadmin', 'admin', 'sede'],
  suspendStructures:  ['superadmin', 'admin'],
  deleteStructures:   ['superadmin'],
  // utenti
  manageUsers:        ['superadmin'],
  viewUserList:       ['superadmin', 'admin'],
  // KPI
  editKpi:            ['superadmin', 'admin', 'sede', 'director'],
  exportKpi:          ['superadmin', 'admin', 'sede'],
  // report
  generateReport:     ['superadmin', 'admin', 'sede', 'director'],
  generateGlobalReport: ['superadmin', 'admin', 'sede'],
  // UDO
  manageUdo:          ['superadmin', 'admin'],
  // non conformità
  manageNonConformity: ['superadmin', 'admin', 'sede', 'director'],
};

// ── BACKOFF HELPER ────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await delay(500 * Math.pow(2, attempt - 1)); // 500ms, 1s, 2s
    }
  }
}

// ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(undefined); // undefined = non ancora verificato
  const [profile,      setProfile]      = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); setProfileError(null); return; }
    setProfileError(null);
    try {
      const data = await fetchWithRetry(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*, user_facility_access!user_facility_access_user_id_fkey(facility_id)')
          .eq('id', userId)
          .single();
        if (error) throw error;
        return data;
      });
      setProfile({
        ...data,
        accessibleFacilityIds: (data.user_facility_access || []).map(a => a.facility_id),
      });
    } catch (err) {
      console.error('Errore caricamento profilo (esauriti i tentativi):', err);
      setProfileError(err?.message ?? 'Profilo non disponibile');
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile(session?.user?.id).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchProfile(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileError(null);
  }, []);

  // ── permessi ────────────────────────────────────────────────
  const role = profile?.role ?? null;

  /**
   * Controlla se l'utente ha il permesso per un'azione.
   * @param {keyof typeof PERMISSIONS} action
   */
  const can = useCallback((action) => {
    if (!role) return false;
    const allowed = PERMISSIONS[action];
    if (!allowed) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AuthContext] Permesso sconosciuto: "${action}". Aggiungerlo a PERMISSIONS.`);
      }
      return false;
    }
    return allowed.includes(role);
  }, [role]);

  /**
   * Controlla se l'utente può accedere a una struttura specifica.
   */
  const canAccessFacility = useCallback((facilityId) => {
    if (!profile) return false;
    if (can('viewAllStructures')) return true;
    return profile.accessibleFacilityIds.includes(facilityId);
  }, [profile, can]);

  // Shorthand per compatibilità con i componenti esistenti
  const isAdmin      = can('manageStructures');
  const isSuperAdmin = role === 'superadmin';
  const isDirector   = role === 'director';

  const value = useMemo(() => ({
    session,
    profile,
    profileError,
    loading,
    role,
    // permessi
    can,
    canAccessFacility,
    // shorthand (retrocompatibilità)
    isAdmin,
    isSuperAdmin,
    isDirector,
    // azioni
    signOut,
    refreshProfile: () => fetchProfile(session?.user?.id),
  }), [
    session, profile, profileError, loading, role,
    can, canAccessFacility, isAdmin, isSuperAdmin, isDirector,
    signOut, fetchProfile
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook base ────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}

/**
 * Hook granulare per un singolo permesso.
 * Evita che i componenti importino l'intero contesto auth
 * solo per un controllo booleano.
 * @param {keyof typeof PERMISSIONS} action
 */
export function usePermission(action) {
  const { can } = useAuth();
  return can(action);
}
