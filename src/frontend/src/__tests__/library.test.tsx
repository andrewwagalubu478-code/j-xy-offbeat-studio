/// <reference types="@testing-library/jest-dom" />
/**
 * Saved-composition library behavior.
 *
 * Covers the offline save -> reload -> reproduce-pattern contract (the library
 * page's primary path) and the presentational list's Load/Delete wiring. The
 * backend mirror is not exercised here; it is covered by the PocketIC lane.
 */

import { SavedCompositionList } from "@/components/SavedCompositionList";
import { generateComposition } from "@/lib/audio/generator";
import {
  listLocalCompositions,
  loadLocalComposition,
  saveLocalComposition,
} from "@/lib/audio/storage";
import { DEFAULT_SETTINGS, type SavedComposition } from "@/lib/audio/types";
import { useStudioStore } from "@/store/studio";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  window.localStorage.clear();
  useStudioStore.setState({ hasGenerated: false, transport: "stopped" });
});

describe("saved composition reload", () => {
  it("reproduces the same pattern after a save/reload round-trip", () => {
    const composition = generateComposition({
      ...DEFAULT_SETTINGS,
      genre: "synthwave",
      bars: 4,
    });
    const saved = saveLocalComposition("Neon Drift", composition);

    // Simulate a fresh session: the store starts empty, then the user loads.
    useStudioStore.setState({ hasGenerated: false });
    const reloaded = loadLocalComposition(saved.id);
    expect(reloaded).not.toBeNull();
    useStudioStore.getState().loadComposition(reloaded!.composition);

    const state = useStudioStore.getState();
    expect(state.hasGenerated).toBe(true);
    expect(state.composition).toEqual(composition);
  });

  it("lists saved compositions newest first", () => {
    const first = saveLocalComposition(
      "First",
      generateComposition(DEFAULT_SETTINGS),
    );
    const second = saveLocalComposition(
      "Second",
      generateComposition(DEFAULT_SETTINGS),
    );
    // Force distinct updatedAt values so ordering is deterministic.
    window.localStorage.setItem(
      "pulsegrid.compositions.v1",
      JSON.stringify([
        { ...first, updatedAt: 1000 },
        { ...second, updatedAt: 2000 },
      ]),
    );
    expect(listLocalCompositions().map((c) => c.name)).toEqual([
      "Second",
      "First",
    ]);
  });
});

describe("SavedCompositionList", () => {
  const items: SavedComposition[] = [
    {
      id: "local-1",
      name: "Neon Drift",
      createdAt: 1000,
      updatedAt: 2000,
      composition: generateComposition(DEFAULT_SETTINGS),
    },
  ];

  it("renders each saved composition with its name", () => {
    render(
      <SavedCompositionList
        items={items}
        onLoad={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Neon Drift")).toBeInTheDocument();
  });

  it("invokes onLoad with the selected composition", async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    render(
      <SavedCompositionList
        items={items}
        onLoad={onLoad}
        onDelete={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    expect(onLoad).toHaveBeenCalledWith(items[0]);
  });

  it("invokes onDelete with the selected composition", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <SavedCompositionList
        items={items}
        onLoad={() => {}}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete Neon Drift" }));
    expect(onDelete).toHaveBeenCalledWith(items[0]);
  });
});
