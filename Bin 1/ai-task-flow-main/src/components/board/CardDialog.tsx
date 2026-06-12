import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Card, CardPriority, CardStatus } from "@/lib/board";
import { STATUSES } from "@/lib/board";

export interface CardDraft {
  id?: string;
  title: string;
  description: string;
  status: CardStatus;
  priority: CardPriority;
  due_date: string | null;
  tags: string[];
}

export function CardDialog({
  open, onOpenChange, initial, onSave, onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Partial<Card> & { status: CardStatus };
  onSave: (draft: CardDraft) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<CardDraft>(toDraft(initial));
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { if (open) { setDraft(toDraft(initial)); setTagInput(""); } }, [open, initial]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) setDraft({ ...draft, tags: [...draft.tags, t] });
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{initial.id ? "Edit card" : "New card"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What needs doing?" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Add details (optional)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as CardStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as CardPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !draft.due_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 size-4" />
                  {draft.due_date ? format(new Date(draft.due_date), "PPP") : "Pick a date"}
                  {draft.due_date && (
                    <X className="ml-auto size-4 opacity-60 hover:opacity-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDraft({ ...draft, due_date: null }); }} />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-strong" align="start">
                <Calendar
                  mode="single"
                  selected={draft.due_date ? new Date(draft.due_date) : undefined}
                  onSelect={(d) => setDraft({ ...draft, due_date: d ? d.toISOString().slice(0, 10) : null })}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder="Type and press Enter"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { if (draft.title.trim()) { onSave(draft); onOpenChange(false); } }}
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            {initial.id ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toDraft(c: Partial<Card> & { status: CardStatus }): CardDraft {
  return {
    id: c.id,
    title: c.title ?? "",
    description: c.description ?? "",
    status: c.status,
    priority: c.priority ?? "medium",
    due_date: c.due_date ?? null,
    tags: c.tags ?? [],
  };
}
