import { renderPrompt, type PromptSpec } from "./prompts";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok || !data.text) {
    throw new Error(data.error ?? "Something went wrong while generating. Please try again.");
  }
  return data.text;
}

/** Runs a structured Role → Context → Objective → Constraints → Output Format prompt. */
export async function runPrompt(spec: PromptSpec): Promise<string> {
  return callAI([
    { role: "system", content: "Follow the structured instruction block exactly." },
    { role: "user", content: renderPrompt(spec) },
  ]);
}

/** Runs a structured prompt whose output format is JSON, and parses it. */
export async function runJsonPrompt<T>(spec: PromptSpec): Promise<T> {
  const raw = await runPrompt(spec);
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new Error("The AI response could not be read. Please regenerate.");
  }
}

export async function runChat(system: string, history: ChatMessage[]): Promise<string> {
  return callAI([{ role: "system", content: system }, ...history]);
}
