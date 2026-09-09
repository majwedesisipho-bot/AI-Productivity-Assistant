import { createFileRoute } from "@tanstack/react-router";
import { Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiNotice, EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { OutputActions } from "@/components/common/OutputActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { runPrompt } from "@/lib/ai-client";
import { emailPrompt } from "@/lib/prompts";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Generate professional workplace email with a chosen purpose, tone, length and call to action.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Draft professional workplace email in seconds, then edit and copy it.",
      },
    ],
  }),
  component: EmailPage,
});

const PURPOSES = [
  "Request",
  "Follow-up",
  "Meeting invitation",
  "Apology",
  "Update",
  "Thank you",
  "Complaint",
  "Job / application communication",
  "Custom",
];
const ACTIONS = [
  "Request a response",
  "Request a meeting",
  "Request approval",
  "Request an update",
  "No specific action",
];

function EmailPage() {
  const { logActivity, saveOutput, settings } = useAppStore();
  const [form, setForm] = useState({
    recipientName: "",
    recipientRole: "",
    purpose: "Request",
    keyPoints: "",
    tone: "Formal",
    length: "Medium",
    action: "Request a response",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const invalid = !form.recipientName.trim() || form.keyPoints.trim().length < 10;

  const generate = async () => {
    if (invalid) {
      toast.error("Add a recipient name and at least a sentence of context.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const text = await runPrompt(
        emailPrompt({ ...form, senderName: settings.displayName || "Your name" }),
      );
      setOutput(text.trim());
      setStatus("done");
      toast.success("Email drafted");
      logActivity("Smart Email Generator", `Drafted a ${form.purpose.toLowerCase()} email to ${form.recipientName}`);
      saveOutput("Smart Email Generator", `Email to ${form.recipientName}`, text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setStatus("error");
    }
  };

  const clearAll = () => {
    setOutput("");
    setStatus("idle");
    setError("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-primary" /> Email details
          </CardTitle>
          <CardDescription>Tell the assistant who you are writing to and why.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient name *</Label>
              <Input
                id="recipient"
                placeholder="e.g. Thandi Nkosi"
                value={form.recipientName}
                onChange={(e) => set("recipientName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / company (optional)</Label>
              <Input
                id="role"
                placeholder="e.g. Operations Manager, Acme"
                value={form.recipientRole}
                onChange={(e) => set("recipientRole", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email purpose</Label>
            <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Key points / context *</Label>
            <Textarea
              id="points"
              rows={6}
              placeholder="e.g. Need the Q3 budget sign-off before Friday; we discussed it in Monday's stand-up; the delay blocks the supplier order."
              value={form.keyPoints}
              onChange={(e) => set("keyPoints", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The draft only uses facts you provide here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Formal", "Friendly", "Persuasive"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={form.length} onValueChange={(v) => set("length", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Short", "Medium", "Detailed"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Desired action</Label>
            <Select value={form.action} onValueChange={(v) => set("action", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={generate} disabled={status === "loading"}>
              <Sparkles className="size-4" />
              {status === "loading" ? "Generating..." : "Generate email"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm({
                  recipientName: "",
                  recipientRole: "",
                  purpose: "Request",
                  keyPoints: "",
                  tone: "Formal",
                  length: "Medium",
                  action: "Request a response",
                });
                clearAll();
              }}
            >
              Clear form
            </Button>
          </div>
          <AiNotice />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Generated email</CardTitle>
          <CardDescription>Fully editable before you send it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <EmptyState
              icon={<Mail className="size-5" />}
              title="No email yet"
              description="Fill in the details on the left and generate a draft."
            />
          )}
          {status === "loading" && <LoadingState label="Drafting your email..." />}
          {status === "error" && <ErrorState message={error} onRetry={generate} />}
          {status === "done" && (
            <>
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-foreground">
                Draft ready — review and edit before sending.
              </div>
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                rows={20}
                className="font-mono text-[13px] leading-relaxed"
                aria-label="Generated email"
              />
              <OutputActions
                text={output}
                onRegenerate={generate}
                onClear={clearAll}
                busy={false}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
