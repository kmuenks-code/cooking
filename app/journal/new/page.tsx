'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/components/Store';
import JournalForm from '@/components/JournalForm';

export default function NewJournalPage() {
  return (
    // Query params are only known in the browser on a static export, so the
    // reader has to sit behind a boundary.
    <Suspense fallback={<Shell />}>
      <NewJournal />
    </Suspense>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <div className="eyebrow">Journal</div>
      <h1>Log a cook</h1>
      <p className="lede">
        Writing this graduates the sub-module. Be honest about what went wrong —
        that is the part worth rereading later.
      </p>
      {children}
    </>
  );
}

function NewJournal() {
  const params = useSearchParams();
  const skillParam = params.get('skill') ?? undefined;
  const recipeParam = params.get('recipe') ?? undefined;
  const { catalog: c, progress } = useStore();

  // Offer studied-but-unpracticed skills first — that is what a journal entry
  // is normally for — then everything else.
  const all = Array.from(c.skills.values());
  const priority = all.filter(
    (s) => progress.studied.includes(s.id) && !progress.practiced.includes(s.id),
  );
  const rest = all.filter((s) => !priority.includes(s));

  const selected = skillParam ? c.skills.get(skillParam) : undefined;

  return (
    <Shell>
      {selected && (
        <div className="card" style={{ margin: '20px 0' }}>
          <div className="eyebrow">The practice prompt for {selected.title}</div>
          <div>{selected.practice}</div>
        </div>
      )}

      <JournalForm
        skills={[
          ...priority.map((s) => ({
            id: s.id,
            label: `${s.title} — ${s.moduleTitle} (studied, awaiting practice)`,
          })),
          ...rest.map((s) => ({
            id: s.id,
            label: `${s.title} — ${s.moduleTitle}`,
          })),
        ]}
        recipes={c.recipes.map((r) => ({ id: r.id, title: r.title }))}
        defaultSkill={skillParam}
        defaultRecipe={recipeParam}
      />
    </Shell>
  );
}
