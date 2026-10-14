/**
 * Step-sequencer grid.
 *
 * Renders one TrackRow per generated track, a beat-number ruler above the grid,
 * and a playhead column that highlights the current step during playback.
 */

import {
  STEP_MIN_WIDTH,
  TrackRow,
  stepGridMinWidth,
} from "@/components/TrackRow";
import { STEPS_PER_BAR } from "@/lib/audio/types";
import { useStudioStore } from "@/store/studio";

export function SequencerGrid() {
  const tracks = useStudioStore((s) => s.composition.tracks);
  const currentStep = useStudioStore((s) => s.currentStep);
  const toggleStep = useStudioStore((s) => s.toggleStep);
  const regenerate = useStudioStore((s) => s.regenerate);
  const toggleMute = useStudioStore((s) => s.toggleMute);
  const toggleSolo = useStudioStore((s) => s.toggleSolo);

  const stepCount = tracks[0]?.steps.length ?? STEPS_PER_BAR;

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-subtle"
      aria-label="Sequencer"
      data-ocid="sequencer.panel"
    >
      <header className="flex items-baseline justify-between">
        <div>
          <p className="label-caps">Studio</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Sequencer
          </h2>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {stepCount} steps
        </span>
      </header>

      <div className="flex items-center gap-3">
        <div className="w-24 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${stepCount}, minmax(${STEP_MIN_WIDTH}px, 1fr))`,
              minWidth: `${stepGridMinWidth(stepCount)}px`,
            }}
          >
            {Array.from({ length: stepCount }, (_, i) => i + 1).map((step) => {
              const beat = (step - 1) % 4 === 0;
              return (
                <span
                  key={`ruler-step-${step}`}
                  className={
                    beat
                      ? "text-center font-mono text-[10px] tabular-nums text-muted-foreground"
                      : "text-center font-mono text-[10px] tabular-nums text-muted-foreground/40"
                  }
                >
                  {step}
                </span>
              );
            })}
          </div>
        </div>
        <div className="w-7 shrink-0" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            currentStep={currentStep}
            onToggleStep={toggleStep}
            onRegenerate={regenerate}
            onToggleMute={toggleMute}
            onToggleSolo={toggleSolo}
          />
        ))}
      </div>
    </section>
  );
}
