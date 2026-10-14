/**
 * Generator / sequencer studio page.
 *
 * Single-page studio layout: a left generator panel, a center sequencer grid,
 * and a sticky bottom transport bar. Before the first generation the sequencer
 * area shows the shared empty state.
 */

import { EmptyState } from "@/components/EmptyState";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SequencerGrid } from "@/components/SequencerGrid";
import { TransportBar } from "@/components/TransportBar";
import { useStudioStore } from "@/store/studio";

export function StudioPage() {
  const hasGenerated = useStudioStore((s) => s.hasGenerated);
  const generate = useStudioStore((s) => s.generate);

  return (
    <div className="flex flex-col gap-6" data-ocid="studio.page">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <GeneratorPanel />

        {hasGenerated ? (
          <SequencerGrid />
        ) : (
          <EmptyState
            title="No track yet"
            description="Set a genre, mood and tempo, then generate a multi-track pattern to start building your track."
            actionLabel="Generate a track"
            onAction={generate}
            ocid="studio.empty_state"
          />
        )}
      </div>

      <TransportBar />
    </div>
  );
}
