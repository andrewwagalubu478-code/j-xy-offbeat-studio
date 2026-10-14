/**
 * Deterministic-ish pattern generator.
 *
 * Given settings it produces a multi-track pattern (drums, bass, chords, lead)
 * as step data. A seeded PRNG keeps results reproducible for the same settings
 * while still feeling musical, and `regenerateTrack` re-rolls a single track.
 */

import {
  type Bars,
  type Composition,
  type GeneratorSettings,
  type KeyName,
  type Mood,
  STEPS_PER_BAR,
  type ScaleName,
  type Step,
  TRACK_IDS,
  type Track,
  type TrackId,
  emptyComposition,
  totalSteps,
} from "./types";

/** Small deterministic PRNG (mulberry32). */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NOTE_INDEX: Record<KeyName, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

const SCALE_INTERVALS: Record<ScaleName, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 3, 5, 7, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

/** Mood nudges velocity, density and register. */
const MOOD_PROFILE: Record<
  Mood,
  { density: number; velocity: number; octave: number }
> = {
  none: { density: 1, velocity: 1, octave: 0 },
  dark: { density: 0.85, velocity: 0.9, octave: -1 },
  bright: { density: 1.1, velocity: 1.05, octave: 1 },
  dreamy: { density: 0.75, velocity: 0.8, octave: 0 },
  tense: { density: 1.2, velocity: 1.1, octave: 0 },
};

/** Genre controls the rhythmic skeleton and voicing. */
const GENRE_PROFILE: Record<
  GeneratorSettings["genre"],
  {
    kick: number[];
    snare: number[];
    hat: number[];
    bassDensity: number;
    chordEvery: number;
  }
> = {
  lofi: {
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    bassDensity: 0.5,
    chordEvery: 8,
  },
  synthwave: {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    bassDensity: 0.75,
    chordEvery: 8,
  },
  ambient: {
    kick: [0],
    snare: [],
    hat: [8],
    bassDensity: 0.25,
    chordEvery: 16,
  },
  chiptune: {
    kick: [0, 8],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bassDensity: 0.85,
    chordEvery: 4,
  },
  house: {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    bassDensity: 0.7,
    chordEvery: 8,
  },
};

function scaleNote(
  key: KeyName,
  scale: ScaleName,
  degree: number,
  octave: number,
): number {
  const intervals = SCALE_INTERVALS[scale];
  const len = intervals.length;
  const octaveShift = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  const semitone =
    NOTE_INDEX[key] + intervals[idx] + (octave + octaveShift) * 12;
  // Keep within a sane MIDI range.
  return Math.max(24, Math.min(108, semitone));
}

function makeStep(active: boolean, velocity: number, note: number): Step {
  return { active, velocity: Math.max(0.1, Math.min(1, velocity)), note };
}

function generateDrums(
  settings: GeneratorSettings,
  rng: () => number,
  mood: Mood,
): Step[] {
  const profile = GENRE_PROFILE[settings.genre];
  const moodProfile = MOOD_PROFILE[mood];
  const steps = totalSteps(settings.bars);
  const out: Step[] = [];
  for (let i = 0; i < steps; i += 1) {
    const pos = i % STEPS_PER_BAR;
    const isKick = profile.kick.includes(pos);
    const isSnare = profile.snare.includes(pos);
    const isHat = profile.hat.includes(pos) && rng() < moodProfile.density;
    const active = isKick || isSnare || isHat;
    const velocity = isKick ? 1 : isSnare ? 0.85 : 0.5;
    const note = isKick ? 36 : isSnare ? 38 : 42;
    out.push(makeStep(active, velocity * moodProfile.velocity, note));
  }
  return out;
}

