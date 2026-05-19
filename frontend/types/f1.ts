export interface Race {
  round: number;
  name: string;
  country: string;
  location: string;
  date: string;
  format: string;
}

export interface ScheduleResponse {
  year: number;
  races: Race[];
}

export interface DriverInfo {
  code: string;
  fullName: string;
  team: string;
  color: string;
}

export interface LapPosition {
  position: number | null;
  lapTime: string | null;
}

export interface LapData {
  lap: number;
  positions: Record<string, LapPosition>;
}

export interface PositionsResponse {
  year: number;
  round: number;
  sessionType: string;
  event: string;
  totalLaps: number;
  drivers: Record<string, DriverInfo>;
  laps: LapData[];
}

export interface Stint {
  compound: TyreCompound;
  startLap: number;
  endLap: number;
  laps: number;
  color: string;
}

export interface LapTyreData {
  lap: number;
  compound: TyreCompound;
  tyreLife: number | null;
  color: string;
  isPersonalBest: boolean;
  lapTime: string | null;
  sector1: string | null;
  sector2: string | null;
  sector3: string | null;
}

export interface DriverTyreData extends DriverInfo {
  stints: Stint[];
  laps: LapTyreData[];
}

export interface TyreResponse {
  year: number;
  round: number;
  sessionType: string;
  event: string;
  drivers: Record<string, DriverTyreData>;
}

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN' | 'TEST_UNKNOWN';

export interface RaceResult {
  position: number | null;
  driverNumber: number | null;
  code: string;
  fullName: string;
  team: string;
  color: string;
  points: number | null;
  status: string | null;
  gridPosition: number | null;
  time: string | null;
}

export interface ResultsResponse {
  year: number;
  round: number;
  event: string;
  results: RaceResult[];
}

export type SessionType = 'R' | 'Q' | 'S' | 'SQ' | 'FP1' | 'FP2' | 'FP3';
