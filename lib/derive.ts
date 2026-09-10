/**
 * Derived state. Pure functions over the build-time catalog plus whatever
 * progress the browser has stored — no filesystem, so this runs identically
 * during prerender and in the client.
 *
 * decisions.md D4:
 *   - a sub-module is AVAILABLE when every prereq is PRACTICED
 *   - a recipe is UNLOCKED when every required skill is STUDIED
 * Study opens recipes, cooking opens curriculum.
 */
import type {
  AppData,
  JournalEntry,
  Module,
  Progress,
  RecipeSummary,
  SkillStatus,
  SubModule,
} from './types';

export interface Catalog {
  modules: Module[];
  skills: Map<string, SubModule>;
  recipes: RecipeSummary[];
  lessonIds: Set<string>;
  errorCount: number;
}

export function catalog(data: AppData): Catalog {
  return {
    modules: data.modules,
    skills: new Map(data.skills.map((s) => [s.id, s])),
    recipes: data.recipes,
    lessonIds: new Set(data.lessonIds),
    errorCount: data.errorCount,
  };
}

/** `practiced` is derived from the journal, never stored separately. */
export function progressFrom(
  studied: string[],
  journal: JournalEntry[],
): Progress {
  return {
    studied,
    practiced: Array.from(new Set(journal.map((e) => e.skill))),
  };
}

export function skillStatus(skill: SubModule, p: Progress): SkillStatus {
  if (p.practiced.includes(skill.id)) return 'practiced';
  if (p.studied.includes(skill.id)) return 'studied';
  const ready = skill.prereqs.every((id) => p.practiced.includes(id));
  return ready ? 'available' : 'locked';
}

export function statusMap(c: Catalog, p: Progress): Map<string, SkillStatus> {
  const out = new Map<string, SkillStatus>();
  for (const [id, skill] of c.skills) out.set(id, skillStatus(skill, p));
  return out;
}

/** Prereqs that are blocking this skill, for the "why is this locked" line. */
export function blockedBy(skill: SubModule, p: Progress): string[] {
  return skill.prereqs.filter((id) => !p.practiced.includes(id));
}

export function isRecipeUnlocked(r: RecipeSummary, p: Progress): boolean {
  return r.required.every((s) => p.studied.includes(s));
}

export function recipeMissingSkills(r: RecipeSummary, p: Progress): string[] {
  return r.required.filter((s) => !p.studied.includes(s));
}

export function unlockedRecipes(c: Catalog, p: Progress): RecipeSummary[] {
  return c.recipes.filter((r) => isRecipeUnlocked(r, p));
}

/**
 * Skills that are studied but not yet practiced, paired with a recipe that
 * would graduate them. This is the "what should I cook next" list.
 */
export function awaitingPractice(
  c: Catalog,
  p: Progress,
): Array<{ skill: SubModule; recipes: RecipeSummary[] }> {
  const out: Array<{ skill: SubModule; recipes: RecipeSummary[] }> = [];
  for (const id of p.studied) {
    if (p.practiced.includes(id)) continue;
    const skill = c.skills.get(id);
    if (!skill) continue;
    const matching = c.recipes.filter(
      (r) =>
        isRecipeUnlocked(r, p) &&
        (r.primary_practice_for === id ||
          r.required.includes(id) ||
          r.reinforced.includes(id)),
    );
    // primary_practice_for first — it is the best vehicle for this skill.
    matching.sort((a, b) =>
      a.primary_practice_for === id ? -1 : b.primary_practice_for === id ? 1 : 0,
    );
    out.push({ skill, recipes: matching });
  }
  return out.sort((a, b) => a.skill.moduleOrder - b.skill.moduleOrder);
}

/** Available, unstudied skills — the "what can I learn right now" list. */
export function availableNow(c: Catalog, p: Progress): SubModule[] {
  const out: SubModule[] = [];
  for (const skill of c.skills.values()) {
    if (skillStatus(skill, p) === 'available') out.push(skill);
  }
  return out.sort((a, b) => a.tier - b.tier || a.moduleOrder - b.moduleOrder);
}

export function counts(c: Catalog, p: Progress) {
  return {
    total: c.skills.size,
    studied: p.studied.length,
    practiced: p.practiced.length,
    available: availableNow(c, p).length,
  };
}
