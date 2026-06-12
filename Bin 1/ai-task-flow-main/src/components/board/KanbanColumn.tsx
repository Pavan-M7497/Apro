import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { Card, CardStatus } from "@/lib/board";

export function KanbanColumn({
  id, label, accent, cards, onAdd, onCardClick,
}: {
  id: CardStatus;
  label: string;
  accent: string;
  cards: Card[];
  onAdd: () => void;
  onCardClick: (c: Card) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column", status: id } });

  return (
    <div className="flex flex-col min-w-[280px] w-[300px] shrink-0">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <h2 className="font-display font-semibold text-sm tracking-wide uppercase">{label}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{cards.length}</span>
        </div>
        <button
          onClick={onAdd}
          className="size-6 rounded-md hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Add card to ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-2xl p-2 space-y-2 transition-colors duration-200 min-h-[200px] scrollbar-thin overflow-y-auto",
          isOver ? "bg-white/[0.05]" : "bg-white/[0.015]"
        )}
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((c) => <KanbanCard key={c.id} card={c} onClick={() => onCardClick(c)} />)}
        </SortableContext>
        {cards.length === 0 && (
          <button
            onClick={onAdd}
            className="w-full py-8 rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
