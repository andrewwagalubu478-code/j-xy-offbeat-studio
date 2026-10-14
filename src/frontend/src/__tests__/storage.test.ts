/**
 * Local composition storage round-trip.
 *
 * The library page's primary, offline path is localStorage. These tests pin the
 * save/list/load/delete contract and the JSON round-trip that a reloaded
 * composition must survive.
 */

import { generateComposition } from "@/lib/audio/generator";
import {
  deleteLocalComposition,
  listLocalCompositions,
  loadLocalComposition,
  saveLocalComposition,
  setLocalCompositionBackendId,
} from "@/lib/audio/storage";
import { DEFAULT_SETTINGS } from "@/lib/audio/types";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  window.localStorage.clear();
});

describe("local composition storage", () => {
  it("starts empty", () => {
    expect(listLocalCompositions()).toEqual([]);
  });

  it("saves and reloads a composition with the same pattern", () => {
    const composition = generateComposition(DEFAULT_SETTINGS);
    const saved = saveLocalComposition("Neon Drift", composition);

    const listed = listLocalCompositions();
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe("Neon Drift");

    const loaded = loadLocalComposition(saved.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.composition).toEqual(composition);
  });

  it("overwrites an existing composition saved under the same name", () => {
    const first = generateComposition(DEFAULT_SETTINGS);
    const second = generateComposition({ ...DEFAULT_SETTINGS, genre: "house" });

    const a = saveLocalComposition("Same name", first);
    const b = saveLocalComposition("Same name", second);

    expect(b.id).toBe(a.id);
    expect(listLocalCompositions()).toHaveLength(1);
    expect(loadLocalComposition(a.id)!.composition).toEqual(second);
  });

  it("deletes a composition by id", () => {
    const saved = saveLocalComposition(
      "Temp",
      generateComposition(DEFAULT_SETTINGS),
    );
    deleteLocalComposition(saved.id);
    expect(listLocalCompositions()).toEqual([]);
    expect(loadLocalComposition(saved.id)).toBeNull();
  });

  it("records a backend id on the local record", () => {
    const saved = saveLocalComposition(
      "Mirrored",
      generateComposition(DEFAULT_SETTINGS),
    );
    setLocalCompositionBackendId(saved.id, "42");
    expect(loadLocalComposition(saved.id)!.backendId).toBe("42");
  });

  it("ignores malformed stored data", () => {
    window.localStorage.setItem("pulsegrid.compositions.v1", "{not json");
    expect(listLocalCompositions()).toEqual([]);
  });
});
