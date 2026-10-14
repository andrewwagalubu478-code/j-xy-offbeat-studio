/**
 * PocketIC backend lane for the PulseGrid composition API.
 *
 * Installs the app's own compiled `src/backend/dist/backend.wasm` into the
 * platform's PocketIC replica and calls the real public API. The frontend suite
 * mocks the actor, so it passes unchanged against a canister whose methods are
 * unimplemented stubs; this file is what actually executes them.
 *
 * Imports come from `declarations/` (the agent-js bindings PocketIC speaks),
 * never from `src/frontend/src/backend` (the TypeScript wrapper built on top of
 * them). Candid maps `Nat` to `bigint`, `?T` to `[] | [T]`, and a variant to
 * `{ variantName: ... }` — NOT the wrapper's `{ __kind__: "..." }` shape.
 */

import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listCompositions()).resolves.toEqual([]);
});

it("round-trips a composition through the real canister", async () => {
  const payload = JSON.stringify({ settings: { bpm: 124 }, tracks: [] });
  const saved = await actor.saveComposition("Neon Drift", payload);
  expect("ok" in saved).toBe(true);
  if (!("ok" in saved)) return;

  expect(saved.ok.name).toBe("Neon Drift");
  expect(saved.ok.payload).toBe(payload);

  const listed = await actor.listCompositions();
  expect(listed).toHaveLength(1);
  expect(listed[0]).toMatchObject({ id: saved.ok.id, name: "Neon Drift" });

  const fetched = await actor.getComposition(saved.ok.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]?.payload).toBe(payload);
});

it("rejects a blank composition name", async () => {
  const result = await actor.saveComposition("   ", "{}");
  expect("err" in result).toBe(true);
  if (!("err" in result)) return;
  expect(result.err).toEqual({ invalidName: null });
});

it("updates and deletes a composition owned by the caller", async () => {
  const saved = await actor.saveComposition("Draft", "{}");
  expect("ok" in saved).toBe(true);
  if (!("ok" in saved)) return;

  const updated = await actor.updateComposition(saved.ok.id, "Final", '{"v":2}');
  expect("ok" in updated).toBe(true);
  if (!("ok" in updated)) return;
  expect(updated.ok.name).toBe("Final");
  expect(updated.ok.payload).toBe('{"v":2}');

  const deleted = await actor.deleteComposition(saved.ok.id);
  expect("ok" in deleted).toBe(true);
  await expect(actor.getComposition(saved.ok.id)).resolves.toEqual([]);
});

it("does not show one caller's compositions to another", async () => {
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  const saved = await actor.saveComposition("Alice's track", "{}");
  expect("ok" in saved).toBe(true);
  if (!("ok" in saved)) return;

  actor.setIdentity(bob);
  expect(await actor.listCompositions()).toEqual([]);
  await expect(actor.getComposition(saved.ok.id)).resolves.toEqual([]);
  const denied = await actor.deleteComposition(saved.ok.id);
  expect("err" in denied).toBe(true);
  if (!("err" in denied)) return;
  expect(denied.err).toEqual({ notAuthorized: null });

  // The owner still sees it after the failed cross-caller delete.
  actor.setIdentity(alice);
  const listed = await actor.listCompositions();
  expect(listed.map((c) => c.name)).toContain("Alice's track");
});

it("returns the API documentation as Markdown", async () => {
  const doc = await actor.getApiDoc();
  expect(typeof doc).toBe("string");
  expect(doc.length).toBeGreaterThan(0);
});
