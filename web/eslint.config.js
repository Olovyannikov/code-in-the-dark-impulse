import js from '@eslint/js';
import effector from 'eslint-plugin-effector';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        // Правилам eslint-plugin-effector нужен доступ к типам.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      effector,
      'react-hooks': reactHooks,
    },
    rules: {
      ...effector.configs.recommended.rules,
      ...effector.configs.react.rules,
      ...effector.configs.scope.rules,
      ...effector.configs.patronum.rules,
    },
  },
);
