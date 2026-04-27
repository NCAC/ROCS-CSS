// eslint.config.js — Configuration ESLint pour la conformité ROCS
// Valide les classes HTML/JSX selon la spécification ROCS v1.0
//
// Usage :
//   npm install --save-dev eslint eslint-plugin-react
//   # Pour HTML :
//   npm install --save-dev eslint-plugin-html
//
// Référence : SPECIFICATION_FR.md §3 (Nommage)

import js from '@eslint/js';

// ─── Patterns ROCS ───────────────────────────────────────────────────────────
const ROCS_BLOC_PATTERN =
  /^[A-Z][a-zA-Z0-9]*$/;

const ROCS_ELEMENT_PATTERN =
  /^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$/;

const ROCS_CLASS_PATTERN =
  /^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$/;

// Classes non-ROCS autorisées (framework / outils tiers)
// Ajoutez vos préfixes de classes framework ici
const NON_ROCS_ALLOWED_PREFIXES = [
  'js-',        // hooks JavaScript purs
  'v-',         // Vue.js directives (v-cloak, etc.)
  'ng-',        // Angular
  'swiper-',    // Swiper.js
  'slick-',     // Slick slider
  'fancybox-',  // Fancybox
];

/**
 * Vérifie si une classe est une classe ROCS valide
 * @param {string} cls
 * @returns {{ valid: boolean, reason?: string }}
 */
function checkRocsClass(cls) {
  if (!cls || cls.trim() === '') return { valid: true };

  // Classes autorisées non-ROCS (framework/outil)
  if (NON_ROCS_ALLOWED_PREFIXES.some(prefix => cls.startsWith(prefix))) {
    return { valid: true };
  }

  if (!ROCS_CLASS_PATTERN.test(cls)) {
    if (/^[a-z]/.test(cls)) {
      return {
        valid: false,
        reason: `"${cls}" commence par une minuscule. Les Blocs ROCS sont en PascalCase. Les Éléments suivent le format "Bloc-element".`,
      };
    }
    if (cls.includes('_')) {
      return {
        valid: false,
        reason: `"${cls}" contient un underscore. ROCS interdit snake_case (§3.2).`,
      };
    }
    if (/--/.test(cls)) {
      return {
        valid: false,
        reason: `"${cls}" ressemble à un modifier BEM (--). ROCS n'utilise pas de modifiers dans les classes (§3.5). Utilisez data-* ou attributs ARIA.`,
      };
    }
    if (/^(is-|has-|no-)/.test(cls)) {
      return {
        valid: false,
        reason: `"${cls}" est une classe d'état. ROCS interdit les classes d'état (§3.5). Utilisez data-state="..." ou attributs ARIA.`,
      };
    }
    return {
      valid: false,
      reason: `"${cls}" ne respecte pas la convention ROCS. Pattern Bloc: PascalCase. Pattern Élément: Bloc-camelCase.`,
    };
  }

  // Vérification profondeur Bloc (max 4 segments)
  if (ROCS_BLOC_PATTERN.test(cls)) {
    const segments = cls.match(/[A-Z][a-z0-9]*/g) || [];
    if (segments.length > 4) {
      return {
        valid: false,
        reason: `"${cls}" dépasse 4 segments PascalCase (ROCS §3.2). Trouvé: ${segments.length} segments.`,
      };
    }
  }

  // Vérification profondeur Élément (max 3 segments camelCase)
  if (ROCS_ELEMENT_PATTERN.test(cls)) {
    const elementPart = cls.split('-')[1];
    const segments = elementPart.match(/[a-z][a-z0-9]*|[A-Z][a-z0-9]*/g) || [];
    if (segments.length > 3) {
      return {
        valid: false,
        reason: `"${cls}" — la partie Élément dépasse 3 segments camelCase (ROCS §3.4). Trouvé: ${segments.length} segments. Envisagez une promotion en Bloc.`,
      };
    }
  }

  return { valid: true };
}

// ─── Plugin ROCS personnalisé ─────────────────────────────────────────────────
const rocsPlugin = {
  meta: {
    name: 'eslint-plugin-rocs',
    version: '1.0.0',
  },
  rules: {
    /**
     * Valide les attributs `class` dans les templates HTML (JSX: className)
     * ROCS §3.1, §3.2
     */
    'class-naming': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Valide les classes ROCS dans JSX (className)',
          url: 'https://github.com/NCAC/ROCS-CSS/blob/main/SPECIFICATION_FR.md#3-nommage-normatif',
        },
        schema: [
          {
            type: 'object',
            properties: {
              allowedNonRocs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Préfixes de classes non-ROCS autorisées',
              },
            },
          },
        ],
        messages: {
          invalidClass: 'Classe ROCS non conforme : {{reason}}',
          multipleRocsClasses: 'ROCS §3.1 — Un élément ne doit porter qu\'au maximum 1 classe ROCS. Trouvé {{count}} classes ROCS : {{classes}}',
        },
      },
      create(context) {
        function validateClassValue(node, classValue) {
          if (!classValue || typeof classValue !== 'string') return;

          const classes = classValue.split(/\s+/).filter(Boolean);
          const rocsClasses = [];

          for (const cls of classes) {
            const result = checkRocsClass(cls);
            if (!result.valid) {
              context.report({
                node,
                messageId: 'invalidClass',
                data: { reason: result.reason },
              });
            } else if (ROCS_CLASS_PATTERN.test(cls)) {
              rocsClasses.push(cls);
            }
          }

          // Règle §3.1 : max 1 classe ROCS par élément
          if (rocsClasses.length > 1) {
            context.report({
              node,
              messageId: 'multipleRocsClasses',
              data: {
                count: rocsClasses.length,
                classes: rocsClasses.join(', '),
              },
            });
          }
        }

        return {
          // JSX : className="..."
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            if (!node.value) return;

            if (node.value.type === 'Literal') {
              validateClassValue(node, node.value.value);
            }
          },
          // HTML dans les templates (attribut class)
          'Property[key.name="class"]'(node) {
            if (node.value.type === 'Literal') {
              validateClassValue(node, node.value.value);
            }
          },
        };
      },
    },

    /**
     * Interdit les classes d'état (is-*, has-*, --modifier)
     * ROCS §3.5
     */
    'no-state-classes': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Interdit les classes d\'état BEM/is-* dans le HTML/JSX (ROCS §3.5)',
        },
        messages: {
          stateClass: 'ROCS §3.5 — Classe d\'état interdite : "{{cls}}". Utilisez data-state="..." ou des attributs ARIA (aria-expanded, disabled, etc.).',
        },
      },
      create(context) {
        const statePatterns = [
          /^is-/,
          /^has-/,
          /^no-/,
          /--is-/,
          /--has-/,
          /--active$/,
          /--disabled$/,
          /--hidden$/,
          /--open$/,
          /--loading$/,
        ];

        function checkClasses(node, classValue) {
          if (!classValue) return;
          const classes = classValue.split(/\s+/).filter(Boolean);
          for (const cls of classes) {
            if (statePatterns.some(p => p.test(cls))) {
              context.report({
                node,
                messageId: 'stateClass',
                data: { cls },
              });
            }
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            if (node.value?.type === 'Literal') {
              checkClasses(node, node.value.value);
            }
          },
        };
      },
    },
  },
};

// ─── Configuration ESLint ─────────────────────────────────────────────────────
export default [
  js.configs.recommended,
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      rocs: rocsPlugin,
    },
    rules: {
      'rocs/class-naming': 'error',
      'rocs/no-state-classes': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.mjs'],
    ignores: ['eslint.config.js', 'tools/**'],
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
    ],
  },
];
