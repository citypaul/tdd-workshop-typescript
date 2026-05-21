import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { makeApiClient } from './api-client';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

// Vite proxies /api to the Hono backend on :3000 (see vite.config.ts).
// Acceptance tests use `playwright-msw` to intercept at the driver layer, so
// this code is 100% production — it does not know anything about tests.
const apiClient = makeApiClient({ baseUrl: '' });
const queryClient = new QueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App apiClient={apiClient} now={() => new Date()} />
    </QueryClientProvider>
  </StrictMode>,
);
