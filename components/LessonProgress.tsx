'use client';

import Link from 'next/link';
import { blockedBy, isRecipeUnlocked, skillStatus } from '@/lib/derive';
import { StatusBadge } from './SkillCard';
import { useStore } from './Store';

/**
 * The progress-dependent islands on a lesson page. The lesson body itself is
 * server-rendered MDX baked into the export.
 */

export function LessonStatusBadge({ id }: { id: string }) {
  const { catalog: c, progress } = useStore();
  const skill = c.skills.get(id);
  if (!skill) return null;
  return <StatusBadge status={skillStatus(skill, progress)} />;
}

export function LessonLockNotice({ id }: { id: string }) {
  const { catalog: c, progress } = useStore();
  const skill = c.skills.get(id);
  if (!skill || skillStatus(skill, progress) !== 'locked') return null;
  const blocked = blockedBy(skill, progress);

  return (
    <div className="issues" style={{ marginTop: 20 }}>
      <strong>Locked.</strong> This opens once you have practiced:{' '}
      {blocked.map((b, i) => (
        <span key={b}>
          {i > 0 && ', '}
          {c.lessonIds.has(b) ? (
            <Link href={`/lesson/${b}/`}>{c.skills.get(b)?.title ?? b}</Link>
          ) : (
            (c.skills.get(b)?.title ?? b)
          )}
        </span>
      ))}
      . You can read it anyway — the lock is a suggested order, not a wall.
    </div>
  );
}

export function PracticeRecipes({ id }: { id: string }) {
  const { catalog: c, progress } = useStore();
  const recipes = c.recipes.filter(
    (r) => r.required.includes(id) || r.reinforced.includes(id),
  );
  if (recipes.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="eyebrow">Recipes that exercise this</div>
      <div className="chips" style={{ marginTop: 6 }}>
        {recipes.map((r) => (
          <Link
            key={r.id}
            className="btn"
            href={`/recipes/${r.id}/`}
            style={{ opacity: isRecipeUnlocked(r, progress) ? 1 : 0.55 }}
          >
            {r.title}
            {r.primary_practice_for === id ? ' ★' : ''}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StudyToggle({ id }: { id: string }) {
  const { progress, setStudied } = useStore();
  const studied = progress.studied.includes(id);
  const practiced = progress.practiced.includes(id);

  if (practiced) {
    return (
      <div
        className="card"
        style={{ background: 'var(--ok-soft)', borderColor: 'var(--ok)' }}
      >
        <strong>Practiced.</strong> You have studied this and logged a cook
        against it. It is unlocking whatever comes next.
      </div>
    );
  }

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setStudied(id, !studied)}
          className={studied ? '' : 'primary'}
        >
          {studied ? 'Mark as not studied' : 'Mark as studied'}
        </button>
        <span className="hint" style={{ margin: 0 }}>
          {studied
            ? 'Studied. Now cook something that uses it and log the cook to graduate.'
            : 'Self-attested. Marking this studied unlocks any recipe that needs it.'}
        </span>
      </div>
    </div>
  );
}

export function LessonCooks({ id }: { id: string }) {
  const { journal } = useStore();
  const entries = journal.filter((e) => e.skill === id);
  if (entries.length === 0) return null;

  return (
    <>
      <h2>Your cooks for this skill</h2>
      <div className="grid">
        {entries.map((e) => (
          <div className="card" key={e.id}>
            <div className="meta">
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
