import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Проектные GitHub Pages живут в подпути /<repo>/
  base: process.env.GITHUB_PAGES === 'true' ? '/code-in-the-dark-impulse/' : '/',
  plugins: [
    react(),
    // @vitejs/plugin-react 6 перешёл на oxc и больше не принимает babel-опции,
    // поэтому effector/babel-plugin подключается отдельным проходом.
    babel({
      // include по умолчанию — /\.jsx?$/, без этого .ts проходят мимо babel.
      // Только .ts: юниты Effector по правилам проекта живут в моделях,
      // а не в .tsx, и гонять babel по всему UI незачем.
      include: /\.ts$/,
      babelConfig: {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript'] },
        plugins: ['effector/babel-plugin'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
