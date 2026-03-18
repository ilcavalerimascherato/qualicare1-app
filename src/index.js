// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider }  from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import AppRouter         from './router/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <AppRouter />
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
