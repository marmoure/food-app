import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined') window.scrollTo = () => {};
if (typeof HTMLElement !== 'undefined') HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => {
  if (typeof window === 'undefined') return;
  cleanup();
  localStorage.clear();
});
