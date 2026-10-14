/**
 * Saved-composition list.
 *
 * Renders each saved composition as a row with its name, save time, and Load
 * and Delete actions. Purely presentational — the library page owns the data
 * and the action handlers.
 */

import { Button } from "@/components/ui/button";
import type { SavedComposition } from "@/lib/audio/types";
import { cn } from "@/lib/utils";
import { Clock, FolderOpen, Trash2 } from "lucide-react";

interface SavedCompositionListProps {
  items: SavedComposition[];
  onLoad: (item: SavedComposition) => void;
  onDelete: (item: SavedComposition) => void;
  pendingDeleteId?: string | null;
}

function formatSavedAt(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SavedCompositionList({
  items,
  onLoad,
  onDelete,
  pendingDeleteId = null,
}: SavedCompositionListProps) {
  return (
    <ul
      className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
      data-ocid="library.list"
    >
      {items.map((item, index) => {
        const position = index + 1;
        const isDeleting = pendingDeleteId === item.id;
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-smooth hover:bg-muted/40"
            data-ocid={`library.item.${position}`}
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-secondary font-mono text-xs text-muted-foreground"
              aria-hidden="true"
            >
              {String(position).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className="truncate font-display text-base font-semibold text-foreground"
                data-ocid={`library.item.name.${position}`}
              >
                {item.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span data-ocid={`library.item.saved_at.${position}`}>
                  Saved {formatSavedAt(item.updatedAt)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onLoad(item)}
                className={cn("gap-1.5")}
                data-ocid={`library.load_button.${position}`}
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                Load
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item)}
                disabled={isDeleting}
                aria-label={`Delete ${item.name}`}
                className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                data-ocid={`library.delete_button.${position}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
