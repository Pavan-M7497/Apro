import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, ArrowRight, Layers, MessageSquare, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Flux · A kanban with an AI brain" },
      { name: "description", content: "Beautiful, drag-and-drop kanban board with an integrated AI assistant. Plan, organize, and ship — your board, persisted in the cloud." },
      { property: "og:title", content: "Flux · A kanban with an AI brain" },
      { property: "og:description", content: "Drag-and-drop kanban with an integrated AI assistant." },
    ],
  }),
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/board" }); });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Flux</span>
        </div>
        <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            New · AI assistant that knows your board
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            A kanban with an
            <br />
            <span className="text-gradient">AI brain.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Drag, drop, organize. Then ask Flux anything — what's overdue, what to tackle next, or just a quick question. Saved to the cloud, always.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="h-12 px-6 font-medium" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}>
                Start your board <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Layers, title: "4 columns", desc: "Backlog → To Do → In Progress → Done" },
              { icon: MessageSquare, title: "AI assistant", desc: "Ask anything about your board" },
              { icon: Cloud, title: "Cloud-saved", desc: "Sign in anywhere, pick up where you left off" },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-5 text-left">
                <f.icon className="size-5 text-accent mb-3" />
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Built with Lovable · Your data, private to your account
      </footer>
    </div>
  );
}
