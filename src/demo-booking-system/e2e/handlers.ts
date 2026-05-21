import { http, HttpResponse } from 'msw';

// Default handlers: an empty world. Every test overrides these via
// `worker.use(...)` with the scenario it needs. The defaults are a safety net
// so a test that forgets to override doesn't silently hit a real backend.
export const defaultHandlers = [
  http.get('/api/rooms', () => HttpResponse.json([])),
  http.get('/api/bookings', () => HttpResponse.json([])),
  http.post('/api/bookings', () => new HttpResponse(null, { status: 500 })),
];
