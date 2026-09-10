// Server-only: reads content/ from disk. Everything here runs at build time —
// the site is a static export, so nothing in this file ships to the browser.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import type {
  AppData,
  Lesson,
  LessonFrontmatter,
  Module,
  Recipe,
  RecipeFrontmatter,
  SubModule,
} from './types';

const CONTENT = path.join(process.cwd(), 'content');

/** Posix-style so the path printed in the UI is stable across platforms. */
function relPath(abs: string): string {
  return path.relative(process.cwd(), abs).split(path.sep).join('/');
}

function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

// --- curriculum --------------------------------------------------------------

export function loadModules(): Module[] {
  const dir = path.join(CONTENT, 'curriculum');
  const modules = readDirSafe(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => {
      const raw = parseYaml(fs.readFileSync(path.join(dir, f), 'utf-8'));
      const mod: Module = {
        id: raw.id,
        order: raw.order,
        title: raw.title,
        question: raw.question,
        description: raw.description ?? '',
        submodules: (raw.submodules ?? []).map(
          (s: Record<string, unknown>): SubModule => ({
            id: s.id as string,
            title: s.title as string,
            tier: (s.tier ?? 1) as SubModule['tier'],
            prereqs: (s.prereqs ?? []) as string[],
            recommended: (s.recommended ?? []) as string[],
            why: (s.why ?? '') as string,
            practice: (s.practice ?? '') as string,
            moduleId: raw.id,
            moduleTitle: raw.title,
            moduleOrder: raw.order,
          }),
        ),
      };
      return mod;
    });
  return modules.sort((a, b) => a.order - b.order);
}

let _skillCache: Map<string, SubModule> | null = null;

export function allSkills(): Map<string, SubModule> {
  // Cached per process. `next dev` restarts on file changes, so edits to
  // content/curriculum are picked up on reload.
  if (_skillCache) return _skillCache;
  const map = new Map<string, SubModule>();
  for (const m of loadModules()) {
    for (const s of m.submodules) map.set(s.id, s);
  }
  _skillCache = map;
  return map;
}

export function getSkill(id: string): SubModule | undefined {
  return allSkills().get(id);
}

// --- lessons -----------------------------------------------------------------

export function loadLessons(): Map<string, Lesson> {
  const root = path.join(CONTENT, 'lessons');
  const out = new Map<string, Lesson>();
  for (const moduleDir of readDirSafe(root)) {
    const full = path.join(root, moduleDir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const file of readDirSafe(full)) {
      if (!file.endsWith('.mdx')) continue;
      const filePath = path.join(full, file);
      const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
      const fm = data as LessonFrontmatter;
      if (!fm?.id) continue;
      out.set(fm.id, {
        frontmatter: fm,
        body: content,
        filePath: relPath(filePath),
      });
    }
  }
  return out;
}

export function getLesson(id: string): Lesson | undefined {
  return loadLessons().get(id);
}

// --- recipes -----------------------------------------------------------------

export function loadRecipes(): Recipe[] {
  const dir = path.join(CONTENT, 'recipes');
  return readDirSafe(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const filePath = path.join(dir, f);
      const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
      return {
        ...(data as RecipeFrontmatter),
        body: content,
        filePath: relPath(filePath),
      } as Recipe;
    })
    .filter((r) => Boolean(r?.id))
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
}

export function getRecipe(id: string): Recipe | undefined {
  return loadRecipes().find((r) => r.id === id);
}

// --- validation --------------------------------------------------------------

export interface ValidationIssue {
  severity: 'error' | 'warning';
  where: string;
  message: string;
}

/**
 * The checks listed in docs/content-model.md. Run by `npm run validate` and
 * surfaced in the UI so content rot is visible rather than silent.
 */
