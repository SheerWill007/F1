import {
  ScheduleResponse,
  PositionsResponse,
  TyreResponse,
  ResultsResponse,
} from '@/types/f1';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const f1API = {
  getSeasons: () => fetchAPI<{ seasons: number[] }>('/api/seasons'),

  getSchedule: (year: number) =>
    fetchAPI<ScheduleResponse>(`/api/schedule/${year}`),

  getPositions: (year: number, round: number, sessionType = 'R') =>
    fetchAPI<PositionsResponse>(
      `/api/race/${year}/${round}/positions?session_type=${sessionType}`
    ),

  getTyres: (year: number, round: number, sessionType = 'R') =>
    fetchAPI<TyreResponse>(
      `/api/race/${year}/${round}/tyres?session_type=${sessionType}`
    ),

  getResults: (year: number, round: number, sessionType = 'R') =>
    fetchAPI<ResultsResponse>(
      `/api/race/${year}/${round}/results?session_type=${sessionType}`
    ),
};
