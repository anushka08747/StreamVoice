"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Observation } from "../types";
import { seedObservations } from "./seed";

export type Role = "volunteer" | "reviewer";
export type Profile = { name: string; id: string; role: Role; heardFull: boolean };

const OBS_KEY = "streamvoice.observations.v2";
const PROFILE_KEY = "streamvoice.profile.v1";
const DEFAULT_PROFILE: Profile = { name: "Guest volunteer", id: "me", role: "volunteer", heardFull: false };

type Ctx = {
  observations: Observation[];
  addObservation: (o: Observation) => void;
  updateObservation: (id: string, patch: Partial<Observation>) => void;
  resetData: () => void;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
};

const AppCtx = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [observations, setObs] = useState<Observation[]>(seedObservations);
  const [profile, setProf] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    setObs(load(OBS_KEY, seedObservations));
    setProf(load(PROFILE_KEY, DEFAULT_PROFILE));
  }, []);

  const addObservation = useCallback((o: Observation) => setObs((p) => { const n = [...p, o]; save(OBS_KEY, n); return n; }), []);
  const updateObservation = useCallback((id: string, patch: Partial<Observation>) =>
    setObs((p) => { const n = p.map((o) => (o.id === id ? { ...o, ...patch } : o)); save(OBS_KEY, n); return n; }), []);
  const resetData = useCallback(() => { setObs(seedObservations); save(OBS_KEY, seedObservations); }, []);
  const setProfile = useCallback((patch: Partial<Profile>) => setProf((p) => { const n = { ...p, ...patch }; save(PROFILE_KEY, n); return n; }), []);

  const value = useMemo(() => ({ observations, addObservation, updateObservation, resetData, profile, setProfile }),
    [observations, addObservation, updateObservation, resetData, profile, setProfile]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
