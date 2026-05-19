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
  onYearChange, onRaceChange, onSessionChange, onLoad, loading
}: Props) {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<Race[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    f1API.getSeasons().then((d) => setSeasons(d.seasons.reverse()));
  }, []);

  useEffect(() => {
    setScheduleLoading(true);
    f1API.getSchedule(year)
      .then((d) => setSchedule(d.races))
      .finally(() => setScheduleLoading(false));
  }, [year]);

  return (
    <div className="bg-f1-darkgray border border-f1-gray/20 rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Season */}
        <div className="space-y-1.5">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Season</label>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-f1-black border border-f1-gray/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-f1-red transition-colors min-w-[90px]"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Race */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Grand Prix</label>
          <select
            value={race?.round ?? ''}
            onChange={(e) => {
              const r = schedule.find((s) => s.round === Number(e.target.value));
              if (r) onRaceChange(r);
            }}
            disabled={scheduleLoading}
            className="w-full bg-f1-black border border-f1-gray/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-f1-red transition-colors disabled:opacity-50"
          >
            <option value="">{scheduleLoading ? 'Loading...' : '— Select Race —'}</option>
            {schedule.map((r) => (
              <option key={r.round} value={r.round}>
                R{r.round} · {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Session Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-f1-silver uppercase tracking-widest">Session</label>
          <div className="flex gap-1">
            {SESSION_TYPES.map((s) => (
              <button
                key={s.value}
                onClick={() => onSessionChange(s.value)}
                className={`px-3 py-2 text-xs font-bold rounded border transition-all ${
                  sessionType === s.value
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
          disabled={!race || loading}
          className="px-6 py-2 bg-f1-red text-white text-xs font-bold uppercase tracking-widest rounded border border-f1-red hover:bg-f1-red/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            'Load Session'
          )}
        </button>
      </div>

      {race && (
        <div className="mt-3 pt-3 border-t border-f1-gray/20 flex items-center gap-3 text-xs text-f1-silver">
          <span>📍 {race.location}, {race.country}</span>
          <span>·</span>
          <span>📅 {race.date}</span>
          {race.format && <><span>·</span><span className="capitalize">{race.format.replace(/_/g, ' ')}</span></>}
        </div>
      )}
    </div>
  );
}
