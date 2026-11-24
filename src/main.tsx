import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.tsx';
import RealtimeProvider from './components/realtime/RealtimeProvider.tsx';

// TanStack Query: кеш і стан запитів до сервера (ключі запитів — у сторінках/сервісах).
// staleTime 30 с: свіжі дані не перезапитуються; retry 1 — одна повторна спроба при помилці.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <RealtimeProvider>
        <App />
      </RealtimeProvider>
    </QueryClientProvider>
  </StrictMode>
);
