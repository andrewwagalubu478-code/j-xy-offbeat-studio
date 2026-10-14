/**
 * Offline WAV renderer.
 *
 * Renders the current composition to a downloadable WAV Blob entirely in the
 * browser using an OfflineAudioContext — no network, no backend.
 */

import { type Composition, STEPS_PER_BAR } from "./types";

function midiToFreq(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function stepDuration(composition: Composition): number {
  return 60 / composition.settings.bpm / 4;
}

/** Render the composition to a mono AudioBuffer via OfflineAudioContext. */
async function renderBuffer(
  composition: Composition,
  masterVolume: number,
): Promise<AudioBuffer> {
  const dur = stepDuration(composition);
  const length = composition.tracks[0]?.steps.length ?? STEPS_PER_BAR;
  const totalSeconds = length * dur + 1.5;
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(
    1,
    Math.ceil(totalSeconds * sampleRate),
    sampleRate,
  );

  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, masterVolume));
  master.connect(ctx.destination);

  const anySolo = composition.tracks.some((t) => t.solo);

  for (const track of composition.tracks) {
    const audible = anySolo ? track.solo : !track.muted;
    if (!audible) continue;
    const trackGain = ctx.createGain();
    trackGain.gain.value = track.gain;
    trackGain.connect(master);

    track.steps.forEach((step, index) => {
      if (!step.active) return;
      const time = index * dur;
      if (track.id === "drums") {
        scheduleDrum(ctx, trackGain, step.note, time, step.velocity);
      } else {
        scheduleTone(
          ctx,
          trackGain,
          track.id,
          step.note,
          time,
          dur,
          step.velocity,
        );
      }
    });
  }

  return ctx.startRendering();
}

function scheduleTone(
  ctx: OfflineAudioContext,
  dest: GainNode,
  trackId: string,
  note: number,
  time: number,
  dur: number,
  velocity: number,
): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type =
    trackId === "bass"
      ? "sawtooth"
      : trackId === "chords"
        ? "triangle"
        : "square";
  osc.frequency.value = midiToFreq(note);
  const attack = trackId === "chords" ? 0.02 : 0.005;
  const release = trackId === "chords" ? dur * 3 : dur * 0.9;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(velocity * 0.5, time + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, time + attack + release);
  osc.connect(env);
  env.connect(dest);
  osc.start(time);
  osc.stop(time + attack + release + 0.02);
}

function scheduleDrum(
  ctx: OfflineAudioContext,
  dest: GainNode,
  note: number,
  time: number,
  velocity: number,
): void {
  if (note === 36) {
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

/** Encode an AudioBuffer as a 16-bit PCM WAV Blob. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const view = new DataView(new ArrayBuffer(bufferSize));

  const writeString = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c += 1) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i += 1) {
    for (let c = 0; c < numChannels; c += 1) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Render the composition and return a WAV Blob ready for download. The export
 * uses the current master volume so it matches what the user hears.
 */
export async function renderCompositionToWav(
  composition: Composition,
  masterVolume = 0.8,
): Promise<Blob> {
  const buffer = await renderBuffer(composition, masterVolume);
  return encodeWav(buffer);
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
