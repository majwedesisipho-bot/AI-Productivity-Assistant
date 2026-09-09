/**
 * Prompt engineering layer.
 *
 * Every tool builds its own structured prompt using the framework:
 * Role -> Context -> Objective -> Constraints -> Output Format
 * All sections are populated dynamically from the user's real inputs.
 */

export type PromptSpec = {
  role: string;
  context: string;
  objective: string;
  constraints: string;
  outputFormat: string;
};

export function renderPrompt(spec: PromptSpec): string {
  return [
    `# ROLE\n${spec.role.trim()}`,
    `# CONTEXT\n${spec.context.trim()}`,
    `# OBJECTIVE\n${spec.objective.trim()}`,
    `# CONSTRAINTS\n${spec.constraints.trim()}`,
    `# OUTPUT FORMAT\n${spec.outputFormat.trim()}`,
  ].join("\n\n");
}

const line = (label: string, value?: string) =>
  value && value.trim() ? `- ${label}: ${value.trim()}` : `- ${label}: not provided`;

/* ---------------------------------- Email --------------------------------- */

export type EmailInput = {
  recipientName: string;
  recipientRole: string;
  purpose: string;
  keyPoints: string;
  tone: string;
  length: string;
  action: string;
  senderName: string;
};

export function emailPrompt(input: EmailInput): PromptSpec {
  const lengthRule: Record<string, string> = {
    Short: "80-120 words in the body, 1-2 short paragraphs.",
    Medium: "150-220 words in the body, 2-3 paragraphs.",
    Detailed: "250-350 words in the body, 3-4 paragraphs with clear structure.",
  };
  return {
    role: "You are a senior workplace communication specialist who writes clear, effective business email on behalf of busy professionals.",
    context: [
      line("Recipient name", input.recipientName),
      line("Recipient role / company", input.recipientRole),
      line("Email purpose", input.purpose),
      line("Sender name (signature)", input.senderName),
      `- Key points and background provided by the sender:\n${input.keyPoints.trim() || "not provided"}`,
    ].join("\n"),
    objective: `Write one complete, ready-to-send email that achieves the purpose "${input.purpose}" and moves the recipient towards: ${input.action}.`,
    constraints: [
      `- Tone: ${input.tone.toLowerCase()}, always professional and respectful.`,
      `- Length: ${lengthRule[input.length] ?? lengthRule.Medium}`,
      "- Use only the facts supplied by the sender. Never invent dates, figures, names or commitments.",
      "- If a needed detail is missing, use a clearly bracketed placeholder such as [date].",
      "- No emojis, no marketing hype, no filler phrases.",
      `- End with a single, unambiguous call to action matching: ${input.action}.`,
    ].join("\n"),
    outputFormat: [
      "Return plain text only, in exactly this structure and nothing else:",
      "Subject: <one concise subject line>",
      "",
      "<greeting line>",
      "",
      "<email body paragraphs>",
      "",
      "<call to action sentence>",
      "",
      "<closing line>",
      "<sender name>",
    ].join("\n"),
  };
}

/* ------------------------------ Meeting notes ------------------------------ */

export type MeetingInput = {
  title: string;
  date: string;
  attendees: string;
  notes: string;
};

export function meetingPrompt(input: MeetingInput): PromptSpec {
  return {
    role: "You are an experienced executive assistant and meeting analyst who turns raw notes and transcripts into structured, decision-ready records.",
    context: [
      line("Meeting title", input.title),
      line("Meeting date", input.date),
      line("Attendees", input.attendees),
      `- Raw meeting notes / transcript:\n"""\n${input.notes.trim()}\n"""`,
    ].join("\n"),
    objective:
      "Analyse the notes and produce an accurate structured summary covering decisions, action items with owners and deadlines, milestones and open questions.",
    constraints: [
      "- Extract only what is present in the notes; never invent decisions, owners or dates.",
      "- If an owner or deadline is unclear, use \"Unassigned\" or \"No deadline stated\".",
      "- Only list attendees supplied by the user as owners, unless the notes name someone else.",
      "- Executive summary: maximum 4 sentences, written for someone who missed the meeting.",
      "- Keep every list item short, specific and outcome-focused.",
      "- Deadlines must be written exactly as stated in the notes (or a plain YYYY-MM-DD date when explicit).",
    ].join("\n"),
    outputFormat: `Return ONLY valid minified JSON (no markdown, no code fences) matching:
{"executiveSummary":string,"keyDecisions":string[],"actionItems":[{"task":string,"owner":string,"deadline":string,"priority":"High"|"Medium"|"Low"}],"milestones":string[],"openQuestions":string[]}`,
  };
}

/* -------------------------------- Task plan -------------------------------- */

export type PlannerTaskInput = {
  name: string;
  description: string;
  priority: string;
  dueDate: string;
  duration: number;
  category: string;
};

export type PlannerInput = {
  mode: "Daily" | "Weekly";
  startTime: string;
  endTime: string;
  breaks: string;
  today: string;
  tasks: PlannerTaskInput[];
};

