/**
 * Save-composition dialog.
 *
 * Prompts for a name, then persists the current studio composition to local
 * browser storage (primary, offline path) and mirrors it to the backend for
 * durable storage. The dialog owns its own draft name state so a failed save
 * never wipes what the user typed.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveComposition } from "@/hooks/useComposition";
import { useLocalCompositions } from "@/hooks/useComposition";
import { setLocalCompositionBackendId } from "@/lib/audio/storage";
import type { SavedComposition } from "@/lib/audio/types";
import { useStudioStore } from "@/store/studio";
import { useEffect, useRef, useState } from "react";

interface SaveCompositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (name: string) => void;
}

export function SaveCompositionDialog({
  open,
  onOpenChange,
  onSaved,
}: SaveCompositionDialogProps) {
  const composition = useStudioStore((s) => s.composition);
  const { save: saveLocal } = useLocalCompositions();
  const saveBackend = useSaveComposition();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the draft each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !saveBackend.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    const captured = trimmed;
    // Local storage is the primary, always-available path. If it fails (e.g.
    // storage quota exceeded), surface the failure and keep the dialog open so
    // the user can retry without losing what they typed.
    let record: SavedComposition;
    try {
      record = saveLocal(captured, composition);
    } catch {
      setError(
        "Couldn’t save to this device. Check your browser storage and try again.",
      );
      return;
    }

    // Mirror to the backend for durable storage. A backend failure must not
    // block the offline save, so we surface it as a non-fatal notice.
    saveBackend.mutate(
      { name: captured, composition },
      {
        onSuccess: (view) => {
          if (view && view.__kind__ === "ok") {
            setLocalCompositionBackendId(record.id, view.ok.id.toString());
          }
          onSaved?.(captured);
          onOpenChange(false);
        },
        onError: () => {
          onSaved?.(captured);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-border bg-card sm:max-w-md"
        data-ocid="save_composition.dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Save composition
          </DialogTitle>
          <DialogDescription>
            Name this pattern so you can reload it from your library later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="composition-name" className="label-caps">
              Composition name
            </Label>
            <Input
              id="composition-name"
              ref={inputRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Neon Drift"
              maxLength={64}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              data-ocid="save_composition.input"
            />
            {error ? (
              <p
                className="text-xs text-destructive"
                data-ocid="save_composition.error_state"
              >
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="save_composition.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="save_composition.submit_button"
            >
              {saveBackend.isPending ? "Saving…" : "Save composition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
