/**
 * Offline-capable Web Audio step sequencer engine.
 *
 * Schedules a multi-track step sequence entirely in the browser with no network
 * calls. Uses a look-ahead scheduler driven by `setInterval` so timing stays
 * sample-accurate even when the main thread is busy.
 */

import {
  type Composition,
  STEPS_PER_BAR,
  type Step,
  type Track,
  type TrackId,
} from "./types";

export interface EngineCallbacks {
  /** Fired on the main thread when a step becomes audible, for UI sync. */
  onStep?: (step: number) => void;
  /** Fired when the transport reaches the end of the pattern. */
  onEnd?: () => void;
}

export interface EngineOptions {
  composition: Composition;
  callbacks?: EngineCallbacks;
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

function midiToFreq(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function stepDuration(composition: Composition): number {
  // 16th notes: 60 / bpm / 4
  return 60 / composition.settings.bpm / 4;
}

export class SequencerEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private trackGains = new Map<TrackId, GainNode>();
  private timer: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private composition: Composition;
  private callbacks: EngineCallbacks;
  private loop = true;
  private volume = 0.8;

  constructor(options: EngineOptions) {
    this.composition = options.composition;
    this.callbacks = options.callbacks ?? {};
  }

  /** Lazily create the AudioContext (must follow a user gesture). */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private trackGain(id: TrackId): GainNode {
    const ctx = this.ensureContext();
    let gain = this.trackGains.get(id);
    if (!gain) {
      gain = ctx.createGain();
      gain.connect(this.master!);
      this.trackGains.set(id, gain);
    }
    return gain;
  }

  setComposition(composition: Composition): void {
    this.composition = composition;
    this.applyMix();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.volume;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  /** Recompute per-track gain from mute/solo state. */
  applyMix(): void {
    const anySolo = this.composition.tracks.some((t) => t.solo);
    for (const track of this.composition.tracks) {
      const gain = this.trackGain(track.id);
      const audible = anySolo ? track.solo : !track.muted;
      gain.gain.value = audible ? track.gain : 0;
    }
  }

  private scheduleStep(track: Track, step: Step, time: number): void {
    const ctx = this.ensureContext();
    const dest = this.trackGain(track.id);
    const dur = stepDuration(this.composition);

    if (track.id === "drums") {
      this.scheduleDrum(ctx, dest, step.note, time, step.velocity);
      return;
    }

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type =
      track.id === "bass"
        ? "sawtooth"
        : track.id === "chords"
          ? "triangle"
          : "square";
    osc.frequency.value = midiToFreq(step.note);
    const attack = track.id === "chords" ? 0.02 : 0.005;
    const release = track.id === "chords" ? dur * 3 : dur * 0.9;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(step.velocity * 0.5, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + attack + release);
    osc.connect(env);
    env.connect(dest);
    osc.start(time);
    osc.stop(time + attack + release + 0.02);
  }

  private scheduleDrum(
    ctx: AudioContext,
    dest: GainNode,
    note: number,
    time: number,
    velocity: number,
  ): void {
    if (note === 36) {
      // Kick: pitch-swept sine.
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      env.gain.setValueAtTime(velocity, time);
      env.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
      osc.connect(env);
      env.connect(dest);
      osc.start(time);
      osc.stop(time + 0.24);
      return;
    }
    // Snare / hat: filtered noise burst.
    const length = note === 38 ? 0.18 : 0.05;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * length),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = note === 38 ? "bandpass" : "highpass";
    filter.frequency.value = note === 38 ? 1800 : 7000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(velocity * (note === 38 ? 0.7 : 0.35), time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + length);
    noise.connect(filter);
    filter.connect(env);
    env.connect(dest);
    noise.start(time);
    noise.stop(time + length);
  }

  private scheduler = (): void => {
    const ctx = this.ensureContext();
    const dur = stepDuration(this.composition);
    const length = this.composition.tracks[0]?.steps.length ?? STEPS_PER_BAR;
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const stepIndex = this.currentStep;
      for (const track of this.composition.tracks) {
        const step = track.steps[stepIndex];
        if (step?.active) this.scheduleStep(track, step, this.nextNoteTime);
      }
      const uiStep = stepIndex;
      const delay = Math.max(0, (this.nextNoteTime - ctx.currentTime) * 1000);
      window.setTimeout(() => this.callbacks.onStep?.(uiStep), delay);

      this.nextNoteTime += dur;
      this.currentStep += 1;
      if (this.currentStep >= length) {
        if (this.loop) {
          this.currentStep = 0;
        } else {
          this.stop();
          this.callbacks.onEnd?.();
          return;
        }
      }
    }
  };

  async play(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    this.applyMix();
    if (this.timer !== null) return;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.timer = window.setInterval(this.scheduler, LOOKAHEAD_MS);
    this.scheduler();
  }

  pause(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    void this.ctx?.suspend();
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.currentStep = 0;
    this.callbacks.onStep?.(-1);
    void this.ctx?.suspend();
  }

  /** Preview a single step's sound (used when toggling a cell). */
  preview(trackId: TrackId, step: Step): void {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") void ctx.resume();
    const track = this.composition.tracks.find((t) => t.id === trackId);
    if (!track) return;
    this.scheduleStep(track, step, ctx.currentTime + 0.01);
  }

  dispose(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.trackGains.clear();
  }
}
