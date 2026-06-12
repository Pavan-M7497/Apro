import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Card } from "@/lib/board";

const PRIO_STYLE: Record<string, { dot: string; label: string }> = {
  low:    { dot: "var(--prio-low)",  label: "Low" },
  medium: { dot: "var(--prio-med)",  label: "Med" },
  high:   { dot: "var(--prio-high)", label: "High" },
};

export function KanbanCard({ card, onClick, dragging }: { card: Card; onClick: () => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: "card", card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const due = card.due_date ? new Date(card.due_date) : null;
  const overdue = due && isPast(due) && !isToday(due) && card.status !== "done";
  const prio = PRIO_STYLE[card.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group glass rounded-2xl p-3.5 cursor-pointer shadow-card",
        "hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200",
        "hover:-translate-y-0.5",
        dragging && "rotate-2 shadow-glow"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-1 mt-0.5"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className="size-2 rounded-full mt-1.5 shrink-0" style={{ background: prio.dot, boxShadow: `0 0 8px ${prio.dot}` }} />
            <h3 className="font-medium text-sm leading-snug flex-1">{card.title}</h3>
          </div>

          {card.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{card.description}</p>
          )}

          {(card.tags.length > 0 || due) && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {card.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-white/5 border-white/10">
                  {t}
                </Badge>
              ))}
              {due && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md",
                  overdue ? "bg-destructive/15 text-destructive" : "bg-white/5 text-muted-foreground"
                )}>
                  <CalendarDays className="size-3" />
                  {format(due, "MMM d")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
