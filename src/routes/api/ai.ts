import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type Body = { messages?: ChatMessage[] };

const MODEL = "google/gemini-3.8-flash";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return Response.json({ error: "No messages supplied." }, { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "AI is not configured for this project yet." },
            { status: 500 },
          );
        }

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({ model: MODEL, messages }),
          });
        } catch {
          return Response.json(
            { error: "Could not reach the AI service. Check your connection and try again." },
            { status: 502 },
          );
        }

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "Too many requests right now. Please wait a moment and try again."
              : upstream.status === 402
                ? "The AI usage allowance for this workspace has run out. Add credits to continue."
                : upstream.status === 403
                  ? "AI access is currently blocked for this workspace."
                  : `The AI service returned an error (${upstream.status}).`;
          console.error("AI gateway error", upstream.status, detail.slice(0, 500));
          return Response.json({ error: message }, { status: upstream.status });
        }

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        if (!text.trim()) {
          return Response.json(
            { error: "The AI returned an empty response. Try regenerating." },
            { status: 502 },
          );
        }
        return Response.json({ text });
      },
    },
  },
});
