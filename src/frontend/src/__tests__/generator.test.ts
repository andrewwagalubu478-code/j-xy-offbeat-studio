/**
 * Generator + studio store behavior.
 *
 * These are the pure, deterministic seams the UI reads from: generating a
 * multi-track pattern, toggling a step, regenerating one track, resizing bars,
 * and mute/solo. They run without a DOM and pin the observable data contract.
 */

import { generateComposition, regenerateTrack } from "@/lib/audio/generator";
import {
  type Composition,
  DEFAULT_SETTINGS,
  STEPS_PER_BAR,
  TRACK_IDS,
  totalSteps,
} from "@/lib/audio/types";
import { useStudioStore } from "@/store/studio";
import { beforeEach, describe, expect, it } from "vitest";

function resetStore(): void {
  useStudioStore.setState({
    composition: {
      settings: { ...DEFAULT_SETTINGS },
      tracks: TRACK_IDS.map((id) => ({
        id,
        steps: Array.from(
          { length: totalSteps(DEFAULT_SETTINGS.bars) },
          () => ({
            active: false,
            velocity: 0.8,
            note: 60,
          }),
        ),
        muted: false,
        solo: false,
        gain: 0.8,
      })),
    },
    transport: "stopped",
    currentStep: -1,
    loop: true,
    volume: 0.8,
    hasGenerated: false,
    regenerateNonce: 0,
  });
}

beforeEach(resetStore);

describe("generateComposition", () => {
  it("produces one track per instrument, each with bars * 16 steps", () => {
    const composition = generateComposition(DEFAULT_SETTINGS);
    expect(composition.tracks.map((t) => t.id)).toEqual(TRACK_IDS);
    for (const track of composition.tracks) {
      expect(track.steps).toHaveLength(totalSteps(DEFAULT_SETTINGS.bars));
    }
  });

  it("activates at least one step on every track", () => {
    const composition = generateComposition(DEFAULT_SETTINGS);
    for (const track of composition.tracks) {
      expect(track.steps.some((step) => step.active)).toBe(true);
    }
  });

  it("is deterministic for the same settings", () => {
    const a = generateComposition(DEFAULT_SETTINGS);
    const b = generateComposition(DEFAULT_SETTINGS);
    expect(a).toEqual(b);
  });

  it("honours the requested bar count", () => {
    const composition = generateComposition({ ...DEFAULT_SETTINGS, bars: 4 });
    for (const track of composition.tracks) {
      expect(track.steps).toHaveLength(4 * STEPS_PER_BAR);
    }
  });
});

describe("regenerateTrack", () => {
  it("re-rolls only the requested track", () => {
    const base = generateComposition(DEFAULT_SETTINGS);
    const next = regenerateTrack(base, "lead", 1);
    const leadBefore = base.tracks.find((t) => t.id === "lead")!.steps;
    const leadAfter = next.tracks.find((t) => t.id === "lead")!.steps;
    expect(leadAfter).not.toEqual(leadBefore);
    for (const id of TRACK_IDS.filter((t) => t !== "lead")) {
      expect(next.tracks.find((t) => t.id === id)!.steps).toEqual(
        base.tracks.find((t) => t.id === id)!.steps,
      );
    }
  });
});

describe("studio store", () => {
  it("starts empty and not generated", () => {
    const state = useStudioStore.getState();
    expect(state.hasGenerated).toBe(false);
    expect(state.transport).toBe("stopped");
  });

  it("generate marks the composition generated and fills the grid", () => {
    useStudioStore.getState().generate();
    const state = useStudioStore.getState();
    expect(state.hasGenerated).toBe(true);
    expect(state.composition.tracks).toHaveLength(TRACK_IDS.length);
    expect(
      state.composition.tracks.some((t) => t.steps.some((s) => s.active)),
    ).toBe(true);
  });

  it("toggleStep flips exactly one step", () => {
    useStudioStore.getState().generate();
    const before = useStudioStore.getState().composition;
    const target = before.tracks[0].steps[3].active;
    useStudioStore.getState().toggleStep("drums", 3);
    const after = useStudioStore.getState().composition;
    expect(after.tracks[0].steps[3].active).toBe(!target);
    expect(after.tracks[0].steps[2]).toEqual(before.tracks[0].steps[2]);
  });

  it("toggleMute and toggleSolo flip per-track flags", () => {
    useStudioStore.getState().generate();
    useStudioStore.getState().toggleMute("bass");
    useStudioStore.getState().toggleSolo("lead");
    const tracks = useStudioStore.getState().composition.tracks;
    expect(tracks.find((t) => t.id === "bass")!.muted).toBe(true);
    expect(tracks.find((t) => t.id === "lead")!.solo).toBe(true);
  });

  it("setBars resizes every track and resets the playhead", () => {
    useStudioStore.getState().generate();
    useStudioStore.getState().setCurrentStep(5);
    useStudioStore.getState().setBars(4);
    const state = useStudioStore.getState();
    expect(state.currentStep).toBe(-1);
    for (const track of state.composition.tracks) {
      expect(track.steps).toHaveLength(4 * STEPS_PER_BAR);
    }
  });

  it("loadComposition restores a saved pattern and marks it generated", () => {
    const saved: Composition = generateComposition({
      ...DEFAULT_SETTINGS,
      genre: "synthwave",
      bars: 4,
    });
    useStudioStore.getState().loadComposition(saved);
    const state = useStudioStore.getState();
    expect(state.hasGenerated).toBe(true);
    expect(state.transport).toBe("stopped");
    expect(state.composition).toEqual(saved);
  });
});
