/**
 * WAV encoder contract.
 *
 * `encodeWav` turns a rendered AudioBuffer into a downloadable 16-bit PCM WAV
 * Blob. These tests pin the RIFF/WAVE header and the sample encoding without
 * needing a real Web Audio context.
 */

import { encodeWav } from "@/lib/audio/wav";
import { describe, expect, it } from "vitest";

/** Minimal AudioBuffer stand-in: only the fields `encodeWav` reads. */
function fakeBuffer(samples: number[], sampleRate = 44100): AudioBuffer {
  const data = Float32Array.from(samples);
  return {
    numberOfChannels: 1,
    sampleRate,
    length: data.length,
    getChannelData: () => data,
  } as unknown as AudioBuffer;
}

async function readBytes(blob: Blob): Promise<DataView> {
  // jsdom's Blob has no `arrayBuffer()`; FileReader is the portable path.
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
  return new DataView(arrayBuffer);
}

function ascii(view: DataView, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += String.fromCharCode(view.getUint8(offset + i));
  }
  return out;
}

describe("encodeWav", () => {
  it("writes a RIFF/WAVE header with the correct sizes", async () => {
    const samples = [0, 0.5, -0.5, 1];
    const blob = await encodeWav(fakeBuffer(samples));
    expect(blob.type).toBe("audio/wav");

    const view = await readBytes(blob);
    expect(ascii(view, 0, 4)).toBe("RIFF");
    expect(ascii(view, 8, 4)).toBe("WAVE");
    expect(ascii(view, 12, 4)).toBe("fmt ");
    expect(ascii(view, 36, 4)).toBe("data");

    const dataSize = samples.length * 2;
    expect(view.getUint32(4, true)).toBe(36 + dataSize);
    expect(view.getUint32(40, true)).toBe(dataSize);
    expect(view.byteLength).toBe(44 + dataSize);
  });

  it("encodes samples as 16-bit PCM", async () => {
    const blob = await encodeWav(fakeBuffer([0, 1, -1]));
    const view = await readBytes(blob);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
  });

  it("records the sample rate and channel count", async () => {
    const blob = await encodeWav(fakeBuffer([0, 0], 22050));
    const view = await readBytes(blob);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(22050);
  });
});
