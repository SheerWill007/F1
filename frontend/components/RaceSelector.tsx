'use client';

import { useState, useEffect } from 'react';
import { f1API } from '@/lib/api';
import { Race } from '@/types/f1';

interface Props {
  year: number;
  race: Race | null;
  sessionType: string;
  onYearChange: (y: number) => void;
  onRaceChange: (r: Race) => void;
  onSessionChange: (s: string) => void;
  onLoad: () => void;
  loading: boolean;
  accessReady: boolean;
  requiresAuth: boolean;
}

const SESSION_TYPES = [
  { value: 'R', label: 'Race' },
  { value: 'Q', label: 'Qualifying' },
  { value: 'S', label: 'Sprint' },
  { value: 'SQ', label: 'Sprint Q' },
  { value: 'FP1', label: 'FP1' },
  { value: 'FP2', label: 'FP2' },
  { value: 'FP3', label: 'FP3' },
];

export default function RaceSelector({
  year, race, sessionType,
  onYearChange, onRaceChange, onSessionChange, onLoad, loading,
  accessReady, requiresAuth
}: Props) {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<Race[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [seasonsError, setSeasonsError] = useState(false);
  const [scheduleError, setScheduleError] = useState(false);

  const loadSeasons = () => {
    setSeasonsError(false);
    f1API.getSeasons()
      .then((d) => setSeasons(d.seasons.reverse()))
      .catch(() => setSeasonsError(true));
  };

  const loadSchedule = (y: number) => {
    setScheduleLoading(true);
    setScheduleError(false);
    f1API.getSchedule(y)
      .then((d) => setSchedule(d.races))
      .catch(() => setScheduleError(true))
      .finally(() => setScheduleLoading(false));
  };

  // These effects intentionally fetch remote selector options when inputs change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSeasons(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSchedule(year); }, [year]);

  return (
    <div className="bg-f1-darkgray border border-f1-gray/20 rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-end">

        {/* Season */}
        <div className="space-y-1.5">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Season</label>
          {seasonsError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-f1-red">Failed to load</span>
              <button
                onClick={loadSeasons}
                className="text-xs text-f1-silver hover:text-white underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              disabled={seasons.length === 0}
              className="bg-f1-black border border-f1-gray/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-f1-red transition-colors min-w-[90px] disabled:opacity-50"
            >
              {seasons.length === 0 && (
                <option value="">Loading...</option>
              )}
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Race */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Grand Prix</label>
          {scheduleError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-f1-red">Failed to load races</span>
              <button
                onClick={() => loadSchedule(year)}
                className="text-xs text-f1-silver hover:text-white underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <select
              value={race?.round ?? ''}
              onChange={(e) => {
                const r = schedule.find((s) => s.round === Number(e.target.value));
                if (r) onRaceChange(r);
              }}
              disabled={scheduleLoading}
              className="w-full bg-f1-black border border-f1-gray/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-f1-red transition-colors disabled:opacity-50"
            >
              <option value="">
                {scheduleLoading ? 'Loading...' : '— Select Race —'}
              </option>
              {schedule.map((r) => (
                <option key={r.round} value={r.round}>
                  R{r.round} · {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Session Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Session</label>
          <div className="flex gap-1">
            {SESSION_TYPES.map((s) => (
              <button
                key={s.value}
                onClick={() => onSessionChange(s.value)}
                className={`px-3 py-2 text-xs font-bold rounded border transition-all ${sessionType === s.value
                    ? 'bg-f1-red border-f1-red text-white'
                    : 'bg-f1-black border-f1-gray/30 text-f1-silver hover:border-f1-gray hover:text-white'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={onLoad}
          disabled={!race || loading || !accessReady || requiresAuth}
          className="px-6 py-2 bg-f1-red text-white text-xs font-bold uppercase tracking-widest rounded border border-f1-red hover:bg-f1-red/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : requiresAuth ? (
            'Sign In Below'
          ) : (
            'Load Session'
          )}
        </button>
      </div>

      {/* Race info strip */}
      {race && (
        <div className="mt-3 pt-3 border-t border-f1-gray/20 flex items-center gap-3 text-xs text-f1-silver">
          <span>📍 {race.location}, {race.country}</span>
          <span>·</span>
          <span>📅 {race.date}</span>
          {race.format && (
            <>
              <span>·</span>
              <span className="capitalize">{race.format.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>
      )}

      {/* CORS / backend connectivity warning */}
      {(seasonsError || scheduleError) && (
        <div className="mt-3 pt-3 border-t border-f1-gray/20">
          <p className="text-xs text-f1-red">
            ⚠ Cannot reach the backend. If this is a fresh deploy, the server may be cold-starting — wait 30s and retry.
          </p>
        </div>
      )}
    </div>
  );
}
