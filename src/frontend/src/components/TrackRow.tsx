/**
 * One sequencer track row: label, mute/solo, regenerate, and the step cells.
 *
 * Steps are rendered as a grid of buttons; the active step column is highlighted
 * by the parent grid via the `currentStep` prop so the playhead spans all rows.
 */

import { TRACK_LABELS, type Track, type TrackId } from "@/lib/audio/types";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface TrackRowProps {
  track: Track;
  currentStep: number;
  onToggleStep: (trackId: TrackId, index: number) => void;
  onRegenerate: (trackId: TrackId) => void;
  onToggleMute: (trackId: TrackId) => void;
  onToggleSolo: (trackId: TrackId) => void;
}

/** Minimum tappable width for a step cell, in pixels. */
export const STEP_MIN_WIDTH = 22;
/** Gap between step cells, in pixels (matches the `gap-1` grid class). */
export const STEP_GAP = 4;

/** Minimum pixel width of a step grid so cells never collapse below tappable. */
export function stepGridMinWidth(stepCount: number): number {
  return stepCount * STEP_MIN_WIDTH + Math.max(0, stepCount - 1) * STEP_GAP;
}

export function TrackRow({
  track,
  currentStep,
  onToggleStep,
  onRegenerate,
  onToggleMute,
  onToggleSolo,
}: TrackRowProps) {
  const label = TRACK_LABELS[track.id];

  return (
    <div
      className="flex items-center gap-3"
      data-ocid={`sequencer.row.${track.id}`}
    >
      <div className="flex w-24 shrink-0 flex-col gap-1">
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={track.muted}
            onClick={() => onToggleMute(track.id)}
            data-ocid={`sequencer.mute.${track.id}`}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-smooth",
              track.muted
                ? "border-accent/60 bg-accent/20 text-accent"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            Mute
          </button>
          <button
            type="button"
            aria-pressed={track.solo}
            onClick={() => onToggleSolo(track.id)}
            data-ocid={`sequencer.solo.${track.id}`}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-smooth",
              track.solo
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            Solo
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <fieldset
          className="grid gap-1 border-0 p-0"
          style={{
            gridTemplateColumns: `repeat(${track.steps.length}, minmax(${STEP_MIN_WIDTH}px, 1fr))`,
            minWidth: `${stepGridMinWidth(track.steps.length)}px`,
          }}
          aria-label={`${label} steps`}
        >
          {track.steps.map((step, index) => {
            const isPlayhead = index === currentStep;
            return (
              <button
                key={`${track.id}-${index}`}
                type="button"
                aria-pressed={step.active}
                aria-label={`${label} step ${index + 1}${step.active ? ", active" : ""}`}
                onClick={() => onToggleStep(track.id, index)}
                data-ocid={`sequencer.step.${track.id}.${index + 1}`}
                className={cn(
                  "h-7 rounded-[3px] border transition-smooth",
                  step.active
                    ? "border-primary/70 bg-primary step-active"
                    : "border-border bg-muted/60 hover:bg-muted",
                  isPlayhead &&
                    "ring-2 ring-foreground/70 ring-offset-1 ring-offset-card",
                )}
              />
            );
          })}
        </fieldset>
      </div>

      <button
        type="button"
        onClick={() => onRegenerate(track.id)}
        aria-label={`Regenerate ${label} track`}
        data-ocid={`sequencer.regenerate.${track.id}`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
