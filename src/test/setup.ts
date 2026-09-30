import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined') window.scrollTo = () => {};

afterEach(() => {
  if (typeof window === 'undefined') return;
  cleanup();
  localStorage.clear();
});
