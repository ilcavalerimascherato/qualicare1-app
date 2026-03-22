// src/router/AppRouter.jsx
// Routing basato su ruolo. Unica fonte di verità per la navigazione.
// Prerequisito: AuthProvider e ModalProvider già presenti in index.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminApp      = lazy(() => import('../App'));
const DirectorApp   = lazy(() => import('../views/DirectorApp'));
const DirectorFacility = lazy(() => import('../views/DirectorFacility'));
const Login         = lazy(() => import('../Login'));

function Splash({ msg = 'Caricamento...' }) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <span className="font-black text-slate-400 uppercase tracking-[0.2em] text-sm animate-pulse">
        {msg}
      </span>
    </div>
  );
}

// Reindirizza se non autenticato
function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Smista in base al ruolo dopo il login
function RoleRouter() {
  const { profile, loading } = useAuth();
  if (loading || !profile) return <Splash msg="Verifica profilo..." />;

  if (['superadmin', 'admin', 'sede'].includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  if (profile.role === 'director') {
    const ids = profile.accessibleFacilityIds ?? [];
    // Una sola struttura → vai diretto
    if (ids.length === 1) return <Navigate to={`/facility/${ids[0]}`} replace />;
    // Più strutture → lista di selezione
    return <Navigate to="/director" replace />;
  }

  // Ruolo non riconosciuto → logout di sicurezza
  return <Navigate to="/login" replace />;
}

// Protegge le route admin
function RequireAdmin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Splash />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Protegge la route di una struttura specifica
function RequireFacilityAccess() {
  const { facilityId } = useParams();
  const { canAccessFacility, isAdmin, loading } = useAuth();
  if (loading) return <Splash />;
  if (!isAdmin && !canAccessFacility(Number(facilityId))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Splash />}>
        <Routes>
          {/* Unica route pubblica */}
          <Route path="/login" element={<Login />} />

          {/* Tutto il resto richiede autenticazione */}
          <Route element={<RequireAuth />}>

            {/* Root: smista per ruolo */}
            <Route index element={<RoleRouter />} />

            {/* Vista HQ — solo admin/superadmin */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminApp />} />
            </Route>

            {/* Vista direttore — lista strutture */}
            <Route path="/director" element={<DirectorApp />} />

            {/* Vista direttore — struttura specifica */}
            <Route element={<RequireFacilityAccess />}>
              <Route path="/facility/:facilityId" element={<DirectorFacility />} />
            </Route>

          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
