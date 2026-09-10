'use client';

import Link from 'next/link';
import { useStore } from '@/components/Store';
import JournalTransfer from '@/components/JournalTransfer';

export default function JournalPage() {
  const { catalog: c, journal, ready, deleteEntry } = useStore();

  return (
    <>
      <div className="eyebrow">Journal</div>
      <h1>Cook log</h1>
      <p className="lede">
        Every entry graduates a sub-module. Entries are stored on this device, in
        this browser — use Export below to back them up or move them to another
        phone.
      </p>

      <p style={{ margin: '20px 0' }}>
        <Link className="btn primary" href="/journal/new">
          New entry
        </Link>
      </p>

      {ready && journal.length === 0 && (
        <div className="empty">
          No entries yet. Study something, cook it, then write up what happened.
        </div>
      )}

      <div className="grid">
        {journal.map((e) => (
          <div className="card" key={e.id}>
            <div
              className="meta"
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              <span className="badge practiced">{e.date}</span>
              <Link href={`/lesson/${e.skill}/`} className="badge module">
                {c.skills.get(e.skill)?.title ?? e.skill}
              </Link>
              {e.rating && <span className="badge tier">{e.rating}/5</span>}
              {e.recipe && (
                <Link href={`/recipes/${e.recipe}/`} className="badge tier">
                  {c.recipes.find((r) => r.id === e.recipe)?.title ?? e.recipe}
                </Link>
              )}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{e.body}</div>
            <div style={{ marginTop: 12 }}>
              <button
                className="quiet"
                onClick={() => {
                  if (
                    window.confirm(
                      'Delete this entry? If it is the only cook logged for that sub-module, the sub-module drops back to studied.',
                    )
                  ) {
                    deleteEntry(e.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <hr className="rule" />
      <JournalTransfer />
    </>
  );
}