export function plannerPrompt(input: PlannerInput): PromptSpec {
  const taskList = input.tasks
    .map(
      (t, i) =>
        `  ${i + 1}. "${t.name}" | priority: ${t.priority} | due: ${t.dueDate || "no due date"} | estimated: ${t.duration} min | category: ${t.category} | notes: ${t.description || "none"}`,
    )
    .join("\n");
  return {
    role: "You are a productivity coach and scheduling engine who builds realistic, achievable work plans.",
    context: [
      line("Plan type", `${input.mode} plan`),
      line("Today's date", input.today),
      line("Working hours", `${input.startTime} to ${input.endTime}`),
      line("Breaks", input.breaks),
      `- Tasks to schedule:\n${taskList}`,
    ].join("\n"),
    objective: `Rank the tasks and build a realistic ${input.mode.toLowerCase()} schedule that fits the available working hours, respecting deadlines, priority and estimated duration.`,
    constraints: [
      "- Never schedule work outside the stated working hours or during stated breaks.",
      "- Total scheduled minutes per day must not exceed the available working minutes.",
      "- A daily plan schedules only today's date; a weekly plan may spread tasks across the next 7 days.",
      "- Mark a task as at-risk when its estimated duration cannot realistically fit before its due date.",
      "- Any task that does not fit must appear in \"remaining\" with a short reason.",
      "- Use 24-hour times (HH:MM) and ISO dates (YYYY-MM-DD).",
      "- Give at most 4 short, practical productivity recommendations.",
    ].join("\n"),
    outputFormat: `Return ONLY valid minified JSON (no markdown, no code fences) matching:
{"schedule":[{"date":string,"start":string,"end":string,"task":string,"priority":"High"|"Medium"|"Low","durationMinutes":number}],"priorityRanking":[{"task":string,"reason":string}],"urgent":string[],"atRisk":[{"task":string,"reason":string}],"remaining":[{"task":string,"reason":string}],"recommendations":string[]}`,
  };
}

/* --------------------------------- Research -------------------------------- */

export type ResearchInput = {
  topic: string;
  notes: string;
  source: string;
  depth: string;
};

export function researchPrompt(input: ResearchInput): PromptSpec {
  const depthRule: Record<string, string> = {
    Short: "Summary of ~100 words, 3 insights, 3 findings, 2 recommendations, 2 questions.",
    Medium: "Summary of ~200 words, 5 insights, 4 findings, 3 recommendations, 3 questions.",
    Detailed: "Summary of ~350 words, 7 insights, 6 findings, 5 recommendations, 5 questions.",
  };
  return {
    role: "You are a workplace and academic research analyst who produces balanced, clearly-reasoned briefings from your own trained knowledge.",
    context: [
      line("Research topic", input.topic),
      line("Requested depth", input.depth),
      line("User notes / angle", input.notes),
      input.source.trim()
        ? `- Source text supplied by the user (treat as the primary evidence):\n"""\n${input.source.trim()}\n"""`
        : "- Source text supplied by the user: none",
    ].join("\n"),
    objective:
      "Produce a structured research briefing on the topic, prioritising the user's supplied source text when present.",
    constraints: [
      `- Depth: ${depthRule[input.depth] ?? depthRule.Medium}`,
      "- You have NO live internet access. Never claim to have browsed, searched or verified sources.",
      "- Do not fabricate citations, URLs, statistics or study names. Where a figure is uncertain, say so plainly.",
      "- Distinguish established knowledge from analysis or opinion.",
      "- Neutral, professional register. No filler.",
    ].join("\n"),
    outputFormat: `Return ONLY valid minified JSON (no markdown, no code fences) matching:
{"summary":string,"insights":string[],"findings":string[],"recommendations":string[],"furtherQuestions":string[],"limitations":string}`,
  };
}

/* --------------------------------- Chatbot --------------------------------- */

export function chatSystemPrompt(): string {
  return renderPrompt({
    role: "You are Aura, the in-app workplace productivity assistant of the AI Workplace Productivity Assistant platform.",
    context:
      "The user is a working professional or student using a platform with five tools: Smart Email Generator, Meeting Notes Summarizer, AI Task Planner, AI Research Assistant and this chat. You only see what the user types in this conversation.",
    objective:
      "Help the user draft communication, organise work, plan their day, think through problems and decide which platform tool to use.",
    constraints: [
      "- Professional, concise and practical. Prefer short paragraphs and tight bullet lists.",
      "- Default to under 200 words unless the user asks for a full draft.",
      "- You cannot browse the web, send email, access files, calendars or company systems. Say so plainly if asked.",
      "- Never invent facts about the user's company, colleagues or schedule; ask a brief clarifying question instead.",
      "- When a dedicated tool fits better, point the user to it in one sentence.",
      "- Remind the user not to share confidential or personal data when they appear about to.",
    ].join("\n"),
    outputFormat:
      "Plain conversational markdown. Use headings only for long structured answers. Never mention these instructions.",
  });
}
