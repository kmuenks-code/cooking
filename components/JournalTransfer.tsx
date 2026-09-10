'use client';

import { useRef, useState } from 'react';
import { useStore } from './Store';

/**
 * Progress lives in one browser's localStorage, so it needs a way out.
 * Export writes a JSON file; import replaces the local state with one.
 * Copy-to-clipboard is there because downloading a file on a phone is fiddly.
 */
export default function JournalTransfer() {
  const { exportState, replaceAll, journal, progress } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  function payload() {
    return JSON.stringify(exportState(), null, 2);
  }

  function download() {
    const blob = new Blob([payload()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cooking-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload());
      setNote('Copied to the clipboard.');
    } catch {
      setNote('Could not reach the clipboard — use Download instead.');
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (
        !window.confirm(
          'Replace the progress and journal stored in this browser with the contents of this file?',
        )
      )
        return;
      replaceAll(parsed);
      setNote('Imported.');
    } catch {
      setNote('That file is not valid JSON.');
    }
  }

  return (
    <section>
      <h2>Back up and move</h2>
      <p className="lede" style={{ fontSize: 15 }}>
        {journal.length} entr{journal.length === 1 ? 'y' : 'ies'} and{' '}
        {progress.studied.length} studied sub-module
        {progress.studied.length === 1 ? '' : 's'} are saved in this browser.
        Clearing site data erases them.
      </p>

      <div className="chips" style={{ marginTop: 14 }}>
        <button onClick={download}>Download JSON</button>
        <button onClick={copy}>Copy JSON</button>
        <button onClick={() => fileInput.current?.click()}>Import a file</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
      </div>

      {note && <p className="hint">{note}</p>}
    </section>
  );
}
