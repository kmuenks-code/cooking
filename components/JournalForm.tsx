'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './Store';

export default function JournalForm({
  skills,
  recipes,
  defaultSkill,
  defaultRecipe,
}: {
  skills: Array<{ id: string; label: string }>;
  recipes: Array<{ id: string; title: string }>;
  defaultSkill?: string;
  defaultRecipe?: string;
}) {
  const router = useRouter();
  const { addEntry } = useStore();
  const [skill, setSkill] = useState(defaultSkill ?? skills[0]?.id ?? '');
  const [recipe, setRecipe] = useState(defaultRecipe ?? '');
  const [rating, setRating] = useState('3');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!skill || !body.trim()) {
      setError('Pick a sub-module and write something.');
      return;
    }
    addEntry({
      skill,
      recipe: recipe || undefined,
      rating: Number(rating),
      body: body.trim(),
    });
    router.push('/journal');
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 720 }}>
      <div className="field">
        <label htmlFor="skill">Sub-module this graduates</label>
        <select
          id="skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="recipe">Recipe (optional)</label>
        <select
          id="recipe"
          value={recipe}
          onChange={(e) => setRecipe(e.target.value)}
        >
          <option value="">— none / my own —</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="rating">How did it go?</label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          <option value="1">1 — went badly, learned why</option>
          <option value="2">2 — rough</option>
          <option value="3">3 — fine</option>
          <option value="4">4 — good</option>
          <option value="5">5 — nailed it</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="body">What happened</label>
        <textarea
          id="body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            'What you cooked, what you noticed, what surprised you, what you would change.\n\nThe lesson listed criteria to cover — answer those.'
          }
        />
        <div className="hint">Saved in this browser. Export from the Journal page to back it up.</div>
      </div>

      {error && (
        <div className="issues" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button className="primary" type="submit">
        Save entry and graduate
      </button>
    </form>
  );
}
