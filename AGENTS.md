# Project Guidance

## User Preferences

- Fully offline: generation, playback and export must work with no network dependency after page load
- Music-tool aesthetic: dark, studio-like interface with clear transport and sequencer controls

## Verified Commands

- **typecheck**: `pnpm -r typecheck`
- **fix**: `pnpm -r fix`
- **build**: `pnpm -r build`

## Learnings

- Motoko has no triple-quoted string literal: author long static Text as a single double-quoted string with \n escapes.
- Time.now() returns Int; a Timestamp typed as Nat needs Time.now().toNat(). Map.values().filter(...) yields an Iter, not an array — call .toArray() before .sort(...).
- Step-sequencer grids stay tappable with minmax(22px,1fr) plus a computed minWidth inside an overflow-x-auto wrapper; minmax(0,1fr) collapses cells on mobile.
- biome's useSemanticElements rejects role="group" on a div (use <fieldset>/<legend>) and role="status" on a <p> (use <output>); noArrayIndexKey flags keys built from a map index.
- Zustand v5 create() callback must not declare an unused `get` param — tsc errors TS2304.
- A static documentation mixin must return the Markdown literal directly from the function body; binding it to a top-level let makes it stable state and traps at runtime.
- mops check --fix auto-applies M0223 fixes to migration files; the enhanced migration chain and stable compatibility check pass for canister 'backend'.
