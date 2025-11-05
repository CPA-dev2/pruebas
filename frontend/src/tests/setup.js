import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extiende expect de vitest con los matchers de jest-dom
expect.extend(matchers);

// Ejecuta la limpieza de JSDOM después de cada test
// para evitar fugas de memoria y estado entre tests.
afterEach(() => {
  cleanup();
});