export function validateContent(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const modules = loadModules();
  const skills = new Map<string, SubModule>();

  for (const m of modules) {
    for (const s of m.submodules) {
      if (skills.has(s.id)) {
        issues.push({
          severity: 'error',
          where: s.id,
          message: `Duplicate sub-module id, also in ${skills.get(s.id)!.moduleId}`,
        });
      }
      skills.set(s.id, s);
    }
  }

  for (const s of skills.values()) {
    for (const p of s.prereqs) {
      if (!skills.has(p)) {
        issues.push({
          severity: 'error',
          where: s.id,
          message: `Prerequisite "${p}" does not resolve to a known sub-module`,
        });
      }
    }
    for (const r of s.recommended ?? []) {
      if (!skills.has(r)) {
        issues.push({
          severity: 'error',
          where: s.id,
          message: `Recommended "${r}" does not resolve to a known sub-module`,
        });
      }
    }
  }

  // Cycle detection over the prerequisite graph.
  const WHITE = 0,
    GREY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const id of skills.keys()) color.set(id, WHITE);
  const visit = (id: string, stack: string[]) => {
    color.set(id, GREY);
    for (const p of skills.get(id)?.prereqs ?? []) {
      if (!skills.has(p)) continue;
      if (color.get(p) === GREY) {
        issues.push({
          severity: 'error',
          where: id,
          message: `Prerequisite cycle: ${[...stack, id, p].join(' -> ')}`,
        });
      } else if (color.get(p) === WHITE) {
        visit(p, [...stack, id]);
      }
    }
    color.set(id, BLACK);
  };
  for (const id of skills.keys()) if (color.get(id) === WHITE) visit(id, []);

  // Lessons.
  const lessons = loadLessons();
  for (const [id, lesson] of lessons) {
    if (!skills.has(id)) {
      issues.push({
        severity: 'error',
        where: lesson.filePath,
        message: `Lesson id "${id}" has no matching sub-module in the curriculum`,
      });
      continue;
    }
    const skill = skills.get(id)!;
    const fmPrereqs = lesson.frontmatter.prereqs ?? [];
    const same =
      fmPrereqs.length === skill.prereqs.length &&
      fmPrereqs.every((p) => skill.prereqs.includes(p));
    if (!same) {
      issues.push({
        severity: 'warning',
        where: id,
        message:
          'Lesson frontmatter prereqs drift from curriculum. The curriculum YAML is the source of truth.',
      });
    }
    for (const img of lesson.frontmatter.images ?? []) {
      if (!img.alt || !img.credit) {
        issues.push({
          severity: 'error',
          where: id,
          message: 'Every image needs both alt text and a credit',
        });
      }
    }
  }

  // Recipes.
  for (const r of loadRecipes()) {
    const tagged = [...(r.skills?.required ?? []), ...(r.skills?.reinforced ?? [])];
    for (const s of tagged) {
      if (!skills.has(s)) {
        issues.push({
          severity: 'error',
          where: r.id,
          message: `Recipe tags unknown skill "${s}"`,
        });
      }
    }
    if (r.primary_practice_for && !skills.has(r.primary_practice_for)) {
      issues.push({
        severity: 'error',
        where: r.id,
        message: `primary_practice_for references unknown skill "${r.primary_practice_for}"`,
      });
    }
    for (const step of r.steps ?? []) {
      if (!step.skill) continue;
      if (!skills.has(step.skill)) {
        issues.push({
          severity: 'error',
          where: r.id,
          message: `Step cites unknown skill "${step.skill}"`,
        });
      } else if (!tagged.includes(step.skill)) {
        issues.push({
          severity: 'warning',
          where: r.id,
          message: `Step cites "${step.skill}" but the recipe does not list it in skills`,
        });
      }
    }
    if (!r.ingredients?.length || !r.steps?.length) {
      issues.push({
        severity: 'error',
        where: r.id,
        message: 'Recipe needs both ingredients and steps',
      });
    }
  }

  return issues;
}

// --- build-time payload ------------------------------------------------------

/**
 * The serializable slice of the content that client components need in order to
 * reason about progress. Called from server components and handed down as
 * props, which is how it ends up in the static bundle.
 */
export function buildAppData(): AppData {
  const modules = loadModules();
  return {
    modules,
    skills: modules.flatMap((m) => m.submodules),
    recipes: loadRecipes().map((r) => ({
      id: r.id,
      title: r.title,
      gist: r.gist,
      difficulty: r.difficulty,
      active_minutes: r.active_minutes,
      tested: Boolean(r.origin?.tested),
      required: r.skills?.required ?? [],
      reinforced: r.skills?.reinforced ?? [],
      primary_practice_for: r.primary_practice_for,
    })),
    lessonIds: Array.from(loadLessons().keys()),
    errorCount: validateContent().filter((i) => i.severity === 'error').length,
  };
}
