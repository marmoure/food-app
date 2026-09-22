import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { localStorageAdapter } from './storage/adapters';
import { StoreContext } from './storage/context';
import { AppStore } from './storage/store';
import './styles/tokens.css';
import './styles/global.css';

const store = new AppStore(localStorageAdapter());

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// Render after loading so the first paint shows saved ticks, not an empty state.
void store.load().finally(() => {
  createRoot(root).render(
    <StrictMode>
      <StoreContext.Provider value={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StoreContext.Provider>
    </StrictMode>,
  );
});
