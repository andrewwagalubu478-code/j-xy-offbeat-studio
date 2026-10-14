/**
 * Zustand store for the current composition and transport state.
 *
 * This is the single source of truth the generator panel, sequencer grid and
 * transport bar all read from and write to.
 */

import {
  generateComposition,
  regenerateTrack,
  resizeComposition,
} from "@/lib/audio/generator";
import {
  type Bars,
  type Composition,
  DEFAULT_SETTINGS,
  type GeneratorSettings,
  type Step,
  type TrackId,
  type TransportState,
  emptyComposition,
} from "@/lib/audio/types";
import { create } from "zustand";

interface StudioState {
  composition: Composition;
  transport: TransportState;
  currentStep: number;
  loop: boolean;
  volume: number;
  hasGenerated: boolean;
  regenerateNonce: number;

  setSettings: (patch: Partial<GeneratorSettings>) => void;
  generate: () => void;
  regenerate: (trackId: TrackId) => void;
  setBars: (bars: Bars) => void;
  toggleStep: (trackId: TrackId, index: number) => void;
  setTrackGain: (trackId: TrackId, gain: number) => void;
  toggleMute: (trackId: TrackId) => void;
  toggleSolo: (trackId: TrackId) => void;
  loadComposition: (composition: Composition) => void;
  setTransport: (transport: TransportState) => void;
  setCurrentStep: (step: number) => void;
  setLoop: (loop: boolean) => void;
  setVolume: (volume: number) => void;
}

function updateTrack(
  composition: Composition,
  trackId: TrackId,
  updater: (
    track: Composition["tracks"][number],
  ) => Composition["tracks"][number],
): Composition {
  return {
    ...composition,
    tracks: composition.tracks.map((track) =>
      track.id === trackId ? updater(track) : track,
    ),
  };
}

export const useStudioStore = create<StudioState>((set) => ({
  composition: emptyComposition(DEFAULT_SETTINGS),
  transport: "stopped",
  currentStep: -1,
  loop: true,
  volume: 0.8,
  hasGenerated: false,
  regenerateNonce: 0,

  setSettings: (patch) =>
    set((state) => ({
      composition: {
        ...state.composition,
        settings: { ...state.composition.settings, ...patch },
      },
    })),

  generate: () =>
    set((state) => ({
      composition: generateComposition(state.composition.settings),
      hasGenerated: true,
      currentStep: -1,
    })),

  regenerate: (trackId) =>
    set((state) => {
      const nonce = state.regenerateNonce + 1;
      return {
        composition: regenerateTrack(state.composition, trackId, nonce),
        regenerateNonce: nonce,
        hasGenerated: true,
      };
    }),

  setBars: (bars) =>
    set((state) => ({
      composition: resizeComposition(state.composition, bars),
      currentStep: -1,
    })),

  toggleStep: (trackId, index) =>
    set((state) => ({
      composition: updateTrack(state.composition, trackId, (track) => ({
        ...track,
        steps: track.steps.map((step, i) =>
          i === index ? { ...step, active: !step.active } : step,
        ),
      })),
    })),

  setTrackGain: (trackId, gain) =>
    set((state) => ({
      composition: updateTrack(state.composition, trackId, (track) => ({
        ...track,
        gain,
      })),
    })),

  toggleMute: (trackId) =>
    set((state) => ({
      composition: updateTrack(state.composition, trackId, (track) => ({
        ...track,
        muted: !track.muted,
      })),
    })),

  toggleSolo: (trackId) =>
    set((state) => ({
      composition: updateTrack(state.composition, trackId, (track) => ({
        ...track,
        solo: !track.solo,
      })),
    })),

  loadComposition: (composition) =>
    set({
      composition,
      hasGenerated: true,
      currentStep: -1,
      transport: "stopped",
    }),

  setTransport: (transport) => set({ transport }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setLoop: (loop) => set({ loop }),
  setVolume: (volume) => set({ volume }),
}));

/** Convenience selector for a single track's steps. */
export function selectTrackSteps(state: StudioState, trackId: TrackId): Step[] {
  return (
    state.composition.tracks.find((track) => track.id === trackId)?.steps ?? []
  );
}
