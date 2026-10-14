/**
 * Generator control panel.
 *
 * Genre preset chips, mood selector, BPM slider with numeric readout, key and
 * scale selectors, a bars/loop-length selector, and the primary Generate CTA.
 * All state lives in the studio store; this panel only reads and patches it.
 */

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  BARS_OPTIONS,
  type Bars,
  GENRE_PRESETS,
  type GenrePreset,
  KEYS,
  type KeyName,
  MOODS,
  type Mood,
  SCALES,
  type ScaleName,
} from "@/lib/audio/types";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/store/studio";
import { Dices } from "lucide-react";

const BPM_MIN = 60;
const BPM_MAX = 200;

export function GeneratorPanel() {
  const settings = useStudioStore((s) => s.composition.settings);
  const setSettings = useStudioStore((s) => s.setSettings);
  const setBars = useStudioStore((s) => s.setBars);
  const generate = useStudioStore((s) => s.generate);

  return (
    <section
      className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4 shadow-subtle"
      aria-label="Generator controls"
      data-ocid="generator.panel"
    >
      <header className="flex items-baseline justify-between">
        <div>
          <p className="label-caps">Studio</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Generator
          </h2>
        </div>
      </header>

      <fieldset className="space-y-2">
        <legend className="label-caps">Genre preset</legend>
        <div className="flex flex-wrap gap-1.5">
          {GENRE_PRESETS.map((preset) => {
            const active = settings.genre === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSettings({ genre: preset.id as GenrePreset })}
                data-ocid={`generator.genre.${preset.id}`}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-smooth",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label className="label-caps" htmlFor="mood-select">
          Mood
        </label>
        <Select
          value={settings.mood}
          onValueChange={(value) => setSettings({ mood: value as Mood })}
        >
          <SelectTrigger
            id="mood-select"
            className="w-full bg-secondary"
            data-ocid="generator.mood.select"
          >
            <SelectValue placeholder="Select a mood" />
          </SelectTrigger>
          <SelectContent>
            {MOODS.map((mood) => (
              <SelectItem
                key={mood.id}
                value={mood.id}
                data-ocid={`generator.mood.${mood.id}`}
              >
                {mood.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="label-caps" htmlFor="bpm-slider">
            BPM
          </label>
          <span
            className="font-mono text-2xl font-semibold tabular-nums text-foreground"
            data-ocid="generator.bpm.readout"
          >
            {settings.bpm}
          </span>
        </div>
        <Slider
          id="bpm-slider"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={[settings.bpm]}
          onValueChange={([value]) => setSettings({ bpm: value })}
          aria-label="Tempo in beats per minute"
          data-ocid="generator.bpm.slider"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="label-caps" htmlFor="key-select">
            Key
          </label>
          <Select
            value={settings.key}
            onValueChange={(value) => setSettings({ key: value as KeyName })}
          >
            <SelectTrigger
              id="key-select"
              className="w-full bg-secondary"
              data-ocid="generator.key.select"
            >
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              {KEYS.map((key) => (
                <SelectItem
                  key={key}
                  value={key}
                  data-ocid={`generator.key.${key.replace("#", "sharp")}`}
                >
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="label-caps" htmlFor="scale-select">
            Scale
          </label>
          <Select
            value={settings.scale}
            onValueChange={(value) =>
              setSettings({ scale: value as ScaleName })
            }
          >
            <SelectTrigger
              id="scale-select"
              className="w-full bg-secondary"
              data-ocid="generator.scale.select"
            >
              <SelectValue placeholder="Scale" />
            </SelectTrigger>
            <SelectContent>
              {SCALES.map((scale) => (
                <SelectItem
                  key={scale.id}
                  value={scale.id}
                  data-ocid={`generator.scale.${scale.id}`}
                >
                  {scale.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="label-caps">Bars / loop length</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {BARS_OPTIONS.map((bars) => {
            const active = settings.bars === bars;
            return (
              <button
                key={bars}
                type="button"
                aria-pressed={active}
                onClick={() => setBars(bars as Bars)}
                data-ocid={`generator.bars.${bars}`}
                className={cn(
                  "rounded-md border py-1.5 font-mono text-sm tabular-nums transition-smooth",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {bars}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button
        type="button"
        onClick={generate}
        data-ocid="generator.generate_button"
        className="h-11 w-full gap-2 bg-primary text-base font-semibold text-primary-foreground shadow-subtle transition-smooth hover:bg-primary/90"
      >
        <Dices className="h-4 w-4" aria-hidden="true" />
        Generate
      </Button>
    </section>
  );
}
