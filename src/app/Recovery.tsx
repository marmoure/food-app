import { useState } from 'react';
import { parseData } from '../storage/schema';
import type { CubeStore } from '../storage/store';
import type { CubeData } from '../domain/types';

export function Recovery({ store, message }: { store: CubeStore; message: string }) {
  const [pending, setPending] = useState<CubeData | null>(null);
  const [error, setError] = useState('');
  return (
    <main className="load-error">
      <h1>Let’s recover your kitchen</h1>
      <p>{message}</p>
      <p>Your original Sunday Kitchen files have not been changed.</p>
      <label>
        Choose a Cube Kitchen backup
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (event) => {
            setError('');
            setPending(null);
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const data = parseData(JSON.parse(await file.text()));
              if (!data) throw new Error('This backup is not valid. Nothing has changed.');
              setPending(data);
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Unable to read backup.');
            }
          }}
        />
      </label>
      {pending && (
        <>
          <p>
            Restore {pending.batches.length} batches and {pending.meals.length} meals? This replaces
            the unreadable cube data.
          </p>
          <button
            className="button primary"
            onClick={async () => {
              store.update(() => pending);
              await store.flush();
              if (store.getSnapshot().error) setError(store.getSnapshot().error);
              else window.location.reload();
            }}
          >
            Restore this backup
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <p>
        <button className="button secondary" onClick={() => window.location.reload()}>
          Try loading again
        </button>
      </p>
    </main>
  );
}
