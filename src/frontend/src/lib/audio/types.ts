/**
 * Shared types for the offline music generator.
 *
 * Everything here is plain serializable data so a composition can round-trip
 * through JSON (localStorage) and through the backend `payload` string.
 */

export type TrackId = "drums" | "bass" | "chords" | "lead";

export const TRACK_IDS: TrackId[] = ["drums", "bass", "chords", "lead"];

export const TRACK_LABELS: Record<TrackId, string> = {
  drums: "Drums",
  bass: "Bass",
  chords: "Chords",
  lead: "Lead",
};

export type GenrePreset =
  | "lofi"
  | "synthwave"
  | "ambient"
  | "chiptune"
  | "house";

export const GENRE_PRESETS: { id: GenrePreset; label: string }[] = [
  { id: "lofi", label: "Lo-Fi" },
  { id: "synthwave", label: "Synthwave" },
  { id: "ambient", label: "Ambient" },
  { id: "chiptune", label: "Chiptune" },
  { id: "house", label: "House" },
];

export type Mood = "none" | "dark" | "bright" | "dreamy" | "tense";

export const MOODS: { id: Mood; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dark", label: "Dark" },
  { id: "bright", label: "Bright" },
  { id: "dreamy", label: "Dreamy" },
  { id: "tense", label: "Tense" },
];

export type KeyName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export const KEYS: KeyName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export type ScaleName =
  | "major"
  | "minor"
  | "dorian"
  | "pentatonic"
  | "mixolydian";

export const SCALES: { id: ScaleName; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "dorian", label: "Dorian" },
  { id: "pentatonic", label: "Pentatonic" },
  { id: "mixolydian", label: "Mixolydian" },
];

export const BARS_OPTIONS = [1, 2, 4, 8] as const;
export type Bars = (typeof BARS_OPTIONS)[number];

export const STEPS_PER_BAR = 16;

/** Generator settings that fully determine a pattern. */
export interface GeneratorSettings {
  genre: GenrePreset;
  mood: Mood;
  bpm: number;
  key: KeyName;
  scale: ScaleName;
  bars: Bars;
}

/** A single step in a track. `velocity` is 0..1, `note` is a MIDI note number. */
export interface Step {
  active: boolean;
  velocity: number;
  note: number;
}

/** One track of the sequencer. `steps.length === bars * STEPS_PER_BAR`. */
export interface Track {
  id: TrackId;
  steps: Step[];
  muted: boolean;
  solo: boolean;
  gain: number;
}

/** The full composition: settings plus every track. */
export interface Composition {
  settings: GeneratorSettings;
  tracks: Track[];
}

/** A composition persisted to localStorage or the backend. */
export interface SavedComposition {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  composition: Composition;
  /** Numeric backend id (as a string) once the record has been mirrored. */
  backendId?: string;
}

export type TransportState = "stopped" | "playing" | "paused";

export const DEFAULT_SETTINGS: GeneratorSettings = {
  genre: "lofi",
  mood: "none",
  bpm: 124,
  key: "C",
  scale: "minor",
  bars: 2,
};

export function totalSteps(bars: Bars): number {
  return bars * STEPS_PER_BAR;
}

export function emptyStep(): Step {
  return { active: false, velocity: 0.8, note: 60 };
}

export function emptyTrack(id: TrackId, bars: Bars): Track {
  return {
    id,
    steps: Array.from({ length: totalSteps(bars) }, emptyStep),
    muted: false,
    solo: false,
    gain: 0.8,
  };
}

export function emptyComposition(
  settings: GeneratorSettings = DEFAULT_SETTINGS,
): Composition {
  return {
    settings,
    tracks: TRACK_IDS.map((id) => emptyTrack(id, settings.bars)),
  };
}

export function isComposition(value: unknown): value is Composition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Composition>;
  return (
    !!candidate.settings &&
    typeof candidate.settings.bpm === "number" &&
    Array.isArray(candidate.tracks) &&
    candidate.tracks.length > 0
  );
}
