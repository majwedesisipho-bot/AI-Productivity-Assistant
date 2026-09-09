import { createFileRoute } from "@tanstack/react-router";
import { Bot, Copy, Loader2, Send, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AiNotice, ErrorState } from "@/components/common/states";
import { copyText } from "@/components/common/OutputActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { runChat, type ChatMessage } from "@/lib/ai-client";
import { chatSystemPrompt } from "@/lib/prompts";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Chat with a professional workplace assistant to draft, plan, summarise and organise your day.",
      },
      { property: "og:title", content: "AI Chatbot" },
      {
        property: "og:description",
        content: "A concise, professional workplace assistant inside your productivity platform.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Draft an email",
  "Summarize meeting notes",
  "Plan my tasks",
  "Research a topic",
  "Organize my day",
];

function ChatPage() {
  const { logActivity } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const reply = await runChat(chatSystemPrompt(), next);
      setMessages([...next, { role: "assistant", content: reply.trim() }]);
      if (messages.length === 0) logActivity("AI Chatbot", "Started a new assistant conversation");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="flex h-[calc(100vh-16rem)] min-h-[520px] flex-col overflow-hidden shadow-card">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 && (
              <div className="mx-auto max-w-md py-10 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Bot className="size-6" />
                </div>
                <p className="text-sm font-semibold">Ask Aura, your workplace assistant</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with a suggestion below, or type your own question.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Bot className="size-4" />
                  </span>
                )}
                <div className={`max-w-[85%] ${m.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={
                      m.role === "user"
                        ? "inline-block rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-left text-sm text-primary-foreground"
                        : "whitespace-pre-wrap text-sm leading-relaxed text-foreground"
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      onClick={async () => {
                        const ok = await copyText(m.content);
                        toast[ok ? "success" : "error"](
                          ok ? "Response copied" : "Copying is blocked in this browser",
                        );
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3" /> Copy
                    </button>
                  )}
                </div>
                {m.role === "user" && (
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="size-4" />
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> Aura is thinking...
              </p>
            )}
            {error && <ErrorState message={error} />}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-4 md:p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask anything about your work — Enter to send, Shift+Enter for a new line"
                className="min-h-[52px] resize-none"
                aria-label="Message"
              />
              <Button onClick={() => void send(input)} disabled={loading || !input.trim()} size="icon">
                <Send className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                disabled={messages.length === 0}
                aria-label="Clear conversation"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <AiNotice />
    </div>
  );
}
