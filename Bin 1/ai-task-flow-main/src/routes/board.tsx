import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import { KanbanCard } from "@/components/board/KanbanCard";
import { CardDialog, type CardDraft } from "@/components/board/CardDialog";
import { AIChat } from "@/components/board/AIChat";
import {
  STATUSES, fetchCards, createCard, updateCard, deleteCard,
  type Card, type CardStatus,
} from "@/lib/board";

export const Route = createFileRoute("/board")({
  component: BoardPage,
  head: () => ({ meta: [{ title: "Your board · Flux Kanban" }] }),
});

function BoardPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; card?: Card; status: CardStatus } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
      else { setUserId(session.user.id); setEmail(session.user.email ?? ""); }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setUserId(data.session.user.id);
      setEmail(data.session.user.email ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    fetchCards(userId).then((d) => { setCards(d); setLoading(false); }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [userId]);

  const byStatus = useMemo(() => {
    const m: Record<CardStatus, Card[]> = { backlog: [], todo: [], in_progress: [], done: [] };
    for (const c of cards) m[c.status].push(c);
    for (const k of Object.keys(m) as CardStatus[]) m[k].sort((a, b) => a.position - b.position);
    return m;
  }, [cards]);

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;
    const overData = over.data.current as any;
    const targetStatus: CardStatus | undefined =
      overData?.type === "column" ? overData.status : overData?.card?.status;
    if (!targetStatus || activeCard.status === targetStatus) return;
    setCards((prev) => prev.map((c) => c.id === active.id ? { ...c, status: targetStatus } : c));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    const overData = over.data.current as any;
    const targetStatus: CardStatus =
      overData?.type === "column" ? overData.status : overData?.card?.status ?? activeCard.status;

    // Reorder within target column
    const colCards = cards.filter((c) => c.status === targetStatus && c.id !== active.id);
    let insertIndex = colCards.length;
    if (overData?.type === "card") {
      insertIndex = colCards.findIndex((c) => c.id === over.id);
      if (insertIndex < 0) insertIndex = colCards.length;
    }
    const newColOrder = [...colCards.slice(0, insertIndex), { ...activeCard, status: targetStatus }, ...colCards.slice(insertIndex)];

    // Persist positions for all cards in this column
    setCards((prev) => {
      const others = prev.filter((c) => c.status !== targetStatus && c.id !== active.id);
      const updated = newColOrder.map((c, i) => ({ ...c, position: i }));
      return [...others, ...updated];
    });

    try {
      await Promise.all(newColOrder.map((c, i) =>
        updateCard(c.id, { position: i, status: targetStatus })
      ));
    } catch (err: any) {
      toast.error("Couldn't save order");
    }
  };

  const handleSave = async (draft: CardDraft) => {
    if (!userId) return;
    try {
      if (draft.id) {
        await updateCard(draft.id, {
          title: draft.title, description: draft.description || null,
          status: draft.status, priority: draft.priority,
          due_date: draft.due_date, tags: draft.tags,
        });
        setCards((prev) => prev.map((c) => c.id === draft.id ? { ...c, ...draft, description: draft.description || null } : c));
        toast.success("Card updated");
      } else {
        const pos = byStatus[draft.status].length;
        const created = await createCard({
          user_id: userId,
          title: draft.title,
          description: draft.description || null,
          status: draft.status,
          priority: draft.priority,
          due_date: draft.due_date,
          tags: draft.tags,
          position: pos,
        });
        setCards((prev) => [...prev, created]);
        toast.success("Card added");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Deleted");
      setDialog(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/10">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Flux</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setDialog({ open: true, status: "todo" })} size="sm" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              <Plus className="size-4 mr-1" /> New card
            </Button>
            <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="glass border-white/10">
              <Sparkles className="size-4 mr-1" /> Ask AI
            </Button>
            <Button onClick={() => supabase.auth.signOut()} variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-x-auto scrollbar-thin">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading your board…</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max pb-4">
              {STATUSES.map((s) => (
                <KanbanColumn
                  key={s.id}
                  id={s.id}
                  label={s.label}
                  accent={s.accent}
                  cards={byStatus[s.id]}
                  onAdd={() => setDialog({ open: true, status: s.id })}
                  onCardClick={(c) => setDialog({ open: true, status: c.status, card: c })}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? <KanbanCard card={activeCard} onClick={() => {}} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {dialog && (
        <CardDialog
          open={dialog.open}
          onOpenChange={(o) => !o && setDialog(null)}
          initial={dialog.card ?? { status: dialog.status, priority: "medium", tags: [] }}
          onSave={handleSave}
          onDelete={dialog.card ? () => handleDelete(dialog.card!.id) : undefined}
        />
      )}

      <AIChat open={aiOpen} onOpenChange={setAiOpen} cards={cards} />
    </div>
  );
}
