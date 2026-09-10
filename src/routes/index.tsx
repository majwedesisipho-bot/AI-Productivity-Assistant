import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarClock,
  CheckCircle2,
  FileText,
  Lightbulb,
  Mail,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AiNotice, EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore, timeAgo } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI workspace dashboard: draft emails, summarise meetings, plan tasks and research topics from one place.",
      },
      { property: "og:title", content: "Dashboard — AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Your AI workspace dashboard: draft emails, summarise meetings, plan tasks and research topics from one place.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  {
    to: "/email" as const,
    label: "Draft an email",
    description: "Professional messages in the tone you choose.",
    icon: Mail,
  },
  {
    to: "/meetings" as const,
    label: "Summarise a meeting",
    description: "Turn raw notes into decisions and action items.",
    icon: FileText,
  },
  {
    to: "/planner" as const,
    label: "Plan my tasks",
    description: "Prioritised, time-blocked daily or weekly plans.",
    icon: CalendarClock,
  },
  {
    to: "/research" as const,
    label: "Research a topic",
    description: "Structured briefs with insights and open questions.",
    icon: BookOpen,
  },
  {
    to: "/chat" as const,
    label: "Ask the assistant",
    description: "Chat through workplace questions with Aura.",
    icon: Bot,
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { tasks, activity, outputs, settings, generationCount } = useAppStore();

  const done = tasks.filter((t) => t.done).length;
  const open = tasks.length - done;
  const highPriority = tasks.filter((t) => !t.done && t.priority === "High").length;
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const stats = [
    { label: "AI generations", value: generationCount, icon: Sparkles },
    { label: "Open tasks", value: open, icon: CalendarClock },
    { label: "Completed tasks", value: done, icon: CheckCircle2 },
    { label: "High priority", value: highPriority, icon: TrendingUp },
  ];

  const insight = !tasks.length
    ? "Start by summarising a meeting or planning your tasks — your productivity insights will build from there."
    : highPriority > 2
      ? `You have ${highPriority} high-priority tasks open. Tackle the two most urgent before your first meeting block.`
      : completion >= 70
        ? `Strong week — ${completion}% of your tasks are complete. Use the spare capacity for deep work.`
        : `You're ${completion}% through your task list. Ask the planner to time-block the rest of today.`;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
        <p className="text-sm font-medium text-primary">{greeting()}, {settings.displayName}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          One AI workspace for your busiest days
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Draft email, turn meeting notes into action items, plan and prioritise your work, and
          research any topic — all in one place, with every output editable before you use it.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/email">
              Start with an email <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/planner">Plan my day</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-2xl font-semibold">{s.value}</span>
                  <span className="block text-xs text-muted-foreground">{s.label}</span>
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-raised"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold">
                  {a.label}
                  <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Generate an email, summary or plan and it will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {activity.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="block text-sm">{a.message}</span>
                      <span className="block text-xs text-muted-foreground">
                        {a.tool} · {timeAgo(a.at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent outputs</CardTitle>
          </CardHeader>
          <CardContent>
            {outputs.length === 0 ? (
              <EmptyState
                title="Nothing saved yet"
                description="Previews of your most recent AI outputs will be listed here."
              />
            ) : (
              <ul className="space-y-3">
                {outputs.slice(0, 4).map((o) => (
                  <li key={o.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{o.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.preview}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.tool} · {timeAgo(o.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex gap-3 p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Productivity insight</span>
            <span className="mt-1 block text-sm text-muted-foreground">{insight}</span>
          </span>
        </CardContent>
      </Card>

      <AiNotice />
    </div>
  );
}
