import { AlertTriangle, Info, Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon ?? <Info className="size-5" />}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingState({ label = "Generating with AI..." }: { label?: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-6">
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </p>
      <div className="space-y-2">
        {[100, 92, 78, 96, 64].map((w, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-muted"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="size-4" /> Generation failed
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function AiNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        {children ?? (
          <>
            AI-generated outputs are produced using automated algorithms. Please review, edit, and
            verify all content before sending or implementing. AI may make mistakes — do not enter
            confidential, sensitive, or personal information unless allowed.
          </>
        )}
      </p>
    </div>
  );
}
