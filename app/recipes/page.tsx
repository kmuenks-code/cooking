'use client';

import Link from 'next/link';
import { isRecipeUnlocked, recipeMissingSkills } from '@/lib/derive';
import { useStore } from '@/components/Store';
import type { RecipeSummary } from '@/lib/types';

export default function RecipesPage() {
  const { catalog: c, progress } = useStore();
  const unlocked = c.recipes.filter((r) => isRecipeUnlocked(r, progress));
  const locked = c.recipes.filter((r) => !isRecipeUnlocked(r, progress));

  return (
    <>
      <div className="eyebrow">Recipes</div>
      <h1>What you can cook</h1>
      <p className="lede">
        A recipe unlocks when every skill it requires has been studied. These are
        written for this curriculum rather than collected — each one exists to
        make a specific technique unavoidable.
      </p>

      <h2>
        Unlocked <span className="mono">({unlocked.length})</span>
      </h2>
      {unlocked.length === 0 ? (
        <div className="empty">
          Nothing unlocked yet. Study the sub-modules a recipe needs and it will
          appear here. <Link href="/">Start with what is available.</Link>
        </div>
      ) : (
        <div className="grid">
          {unlocked.map((r) => (
            <RecipeCard key={r.id} recipe={r} unlocked />
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <>
          <h2>
            Still locked <span className="mono">({locked.length})</span>
          </h2>
          <p className="lede" style={{ fontSize: 15 }}>
            Shown so you can see what you are working toward. Missing skills are
            marked.
          </p>
          <div className="grid">
            {locked.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                unlocked={false}
                missing={recipeMissingSkills(r, progress)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

const DIFFICULTY = { 1: 'Easy', 2: 'Moderate', 3: 'Involved' } as const;

function RecipeCard({
  recipe: r,
  unlocked,
  missing = [],
}: {
  recipe: RecipeSummary;
  unlocked: boolean;
  missing?: string[];
}) {
  const { catalog: c } = useStore();
  const title = (id: string) => c.skills.get(id)?.title ?? id;

  return (
    <div className="card" id={r.id} style={{ opacity: unlocked ? 1 : 0.72 }}>
      <div
        className="meta"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}
      >
        <span className={`badge ${unlocked ? 'practiced' : 'locked'}`}>
          {unlocked ? 'Unlocked' : `${missing.length} skill(s) to go`}
        </span>
        {r.difficulty && (
          <span className="badge tier">
            {DIFFICULTY[r.difficulty as 1 | 2 | 3] ?? r.difficulty}
          </span>
        )}
        {r.active_minutes && (
          <span className="badge tier">{r.active_minutes} min active</span>
        )}
        {!r.tested && <span className="badge draft">Untested</span>}
      </div>

      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 17 }}>
        {unlocked ? <Link href={`/recipes/${r.id}/`}>{r.title}</Link> : r.title}
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>{r.gist}</div>

      {r.primary_practice_for && (
        <div style={{ marginTop: 10 }}>
          <div className="eyebrow">Best practice vehicle for</div>
          <Link
            href={`/lesson/${r.primary_practice_for}/`}
            className="badge available"
          >
            {title(r.primary_practice_for)}
          </Link>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div className="eyebrow">Requires</div>
        <div className="chips">
          {r.required.map((s) => {
            const done = !missing.includes(s);
            return (
              <Link
                key={s}
                href={`/lesson/${s}/`}
                className={`badge ${done ? 'practiced' : 'locked'}`}
              >
                {done ? '' : '· '}
                {title(s)}
              </Link>
            );
          })}
        </div>
      </div>

      {unlocked && (
        <div className="chips" style={{ marginTop: 14 }}>
          <Link className="btn" href={`/recipes/${r.id}/`}>
            Open recipe
          </Link>
          {r.primary_practice_for && (
            <Link
              className="btn primary"
              href={`/journal/new/?skill=${r.primary_practice_for}&recipe=${r.id}`}
            >
              Cooked it — log this
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
