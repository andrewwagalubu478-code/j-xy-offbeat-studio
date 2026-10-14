/// <reference types="@testing-library/jest-dom" />
/**
 * Studio page journey.
 *
 * Renders the real generator panel, sequencer grid and transport bar against
 * the real studio store. Covers the empty state before the first generation,
 * the Generate action producing a visible multi-track grid, and the transport
 * being gated on a generated composition.
 *
 * The audio engine is not started here: `useTransport` only creates an
 * AudioContext lazily on play, so rendering and clicking Generate exercise the
 * UI without a real audio device.
 */

import { DEFAULT_SETTINGS, TRACK_IDS, totalSteps } from "@/lib/audio/types";
import { StudioPage } from "@/pages/StudioPage";
import { useStudioStore } from "@/store/studio";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("StudioPage", () => {
  it("shows the empty state before the first generation", () => {
    render(<StudioPage />);
    expect(screen.getByText("No track yet")).toBeInTheDocument();
    expect(screen.queryByLabelText("Sequencer")).not.toBeInTheDocument();
  });

  it("disables transport controls until a composition is generated", () => {
    render(<StudioPage />);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export WAV" })).toBeDisabled();
  });

  it("Generate produces a visible multi-track sequencer grid", async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await user.click(screen.getByTestId("generator.generate_button"));

    const sequencer = await screen.findByLabelText("Sequencer");
    expect(screen.queryByText("No track yet")).not.toBeInTheDocument();

    // One row per instrument, each with a full step grid.
    for (const id of TRACK_IDS) {
      expect(
        within(sequencer).getByTestId(`sequencer.row.${id}`),
      ).toBeInTheDocument();
    }
    const drumSteps = within(sequencer).getByLabelText("Drums steps");
    expect(within(drumSteps).getAllByRole("button")).toHaveLength(
      totalSteps(DEFAULT_SETTINGS.bars),
    );

    // The composition is immediately playable.
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export WAV" })).toBeEnabled();
  });

  it("toggling a step flips its pressed state", async () => {
    const user = userEvent.setup();
    render(<StudioPage />);
    await user.click(screen.getByTestId("generator.generate_button"));

    const step = screen.getByTestId("sequencer.step.drums.1");
    const before = step.getAttribute("aria-pressed");
    await user.click(step);
    expect(step.getAttribute("aria-pressed")).not.toBe(before);
  });

  it("regenerating a track keeps the other tracks unchanged", async () => {
    const user = userEvent.setup();
    render(<StudioPage />);
    await user.click(screen.getByTestId("generator.generate_button"));

    const bassBefore = useStudioStore
      .getState()
      .composition.tracks.find((t) => t.id === "bass")!.steps;

    await user.click(
      screen.getByRole("button", { name: "Regenerate Lead track" }),
    );

    const bassAfter = useStudioStore
      .getState()
      .composition.tracks.find((t) => t.id === "bass")!.steps;
    expect(bassAfter).toEqual(bassBefore);
  });
});
