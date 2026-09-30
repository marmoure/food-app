import { createContext, useContext, useSyncExternalStore } from 'react';
import type { CubeStore } from './store';

export const StoreContext = createContext<CubeStore | null>(null);
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Missing CubeStore');
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot), update: store.update };
}
