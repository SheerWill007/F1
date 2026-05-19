import { create } from "zustand";

interface RaceState {
  currentLap: number;
  sessionName: string;

  setCurrentLap: (lap: number) => void;
  setSessionName: (name: string) => void;
}

export const useRaceStore = create<RaceState>((set) => ({
  currentLap: 1,
  sessionName: "Miami Grand Prix",

  setCurrentLap: (lap) =>
    set({
      currentLap: lap,
    }),

  setSessionName: (name) =>
    set({
      sessionName: name,
    }),
}));