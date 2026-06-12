import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardStatus = Database["public"]["Enums"]["card_status"];
export type CardPriority = Database["public"]["Enums"]["card_priority"];

export const STATUSES: { id: CardStatus; label: string; accent: string }[] = [
  { id: "backlog", label: "Backlog", accent: "var(--backlog)" },
  { id: "todo", label: "To Do", accent: "var(--todo)" },
  { id: "in_progress", label: "In Progress", accent: "var(--progress)" },
  { id: "done", label: "Done", accent: "var(--done)" },
];

export async function fetchCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCard(input: {
  user_id: string;
  title: string;
  description?: string | null;
  status: CardStatus;
  priority: CardPriority;
  due_date?: string | null;
  tags?: string[];
  position: number;
}) {
  const { data, error } = await supabase.from("cards").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCard(id: string, patch: Partial<Card>) {
  const { error } = await supabase.from("cards").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}
