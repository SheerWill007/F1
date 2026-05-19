'use client';

import { PositionsResponse, ResultsResponse } from '@/types/f1';
import { Race } from '@/types/f1';

interface Props {
  positionsData: PositionsResponse | null;
  resultsData: ResultsResponse | null;
  year: number;
  race: Race | null;
  sessionType: string;
}

const SESSION_NAMES: Record<string, string> = {
  R: 'Race', Q: 'Qualifying', S: 'Sprint',
  SQ: 'Sprint Qualifying', FP1: 'Practice 1', FP2: 'Practice 2', FP3: 'Practice 3',
};

export default function SessionHeader({ positionsData, resultsData, year, race, sessionType }: Props) {
  const eventName = positionsData?.event || resultsData?.event || race?.name || '—';
  const winner = resultsData?.results?.[0];
  const totalLaps = positionsData?.totalLaps;
  const numDrivers = positionsData ? Object.keys(positionsData.drivers).length : null;

  return (
    <div className="bg-gradient-to-r from-f1-darkgray to-f1-black border border-f1-gray/20 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-f1-red">
              {year} · {SESSION_NAMES[sessionType] ?? sessionType}
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">{eventName}</h1>
          {race && (
            <p className="text-xs text-f1-silver mt-0.5">{race.location}, {race.country}</p>
          )}
        </div>
        <div className="flex gap-6 text-center">
          {totalLaps && (
            <div>
              <p className="text-xl font-bold text-white">{totalLaps}</p>
              <p className="text-xs text-f1-silver uppercase tracking-wider">Laps</p>
            </div>
          )}
          {numDrivers && (
            <div>
              <p className="text-xl font-bold text-white">{numDrivers}</p>
              <p className="text-xs text-f1-silver uppercase tracking-wider">Drivers</p>
            </div>
          )}
          {winner && (
            <div>
              <p className="text-xl font-bold" style={{ color: winner.color }}>{winner.code}</p>
              <p className="text-xs text-f1-silver uppercase tracking-wider">Winner</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
