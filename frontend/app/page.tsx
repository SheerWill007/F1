'use client';

import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { useState, useSyncExternalStore } from 'react';
import { f1API } from '@/lib/api';
import {
  Race,
  PositionsResponse,
  TyreResponse,
  ResultsResponse,
} from '@/types/f1';

import RaceSelector from '@/components/RaceSelector';
import PositionChart from '@/components/PositionChart';
import TyreStrategy from '@/components/TyreStrategy';
import StandingsTable from '@/components/StandingsTable';
import SessionHeader from '@/components/SessionHeader';
import LoadingState from '@/components/LoadingState';

type ActiveTab = 'positions' | 'tyres' | 'results';
const GUEST_ANALYSIS_KEY = 'slipstreams_guest_analysis_viewed';
const GUEST_ANALYSIS_EVENT = 'slipstreams-guest-analysis-viewed';

function subscribeToGuestAnalysis(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(GUEST_ANALYSIS_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(GUEST_ANALYSIS_EVENT, callback);
  };
}

function getGuestAnalysisSnapshot() {
  return window.localStorage.getItem(GUEST_ANALYSIS_KEY) === 'true';
}

export default function Home() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [year, setYear] = useState(2024);
  const [race, setRace] = useState<Race | null>(null);
  const [sessionType, setSessionType] = useState('R');
  const [currentLap, setCurrentLap] = useState(1);
  const [activeTab, setActiveTab] =
    useState<ActiveTab>('positions');

  const [positionsData, setPositionsData] =
    useState<PositionsResponse | null>(null);

  const [tyreData, setTyreData] =
    useState<TyreResponse | null>(null);

  const [resultsData, setResultsData] =
    useState<ResultsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);
  const guestAnalysisViewed = useSyncExternalStore(
    subscribeToGuestAnalysis,
    getGuestAnalysisSnapshot,
    () => false
  );

  const requiresAuth =
    authLoaded && !isSignedIn && guestAnalysisViewed;

  const loadRaceData = async () => {
    if (!race || !authLoaded || requiresAuth) return;

    setLoading(true);
    setError(null);

    setPositionsData(null);
    setTyreData(null);
    setResultsData(null);

    setCurrentLap(1);

    try {
      setLoadingMessage(
        'Loading session data from FastF1...'
      );

      const [positions, tyres, results] =
        await Promise.allSettled([
          f1API.getPositions(
            year,
            race.round,
            sessionType
          ),
          f1API.getTyres(
            year,
            race.round,
            sessionType
          ),
          f1API.getResults(
            year,
            race.round,
            sessionType
          ),
        ]);

      if (positions.status === 'fulfilled') {
        setPositionsData(positions.value);

        setCurrentLap(
          Math.min(
            10,
            positions.value.totalLaps
          )
        );
      }

      if (tyres.status === 'fulfilled') {
        setTyreData(tyres.value);
      }

      if (results.status === 'fulfilled') {
        setResultsData(results.value);
      }

      const hasLoadedAnalysis =
        positions.status === 'fulfilled' ||
        tyres.status === 'fulfilled' ||
        results.status === 'fulfilled';

      if (hasLoadedAnalysis && !isSignedIn) {
        window.localStorage.setItem(GUEST_ANALYSIS_KEY, 'true');
        window.dispatchEvent(new Event(GUEST_ANALYSIS_EVENT));
      }

      if (
        positions.status === 'rejected' &&
        tyres.status === 'rejected' &&
        results.status === 'rejected'
      ) {
        throw new Error(
          'Failed to load session data'
        );
      }
    } catch (err: unknown) {
      setError(
        (err instanceof Error && err.message) ||
          'Failed to load race data'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasData =
    positionsData ||
    tyreData ||
    resultsData;

  return (
    <div className="space-y-6">

      <RaceSelector
        year={year}
        race={race}
        sessionType={sessionType}
        onYearChange={setYear}
        onRaceChange={setRace}
        onSessionChange={setSessionType}
        onLoad={loadRaceData}
        loading={loading}
        accessReady={authLoaded}
        requiresAuth={requiresAuth}
      />

      {requiresAuth && (
        <div className="border border-f1-red/40 bg-f1-darkgray rounded-lg p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <p className="text-xs text-f1-red font-bold uppercase tracking-widest">
              Continue Your Analysis
            </p>
            <h2 className="text-lg font-bold text-white">
              Sign in to explore more races
            </h2>
            <p className="text-sm text-f1-silver max-w-2xl">
              You have viewed your free race analysis. Create a free account or
              sign in with Clerk to load another session.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SignInButton mode="modal">
              <button className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-white border border-f1-gray/40 hover:border-f1-red rounded transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-white bg-f1-red hover:bg-f1-red/90 rounded transition-all">
                Sign Up Free
              </button>
            </SignUpButton>
          </div>
        </div>
      )}

      {loading && (
        <LoadingState
          message={loadingMessage}
        />
      )}

      {error && (
        <div className="border border-f1-red/50 bg-f1-red/10 rounded-lg p-4">
          <p className="text-f1-red text-sm font-mono">
            ⚠ {error}
          </p>

          <p className="text-f1-silver text-xs mt-1">
            First load may take
            30–60s while FastF1
            downloads telemetry.
          </p>
        </div>
      )}

      {hasData && !loading && (
        <SessionHeader
          positionsData={positionsData}
          resultsData={resultsData}
          year={year}
          race={race}
          sessionType={sessionType}
        />
      )}

      {hasData && !loading && (
        <>
          <div className="flex gap-1 border-b border-f1-gray/30">

            {(
              [
                'positions',
                'tyres',
                'results',
              ] as ActiveTab[]
            ).map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab
                    ? 'text-f1-red'
                    : 'text-f1-silver hover:text-white'
                }`}
              >
                {tab === 'positions'
                  ? 'Lap Chart'
                  : tab === 'tyres'
                  ? 'Tyre Strategy'
                  : 'Results'}

                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-red" />
                )}
              </button>
            ))}

          </div>

          {activeTab === 'positions' &&
            positionsData && (
              <div className="space-y-4">

                <div className="bg-f1-darkgray rounded-lg p-4 border border-f1-gray/20">

                  <div className="flex items-center gap-4">

                    <span className="text-xs text-f1-silver uppercase tracking-wider whitespace-nowrap">
                      Lap {currentLap} /
                      {' '}
                      {positionsData.totalLaps}
                    </span>

                    <input
                      type="range"
                      min={1}
                      max={
                        positionsData.totalLaps
                      }
                      value={currentLap}
                      onChange={(e) =>
                        setCurrentLap(
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="flex-1 accent-f1-red"
                    />

                  </div>

                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                  <div className="xl:col-span-2">
                    <PositionChart
                      data={positionsData}
                      currentLap={currentLap}
                    />
                  </div>

                  <StandingsTable
                    data={positionsData}
                    currentLap={currentLap}
                  />

                </div>

              </div>
            )}

          {activeTab === 'tyres' &&
            tyreData && (
              <TyreStrategy
                data={tyreData}
                currentLap={currentLap}
                totalLaps={
                  positionsData?.totalLaps
                }
              />
            )}

          {activeTab === 'results' &&
            resultsData && (
              <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 overflow-hidden">

                <table className="w-full text-xs">

                  <tbody>

                    {resultsData.results.map(
                      (driver, index) => (
                        <tr
                          key={driver.code}
                        >
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {
                              driver.fullName
                            }
                          </td>

                          <td>
                            {
                              driver.team
                            }
                          </td>

                          <td>
                            {
                              driver.points
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

        </>
      )}

      {!hasData &&
        !loading &&
        !error && (

        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">

          <div className="w-16 h-16 rounded-full border-2 border-f1-gray/30 flex items-center justify-center">

            📊

          </div>

          <div>

            <p className="text-f1-silver text-sm font-mono">
              Select a race and
              session to begin
              analysis
            </p>

            <p className="text-f1-gray text-xs mt-1">
              FastF1 powered data
            </p>

          </div>

        </div>

      )}

    </div>
  );
}
