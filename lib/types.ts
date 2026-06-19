export interface Card {
  id: string;
  user_id: string;
  player_name: string;
  team: string;
  year: string;
  condition: "mint" | "near_mint" | "excellent" | "good" | "poor";
  psa_graded: boolean;
  psa_grade: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

export type CardInsert = Omit<Card, "id" | "user_id" | "created_at">;
export type CardUpdate = Partial<CardInsert>;
