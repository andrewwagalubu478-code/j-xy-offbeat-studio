import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components use `data-ocid` as their stable test hook.
configure({ testIdAttribute: "data-ocid" });

/**
 * jsdom ships no Web Audio API, but the transport hook constructs a
 * `SequencerEngine` on mount and its `applyMix` path touches `AudioContext`.
 * This stub provides just enough of the interface for the engine to build its
 * gain graph; it produces no sound and is never asserted on.
 */
class FakeAudioParam {
  value = 0;
  setValueAtTime(): void {}
  linearRampToValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
}

class FakeNode {
  connect(): void {}
  disconnect(): void {}
}

class FakeGainNode extends FakeNode {
  gain = new FakeAudioParam();
}

class FakeOscillatorNode extends FakeNode {
  type = "sine";
  frequency = new FakeAudioParam();
  start(): void {}
  stop(): void {}
}

class FakeBufferSourceNode extends FakeNode {
  buffer: unknown = null;
  start(): void {}
  stop(): void {}
}

class FakeBiquadFilterNode extends FakeNode {
  type = "lowpass";
  frequency = new FakeAudioParam();
}

class FakeAudioBuffer {
  constructor(
    public numberOfChannels: number,
    public length: number,
    public sampleRate: number,
  ) {}
  getChannelData(): Float32Array {
    return new Float32Array(this.length);
  }
}

class FakeAudioContext {
  state = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = new FakeNode();
  createGain(): FakeGainNode {
    return new FakeGainNode();
  }
  createOscillator(): FakeOscillatorNode {
    return new FakeOscillatorNode();
  }
  createBuffer(
    channels: number,
    length: number,
    sampleRate: number,
  ): FakeAudioBuffer {
    return new FakeAudioBuffer(channels, length, sampleRate);
  }
  createBufferSource(): FakeBufferSourceNode {
    return new FakeBufferSourceNode();
  }
  createBiquadFilter(): FakeBiquadFilterNode {
    return new FakeBiquadFilterNode();
  }
  async resume(): Promise<void> {}
  async suspend(): Promise<void> {}
  async close(): Promise<void> {}
}

if (typeof window !== "undefined" && !window.AudioContext) {
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  });
}

// Radix UI's Slider observes its own size; jsdom has no ResizeObserver.
if (typeof globalThis.ResizeObserver === "undefined") {
  class FakeResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: FakeResizeObserver,
  });
}

afterEach(() => {
  cleanup();
});
