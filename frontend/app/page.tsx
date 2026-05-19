'use client';

import { useState, useEffect } from 'react';
import { f1API } from '@/lib/api';
import { Race, PositionsResponse, TyreResponse, ResultsResponse } from '@/types/f1';
import RaceSelector from '@/components/RaceSelector';
import PositionChart from '@/components/PositionChart';
import TyreStrategy from '@/components/TyreStrategy';
import StandingsTable from '@/components/StandingsTable';
import SessionHeader from '@/components/SessionHeader';
import LoadingState from '@/components/LoadingState';

type ActiveTab = 'positions' | 'tyres' | 'results';

export default function Home() {
  const [year, setYear] = useState<number>(2024);
  const [race, setRace] = useState<Race | null>(null);
  const [sessionType, setSessionType] = useState<string>('R');
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('positions');

  const [positionsData, setPositionsData] = useState<PositionsResponse | null>(null);
  const [tyreData, setTyreData] = useState<TyreResponse | null>(null);
  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadRaceData = async () => {
    if (!race) return;
    setLoading(true);
    setError(null);
    setPositionsData(null);
    setTyreData(null);
    setResultsData(null);
    setCurrentLap(1);

    try {
      setLoadingMessage('Loading session data from FastF1...');
      const [pos, tyres, results] = await Promise.allSettled([
        f1API.getPositions(year, race.round, sessionType),
        f1API.getTyres(year, race.round, sessionType),
        f1API.getResults(year, race.round, sessionType),
      ]);

      if (pos.status === 'fulfilled') {
        setPositionsData(pos.value);
        setCurrentLap(Math.min(10, pos.value.totalLaps));
      }
      if (tyres.status === 'fulfilled') setTyreData(tyres.value);
      if (results.status === 'fulfilled') setResultsData(results.value);

      if (pos.status === 'rejected' && tyres.status === 'rejected' && results.status === 'rejected') {
        throw new Error('Failed to load any session data. The session may not be available.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load race data');
    } finally {
      setLoading(false);
    }
  };

  const hasData = positionsData || tyreData || resultsData;

  return (
    <div className="min-h-screen bg-f1-black text-white font-mono">
      {/* Header Bar */}
      <header className="border-b border-f1-gray/30 bg-f1-black/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-f1-red rounded-sm flex items-center justify-center">
                <span className="text-xs font-black text-white leading-none">F1</span>
              </div>
              <span className="text-sm font-bold tracking-widest text-white uppercase">Race Analysis</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-f1-gray/40" />
            <span className="hidden md:block text-xs text-f1-silver tracking-wider">Dashboard v1.0</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-f1-silver">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              FastF1 Connected
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* Race Selector */}
        <RaceSelector
          year={year}
          race={race}
          sessionType={sessionType}
          onYearChange={setYear}
          onRaceChange={setRace}
          onSessionChange={setSessionType}
          onLoad={loadRaceData}
          loading={loading}
        />

        {/* Loading State */}
        {loading && <LoadingState message={loadingMessage} />}

        {/* Error */}
        {error && (
          <div className="border border-f1-red/50 bg-f1-red/10 rounded-lg p-4">
            <p className="text-f1-red text-sm font-mono">⚠ {error}</p>
            <p className="text-f1-silver text-xs mt-1">Note: First load may take 30–60s while FastF1 downloads telemetry data.</p>
          </div>
        )}

        {/* Session Header */}
        {hasData && !loading && (
          <SessionHeader
            positionsData={positionsData}
            resultsData={resultsData}
            year={year}
            race={race}
            sessionType={sessionType}
          />
        )}

        {/* Tabs */}
        {hasData && !loading && (
          <>
            <div className="flex gap-1 border-b border-f1-gray/30">
              {(['positions', 'tyres', 'results'] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab
                    ? 'text-f1-red'
                    : 'text-f1-silver hover:text-white'
                    }`}
                >
                  {tab === 'positions' ? 'Lap Chart' : tab === 'tyres' ? 'Tyre Strategy' : 'Results'}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-red" />
                  )}
                </button>
              ))}
            </div>

            {/* Lap Position Chart */}
            {activeTab === 'positions' && positionsData && (
              <div className="space-y-4">
                {/* Lap Scrubber */}
                <div className="bg-f1-darkgray rounded-lg p-4 border border-f1-gray/20">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-f1-silver uppercase tracking-wider whitespace-nowrap">
                      Lap {currentLap} / {positionsData.totalLaps}
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={positionsData.totalLaps}
                      value={currentLap}
                      onChange={(e) => setCurrentLap(Number(e.target.value))}
                      className="flex-1 accent-f1-red h-1"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentLap(1)}
                        className="text-xs text-f1-silver hover:text-white px-2 py-1 border border-f1-gray/30 rounded"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setCurrentLap(positionsData.totalLaps)}
                        className="text-xs text-f1-silver hover:text-white px-2 py-1 border border-f1-gray/30 rounded"
                      >
                        Final
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2">
                    <PositionChart data={positionsData} currentLap={currentLap} />
                  </div>
                  <div>
                    <StandingsTable data={positionsData} currentLap={currentLap} />
                  </div>
                </div>
              </div>
            )}

            {/* Tyre Strategy */}
            {activeTab === 'tyres' && tyreData && (
              <TyreStrategy data={tyreData} currentLap={currentLap} totalLaps={positionsData?.totalLaps} />
            )}

            {/* Results */}
            {activeTab === 'results' && resultsData && (
              <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-f1-gray/30">
                      <th className="text-left px-4 py-3 text-f1-silver tracking-widest uppercase">Pos</th>
                      <th className="text-left px-4 py-3 text-f1-silver tracking-widest uppercase">Driver</th>
                      <th className="text-left px-4 py-3 text-f1-silver tracking-widest uppercase hidden md:table-cell">Team</th>
                      <th className="text-left px-4 py-3 text-f1-silver tracking-widest uppercase hidden md:table-cell">Grid</th>
                      <th className="text-left px-4 py-3 text-f1-silver tracking-widest uppercase">Time/Status</th>
                      <th className="text-right px-4 py-3 text-f1-silver tracking-widest uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsData.results.map((r, i) => (
                      <tr
                        key={r.code}
                        className="border-b border-f1-gray/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-white">{r.position ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-0.5 h-6 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="font-bold text-white">{r.code}</span>
                            <span className="text-f1-silver hidden sm:inline">{r.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-f1-silver hidden md:table-cell">{r.team}</td>
                        <td className="px-4 py-3 text-f1-silver hidden md:table-cell">
                          {r.gridPosition ?? '—'}
                          {r.gridPosition && r.position && (
                            <span className={`ml-1.5 text-xs ${r.gridPosition > r.position ? 'text-green-400' :
                              r.gridPosition < r.position ? 'text-f1-red' : 'text-f1-silver'
                              }`}>
                              {r.gridPosition > r.position ? `▲${r.gridPosition - r.position}` :
                                r.gridPosition < r.position ? `▼${r.position - r.gridPosition}` : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-f1-silver">
                          {i === 0 ? 'Winner' : r.time || r.status || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white">
                          {r.points ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!hasData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-f1-gray/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-f1-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-f1-silver text-sm font-mono tracking-wide">Select a race and session to begin analysis</p>
              <p className="text-f1-gray text-xs mt-1">Data powered by FastF1 — first load may take 30–60s</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
