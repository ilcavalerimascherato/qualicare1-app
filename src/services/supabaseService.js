/**
 * src/services/supabaseService.js  —  v2
 * ─────────────────────────────────────────────────────────────
 * Regola fondamentale: ogni service lancia l'errore, non lo gestisce.
 * La gestione (toast, UI) spetta al chiamante.
 *
 * MODIFICHE v2:
 *  - userService.invite: rimosso il tentativo di chiamare
 *    supabase.auth.admin.inviteUserByEmail() lato client.
 *    Questa API richiede la SERVICE ROLE KEY, che NON deve mai
 *    essere nel bundle del browser.
 *    La funzione ora lancia un errore descrittivo che guida
 *    lo sviluppatore verso la soluzione corretta.
 *    TODO: implementare Edge Function 'invite-user' in Supabase.
 *  - Tutto il resto invariato.
 * ─────────────────────────────────────────────────────────────
 */

import { supabase } from '../supabaseClient';

// ─── Log service ──────────────────────────────────────────────
// FIRE AND FORGET: il log non deve mai bloccare l'operazione principale
const log = (action, details = {}) => {
  supabase.auth.getSession()
    .then(({ data: { session } }) =>
      supabase.from('logs').insert([{
        user_email: session?.user?.email ?? 'unknown',
        action,
        details,
      }])
    )
    .catch(err => console.warn('[log] fallito silenziosamente:', err));
};

// ─── UDO service ──────────────────────────────────────────────
export const udoService = {
  save: async (udo) => {
    const { data, error } = await supabase.from('udos').upsert([udo]).select().single();
    if (error) throw error;
    log(udo.id ? 'UPDATE_UDO' : 'CREATE_UDO', { id: data.id, name: data.name });
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('udos').delete().eq('id', id);
    if (error) throw error;
    log('DELETE_UDO', { id });
  },
};

// ─── Facility service ─────────────────────────────────────────
export const facilityService = {
  save: async (facility) => {
    const { data, error } = await supabase.from('facilities').upsert([facility]).select().single();
    if (error) throw error;
    log(facility.id ? 'UPDATE_FACILITY' : 'CREATE_FACILITY', { id: data.id, name: data.name });
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('facilities').delete().eq('id', id);
    if (error) throw error;
    log('DELETE_FACILITY', { id });
  },
  toggleSuspend: async (facility) => {
    const newState = !facility.is_suspended;
    const { error } = await supabase
      .from('facilities')
      .update({ is_suspended: newState })
      .eq('id', facility.id);
    if (error) throw error;
    log(newState ? 'SUSPEND_FACILITY' : 'REACTIVATE_FACILITY', { id: facility.id });
  },
};

// ─── Questionnaire service ────────────────────────────────────
export const questionnaireService = {
  upsert: async (payload) => {
    const { data, error } = await supabase
      .from('questionnaires')
      .upsert({
        facility_id: payload.facility_id,
        year:        payload.year,
        type:        payload.type,
        calendar_id: `${payload.year}-12`,
        start_date:  payload.start_date || null,
        end_date:    payload.end_date   || null,
        esiti_pdf:   payload.esiti_pdf  || null,
      }, { onConflict: 'facility_id, type, calendar_id' })
      .select()
      .single();
    if (error) throw error;
    log('UPSERT_QUESTIONNAIRE', { facility_id: payload.facility_id, type: payload.type });
    return data;
  },
};

// ─── User management service ──────────────────────────────────
export const userService = {
  /**
   * Invita un nuovo utente.
   *
   * ⚠️  RICHIEDE EDGE FUNCTION — non può funzionare lato client.
   *
   * supabase.auth.admin.* richiede la SERVICE ROLE KEY, che non deve
   * mai essere esposta nel bundle del browser per ragioni di sicurezza.
   *
   * SOLUZIONE: implementare una Supabase Edge Function 'invite-user'
   * che riceve { email, role, companyId, facilityIds } e usa
   * supabaseAdmin (con service role key nel server env) per creare l'utente.
   *
   * Esempio Edge Function (Deno):
   *   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   *   const supabaseAdmin = createClient(
   *     Deno.env.get('SUPABASE_URL'),
   *     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  // solo lato server
   *   )
   *   const { data } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
   *
   * Nel frattempo, usa il pannello Supabase Dashboard → Authentication → Users
   * e lo script SQL generato da InvitoPanel in DirectorFacility.
   */
  invite: async ({ email, role, companyId, facilityIds = [] }) => {
    // Chiamata all'Edge Function (da implementare)
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role, companyId, facilityIds },
    });

    if (error) {
      // Messaggio chiaro se la Edge Function non è ancora deployata
      if (error.message?.includes('Function not found')) {
        throw new Error(
          'La funzione Edge "invite-user" non è ancora deployata su Supabase. ' +
          'Crea la Edge Function o usa il pannello Supabase Dashboard per invitare manualmente l\'utente.'
        );
      }
      throw error;
    }

    log('INVITE_USER', { email, role, facilityIds });
    return data;
  },

  updateAccess: async (userId, facilityIds) => {
    // Rimpiazza tutti gli accessi con il nuovo set
    const { error: delError } = await supabase
      .from('user_facility_access')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    if (facilityIds.length > 0) {
      const rows = facilityIds.map(fid => ({ user_id: userId, facility_id: fid }));
      const { error: insError } = await supabase.from('user_facility_access').insert(rows);
      if (insError) throw insError;
    }
    log('UPDATE_USER_ACCESS', { userId, facilityIds });
  },

  listByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, user_facility_access(facility_id)')
      .eq('company_id', companyId)
      .order('full_name');
    if (error) throw error;
    return data;
  },
};
