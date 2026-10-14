/**
 * Shared empty state shown before the first generation.
 *
 * Invites the user to generate a track. Reused by the studio page and the
 * library page.
 */

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  ocid?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  ocid = "empty_state",
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/60 px-6 py-16 text-center"
      data-ocid={ocid}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-primary">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="max-w-md space-y-1.5">
        <h2 className="font-display text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          data-ocid="empty_state.primary_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
