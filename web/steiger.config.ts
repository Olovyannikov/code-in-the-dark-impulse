import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // `providers` — конвенциональный сегмент слоя app в документации FSD,
    // а не безымянная свалка, на которую рассчитано правило.
    files: ['./src/app/**'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
