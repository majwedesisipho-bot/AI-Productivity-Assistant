import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Clock, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiNotice, EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { OutputActions } from "@/components/common/OutputActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { runJsonPrompt } from "@/lib/ai-client";
import { plannerPrompt } from "@/lib/prompts";
import { useAppStore, type Priority } from "@/lib/app-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Rank tasks by priority and deadline and build a realistic daily or weekly schedule within your working hours.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content: "Turn a task list into a realistic daily or weekly schedule.",
      },
    ],
  }),
  component: PlannerPage,
});

type Plan = {
  schedule: {
    date: string;
    start: string;
    end: string;
    task: string;
    priority: Priority;
    durationMinutes: number;
  }[];
  priorityRanking: { task: string; reason: string }[];
  urgent: string[];
  atRisk: { task: string; reason: string }[];
  remaining: { task: string; reason: string }[];
  recommendations: string[];
};

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

const priorityTone: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40",
  Low: "bg-muted text-muted-foreground border-border",
};

function planToText(plan: Plan) {
  return [
    "SCHEDULE",
    ...plan.schedule.map(
      (s) => `${s.date} ${s.start}-${s.end} · ${s.task} (${s.priority}, ${s.durationMinutes}m)`,
    ),
    "",
    "PRIORITY RANKING",
    ...plan.priorityRanking.map((p, i) => `${i + 1}. ${p.task} — ${p.reason}`),
    "",
    `URGENT: ${plan.urgent.join("; ") || "none"}`,
    `AT RISK: ${plan.atRisk.map((a) => `${a.task} (${a.reason})`).join("; ") || "none"}`,
    `REMAINING: ${plan.remaining.map((a) => `${a.task} (${a.reason})`).join("; ") || "none"}`,
    "",
    "RECOMMENDATIONS",
    ...plan.recommendations.map((r) => `- ${r}`),
  ].join("\n");
}

