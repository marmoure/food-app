import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../app/App';
import { TodayContext } from '../hooks/useToday';
import { memoryAdapter } from '../storage/adapters';
import { StoreContext } from '../storage/context';
import { AppStore } from '../storage/store';

interface Options {
  /** Pinned "today". */
  date: Date;
  route?: string;
  store?: AppStore;
}

export function renderApp({ date, route = '/', store }: Options) {
  let n = 0;
  const appStore = store ?? new AppStore(memoryAdapter(), () => `id-${++n}`);
  const utils = render(
    <StoreContext.Provider value={appStore}>
      <TodayContext.Provider value={date}>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </TodayContext.Provider>
    </StoreContext.Provider>,
  );
  return { ...utils, store: appStore };
}
