import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Sparkles, TriangleAlert } from "lucide-react";
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
import { runJsonPrompt } from "@/lib/ai-client";
import { researchPrompt } from "@/lib/prompts";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Produce structured research briefings with insights, findings, recommendations and follow-up questions.",
      },
      { property: "og:title", content: "AI Research Assistant" },
      {
        property: "og:description",
        content: "Structured research briefings for workplace and academic topics.",
      },
    ],
  }),
  component: ResearchPage,
});

type Result = {
  summary: string;
  insights: string[];
  findings: string[];
  recommendations: string[];
  furtherQuestions: string[];
  limitations: string;
};

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
        {items.map((it, i) => (
          <Textarea
            key={i}
            rows={2}
            value={it}
            className="text-[13px] leading-relaxed"
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function resultToText(r: Result, topic: string) {
  return [
    `Research briefing: ${topic}`,
    "",
    "SUMMARY",
    r.summary,
    "",
    "KEY INSIGHTS",
    ...r.insights.map((i) => `- ${i}`),
    "",
    "IMPORTANT FINDINGS",
    ...r.findings.map((i) => `- ${i}`),
    "",
    "RECOMMENDATIONS",
    ...r.recommendations.map((i) => `- ${i}`),
    "",
    "QUESTIONS FOR FURTHER RESEARCH",
    ...r.furtherQuestions.map((i) => `- ${i}`),
    "",
    `LIMITATIONS: ${r.limitations}`,
  ].join("\n");
}

function ResearchPage() {
  const { logActivity, saveOutput } = useAppStore();
  const [form, setForm] = useState({ topic: "", notes: "", source: "", depth: "Medium" });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (form.topic.trim().length < 3) {
      toast.error("Enter a research topic first.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const raw = await runJsonPrompt<Result>(researchPrompt(form));
      setResult({
        summary: raw.summary ?? "",
        insights: raw.insights ?? [],
        findings: raw.findings ?? [],
        recommendations: raw.recommendations ?? [],
        furtherQuestions: raw.furtherQuestions ?? [],
        limitations: raw.limitations ?? "",
      });
      setStatus("done");
      toast.success("Research briefing ready");
      logActivity("AI Research Assistant", `Researched "${form.topic}"`);
      saveOutput("AI Research Assistant", form.topic, raw.summary ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setStatus("error");
    }
  };

  const clearAll = () => {
    setResult(null);
    setStatus("idle");
    setError("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" /> Research brief
          </CardTitle>
          <CardDescription>
            The assistant works from its trained knowledge and any text you paste in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Research topic *</Label>
            <Input
              id="topic"
              placeholder="e.g. Hybrid work policies for small teams"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / angle (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="e.g. Focus on retention and cost for a 20-person company"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Article / text to analyse (optional)</Label>
            <Textarea
              id="source"
              rows={8}
              placeholder="Paste an article, report extract or document here..."
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="text-[13px] leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label>Research depth</Label>
            <Select value={form.depth} onValueChange={(v) => set("depth", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Short", "Medium", "Detailed"].map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={status === "loading"}>
              <Sparkles className="size-4" />
              {status === "loading" ? "Researching..." : "Generate briefing"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm({ topic: "", notes: "", source: "", depth: "Medium" });
                clearAll();
              }}
            >
              Clear form
            </Button>
          </div>
          <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              Verify important facts and sources before using research results. This assistant has
              no live internet access and does not browse or verify sources.
            </p>
          </div>
          <AiNotice />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Research output</CardTitle>
          <CardDescription>Every section is editable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "idle" && (
            <EmptyState
              icon={<BookOpen className="size-5" />}
              title="No briefing yet"
              description="Enter a topic and choose a depth to generate a structured briefing."
            />
          )}
          {status === "loading" && <LoadingState label="Building your research briefing..." />}
          {status === "error" && <ErrorState message={error} onRetry={generate} />}
          {status === "done" && result && (
            <>
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium">
                Briefing ready — remember to verify key facts.
              </div>
              <div>
                <h3 className="text-sm font-semibold">Research summary</h3>
                <Textarea
                  rows={7}
                  className="mt-2 text-[13px] leading-relaxed"
                  value={result.summary}
                  onChange={(e) => setResult({ ...result, summary: e.target.value })}
                />
              </div>
              <EditableList
                title="Key insights"
                items={result.insights}
                onChange={(insights) => setResult({ ...result, insights })}
              />
              <EditableList
                title="Important findings"
                items={result.findings}
                onChange={(findings) => setResult({ ...result, findings })}
              />
              <EditableList
                title="Recommendations"
                items={result.recommendations}
                onChange={(recommendations) => setResult({ ...result, recommendations })}
              />
              <EditableList
                title="Questions for further research"
                items={result.furtherQuestions}
                onChange={(furtherQuestions) => setResult({ ...result, furtherQuestions })}
              />
              {result.limitations && (
                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Limitations: </span>
                  {result.limitations}
                </p>
              )}
              <OutputActions
                text={resultToText(result, form.topic)}
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
