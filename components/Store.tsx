'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { catalog, progressFrom, type Catalog } from '@/lib/derive';
import type { AppData, JournalEntry, Progress, SavedState } from '@/lib/types';

/**
 * The whole app state, client-side.
 *
 * There is no server — the site is a static export on GitHub Pages — so what
 * used to be content/progress.json and content/journal/*.md now lives in this
 * browser's localStorage. That means progress is per-device; the Journal page
 * offers export/import so it can be moved or backed up.
 */

const KEY = 'cooking-curriculum/v1';

const EMPTY: SavedState = { version: 1, studied: [], journal: [] };

function read(): SavedState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return normalize(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

/** Tolerates hand-edited or older files rather than throwing away the data. */
export function normalize(input: unknown): SavedState {
  const o = (input ?? {}) as Partial<SavedState>;
  const journal = Array.isArray(o.journal) ? o.journal : [];
  return {
    version: 1,
    studied: Array.isArray(o.studied)
      ? Array.from(new Set(o.studied.filter((s) => typeof s === 'string')))
      : [],
    journal: journal
      .filter((e): e is JournalEntry => Boolean(e && typeof e.skill === 'string'))
      .map((e) => ({
        id: e.id || newId(),
        date: e.date || new Date().toISOString().slice(0, 10),
        skill: e.skill,
        recipe: e.recipe || undefined,
        rating: typeof e.rating === 'number' ? e.rating : undefined,
        body: String(e.body ?? ''),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface StoreValue {
  catalog: Catalog;
  progress: Progress;
  journal: JournalEntry[];
  /** False until localStorage has been read, so the first paint matches the prerender. */
  ready: boolean;
  setStudied: (skillId: string, studied: boolean) => void;
  addEntry: (e: Omit<JournalEntry, 'id' | 'date'>) => void;
  deleteEntry: (id: string) => void;
  replaceAll: (state: SavedState) => void;
  exportState: () => SavedState;
}

const Ctx = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <Store>');
  return v;
}

export default function Store({
  data,
  children,
}: {
  data: AppData;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<SavedState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  // Keep two tabs (or a second copy of the page) in agreement.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: SavedState) => {
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Private mode, quota, storage disabled — the session still works, it
      // just will not survive a reload. Not worth interrupting a cook over.
    }
  }, []);

  const value = useMemo<StoreValue>(() => {
    const c = catalog(data);
    return {
      catalog: c,
      progress: progressFrom(state.studied, state.journal),
      journal: state.journal,
      ready,
      setStudied(skillId, studied) {
        const set = new Set(state.studied);
        if (studied) set.add(skillId);
        else set.delete(skillId);
        persist({ ...state, studied: Array.from(set).sort() });
      },
      addEntry(e) {
        const entry: JournalEntry = {
          ...e,
          id: newId(),
          date: new Date().toISOString().slice(0, 10),
        };
        // Marking studied is implied by having cooked it.
        const studied = Array.from(new Set([...state.studied, e.skill])).sort();
        persist({ ...state, studied, journal: [entry, ...state.journal] });
      },
      deleteEntry(id) {
        persist({ ...state, journal: state.journal.filter((e) => e.id !== id) });
      },
      replaceAll(next) {
        persist(normalize(next));
      },
      exportState: () => state,
    };
  }, [data, state, ready, persist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
