# Design Brief

## Direction

**Studio Rack** — a dark, hardware-inspired step-sequencer studio where the sequencer grid is the instrument and every control reads like real rack gear.

## Tone

Industrial/utilitarian executed with precision: near-black warm-charcoal chassis, recessed panel wells, and a single electric accent — a professional studio tool, not a consumer toy.

## Differentiation

An acid-lime playhead beam that sweeps the 16-step grid in real time, making the sequencer feel physically alive rather than a static table of buttons.

## Color Palette

| Token      | OKLCH         | Role                                              |
| ---------- | ------------- | ------------------------------------------------- |
| background | 0.16 0.012 60 | Warm-charcoal chassis                             |
| foreground | 0.94 0.008 80 | Primary text, labels                              |
| card       | 0.205 0.014 60| Panels, sequencer surface                         |
| primary    | 0.82 0.19 128 | Active steps, playhead, Generate CTA (acid-lime)  |
| accent     | 0.68 0.20 42  | Record / transport-active states (signal-orange)  |
| muted      | 0.24 0.012 60 | Recessed cells, inactive steps, secondary chrome  |

## Typography

- Display: Space Grotesk — wordmark, section headings, panel titles
- Body: DM Sans — labels, controls, list text
- Mono: Geist Mono — BPM, bars, timecode, step numbers (tabular readouts)
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-xs font-semibold uppercase tracking-widest`, body `text-sm md:text-base`

## Elevation & Depth

Layered chassis: `bg-background` base, `bg-card` panels with `shadow-subtle`, recessed sequencer cells with `shadow-inset-soft`; the transport bar floats on `shadow-elevated`.

## Structural Zones

| Zone      | Background        | Border    | Notes                                                    |
| --------- | ----------------- | --------- | -------------------------------------------------------- |
| Header    | `bg-card`         | `border-b`| Wordmark left, mono status readouts (BPM/bars/time) right |
| Generator | `bg-card` panel   | `border`  | Preset chips, sliders, dropdowns, prominent Generate CTA  |
| Sequencer | `bg-background`   | —         | 16×4 grid on `bg-muted` wells; alternating row shading     |
| Transport | `bg-card`         | `border-t`| Play/pause/stop/loop, volume; elevated, sticky bottom      |

## Spacing & Rhythm

Section gaps `gap-6`; panels padded `p-4 md:p-6`; step cells `gap-1.5` with `aspect-square`; tight 4px micro-spacing inside control groups to read as rack modules.

## Component Patterns

- Buttons: 8px radius; Generate uses `bg-primary text-primary-foreground`; transport icons are square ghost buttons with `hover:bg-muted`
- Cards: `rounded-lg bg-card border shadow-subtle`; sequencer wells use inset shadow, not border-only
- Badges: pill `rounded-full` chips for genre presets; active chip fills `bg-primary`, inactive `bg-muted text-muted-foreground`
- Steps: `rounded-md` cells — active `bg-primary shadow-[glow]`, inactive `bg-muted shadow-inset-soft`

## Motion

- Entrance: panels `animate-fade-in` staggered ~40ms
- Hover: steps scale 1.05 and brighten border via `transition-smooth` (0.3s)
- Decorative: playhead column `animate-playhead-pulse`; toggled step `animate-step-flash`

## Constraints

- Dark-first only — no light mode; the studio aesthetic depends on a dark chassis
- Accent lime is sparing: reserved for active steps, playhead, and primary CTA — never decorative fills
- Fully offline: no external font/CDN/network references; all fonts self-hosted under `/assets/fonts/`
- Numeric readouts always use `font-mono` with tabular figures so values don't jitter during playback

## Signature Detail

The live playhead beam — a translucent acid-lime column with a soft glow that sweeps the grid in tempo, turning the sequencer from a control panel into a visible performance.
