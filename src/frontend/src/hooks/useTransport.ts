/**
 * Transport hook: owns the SequencerEngine lifecycle and keeps it in sync with
 * the studio store. Play/pause/stop, loop, volume and the playhead step all
 * flow through here.
 */

import { SequencerEngine } from "@/lib/audio/engine";
import { useStudioStore } from "@/store/studio";
import { useCallback, useEffect, useRef } from "react";

export function useTransport() {
  const engineRef = useRef<SequencerEngine | null>(null);

  const composition = useStudioStore((s) => s.composition);
  const transport = useStudioStore((s) => s.transport);
  const loop = useStudioStore((s) => s.loop);
  const volume = useStudioStore((s) => s.volume);
  const setTransport = useStudioStore((s) => s.setTransport);
  const setCurrentStep = useStudioStore((s) => s.setCurrentStep);

  // Create the engine once.
  if (engineRef.current === null) {
    engineRef.current = new SequencerEngine({
      composition,
      callbacks: {
        onStep: (step) => setCurrentStep(step),
        onEnd: () => setTransport("stopped"),
      },
    });
  }

  // Keep the engine's composition in sync.
  useEffect(() => {
    engineRef.current?.setComposition(composition);
  }, [composition]);

  useEffect(() => {
    engineRef.current?.setLoop(loop);
  }, [loop]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    void engineRef.current?.play();
    setTransport("playing");
  }, [setTransport]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setTransport("paused");
  }, [setTransport]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setTransport("stopped");
    setCurrentStep(-1);
  }, [setTransport, setCurrentStep]);

  const toggle = useCallback(() => {
    if (transport === "playing") pause();
    else play();
  }, [transport, pause, play]);

  const preview = useCallback(
    (
      trackId: Parameters<SequencerEngine["preview"]>[0],
      step: Parameters<SequencerEngine["preview"]>[1],
    ) => {
      engineRef.current?.preview(trackId, step);
    },
    [],
  );

  return { transport, play, pause, stop, toggle, preview };
}
