'use client';

import { useMemo } from 'react';
import { TyreResponse } from '@/types/f1';
import { TYRE_ABBR } from '@/lib/utils';

interface Props {
  data: TyreResponse;
  currentLap: number;
  totalLaps?: number;
}

const TYRE_LABELS: Record<string, { full: string; color: string }> = {
  SOFT:     { full: 'Soft',         color: '#E8002D' },
  MEDIUM:   { full: 'Medium',       color: '#FFF200' },
  HARD:     { full: 'Hard',         color: '#FFFFFF' },
  INTERMEDIATE: { full: 'Inter',   color: '#39B54A' },
  WET:      { full: 'Wet',          color: '#0067FF' },
  UNKNOWN:  { full: 'Unknown',      color: '#666' },
  TEST_UNKNOWN: { full: 'Unknown',  color: '#666' },
};

export default function TyreStrategy({ data, currentLap, totalLaps }: Props) {
  const drivers = useMemo(() => {
    return Object.values(data.drivers).sort((a, b) => {
      // Sort by first position at lap 1 if possible, else alphabetically
      return a.code.localeCompare(b.code);
    });
  }, [data.drivers]);

  const maxLap = totalLaps ?? Math.max(...drivers.flatMap((d) => d.stints.map((s) => s.endLap)));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {Object.entries(TYRE_LABELS).slice(0, 5).map(([compound, info]) => (
          <div key={compound} className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className="w-4 h-4 rounded-sm border border-black/20 inline-block"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-f1-silver">{info.full}</span>
          </div>
        ))}
      </div>

      {/* Strategy Chart */}
      <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 p-4 overflow-x-auto">
        <h2 className="text-xs font-bold uppercase tracking-widest text-f1-silver mb-4">
          Tyre Strategy — {data.event}
        </h2>

        {/* Lap ruler */}
        <div className="relative">
          {/* Header ruler */}
          <div className="flex items-center mb-2 pl-24">
            <div className="relative flex-1 h-4">
              {[0, 20, 40, 60, 80, 100].filter((l) => l <= maxLap).map((l) => (
                <span
                  key={l}
                  className="absolute text-xs text-f1-gray font-mono transform -translate-x-1/2"
                  style={{ left: `${(l / maxLap) * 100}%` }}
                >
                  {l === 0 ? '1' : l}
                </span>
              ))}
            </div>
          </div>

          {/* Driver rows */}
          {drivers.map((driver) => (
            <div key={driver.code} className="flex items-center mb-1.5 group">
              {/* Driver label */}
              <div className="w-24 flex-shrink-0 flex items-center gap-1.5 pr-2">
                <span
                  className="w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: driver.color }}
                />
                <span className="text-xs font-bold text-white font-mono truncate">
                  {driver.code}
                </span>
              </div>

              {/* Stint bars */}
              <div className="relative flex-1 h-7 bg-black/20 rounded overflow-hidden">
                {driver.stints.map((stint, i) => {
                  const left = ((stint.startLap - 1) / maxLap) * 100;
                  const width = ((stint.endLap - stint.startLap + 1) / maxLap) * 100;
                  const tyreInfo = TYRE_LABELS[stint.compound] ?? TYRE_LABELS.UNKNOWN;

                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center justify-center text-black font-bold text-xs overflow-hidden transition-opacity group-hover:opacity-90"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: tyreInfo.color,
                        borderRight: '1px solid rgba(0,0,0,0.3)',
                      }}
                      title={`${tyreInfo.full} — Laps ${stint.startLap}–${stint.endLap} (${stint.laps} laps)`}
                    >
                      {width > 5 && (
                        <span className={`px-1 ${stint.compound === 'HARD' || stint.compound === 'MEDIUM' ? 'text-black' : 'text-white'}`}>
                          {TYRE_ABBR[stint.compound]}
                          {width > 12 && <span className="ml-1 font-normal opacity-80 hidden sm:inline">{stint.laps}L</span>}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Current lap marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-f1-red/80 z-10 pointer-events-none"
                  style={{ left: `${((currentLap - 1) / maxLap) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Bottom lap ruler */}
          <div className="flex items-center mt-2 pl-24">
            <div className="relative flex-1 h-px bg-f1-gray/20">
              {Array.from({ length: Math.ceil(maxLap / 5) + 1 }, (_, i) => i * 5)
                .filter((l) => l <= maxLap)
                .map((l) => (
                  <div
                    key={l}
                    className="absolute top-0 w-px h-2 bg-f1-gray/30"
                    style={{ left: `${(l / maxLap) * 100}%` }}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Driver degradation table */}
      <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-gray/20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-f1-silver">
            Stint Summary
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-f1-gray/20">
                <th className="text-left px-4 py-2.5 text-f1-gray uppercase tracking-wider">Driver</th>
                <th className="text-left px-4 py-2.5 text-f1-gray uppercase tracking-wider hidden sm:table-cell">Team</th>
                <th className="text-left px-4 py-2.5 text-f1-gray uppercase tracking-wider">Stints</th>
                <th className="text-left px-4 py-2.5 text-f1-gray uppercase tracking-wider">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.code} className="border-b border-f1-gray/10 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-0.5 h-5 rounded-full"
                        style={{ backgroundColor: driver.color }}
                      />
                      <span className="font-bold text-white">{driver.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-f1-silver hidden sm:table-cell truncate max-w-[140px]">
                    {driver.team}
                  </td>
                  <td className="px-4 py-2.5 text-white">{driver.stints.length}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {driver.stints.map((stint, i) => {
                        const info = TYRE_LABELS[stint.compound] ?? TYRE_LABELS.UNKNOWN;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{
                              backgroundColor: info.color,
                              color: stint.compound === 'HARD' || stint.compound === 'MEDIUM' ? '#000' : '#fff',
                            }}
                            title={`${info.full}: L${stint.startLap}–${stint.endLap}`}
                          >
                            {TYRE_ABBR[stint.compound]}
                            <span className="font-normal opacity-70 hidden md:inline">{stint.laps}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
