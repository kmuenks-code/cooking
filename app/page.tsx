'use client';

import Link from 'next/link';
import {
  availableNow,
  awaitingPractice,
  blockedBy,
  counts,
  statusMap,
  unlockedRecipes,
} from '@/lib/derive';
import { useStore } from '@/components/Store';
import SkillCard from '@/components/SkillCard';

export default function Home() {
  const { catalog: c, progress, journal } = useStore();
  const status = statusMap(c, progress);
  const n = counts(c, progress);
  const available = availableNow(c, progress);
  const awaiting = awaitingPractice(c, progress);
  const recipes = unlockedRecipes(c, progress);

  const pctPracticed = (n.practiced / n.total) * 100;
  const pctStudied = ((n.studied - n.practiced) / n.total) * 100;

  return (
    <>
      <div className="eyebrow">Today</div>
      <h1>Where you are</h1>
      <p className="lede">
        Study a sub-module to unlock the recipes that use it. Cook one and write
        it up to graduate, which opens what comes next.
      </p>

      {c.errorCount > 0 && (
        <div className="issues" style={{ marginTop: 20 }}>
          <strong>{c.errorCount} content validation error(s).</strong> Run{' '}
          <code>npm run validate</code> for detail.
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <div className="n">{n.practiced}</div>
          <div className="l">Practiced</div>
        </div>
        <div className="stat">
          <div className="n">{n.studied}</div>
          <div className="l">Studied</div>
        </div>
        <div className="stat">
          <div className="n">{n.available}</div>
          <div className="l">Available now</div>
        </div>
        <div className="stat">
          <div className="n">{n.total}</div>
          <div className="l">Sub-modules</div>
        </div>
        <div className="stat">
          <div className="n">{recipes.length}</div>
          <div className="l">Recipes unlocked</div>
        </div>
      </div>

      <div className="bar" style={{ maxWidth: 520 }}>
        <div className="practiced" style={{ width: `${pctPracticed}%` }} />
        <div className="studied" style={{ width: `${Math.max(0, pctStudied)}%` }} />
      </div>

      {awaiting.length > 0 && (
        <>
          <h2>Cook something to graduate these</h2>
          <p className="lede" style={{ fontSize: 15 }}>
            Studied but not yet practiced. Each needs one cook and one journal
            entry.
          </p>
          <div className="grid">
            {awaiting.map(({ skill, recipes: rs }) => (
              <div className="card" key={skill.id}>
                <div className="meta">
                  <span className="badge studied">Studied</span>
                  <span className="badge module">{skill.moduleTitle}</span>
                </div>
                <div className="title" style={{ fontWeight: 600 }}>
                  {skill.title}
                </div>
                <div className="why" style={{ marginBottom: 10 }}>
                  {skill.practice}
                </div>
                <div className="chips">
                  <Link
                    className="btn primary"
                    href={`/journal/new/?skill=${skill.id}`}
                  >
                    Log a cook
                  </Link>
                  {rs.slice(0, 2).map((r) => (
                    <Link className="btn" key={r.id} href={`/recipes/${r.id}/`}>
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Available to study now</h2>
      {available.length === 0 ? (
        <div className="empty">
          Nothing available. Practice something you have studied to open the next
          layer.
        </div>
      ) : (
        <>
          <p className="lede" style={{ fontSize: 15 }}>
            {available.length} sub-modules are open across{' '}
            {new Set(available.map((s) => s.moduleId)).size} modules. Order is a
            suggestion, not a requirement.
          </p>
          <div className="grid two">
            {available.map((s) => (
              <SkillCard
                key={s.id}
                skill={s}
                status={status.get(s.id)!}
                hasLesson={c.lessonIds.has(s.id)}
                blockedBy={blockedBy(s, progress)}
              />
            ))}
          </div>
        </>
      )}

      {journal.length > 0 && (
        <>
          <h2>Recent cooks</h2>
          <div className="grid">
            {journal.slice(0, 4).map((e) => (
              <div className="card" key={e.id}>
                <div className="meta">
                  <span className="badge practiced">{e.date}</span>
                  <span className="badge module">
                    {c.skills.get(e.skill)?.title ?? e.skill}
                  </span>
                  {e.rating && <span className="badge tier">{e.rating}/5</span>}
                </div>
                <div className="why">
                  {e.body.slice(0, 220)}
                  {e.body.length > 220 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>
            <Link href="/journal">All journal entries →</Link>
          </p>
        </>
      )}
    </>
  );
}
