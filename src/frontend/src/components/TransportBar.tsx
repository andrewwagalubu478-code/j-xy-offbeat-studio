/**
 * Sticky transport bar.
 *
 * Play/pause, stop, loop toggle, master volume, and the Export WAV action.
 * Playback is driven by the shared `useTransport` hook; export renders the
 * composition to a WAV blob entirely in the browser.
 */

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTransport } from "@/hooks/useTransport";
import { downloadBlob, renderCompositionToWav } from "@/lib/audio/wav";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/store/studio";
import { Download, Loader2, Pause, Play, Repeat, Square } from "lucide-react";
import { useState } from "react";

export function TransportBar() {
  const { transport, toggle, stop } = useTransport();
  const loop = useStudioStore((s) => s.loop);
  const setLoop = useStudioStore((s) => s.setLoop);
  const volume = useStudioStore((s) => s.volume);
  const setVolume = useStudioStore((s) => s.setVolume);
  const composition = useStudioStore((s) => s.composition);
  const hasGenerated = useStudioStore((s) => s.hasGenerated);

  const [exporting, setExporting] = useState(false);

  const playing = transport === "playing";

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await renderCompositionToWav(composition, volume);
      downloadBlob(blob, "pulsegrid-composition.wav");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      data-ocid="transport.bar"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            onClick={toggle}
            disabled={!hasGenerated}
            aria-label={playing ? "Pause" : "Play"}
            data-ocid="transport.play_button"
            className={cn(
              "h-10 w-10 rounded-md transition-smooth",
              playing
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {playing ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={stop}
            disabled={!hasGenerated}
            aria-label="Stop"
            data-ocid="transport.stop_button"
            className="h-10 w-10 rounded-md"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => setLoop(!loop)}
            aria-pressed={loop}
            aria-label="Toggle loop"
            data-ocid="transport.loop_toggle"
            className={cn(
              "h-10 w-10 rounded-md transition-smooth",
              loop && "bg-primary/20 text-primary",
            )}
          >
            <Repeat className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <span className="label-caps shrink-0">Vol</span>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[Math.round(volume * 100)]}
            onValueChange={([value]) => setVolume(value / 100)}
            aria-label="Master volume"
            data-ocid="transport.volume_slider"
            className="max-w-xs"
          />
          <span className="w-9 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(volume * 100)}
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          disabled={!hasGenerated || exporting}
          data-ocid="transport.export_button"
          className="ml-auto gap-2 rounded-md"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {exporting ? "Rendering…" : "Export WAV"}
        </Button>
      </div>
    </div>
  );
}
