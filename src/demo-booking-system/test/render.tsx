import type { ReactNode } from 'react';
import { render as baseRender } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Testing Library custom-render pattern for page-level tests:
// https://testing-library.com/docs/react-testing-library/setup#custom-render
// Fresh QueryClient per call so cache state can't leak between tests.
// `retry: false` so an MSW-returned error surfaces immediately instead
// of waiting through default retries.
export const renderWithProviders = async (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return baseRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};
