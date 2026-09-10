import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getRecipe, getSkill, loadRecipes } from '@/lib/content';
import {
  RecipeCooks,
  RecipeLockNotice,
  RecipeLogButton,
  RecipeSkills,
  RecipeStatusBadge,
} from '@/components/RecipeProgress';

const mdxComponents = {
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};

const DIFFICULTY = { 1: 'Easy', 2: 'Moderate', 3: 'Involved' } as const;

export function generateStaticParams() {
  return loadRecipes().map((r) => ({ id: r.id }));
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = getRecipe(id);
  if (!r) notFound();

  return (
    <>
      <div className="crumb">
        <Link href="/recipes">Recipes</Link>
      </div>

      <div
        className="meta"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}
      >
        <RecipeStatusBadge id={id} />
        {r.difficulty && (
          <span className="badge tier">
            {DIFFICULTY[r.difficulty as 1 | 2 | 3] ?? r.difficulty}
          </span>
        )}
        {r.active_minutes && (
          <span className="badge tier">{r.active_minutes} min active</span>
        )}
        {r.yield && <span className="badge tier">{r.yield}</span>}
        {!r.origin?.tested && <span className="badge draft">Untested</span>}
      </div>

      <h1>{r.title}</h1>
      <p className="lede">{r.gist}</p>

      {!r.origin?.tested && (
        <div className="issues" style={{ marginTop: 18 }}>
          <strong>Untested.</strong> This recipe was written from technique
          rather than cooked and iterated on. Treat quantities and times as
          starting points, and flip <code>origin.tested</code> in{' '}
          <code>{r.filePath}</code> once you have made it.
        </div>
      )}

      <RecipeLockNotice id={id} />

      <h2>Ingredients</h2>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {r.ingredients.map((ing, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <strong>{ing.amount}</strong> {ing.item}
              {ing.role && (
                <span className="badge tier" style={{ marginLeft: 8 }}>
                  {ing.role}
                </span>
              )}
              {ing.note && (
                <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  {ing.note}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <h2>Method</h2>
      <ol className="method">
        {r.steps.map((s, i) => (
          <li key={i}>
            <MDXRemote
              source={s.text}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
            {s.skill && (
              <Link href={`/lesson/${s.skill}/`} className="badge available">
                {getSkill(s.skill)?.title ?? s.skill}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {r.body.trim() && (
        <>
          <hr className="rule" />
          <article className="prose">
            <MDXRemote
              source={r.body}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>
        </>
      )}

      <hr className="rule" />

      <h2>Skills this uses</h2>
      <RecipeSkills id={id} />
      <RecipeLogButton id={id} />
      <RecipeCooks id={id} />

      {r.origin?.notes && (
        <>
          <h2>Notes on this recipe</h2>
          <p className="lede" style={{ fontSize: 15 }}>{r.origin.notes}</p>
        </>
      )}

      <p className="mono" style={{ marginTop: 28 }}>{r.filePath}</p>
    </>
  );
}
