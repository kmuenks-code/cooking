// Shapes mirroring the files in content/. See docs/content-model.md.

export type Tier = 1 | 2 | 3;

export interface SubModule {
  id: string;
  title: string;
  tier: Tier;
  prereqs: string[];
  /** Soft prerequisites. Surfaced as a suggestion, never gates availability. */
  recommended?: string[];
  why: string;
  practice: string;
  /** Injected at load time from the containing file. */
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
}

export interface Module {
  id: string;
  order: number;
  title: string;
  question: string;
  description: string;
  submodules: SubModule[];
}

export interface LessonVideo {
  title: string;
  channel: string;
  youtube_id: string;
  start_seconds?: number;
  note?: string;
}

export interface LessonImage {
  src: string;
  alt: string;
  caption?: string;
  credit: string;
}

export interface LessonFrontmatter {
  id: string;
  module: string;
  title: string;
  tier: Tier;
  prereqs?: string[];
  recommended?: string[];
  estimated_read_minutes?: number;
  summary: string;
  objectives: string[];
  practice: { prompt: string; criteria: string[] };
  videos?: LessonVideo[];
  images?: LessonImage[];
  sources?: string[];
  reviewed: boolean;
}

export interface Lesson {
  frontmatter: LessonFrontmatter;
  body: string;
  filePath: string;
}

export interface RecipeIngredient {
  amount: string;
  item: string;
  /** Functional role, for the future pantry-first tool. */
  role?:
    | 'protein'
    | 'aromatic'
    | 'vegetable'
    | 'fat'
    | 'acid'
    | 'liquid'
    | 'starch'
    | 'herb'
    | 'dairy'
    | 'pantry';
  note?: string;
}

export interface RecipeStep {
  text: string;
  /** Optional sub-module this step exercises. Renders as a link to the lesson. */
  skill?: string;
}

export interface RecipeFrontmatter {
  id: string;
  title: string;
  gist: string;
  yield?: string;
  active_minutes?: number;
  total_minutes?: number;
  difficulty?: number;
  skills: { required: string[]; reinforced?: string[] };
  primary_practice_for?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags?: string[];
  /** Optional outside references. Never the recipe itself — see decisions.md D8. */
  references?: Array<{ title: string; url: string; note?: string }>;
  origin: {
    authored_by?: string;
    date?: string;
    /** False until someone has actually cooked it. Rendered in the UI. */
    tested: boolean;
    notes?: string;
  };
}

export interface Recipe extends RecipeFrontmatter {
  /** MDX body — the "why this works" narrative, variations, troubleshooting. */
  body: string;
  filePath: string;
}

export interface JournalEntry {
  /** Stable local id. Entries live in the browser, so nothing else identifies them. */
  id: string;
  date: string;
  skill: string;
  recipe?: string;
  rating?: number;
  body: string;
}

/**
 * Progress state. See decisions.md D3 — two independent states per sub-module.
 * `studied` is self-attested and unlocks recipes. `practiced` requires a
 * journal entry and unlocks downstream curriculum.
 */
export interface Progress {
  studied: string[];
  /** Derived from journal entries on load, never written directly. */
  practiced: string[];
}

/** What gets persisted to localStorage, and what an export/import file holds. */
export interface SavedState {
  version: 1;
  studied: string[];
  journal: JournalEntry[];
}

export type SkillStatus =
  | 'locked'
  | 'available'
  | 'studied'
  | 'practiced';

// --- build-time payload ------------------------------------------------------

/**
 * Everything the client needs to compute status, serialized into the bundle at
 * build time. Lesson and recipe *bodies* stay server-rendered — only the
 * metadata that progress reasoning touches is shipped here.
 */
export interface RecipeSummary {
  id: string;
  title: string;
  gist: string;
  difficulty?: number;
  active_minutes?: number;
  tested: boolean;
  required: string[];
  reinforced: string[];
  primary_practice_for?: string;
}

export interface AppData {
  modules: Module[];
  skills: SubModule[];
  recipes: RecipeSummary[];
  /** Sub-module ids that have a lesson file written. */
  lessonIds: string[];
  errorCount: number;
}
