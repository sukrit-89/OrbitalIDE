import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Keep global test state isolated between test cases.
afterEach(() => {
  vi.clearAllMocks();
});