function PlannerPage() {
  const { tasks, addTasks, updateTask, removeTask, logActivity, saveOutput } = useAppStore();
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priority: "Medium" as Priority,
    dueDate: "",
    duration: "60",
    category: "General",
  });
  const [config, setConfig] = useState({
    mode: "Daily" as "Daily" | "Weekly",
    startTime: "09:00",
    endTime: "17:00",
    breaks: "13:00-13:45 lunch",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);

  const addTask = () => {
    if (!draft.name.trim()) {
      toast.error("Give the task a name.");
      return;
    }
    addTasks([
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        priority: draft.priority,
        dueDate: draft.dueDate,
        duration: Number(draft.duration) || 30,
        category: draft.category.trim() || "General",
        source: "manual",
      },
    ]);
    setDraft({
      name: "",
      description: "",
      priority: "Medium",
      dueDate: "",
      duration: "60",
      category: draft.category,
    });
    toast.success("Task added");
  };

  const generate = async () => {
    const open = tasks.filter((t) => !t.done);
    if (open.length === 0) {
      toast.error("Add at least one open task before generating a plan.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const result = await runJsonPrompt<Plan>(
        plannerPrompt({
          mode: config.mode,
          startTime: config.startTime,
          endTime: config.endTime,
          breaks: config.breaks,
          today: new Date().toISOString().slice(0, 10),
          tasks: open.map((t) => ({
            name: t.name,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate,
            duration: t.duration,
            category: t.category,
          })),
        }),
      );
      setPlan({
        schedule: result.schedule ?? [],
        priorityRanking: result.priorityRanking ?? [],
        urgent: result.urgent ?? [],
        atRisk: result.atRisk ?? [],
        remaining: result.remaining ?? [],
        recommendations: result.recommendations ?? [],
      });
      setStatus("done");
      toast.success(`${config.mode} plan generated`);
      logActivity("AI Task Planner", `Generated a ${config.mode.toLowerCase()} plan for ${open.length} tasks`);
      saveOutput("AI Task Planner", `${config.mode} plan`, `${open.length} tasks scheduled`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setStatus("error");
    }
  };

  const clearPlan = () => {
    setPlan(null);
    setStatus("idle");
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4 text-primary" /> Add a task
            </CardTitle>
            <CardDescription>Build your task list, then let the AI schedule it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tname">Task name *</Label>
              <Input
                id="tname"
                placeholder="e.g. Draft supplier contract"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea
                id="tdesc"
                rows={2}
                placeholder="Any detail that affects how long it takes"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tdue">Due date</Label>
                <Input
                  id="tdue"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tdur">Estimated duration (minutes)</Label>
                <Input
                  id="tdur"
                  type="number"
                  min={5}
                  step={5}
                  value={draft.duration}
                  onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcat">Category</Label>
                <Input
                  id="tcat"
                  placeholder="e.g. Admin"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addTask} variant="secondary" className="w-full sm:w-auto">
              <Plus className="size-4" /> Add task
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" /> Planning window
            </CardTitle>
            <CardDescription>The schedule stays inside these hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Plan type</Label>
              <Select
                value={config.mode}
                onValueChange={(v) => setConfig({ ...config, mode: v as "Daily" | "Weekly" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily plan</SelectItem>
                  <SelectItem value="Weekly">Weekly plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Working start time</Label>
                <Input
                  id="start"
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Working end time</Label>
                <Input
                  id="end"
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breaks">Breaks (optional)</Label>
              <Input
                id="breaks"
                placeholder="e.g. 13:00-13:45 lunch"
                value={config.breaks}
                onChange={(e) => setConfig({ ...config, breaks: e.target.value })}
              />
            </div>
            <Button onClick={generate} disabled={status === "loading"} className="w-full sm:w-auto">
              <Sparkles className="size-4" />
              {status === "loading" ? "Planning..." : `Generate ${config.mode.toLowerCase()} plan`}
            </Button>
            <AiNotice />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Your tasks ({tasks.filter((t) => !t.done).length} open)</CardTitle>
          <CardDescription>Edit, reprioritise, complete or delete any task.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="No tasks yet"
              description="Add tasks above, or send action items over from the Meeting Notes Summarizer."
            />
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={(v) => updateTask(t.id, { done: Boolean(v) })}
                  aria-label="Mark task complete"
                />
                <Input
                  value={t.name}
                  onChange={(e) => updateTask(t.id, { name: e.target.value })}
                  className={`flex-1 ${t.done ? "line-through opacity-60" : ""}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={t.priority}
                    onValueChange={(v) => updateTask(t.id, { priority: v as Priority })}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={t.dueDate}
                    onChange={(e) => updateTask(t.id, { dueDate: e.target.value })}
                    className="w-[150px]"
                  />
                  <Badge variant="outline">{t.duration}m</Badge>
                  <Badge variant="secondary">{t.category}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask(t.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Recommended schedule</CardTitle>
          <CardDescription>
            Built from your deadlines, priorities, durations and working hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "idle" && (
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="No plan yet"
              description="Add tasks and generate a daily or weekly plan."
            />
          )}
          {status === "loading" && <LoadingState label="Building your schedule..." />}
          {status === "error" && <ErrorState message={error} onRetry={generate} />}
          {status === "done" && plan && (
            <>
              <div className="space-y-2">
                {plan.schedule.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.task}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date} · {s.start}–{s.end} · {s.durationMinutes} min
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityTone[s.priority] ?? priorityTone.Low}`}
                    >
                      {s.priority}
                    </span>
                  </div>
                ))}
                {plan.schedule.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing could be scheduled.</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold">Priority ranking</h3>
                  <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {plan.priorityRanking.map((p, i) => (
                      <li key={i}>
                        <span className="font-medium text-foreground">
                          {i + 1}. {p.task}
                        </span>{" "}
                        — {p.reason}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <TriangleAlert className="size-4" /> Urgent
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.urgent.join(", ") || "Nothing urgent."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
                    <h3 className="text-sm font-semibold">At risk</h3>
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {plan.atRisk.length === 0 && <li>No tasks at risk.</li>}
                      {plan.atRisk.map((a, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{a.task}</span> — {a.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <h3 className="text-sm font-semibold">Remaining / unscheduled</h3>
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {plan.remaining.length === 0 && <li>Everything fits.</li>}
                      {plan.remaining.map((a, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{a.task}</span> — {a.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-accent/40 p-4">
                <h3 className="text-sm font-semibold">Productivity recommendations</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {plan.recommendations.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>

              <OutputActions text={planToText(plan)} onRegenerate={generate} onClear={clearPlan} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
