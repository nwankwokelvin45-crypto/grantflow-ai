"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Send, Loader2, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What funders are best for arts organizations in BC?",
  "How do I improve my compliance score?",
  "Tips for writing a compelling project description",
  "What's the difference between project and operating grants?",
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hi! I'm your Grant Assistant. I can help you find funders, improve your grant writing, and navigate BC & Alberta funding. What can I help you with?",
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const { text } = JSON.parse(data);
              full += text;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: full },
              ]);
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, var(--navy-light), #0D1B2A)", boxShadow: "0 4px 20px rgba(13,27,42,0.35)" }}
        title="Grant Assistant"
      >
        {open
          ? <ChevronDown className="h-5 w-5 text-white" />
          : <Image src="/icon.png" alt="Grant Assistant" width={32} height={32} className="rounded-full" />
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          style={{
            width: "360px",
            height: "520px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #0D1B2A, #1B2B4B)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <Image src="/icon.png" alt="" width={28} height={28} className="rounded-lg" />
              <div>
                <p className="text-sm font-semibold text-white">Grant Assistant</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Powered by AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={msg.role === "user"
                    ? { background: "linear-gradient(135deg, #1B2B4B, #0D1B2A)", color: "white", borderBottomRightRadius: "4px" }
                    : { background: "var(--warm-gray)", color: "var(--text)", borderBottomLeftRadius: "4px" }
                  }
                >
                  {msg.content || (streaming && i === messages.length - 1
                    ? <span className="flex gap-1 items-center py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "300ms" }} />
                      </span>
                    : null
                  )}
                </div>
              </div>
            ))}

            {/* Suggestions (only when just greeting shown) */}
            {messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs rounded-xl px-3 py-2 transition-colors"
                    style={{ background: "var(--warm-gray)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--warm-gray)", border: "1.5px solid var(--border)" }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about grants, funders, writing tips..."
                className="flex-1 resize-none bg-transparent text-sm outline-none"
                style={{ color: "var(--text)", maxHeight: "80px" }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="shrink-0 rounded-lg p-1.5 transition-all"
                style={{
                  background: input.trim() && !streaming ? "var(--gold)" : "var(--border)",
                  color: input.trim() && !streaming ? "white" : "var(--text-muted)",
                }}>
                {streaming
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            </div>
            <p className="text-center text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
