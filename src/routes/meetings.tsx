import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiNotice, EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { OutputActions } from "@/components/common/OutputActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runJsonPrompt } from "@/lib/ai-client";
import { meetingPrompt } from "@/lib/prompts";
import { useAppStore, uid, type Priority } from "@/lib/app-store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Turn long meeting notes into an executive summary, decisions, action items, milestones and open questions.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      {
        property: "og:description",
        content: "Structure raw meeting notes and send action items straight to your task planner.",
      },
    ],
  }),
  component: MeetingsPage,
});

type ActionItem = {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: Priority;
  done: boolean;
};

type Summary = {
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  milestones: string[];
  openQuestions: string[];
};

type RawSummary = Omit<Summary, "actionItems"> & {
  actionItems: { task: string; owner: string; deadline: string; priority: Priority }[];
};

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">None captured.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summaryToText(s: Summary, title: string) {
  return [
    `Meeting summary: ${title || "Untitled"}`,
    "",
    "EXECUTIVE SUMMARY",
    s.executiveSummary,
    "",
    "KEY DECISIONS",
    ...s.keyDecisions.map((d) => `- ${d}`),
    "",
    "ACTION ITEMS",
    ...s.actionItems.map(
      (a) => `- [${a.done ? "x" : " "}] ${a.task} (owner: ${a.owner}, due: ${a.deadline}, ${a.priority})`,
    ),
    "",
    "MILESTONES",
    ...s.milestones.map((m) => `- ${m}`),
    "",
    "OPEN QUESTIONS",
    ...s.openQuestions.map((q) => `- ${q}`),
  ].join("\n");
}

function MeetingsPage() {
  const navigate = useNavigate();
  const { addTasks, logActivity, saveOutput } = useAppStore();
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    attendees: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (form.notes.trim().length < 40) {
      toast.error("Paste a bit more of the meeting notes (at least a few sentences).");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const raw = await runJsonPrompt<RawSummary>(meetingPrompt(form));
      const parsed: Summary = {
        executiveSummary: raw.executiveSummary ?? "",
        keyDecisions: raw.keyDecisions ?? [],
        milestones: raw.milestones ?? [],
        openQuestions: raw.openQuestions ?? [],
        actionItems: (raw.actionItems ?? []).map((a) => ({ ...a, id: uid(), done: false })),
      };
      setSummary(parsed);
      setStatus("done");
      toast.success("Meeting summarised");
      logActivity("Meeting Notes Summarizer", `Summarised "${form.title || "meeting notes"}"`);
      saveOutput(
        "Meeting Notes Summarizer",
        form.title || "Meeting summary",
        parsed.executiveSummary,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setStatus("error");
    }
  };

  const patchItem = (id: string, patch: Partial<ActionItem>) =>
    setSummary((s) =>
      s ? { ...s, actionItems: s.actionItems.map((a) => (a.id === id ? { ...a, ...patch } : a)) } : s,
    );

  const sendToPlanner = () => {
    if (!summary || summary.actionItems.length === 0) return;
    const open = summary.actionItems.filter((a) => !a.done);
    if (open.length === 0) {
      toast.info("All action items are already marked complete.");
      return;
    }
    addTasks(
      open.map((a) => ({
        name: a.task,
        description: `From meeting: ${form.title || "untitled"}${a.owner ? ` · Owner: ${a.owner}` : ""}`,
        priority: a.priority ?? "Medium",
        dueDate: /^\d{4}-\d{2}-\d{2}$/.test(a.deadline) ? a.deadline : "",
        duration: 45,
        category: "Meeting follow-up",
        source: "meeting" as const,
        owner: a.owner,
      })),
    );
    logActivity("Meeting Notes Summarizer", `Sent ${open.length} action items to the Task Planner`);
    toast.success(`${open.length} action items added to the Task Planner`);
    navigate({ to: "/planner" });
  };

  const clearAll = () => {
    setSummary(null);
    setStatus("idle");
    setError("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" /> Meeting input
          </CardTitle>
          <CardDescription>Paste raw notes or a transcript — no formatting needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting title</Label>
              <Input
                id="title"
                placeholder="e.g. Q3 Planning Review"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees</Label>
            <Input
              id="attendees"
              placeholder="e.g. Thandi, Marco, Aisha"
              value={form.attendees}
              onChange={(e) => set("attendees", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Meeting notes / transcript *</Label>
            <Textarea
              id="notes"
              rows={14}
              placeholder="Paste the full notes or transcript here..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="text-[13px] leading-relaxed"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={status === "loading"}>
              <Sparkles className="size-4" />
              {status === "loading" ? "Summarising..." : "Summarise meeting"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm({ title: "", date: form.date, attendees: "", notes: "" });
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
          <CardTitle className="text-base">Structured summary</CardTitle>
          <CardDescription>Edit any action item before sending it to the planner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "idle" && (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No summary yet"
              description="Add your meeting notes and generate a structured summary."
            />
          )}
          {status === "loading" && <LoadingState label="Reading your meeting notes..." />}
          {status === "error" && <ErrorState message={error} onRetry={generate} />}
          {status === "done" && summary && (
            <>
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium">
                Summary ready — {summary.actionItems.length} action items found.
              </div>

              <div>
                <h3 className="text-sm font-semibold">Executive summary</h3>
                <Textarea
                  className="mt-2 text-[13px] leading-relaxed"
                  rows={4}
                  value={summary.executiveSummary}
                  onChange={(e) =>
                    setSummary((s) => (s ? { ...s, executiveSummary: e.target.value } : s))
                  }
                />
              </div>

              <List title="Key decisions" items={summary.keyDecisions} />

              <div>
                <h3 className="text-sm font-semibold">Action items</h3>
                <div className="mt-2 space-y-3">
                  {summary.actionItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">No action items found.</p>
                  )}
                  {summary.actionItems.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={a.done}
                          onCheckedChange={(v) => patchItem(a.id, { done: Boolean(v) })}
                          className="mt-1"
                          aria-label="Mark action item complete"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Input
                            value={a.task}
                            onChange={(e) => patchItem(a.id, { task: e.target.value })}
                            className={a.done ? "line-through opacity-60" : ""}
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={a.owner}
                              onChange={(e) => patchItem(a.id, { owner: e.target.value })}
                              placeholder="Owner"
                            />
                            <Input
                              value={a.deadline}
                              onChange={(e) => patchItem(a.id, { deadline: e.target.value })}
                              placeholder="Deadline"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {summary.actionItems.length > 0 && (
                  <Button className="mt-3 w-full sm:w-auto" onClick={sendToPlanner}>
                    <CalendarPlus className="size-4" /> Add Action Items to Task Planner
                  </Button>
                )}
              </div>

              <List title="Important milestones" items={summary.milestones} />
              <List title="Open questions" items={summary.openQuestions} />

              <OutputActions
                text={summaryToText(summary, form.title)}
                onRegenerate={generate}
                onClear={clearAll}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