function generateBass(
  settings: GeneratorSettings,
  rng: () => number,
  mood: Mood,
): Step[] {
  const profile = GENRE_PROFILE[settings.genre];
  const moodProfile = MOOD_PROFILE[mood];
  const steps = totalSteps(settings.bars);
  const out: Step[] = [];
  let degree = 0;
  for (let i = 0; i < steps; i += 1) {
    const pos = i % STEPS_PER_BAR;
    const onBeat = pos % 4 === 0;
    const active = onBeat || rng() < profile.bassDensity * 0.35;
    if (active && rng() < 0.4) degree = Math.floor(rng() * 5);
    const note = scaleNote(
      settings.key,
      settings.scale,
      degree,
      2 + moodProfile.octave,
    );
    out.push(makeStep(active, 0.85 * moodProfile.velocity, note));
  }
  return out;
}

function generateChords(
  settings: GeneratorSettings,
  rng: () => number,
  mood: Mood,
): Step[] {
  const profile = GENRE_PROFILE[settings.genre];
  const moodProfile = MOOD_PROFILE[mood];
  const steps = totalSteps(settings.bars);
  const out: Step[] = [];
  let root = 0;
  for (let i = 0; i < steps; i += 1) {
    const pos = i % STEPS_PER_BAR;
    const active = pos % profile.chordEvery === 0;
    if (active) root = Math.floor(rng() * 6);
    const note = scaleNote(
      settings.key,
      settings.scale,
      root,
      3 + moodProfile.octave,
    );
    out.push(makeStep(active, 0.7 * moodProfile.velocity, note));
  }
  return out;
}

function generateLead(
  settings: GeneratorSettings,
  rng: () => number,
  mood: Mood,
): Step[] {
  const moodProfile = MOOD_PROFILE[mood];
  const steps = totalSteps(settings.bars);
  const out: Step[] = [];
  let degree = 4;
  for (let i = 0; i < steps; i += 1) {
    const pos = i % STEPS_PER_BAR;
    const active = rng() < 0.28 * moodProfile.density && pos % 2 === 0;
    if (active) degree += Math.floor(rng() * 5) - 2;
    const note = scaleNote(
      settings.key,
      settings.scale,
      degree,
      4 + moodProfile.octave,
    );
    out.push(makeStep(active, 0.75 * moodProfile.velocity, note));
  }
  return out;
}

function generateTrack(
  id: TrackId,
  settings: GeneratorSettings,
  rng: () => number,
): Step[] {
  switch (id) {
    case "drums":
      return generateDrums(settings, rng, settings.mood);
    case "bass":
      return generateBass(settings, rng, settings.mood);
    case "chords":
      return generateChords(settings, rng, settings.mood);
    case "lead":
      return generateLead(settings, rng, settings.mood);
  }
}

function seedFor(settings: GeneratorSettings, salt: string): number {
  return hashString(
    `${settings.genre}|${settings.mood}|${settings.bpm}|${settings.key}|${settings.scale}|${settings.bars}|${salt}`,
  );
}

/** Generate a full composition from settings. */
export function generateComposition(settings: GeneratorSettings): Composition {
  const base = emptyComposition(settings);
  const tracks: Track[] = TRACK_IDS.map((id) => {
    const rng = makeRng(seedFor(settings, id));
    return {
      ...base.tracks.find((t) => t.id === id)!,
      steps: generateTrack(id, settings, rng),
    };
  });
  return { settings, tracks };
}

/**
 * Re-roll a single track in place, keeping the rest of the composition.
 * `nonce` lets the caller request a fresh variation each press.
 */
export function regenerateTrack(
  composition: Composition,
  id: TrackId,
  nonce: number,
): Composition {
  const rng = makeRng(seedFor(composition.settings, `${id}:${nonce}`));
  const steps = generateTrack(id, composition.settings, rng);
  return {
    ...composition,
    tracks: composition.tracks.map((track) =>
      track.id === id ? { ...track, steps } : track,
    ),
  };
}

/** Resize every track to match a new bar count, preserving existing steps. */
export function resizeComposition(
  composition: Composition,
  bars: Bars,
): Composition {
  const length = totalSteps(bars);
  return {
    settings: { ...composition.settings, bars },
    tracks: composition.tracks.map((track) => {
      const steps = track.steps.slice(0, length);
      while (steps.length < length) {
        steps.push({ active: false, velocity: 0.8, note: 60 });
      }
      return { ...track, steps };
    }),
  };
}
