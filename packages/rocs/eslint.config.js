// eslint.config.js — Configuration ESLint ROCS prête à l'emploi
// Active les règles du plugin ROCS sur les fichiers JSX/TSX, et rien d'autre :
// aucune règle cœur d'ESLint, aucun ignore, aucun autre type de fichier.
//
// Usage (flat config, ESLint ≥ 9) :
//   import rocs from '@rocss/rocs/eslint';
//   export default [...rocs, /* configuration du projet */];
//
// TypeScript (.tsx) nécessite en plus un parseur adapté (typescript-eslint).
// Pour choisir les fichiers ou la sévérité, utiliser '@rocss/rocs/eslint-plugin'.
//
// Référence : docs/fr/SPECIFICATION.md §3 (Nommage), §3.5 (États)

import rocsPlugin from './eslint-plugin.js';

export default [
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      rocs: rocsPlugin,
    },
    rules: {
      'rocs/class-naming': 'error',
      'rocs/no-state-classes': 'error',
    },
  },
];
