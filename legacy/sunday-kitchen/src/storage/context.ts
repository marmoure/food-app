import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AppStore, StoreSnapshot } from './store';

export const StoreContext = createContext<AppStore | null>(null);

export function useStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreContext.Provider>');
  return store;
}

export function useStoreSnapshot(): StoreSnapshot {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useAppData() {
  return useStoreSnapshot().data;
}
