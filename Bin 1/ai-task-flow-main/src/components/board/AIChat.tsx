import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { Card } from "@/lib/board";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat({ open, onOpenChange, cards }: { open: boolean; onOpenChange: (o: boolean) => void; cards: Card[] }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const boardContext = {
    backlog: cards.filter(c => c.status === "backlog").map(serialize),
    todo: cards.filter(c => c.status === "todo").map(serialize),
    in_progress: cards.filter(c => c.status === "in_progress").map(serialize),
    done: cards.filter(c => c.status === "done").map(serialize),
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], boardContext }),
      });

      if (resp.status === 429) { toast.error("Rate limit hit. Try again shortly."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      toast.error("Failed to reach AI. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="glass-strong w-full sm:max-w-md p-0 flex flex-col border-l border-white/10">
        <SheetHeader className="p-5 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 font-display">
            <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            Flux AI
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm text-muted-foreground">Ask anything — your board is in context.</p>
              <div className="flex flex-col gap-2 text-xs">
                {["What's overdue?", "Summarize what's in progress", "What should I tackle next?"].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="px-3 py-2 rounded-lg glass hover:bg-white/[0.07] text-left transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary/20 border border-primary/30 text-foreground"
                  : "glass"
              )}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start"><div className="glass rounded-2xl px-4 py-2.5"><Loader2 className="size-4 animate-spin" /></div></div>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your board…"
              rows={1}
              className="resize-none min-h-[44px] max-h-32"
            />
            <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="shrink-0 size-11" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function serialize(c: Card) {
  return { title: c.title, description: c.description, priority: c.priority, due_date: c.due_date, tags: c.tags };
}
