import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Server tests run in Node (`@vitest-environment node`), where there's no window.
const browser = typeof window !== 'undefined';

// jsdom doesn't implement scrolling; Layout scrolls to top on navigation.
if (browser) window.scrollTo = () => {};

afterEach(() => {
  if (!browser) return;
  cleanup();
  window.localStorage.clear();
});
