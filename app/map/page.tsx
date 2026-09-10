'use client';

import { blockedBy, counts, statusMap } from '@/lib/derive';
import { useStore } from '@/components/Store';
import SkillCard from '@/components/SkillCard';

const TIERS = [1, 2, 3] as const;
const TIER_NAME = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
} as const;

export default function MapPage() {
  const { catalog: c, progress } = useStore();
  const status = statusMap(c, progress);
  const n = counts(c, progress);

  return (
    <>
      <div className="eyebrow">Map</div>
      <h1>The whole curriculum</h1>
      <p className="lede">
        {c.modules.length} modules, {n.total} sub-modules. Paths advance in
        parallel — prerequisites cross between modules, so progress in one opens
        things in another.
      </p>

      {c.modules.map((m) => {
        const byTier = TIERS.map((t) => ({
          tier: t,
          skills: m.submodules.filter((s) => s.tier === t),
        })).filter((g) => g.skills.length > 0);

        const done = m.submodules.filter(
          (s) => status.get(s.id) === 'practiced',
        ).length;

        return (
          <section key={m.id} id={m.id}>
            <h2 style={{ marginBottom: 4 }}>
              {m.order}. {m.title}{' '}
              <span className="mono" style={{ fontWeight: 400 }}>
                {done}/{m.submodules.length}
              </span>
            </h2>
            <p className="lede" style={{ fontSize: 15, marginBottom: 16 }}>
              {m.question}
            </p>

            {byTier.map((g) => (
              <div key={g.tier} style={{ marginBottom: 18 }}>
                <div className="eyebrow">{TIER_NAME[g.tier]}</div>
                <div className="grid two">
                  {g.skills.map((s) => (
                    <SkillCard
                      key={s.id}
                      skill={s}
                      status={status.get(s.id)!}
                      hasLesson={c.lessonIds.has(s.id)}
                      blockedBy={
                        status.get(s.id) === 'locked'
                          ? blockedBy(s, progress)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
