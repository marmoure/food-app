import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { Recovery } from './app/Recovery';
import { StoreContext } from './storage/context';
import { browserAdapter, CubeStore } from './storage/store';
import './styles/global.css';
import './styles/phone.css';
import { applyTheme, readTheme } from './theme';

applyTheme(readTheme());
const store = new CubeStore(browserAdapter());
const root = createRoot(document.getElementById('root')!);
void store
  .load()
  .then(() => {
    root.render(
      <StrictMode>
        <StoreContext.Provider value={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StoreContext.Provider>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    root.render(
      <Recovery
        store={store}
        message={error instanceof Error ? error.message : 'Unable to load saved data.'}
      />,
    );
  });
