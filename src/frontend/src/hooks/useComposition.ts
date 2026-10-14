/**
 * Composition persistence hook.
 *
 * Wires the backend composition methods (saveComposition, listCompositions,
 * getComposition, updateComposition, deleteComposition) through React Query,
 * and exposes local browser storage helpers for fully offline use.
 */

import { createActor } from "@/backend";
import {
  deleteLocalComposition,
  listLocalCompositions,
  loadLocalComposition,
  saveLocalComposition,
} from "@/lib/audio/storage";
import type { Composition, SavedComposition } from "@/lib/audio/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const COMPOSITIONS_KEY = ["compositions"] as const;

/** Save a new composition to the backend. */
export function useSaveComposition() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      composition,
    }: { name: string; composition: Composition }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveComposition(name, JSON.stringify(composition));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMPOSITIONS_KEY });
    },
  });
}

/** Delete a composition from the backend. */
export function useDeleteComposition() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteComposition(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMPOSITIONS_KEY });
    },
  });
}

/** Local (offline) composition storage helpers. */
export function useLocalCompositions() {
  const list = useCallback(
    (): SavedComposition[] => listLocalCompositions(),
    [],
  );
  const save = useCallback(
    (name: string, composition: Composition): SavedComposition =>
      saveLocalComposition(name, composition),
    [],
  );
  const load = useCallback(
    (id: string): SavedComposition | null => loadLocalComposition(id),
    [],
  );
  const remove = useCallback(
    (id: string): void => deleteLocalComposition(id),
    [],
  );
  return { list, save, load, remove };
}
