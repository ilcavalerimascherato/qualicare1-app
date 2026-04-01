# CHANGELOG — QualiCAVA

## v1.0.0 — 2026-04-01 — Primo deploy stabile

### Stack
React 18 · Supabase · Tailwind CSS · Recharts · Gemini AI · jsPDF · html2canvas  
Deploy: `qualicava-app.vercel.app` · Repo: `github.com/ilcavalerimascherato/qualicava-app`

---

### Funzionalità incluse

#### Dashboard principale
- Griglia strutture con 3 densità (4 / 6 / 8 colonne)
- Filtri per UDO, stato avanzamento, ricerca testuale
- Toggle strutture sospese
- Contatore posti letto attivi
- Progress bar report clienti / staff
- Header con nome utente e 4 pulsanti azione (Report, Qualità, KPI, Nuova struttura)

#### Gestione strutture (FacilityCard / FacilityModal)
- Creazione e modifica struttura con validazione
- Campi: nome, UDO, società, regione, indirizzo, posti letto, direttore, email
- Provisioning automatico account direttore al salvataggio (via Edge Function)
- Toggle sospensione struttura
- Badge rischio (solo admin, 4 colori)
- Icona accesso vista direttore

#### KPI — sistema completo
- **KpiManagerModal** — inserimento mensile KPI per struttura con validazione
- **KpiChartsModal** — grafici trend per struttura, overview HR (Lavoratori + Addetti Cucina)
- **KpiLaserModal** — analisi multi-struttura, click-to-isolate, filtri, ricerca legenda
- **KpiXrayModal** — analisi anomalie KPI per struttura
- **KpiDashboardModal** — dashboard KPI aggregata
- **KpiHubModal** — hub di accesso agli strumenti KPI
- `kpiRules.js` — 37 indicatori con settori, formule, soglie semaforo
- `kpiFormulaEngine.js` — calcolo formule con `isNumericSettore()`
- `kpiAnomalyEngine.js` — 14 regole di validazione logica (inclusa `addetti_cucina_gt_lavoratori`)
- `riskWeights.js` — pesi rischio KPI, soglie semaforo, criteri NC automatica
- `riskScoreEngine.js` — score rischio 0–100 con media mobile 3 mesi
- `autoNcEngine.js` — apertura NC automatica da KPI in rosso per N mesi consecutivi

#### Non Conformità
- Registro NC con 24 campi e validazione stato
- Filtri per stato, severità, UDO, ricerca testuale
- Expand dettaglio NC con nota HQ
- Badge 🤖 System sulle NC generate automaticamente da KPI
- Aggiornamento stato con data chiusura automatica

#### Dashboard Qualità (QualityDashboardModal)
- Tab **Non Conformità** — lista filtrata con expand
- Tab **Solleciti** — verifica inadempienze KPI tutti i mesi + questionari, invio email singolo/massivo
- Tab **Statistiche NC** — grafici per stato, severità, categoria, UDO
- Tab **Mailing List** — export CSV, mailto BCC per ruolo
- Tab **Utenti** — lista utenti, modifica ruolo/accessi, creazione nuovo utente via Edge Function

#### Questionari soddisfazione
- Gestione questionari clienti e operatori per struttura
- Integrazione con analytics AI (Gemini)
- Import dati e report PDF multi-sezione

#### Vista Direttore (DirectorFacility)
- Dashboard KPI trend (37 card indicatori)
- BenchmarkTab confronto tra strutture
- Banner NC aperte persistente
- InvitoPanel per invio credenziali via Edge Function
- `useAdaptiveData` con fix superadmin

#### Autenticazione
- Login con magic link
- Flusso "Password dimenticata"
- Gestione sessione scaduta con redirect `?expired=1`
- `AuthContext` con `can()`, ruoli, accessi per struttura
- Ruoli: superadmin · admin · sede · director

#### Report e export
- **GlobalReportModal** — report globale con tutti 37 KPI, scrollbar
- **AnalyticsModal** — PDF 2 sezioni separate (testo + grafici)
- `pdfExport.js` v5 — multi-sezione, logo su ogni pagina

#### Infrastruttura
- Edge Function `invite-user` v2 — crea utente + profilo + accessi + email reset
- `supabaseService.js` — servizi udos, facilities, questionnaires, users con logging
- `AuthContext.jsx` — sessione, profilo, ruolo, permessi
- Log automatico su tutte le operazioni principali

---

### Problemi noti aperti
1. **Email invito** — Outlook blocca il dominio Supabase. Fix: whitelist `mail.supabase.io` o SMTP custom
2. **Edge Function cold start** — primo invio lento (~2s) per cold start Deno
3. **Migrazione AWS** — pianificata dopo stabilizzazione v1.x

---

### Regole di sviluppo
- Mai cancellare funzionalità esistenti — solo aggiungere o modificare chirurgicamente
- Ogni modifica parte dalla lettura del file esistente
- Fix ESLint prima di ogni deploy
- Pesi rischio e criteri NC configurabili in `riskWeights.js` senza toccare il codice