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
  {
    // Правило советует удалять слайсы, на которые пока никто не ссылается.
    // При пошаговой сборке по плану сущности появляются раньше фич,
    // которые их используют, и совет каждый раз ложный.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
]);
