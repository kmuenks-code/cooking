'use client';

import Link from 'next/link';
import { isRecipeUnlocked, recipeMissingSkills } from '@/lib/derive';
import { useStore } from './Store';

/**
 * The progress-dependent parts of a recipe page. The page itself stays a server
 * component so the MDX body is rendered at build time; these islands read the
 * browser's stored progress.
 */

function useRecipe(id: string) {
  const { catalog: c, progress, journal } = useStore();
  const recipe = c.recipes.find((r) => r.id === id);
  return {
    c,
    progress,
    journal,
    recipe,
    unlocked: recipe ? isRecipeUnlocked(recipe, progress) : false,
    missing: recipe ? recipeMissingSkills(recipe, progress) : [],
  };
}

export function RecipeStatusBadge({ id }: { id: string }) {
  const { unlocked } = useRecipe(id);
  return (
    <span className={`badge ${unlocked ? 'practiced' : 'locked'}`}>
      {unlocked ? 'Unlocked' : 'Locked'}
    </span>
  );
}

export function RecipeLockNotice({ id }: { id: string }) {
  const { c, unlocked, missing } = useRecipe(id);
  if (unlocked) return null;
  return (
    <div className="issues" style={{ marginTop: 18 }}>
      <strong>Locked.</strong> Study these first:{' '}
      {missing.map((s, i) => (
        <span key={s}>
          {i > 0 && ', '}
          <Link href={`/lesson/${s}/`}>{c.skills.get(s)?.title ?? s}</Link>
        </span>
      ))}
      . You can read it anyway — the lock is a suggested order, not a wall.
    </div>
  );
}

export function RecipeSkills({ id }: { id: string }) {
  const { c, recipe, missing } = useRecipe(id);
  if (!recipe) return null;
  const title = (s: string) => c.skills.get(s)?.title ?? s;

  return (
    <div className="card">
      <div className="eyebrow">Required — these gate the unlock</div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {recipe.required.map((s) => (
          <Link
            key={s}
            href={`/lesson/${s}/`}
            className={`badge ${missing.includes(s) ? 'locked' : 'practiced'}`}
          >
            {title(s)}
          </Link>
        ))}
      </div>
      {recipe.reinforced.length > 0 && (
        <>
          <div className="eyebrow">Also exercises</div>
          <div className="chips">
            {recipe.reinforced.map((s) => (
              <Link key={s} href={`/lesson/${s}/`} className="badge tier">
                {title(s)}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RecipeLogButton({ id }: { id: string }) {
  const { recipe, unlocked } = useRecipe(id);
  if (!recipe?.primary_practice_for || !unlocked) return null;
  return (
    <p style={{ marginTop: 20 }}>
      <Link
        className="btn primary"
        href={`/journal/new/?skill=${recipe.primary_practice_for}&recipe=${id}`}
      >
        Cooked it — log this
      </Link>
    </p>
  );
}

export function RecipeCooks({ id }: { id: string }) {
  const { journal } = useRecipe(id);
  const cooks = journal.filter((e) => e.recipe === id);
  if (cooks.length === 0) return null;

  return (
    <>
      <h2>Times you have made this</h2>
      <div className="grid">
        {cooks.map((e) => (
          <div className="card" key={e.id}>
            <div className="meta" style={{ marginBottom: 8 }}>
              <span className="badge practiced">{e.date}</span>
              {e.rating && <span className="badge tier">{e.rating}/5</span>}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{e.body}</div>
          </div>
        ))}
      </div>
    </>
  );
}
