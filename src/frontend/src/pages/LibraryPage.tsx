/**
 * Saved-compositions library page.
 *
 * Lists compositions saved to local browser storage (the primary, offline
 * path), with Load and Delete actions per row. Saving mirrors to the backend
 * for durable storage, and loading restores a composition into the studio
 * store so the studio page shows the same pattern.
 */

import { EmptyState } from "@/components/EmptyState";
import { SaveCompositionDialog } from "@/components/SaveCompositionDialog";
import { SavedCompositionList } from "@/components/SavedCompositionList";
import { Button } from "@/components/ui/button";
import {
  useDeleteComposition,
  useLocalCompositions,
} from "@/hooks/useComposition";
import type { SavedComposition } from "@/lib/audio/types";
import { useStudioStore } from "@/store/studio";
import { useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function LibraryPage() {
  const { list, remove } = useLocalCompositions();
  const deleteBackend = useDeleteComposition();
  const loadComposition = useStudioStore((s) => s.loadComposition);
  const hasGenerated = useStudioStore((s) => s.hasGenerated);
  const navigate = useNavigate();

  const [items, setItems] = useState<SavedComposition[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setItems(list());
  }, [list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleLoad(item: SavedComposition) {
    loadComposition(item.composition);
    void navigate({ to: "/" });
  }

  async function handleDelete(item: SavedComposition) {
    setPendingDeleteId(item.id);
    // Local storage is the primary path — remove immediately.
    remove(item.id);
    refresh();
    setNotice(`Deleted “${item.name}”.`);

    // Best-effort backend mirror; a failure must not block the offline delete.
    const backendId = backendIdFromLocalId(item.backendId);
    try {
      if (backendId !== null) {
        await deleteBackend.mutateAsync(backendId);
      }
    } catch {
      // Offline delete already succeeded; a backend failure is non-fatal.
    } finally {
      setPendingDeleteId(null);
    }
  }

  function handleSaved(name: string) {
    refresh();
    setNotice(`Saved “${name}”.`);
  }

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-6" data-ocid="library.page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="label-caps">Library</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Saved compositions
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEmpty
              ? "Your saved patterns will appear here."
              : `${items.length} saved ${
                  items.length === 1 ? "composition" : "compositions"
                } — stored on this device, mirrored to your account.`}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setSaveOpen(true)}
          disabled={!hasGenerated}
          title={
            hasGenerated
              ? undefined
              : "Generate a track in the studio before saving"
          }
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="library.save_button"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save current
        </Button>
      </div>

      {notice ? (
        <output
          className="block rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
          data-ocid="library.success_state"
        >
          {notice}
        </output>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="No saved compositions"
          description="Generate a track in the studio, then save it here to build your library."
          actionLabel="Go to studio"
          onAction={() => void navigate({ to: "/" })}
          ocid="library.empty_state"
        />
      ) : (
        <SavedCompositionList
          items={items}
          onLoad={handleLoad}
          onDelete={handleDelete}
          pendingDeleteId={pendingDeleteId}
        />
      )}

      <SaveCompositionDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}

/**
 * Backend ids are numeric strings recorded when a composition is mirrored.
 * Returns the numeric backend id when the local record has one, otherwise null
 * so we skip the mirror delete.
 */
function backendIdFromLocalId(backendId: string | undefined): bigint | null {
  if (!backendId || !/^\d+$/.test(backendId)) return null;
  try {
    return BigInt(backendId);
  } catch {
    return null;
  }
}
