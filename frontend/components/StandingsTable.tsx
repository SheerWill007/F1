'use client';

import { useMemo } from 'react';
import { PositionsResponse } from '@/types/f1';

interface Props {
  data: PositionsResponse;
  currentLap: number;
}

export default function StandingsTable({ data, currentLap }: Props) {
  const standings = useMemo(() => {
    const lapData = data.laps.find((l) => l.lap === currentLap)
      || data.laps[data.laps.length - 1];

    if (!lapData) return [];

    return Object.entries(lapData.positions)
      .map(([code, pos]) => ({
        code,
        driver: data.drivers[code],
        position: pos.position,
        lapTime: pos.lapTime,
      }))
      .filter((d) => d.position !== null)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  }, [data, currentLap]);

  return (
    <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-gray/20">
        <h2 className="text-xs font-bold uppercase tracking-widest text-f1-silver">
          Standings — Lap {currentLap}
        </h2>
      </div>
      <div className="overflow-y-auto max-h-[440px]">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-f1-darkgray z-10">
            <tr className="border-b border-f1-gray/20">
              <th className="text-left px-3 py-2 text-f1-gray uppercase tracking-wider w-8">P</th>
              <th className="text-left px-3 py-2 text-f1-gray uppercase tracking-wider">Driver</th>
              <th className="text-left px-3 py-2 text-f1-gray uppercase tracking-wider hidden sm:table-cell">Team</th>
            </tr>
          </thead>
          <tbody>
            {standings.map(({ code, driver, position }) => (
              <tr key={code} className="border-b border-f1-gray/10 hover:bg-white/5 transition-colors">
                <td className="px-3 py-2.5 font-bold text-white">
                  {position}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-0.5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: driver?.color ?? '#fff' }}
                    />
                    <span className="font-bold text-white">{code}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-f1-silver hidden sm:table-cell truncate max-w-[120px]">
                  {driver?.team ?? '—'}
                </td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-f1-gray text-xs">
                  No position data for this lap
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
