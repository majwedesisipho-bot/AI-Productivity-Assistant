import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function OutputActions({
  text,
  onRegenerate,
  onClear,
  busy,
}: {
  text: string;
  onRegenerate: () => void;
  onClear: () => void;
  busy?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const ok = await copyText(text);
          if (ok) {
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 1800);
          } else {
            toast.error("Copying is blocked in this browser");
          }
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={onRegenerate} disabled={busy}>
        <RefreshCw className="size-4" /> Regenerate
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={busy}>
        <Trash2 className="size-4" /> Clear
      </Button>
    </div>
  );
}
