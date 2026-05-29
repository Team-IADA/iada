export interface Judge {
  id: number;
  name: string;
  email: string;
  access_code: string;
  is_active: number;
  created_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

export interface Question {
  id: number;
  category_id: number;
  sort_order: number;
  label: string;
  description: string | null;
}

export interface Entry {
  id: number;
  entry_code: string;
  title: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  submitter_name: string | null;
  year: number;
  is_active: number;
  created_at: string;
}

export interface Score {
  id: number;
  judge_id: number;
  entry_id: number;
  question_id: number;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface ScoredEntry extends Entry {
  questions: (Question & { score: number | null })[];
  total_score: number | null;
  is_complete: boolean;
}

// D1Database, D1PreparedStatement, etc. come from @cloudflare/workers-types
// CloudflareEnv is augmented in src/types/cloudflare-env.d.ts
