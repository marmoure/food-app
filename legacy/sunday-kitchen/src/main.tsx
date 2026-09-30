import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { syncedAdapter } from './storage/adapters';
import { StoreContext } from './storage/context';
import { dataReport } from './storage/report';
import { AppStore } from './storage/store';
import './styles/tokens.css';
import './styles/global.css';

const store = new AppStore(syncedAdapter({ report: (data) => dataReport(data, new Date()) }));

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
