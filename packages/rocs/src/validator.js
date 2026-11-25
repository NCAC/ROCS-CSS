/**
 * Validateur autonome de conformité ROCS v1.0
 *
 * Analyse les fichiers HTML, Twig, SCSS et CSS d'un répertoire et produit un
 * rapport de conformité basé sur la spécification normative ROCS.
 * L'analyse reste heuristique : dans les templates Twig, seules les classes
 * statiques sont vérifiées, les valeurs dynamiques ne sont pas devinées.
 *
 * Usage :
 *   rocs --dir ./src
 *   rocs --dir ./examples --format github
 *   rocs --dir ./src --format json --output rocs-report.json
 *   rocs --dir ./src --strict   (exit 1 sur les warnings aussi)
 *
 * Règles implémentées (références à SPECIFICATION_FR.md) :
 *   R01 §3.2  — Bloc : PascalCase, max 4 segments
 *   R02 §3.2  — Élément : Bloc-camelCase, max 3 segments
 *   R03 §3.1  — Max 1 classe ROCS par élément HTML
 *   R04 §3.5  — Classes d'état interdites (is-*, has-*, --modifier)
 *   R05 §4.3  — data-* variant statique (heuristique)
 *   R06 §5    — id interdit dans les sélecteurs CSS
 *   R07 §6.2.1 — Sélecteurs descendants ROCS interdits
 *   R08 §6.2.2 — :where() obligatoire pour sélecteurs combinés autorisés
 *   R09 §3.2  — Blocs génériques de design system interdits
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'node:path';
import { parseArgs } from 'util';

// ─── Configuration ────────────────────────────────────────────────────────────

const ROCS_BLOC_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;
const ROCS_ELEMENT_PATTERN = /^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$/;
const ROCS_CLASS_PATTERN = /^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$/;

// Blocs génériques de design system — interdits comme Blocs ROCS applicatifs (§3.2)
const GENERIC_DS_BLOCS = new Set([
  'Button', 'Btn', 'Modal', 'Dialog', 'Card', 'Input', 'Select', 'Textarea',
  'Checkbox', 'Radio', 'Toggle', 'Switch', 'Badge', 'Tag', 'Label', 'Alert',
  'Toast', 'Tooltip', 'Popover', 'Dropdown', 'Menu', 'Tabs', 'Tab',
  'Accordion', 'Collapse', 'Spinner', 'Loader', 'Skeleton', 'Avatar',
  'Icon', 'Image', 'List', 'Table', 'Form', 'Header', 'Footer', 'Sidebar',
  'Nav', 'Breadcrumb', 'Pagination', 'Slider', 'Carousel', 'Grid', 'Page',
]);

// Patterns de classes d'état interdites (§3.5)
const STATE_CLASS_PATTERNS = [
  /^is-/,
  /^has-/,
  /^no-/,
  /--is-/,
  /--has-/,
  /--active$/,
  /--disabled$/,
  /--hidden$/,
  /--open$/,
  /--closed$/,
  /--loading$/,
  /--error$/,
  /--success$/,
  /--selected$/,
  /--checked$/,
  /--expanded$/,
  /--collapsed$/,
  /--visible$/,
  /--invalid$/,
  /--valid$/,
  /--focused$/,
  /--current$/,
  /--.+$/,  // tout modifier BEM --
];

// data-* de variant statique (heuristiques — à affiner selon le projet)
const STATIC_VARIANT_DATA_ATTRS = [
  /^data-type=/,
  /^data-variant=/,
  /^data-size=/,
  /^data-color=/,
  /^data-theme=/, // autorisé seulement si modifiable côté client
  /^data-level=/,
  /^data-role=/,
  /^data-kind=/,
  /^data-category=/,
];

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {'error' | 'warning' | 'info'} Severity
 * @typedef {{ rule: string, severity: Severity, message: string, line: number, col?: number, context?: string }} Issue
 * @typedef {{ file: string, issues: Issue[] }} FileReport
 */

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function countPascalCaseSegments(name) {
  const matches = name.match(/[A-Z][a-z0-9]*/g);
  return matches ? matches.length : 0;
}

function countCamelCaseSegments(str) {
  const matches = str.match(/[a-z][a-z0-9]*|[A-Z][a-z0-9]*/g);
  return matches ? matches.length : 0;
}

/**
 * Vérifie une classe ROCS et retourne les problèmes détectés.
 * @param {string} cls
 * @returns {Array<{rule: string, severity: Severity, message: string}>}
 */
export function validateRocsClass(cls) {
  const issues = [];

  // R04 — Classes d'état
  if (STATE_CLASS_PATTERNS.some(p => p.test(cls))) {
    issues.push({
      rule: 'R04',
      severity: 'error',
      message: `Classe d'état interdite "${cls}" (§3.5). Utilisez data-state="..." ou attributs ARIA.`,
    });
    return issues; // pas besoin de continuer
  }

  // Non-ROCS manifeste (minuscule, kebab, etc.) — skip silencieusement
  // (frameworks, classes tiers, etc.)
  if (!ROCS_CLASS_PATTERN.test(cls)) {
    // Heuristique : si ça commence par une majuscule mais ne matche pas → erreur
    if (/^[A-Z]/.test(cls)) {
      issues.push({
        rule: 'R01',
        severity: 'error',
        message: `"${cls}" ne respecte pas le pattern ROCS (§3.2). Pattern Bloc: PascalCase. Pattern Élément: Bloc-camelCase (max 3 segments).`,
      });
    }
    return issues;
  }

  // R09 — Blocs génériques de design system
  if (ROCS_BLOC_PATTERN.test(cls) && GENERIC_DS_BLOCS.has(cls)) {
    issues.push({
      rule: 'R09',
      severity: 'warning',
      message: `"${cls}" est un nom de composant design system générique (§3.2). Utilisez un Bloc applicatif (ex: LoginForm-submitButton plutôt que Button).`,
    });
  }

  // R01 — Profondeur du Bloc (max 4 segments)
  if (ROCS_BLOC_PATTERN.test(cls)) {
    const depth = countPascalCaseSegments(cls);
    if (depth > 4) {
      issues.push({
        rule: 'R01',
        severity: 'error',
        message: `Bloc "${cls}" dépasse 4 segments PascalCase (${depth} détectés) (§3.2). Simplifiez le nom.`,
      });
    }
  }

  // R02 — Profondeur de l'Élément (max 3 segments camelCase)
  if (ROCS_ELEMENT_PATTERN.test(cls)) {
    const elementPart = cls.split('-').slice(1).join('-');
    const depth = countCamelCaseSegments(elementPart);
    if (depth > 3) {
      issues.push({
        rule: 'R02',
        severity: 'error',
        message: `Élément "${cls}" — partie camelCase dépasse 3 segments (${depth} détectés) (§3.4). Envisagez une promotion en Bloc.`,
      });
    }
    if (depth === 3) {
      issues.push({
        rule: 'R02',
        severity: 'warning',
        message: `Élément "${cls}" atteint la profondeur maximale (3 segments) (§3.4). Vérifiez que la promotion en Bloc n'est pas plus appropriée.`,
      });
    }
  }

  return issues;
}

// ─── Analyse HTML ─────────────────────────────────────────────────────────────

/**
 * Extrait les attributs class d'un HTML et les valide.
 * @param {string} content
 * @param {string} filePath
 * @returns {Issue[]}
 */
export function analyzeHtml(content, filePath) {
  const issues = [];
  const lines = content.split('\n');

  // Regex pour extraire les attributs class (HTML)
  const classAttrRegex = /\bclass="([^"]*)"/g;

  lines.forEach((line, lineIndex) => {
    let match;
    const lineRegex = /\bclass="([^"]*)"/g;

    while ((match = lineRegex.exec(line)) !== null) {
      const classValue = match[1].trim();
      if (!classValue) continue;

      const classes = classValue.split(/\s+/).filter(Boolean);
      const rocsClasses = [];

      for (const cls of classes) {
        if (!cls) continue;

        const classIssues = validateRocsClass(cls);
        for (const issue of classIssues) {
          issues.push({ ...issue, line: lineIndex + 1, context: line.trim() });
        }

        // Collecter les classes ROCS valides pour la règle R03
        if (ROCS_CLASS_PATTERN.test(cls) && !STATE_CLASS_PATTERNS.some(p => p.test(cls))) {
          rocsClasses.push(cls);
        }
      }

      // R03 — Max 1 classe ROCS par élément
      if (rocsClasses.length > 1) {
        issues.push({
          rule: 'R03',
          severity: 'error',
          message: `${rocsClasses.length} classes ROCS sur un même élément (§3.1) : [${rocsClasses.join(', ')}]. Maximum autorisé : 1.`,
          line: lineIndex + 1,
          context: line.trim(),
        });
      }
    }

    // R05 — data-* de variant statique (heuristique)
    const dataAttrRegex = /\bdata-[a-zA-Z-]+="[^"]*"/g;
    let dataMatch;
    while ((dataMatch = dataAttrRegex.exec(line)) !== null) {
      const attr = dataMatch[0];
      if (STATIC_VARIANT_DATA_ATTRS.some(p => p.test(attr))) {
        issues.push({
          rule: 'R05',
          severity: 'warning',
          message: `Attribut "${attr}" (§4.3) — heuristique : peut-être un variant sémantique statique. Vérifiez si une classe ROCS distincte serait plus appropriée.`,
          line: lineIndex + 1,
          context: line.trim(),
        });
      }
    }
  });

  return issues;
}

// ─── Analyse Twig ─────────────────────────────────────────────────────────────

// Marqueurs de masquage : un caractère par caractère source, pour conserver
// les positions (lignes et colonnes) du template d'origine.
const TWIG_EXPR_MASK = '\u0001';
const TWIG_TAG_MASK = '\u0002';

/**
 * Masque la syntaxe Twig sans décaler les positions : les commentaires {# #}
 * deviennent des espaces, les expressions {{ }} et les balises {% %} des
 * marqueurs. Les retours à la ligne sont conservés.
 * @param {string} content
 * @returns {{ masked: string, tags: Map<number, { end: number, keyword: string }> }}
 */
function maskTwig(content) {
  const tags = new Map();
  let masked = '';
  let i = 0;
  while (i < content.length) {
    const open = content.slice(i, i + 2);
    const close = { '{#': '#}', '{{': '}}', '{%': '%}' }[open];
    if (!close) {
      masked += content[i++];
      continue;
    }
    const closeAt = content.indexOf(close, i + 2);
    const end = closeAt === -1 ? content.length : closeAt + 2;
    const source = content.slice(i, end);
    const fill = open === '{#' ? ' ' : open === '{{' ? TWIG_EXPR_MASK : TWIG_TAG_MASK;
    masked += source.replace(/[^\n]/g, fill);
    if (open === '{%') {
      const keyword = (source.slice(2).replace(/^[-~]?\s*/, '').match(/^[a-z]+/) || [''])[0];
      tags.set(i, { end, keyword });
    }
    i = end;
  }
  return { masked, tags };
}

/**
 * Découpe la valeur masquée d'un attribut class en un arbre : classes statiques
 * et groupes conditionnels ({% if %} … {% elseif %} … {% else %} … {% endif %}).
 * Une classe collée à une expression ({{ }}) est dynamique et ignorée.
 * @returns {Array<{ cls: string, offset: number } | { branches: any[][] }>}
 */
function parseTwigClassValue(masked, start, end, tags) {
  const root = [];
  const stack = [{ items: root }];
  let token = '';
  let tokenStart = -1;
  let dynamic = false;
  const current = () => stack[stack.length - 1].items;
  const flush = () => {
    if (token && !dynamic) current().push({ cls: token, offset: tokenStart });
    token = '';
    tokenStart = -1;
    dynamic = false;
  };

  for (let i = start; i < end;) {
    const ch = masked[i];
    if (ch === TWIG_TAG_MASK) {
      flush();
      const tag = tags.get(i);
      if (!tag) { i++; continue; }
      if (tag.keyword === 'if') {
        const group = { branches: [[]] };
        current().push(group);
        stack.push({ group, items: group.branches[0] });
      } else if ((tag.keyword === 'elseif' || tag.keyword === 'else') && stack.length > 1 && stack[stack.length - 1].group) {
        const frame = stack[stack.length - 1];
        frame.items = [];
        frame.group.branches.push(frame.items);
      } else if (tag.keyword === 'endif' && stack.length > 1) {
        stack.pop();
      }
      i = tag.end;
      continue;
    }
    if (ch === TWIG_EXPR_MASK) {
      dynamic = true;
      if (tokenStart === -1) tokenStart = i;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      flush();
      i++;
      continue;
    }
    if (tokenStart === -1) tokenStart = i;
    token += ch;
    i++;
  }
  flush();
  return root;
}

/** Aplatit l'arbre en liste de classes statiques, toutes branches comprises. */
function flattenTwigClasses(items) {
  return items.flatMap(item => ('cls' in item ? [item] : item.branches.flatMap(flattenTwigClasses)));
}

/**
 * Nombre maximal de classes ROCS portées à la fois par l'élément : les classes
 * inconditionnelles plus, pour chaque condition, la branche la plus chargée.
 * Les branches d'une même condition sont exclusives (R03 par chemin de rendu).
 */
function maxRocsClasses(items, isRocs) {
  let count = 0;
  for (const item of items) {
    if ('cls' in item) count += isRocs(item.cls) ? 1 : 0;
    else count += Math.max(0, ...item.branches.map(branch => maxRocsClasses(branch, isRocs)));
  }
  return count;
}

/**
 * Analyse un template Twig (.twig, .html.twig) avec les règles HTML.
 * Les commentaires Twig sont ignorés ; les classes statiques sont vérifiées,
 * y compris dans les blocs conditionnels et les attributs mixtes
 * (class="ServiceCard {{ extra_classes }}"). Les valeurs dynamiques ne sont
 * pas devinées : seule la partie statique du template est contrôlée.
 * @param {string} content
 * @param {string} filePath
 * @returns {Issue[]}
 */
export function analyzeTwig(content, filePath) {
  const issues = [];
  const { masked, tags } = maskTwig(content);
  const sourceLines = content.split('\n');
  const lineStarts = [0];
  for (let i = 0; i < content.length; i++) if (content[i] === '\n') lineStarts.push(i + 1);
  const lineOf = offset => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
  const at = (offset, issue) => {
    const line = lineOf(offset);
    issues.push({ ...issue, line, context: sourceLines[line - 1].trim() });
  };
  const isRocs = cls => ROCS_CLASS_PATTERN.test(cls) && !STATE_CLASS_PATTERNS.some(p => p.test(cls));

  const classAttrRegex = /\bclass="([^"]*)"/g;
  let match;
  while ((match = classAttrRegex.exec(masked)) !== null) {
    const valueStart = match.index + match[0].indexOf('"') + 1;
    const tree = parseTwigClassValue(masked, valueStart, valueStart + match[1].length, tags);

    for (const { cls, offset } of flattenTwigClasses(tree)) {
      for (const issue of validateRocsClass(cls)) at(offset, issue);
    }

    // R03 — Max 1 classe ROCS par élément, sur chaque chemin de rendu
    const count = maxRocsClasses(tree, isRocs);
    if (count > 1) {
      const rocsClasses = [...new Set(flattenTwigClasses(tree).map(item => item.cls).filter(isRocs))];
      at(match.index, {
        rule: 'R03',
        severity: 'error',
        message: `${count} classes ROCS sur un même élément (§3.1) : [${rocsClasses.join(', ')}]. Maximum autorisé : 1.`,
      });
    }
  }

  // R05 — data-* de variant statique (heuristique), hors syntaxe Twig
  const dataAttrRegex = /\bdata-[a-zA-Z-]+="[^"]*"/g;
  let dataMatch;
  while ((dataMatch = dataAttrRegex.exec(masked)) !== null) {
    const name = dataMatch[0].slice(0, dataMatch[0].indexOf('=') + 1);
    if (STATIC_VARIANT_DATA_ATTRS.some(p => p.test(name))) {
      const attr = content.slice(dataMatch.index, dataMatch.index + dataMatch[0].length);
      at(dataMatch.index, {
        rule: 'R05',
        severity: 'warning',
        message: `Attribut "${attr}" (§4.3) — heuristique : peut-être un variant sémantique statique. Vérifiez si une classe ROCS distincte serait plus appropriée.`,
      });
    }
  }

  issues.sort((a, b) => a.line - b.line);
  return issues;
}

// ─── Analyse SCSS/CSS ─────────────────────────────────────────────────────────

/**
 * Analyse un fichier SCSS ou CSS et valide les sélecteurs.
 * @param {string} content
 * @param {string} filePath
 * @returns {Issue[]}
 */
export function analyzeScss(content, filePath) {
  const issues = [];
  const lines = content.split('\n');

  // Regex pour extraire les sélecteurs
  const selectorLineRegex = /^(\s*)([^{}@/\n][^{}@\n]*)\s*\{/;

  lines.forEach((line, lineIndex) => {
    const match = selectorLineRegex.exec(line);
    if (!match) return;

    const selector = match[2].trim();

    // R06 — id interdit en CSS
    if (/#[a-zA-Z]/.test(selector)) {
      issues.push({
        rule: 'R06',
        severity: 'error',
        message: `Sélecteur id "${selector}" interdit en CSS ROCS (§5). Utilisez une classe ROCS.`,
        line: lineIndex + 1,
        context: line.trim(),
      });
    }

    // R07 — Sélecteurs descendants ROCS interdits (sauf exceptions §6.2.2)
    // Détecter .RocsClass .RocsClass ou .RocsClass > .RocsClass
    const descendantRocsRegex = /\.[A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)?\s+\.([A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)?)/;
    const childRocsRegex = /\.[A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)?\s*>\s*\.([A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)?)/;

    if (descendantRocsRegex.test(selector) || childRocsRegex.test(selector)) {
      // Vérifier si c'est une exception autorisée (:where() présent)
      if (!/:where\(/.test(selector)) {
        issues.push({
          rule: 'R07',
          severity: 'error',
          message: `Sélecteur combiné ROCS interdit "${selector}" (§6.2.1). Les classes ROCS doivent être auto-suffisantes. Exception : utilisez :where() pour les métadonnées contextuelles.`,
          line: lineIndex + 1,
          context: line.trim(),
        });
      }
    }

    // R08 — :where() manquant pour les sélecteurs [data-*] combinés
    // Pattern : .RocsClass[data-x] .RocsClass (sans :where())
    const dataDescendantRegex = /\.[A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)?\[data-[^\]]+\]\s+\./;
    const bodyDataDescendantRegex = /(?:body|html|:root)\[data-[^\]]+\]\s+\./;

    if (
      (dataDescendantRegex.test(selector) || bodyDataDescendantRegex.test(selector)) &&
      !/:where\(/.test(selector)
    ) {
      issues.push({
        rule: 'R08',
        severity: 'error',
        message: `Sélecteur combiné avec data-* sans :where() "${selector}" (§6.2.2). Le sélecteur descendant doit utiliser :where() pour préserver la spécificité.`,
        line: lineIndex + 1,
        context: line.trim(),
      });
    }

    // Vérifier les noms de classes dans les sélecteurs SCSS
    const classesInSelector = selector.match(/\.[A-Z][a-zA-Z0-9]*(?:-[a-z][a-zA-Z0-9]*)*/g) || [];
    for (const clsWithDot of classesInSelector) {
      const cls = clsWithDot.slice(1); // supprimer le point
      const classIssues = validateRocsClass(cls);
      for (const issue of classIssues) {
        // Ne pas remonter les warnings DS en CSS (on est dans un sélecteur, pas dans le HTML)
        if (issue.rule !== 'R09') {
          issues.push({ ...issue, line: lineIndex + 1, context: line.trim() });
        }
      }
    }
  });

  return issues;
}

// ─── Collecte des fichiers ────────────────────────────────────────────────────

function collectFiles(dir, extensions) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry)) {
        files.push(...collectFiles(fullPath, extensions));
      }
    } else if (extensions.includes(extname(entry).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

// ─── Formatage du rapport ─────────────────────────────────────────────────────

function formatText(reports, stats) {
  const lines = [];
  lines.push('');
  lines.push('══════════════════════════════════════════════════════');
  lines.push('  ROCS Validation Report — v1.0');
  lines.push('══════════════════════════════════════════════════════');
  lines.push('');

  let hasIssues = false;

  for (const report of reports) {
    if (report.issues.length === 0) continue;
    hasIssues = true;

    lines.push(`📄 ${report.file}`);
    lines.push('─'.repeat(60));

    for (const issue of report.issues) {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`  ${icon} [${issue.rule}] L${issue.line} — ${issue.message}`);
      if (issue.context) {
        lines.push(`     → ${issue.context.slice(0, 80)}${issue.context.length > 80 ? '…' : ''}`);
      }
    }
    lines.push('');
  }

  if (!hasIssues) {
    lines.push('✅ Aucune violation détectée.');
    lines.push('');
  }

  lines.push('──────────────────────────────────────────────────────');
  lines.push(`  Fichiers analysés : ${stats.files}`);
  lines.push(`  Erreurs           : ${stats.errors}`);
  lines.push(`  Avertissements    : ${stats.warnings}`);
  lines.push(`  Statut            : ${stats.errors > 0 ? '❌ ÉCHEC' : stats.warnings > 0 ? '⚠️  AVERTISSEMENTS' : '✅ OK'}`);
  lines.push('══════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

function formatGithub(reports, stats) {
  const lines = [];

  for (const report of reports) {
    for (const issue of report.issues) {
      const type = issue.severity === 'error' ? 'error' : 'warning';
      lines.push(`::${type} file=${report.file},line=${issue.line}::ROCS [${issue.rule}] ${issue.message}`);
    }
  }

  if (stats.errors > 0) {
    lines.push(`::error::ROCS Validation : ${stats.errors} erreur(s), ${stats.warnings} avertissement(s).`);
  } else if (stats.warnings > 0) {
    lines.push(`::warning::ROCS Validation : ${stats.warnings} avertissement(s).`);
  }

  return lines.join('\n');
}

function formatJson(reports, stats) {
  return JSON.stringify({ stats, reports }, null, 2);
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export function runCli(args = process.argv.slice(2)) {
  const { values: options } = parseArgs({
    args,
    options: {
      dir: { type: 'string', default: '.' },
      format: { type: 'string', default: 'text' }, // text | github | json
      output: { type: 'string' },
      strict: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (options.help) {
    console.log(`
ROCS Validator — v1.0
Valide la conformité ROCS des fichiers HTML, Twig (.twig, .html.twig), SCSS et CSS.
Dans les templates Twig, seules les classes statiques sont vérifiées.

Usage:
  rocs [options]
  node tools/rocs-validate.js [options]

Options:
  --dir <path>        Répertoire à analyser (défaut: .)
  --format <format>   Format de sortie : text (défaut), github, json
  --output <file>     Fichier de sortie (défaut: stdout)
  --strict            Exit 1 sur les warnings également
  --help              Afficher cette aide

Règles implémentées:
  R01 §3.2  Bloc PascalCase, max 4 segments
  R02 §3.2  Élément Bloc-camelCase, max 3 segments
  R03 §3.1  Max 1 classe ROCS par élément HTML (Twig : par chemin de rendu)
  R04 §3.5  Classes d'état interdites
  R05 §4.3  data-* variant statique (heuristique)
  R06 §5    id interdit dans les sélecteurs CSS
  R07 §6.2.1 Sélecteurs descendants ROCS interdits
  R08 §6.2.2 :where() obligatoire pour combinés autorisés
  R09 §3.2  Blocs génériques design system
    `);
    process.exit(0);
  }

  const targetDir = options.dir;
  const htmlFiles = collectFiles(targetDir, ['.html', '.htm']);
  // Templates Twig : extname('x.html.twig') vaut '.twig', ce qui couvre les deux formes.
  const twigFiles = collectFiles(targetDir, ['.twig']);
  // Les sources SCSS et les fichiers CSS sont analysés, y compris les CSS générés.
  const scssFiles = collectFiles(targetDir, ['.scss', '.css']);

  /** @type {FileReport[]} */
  const reports = [];
  const stats = { files: 0, errors: 0, warnings: 0 };

  // Analyser les fichiers HTML
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const issues = analyzeHtml(content, file);
    const relPath = relative(process.cwd(), file);
    reports.push({ file: relPath, issues });
    stats.files++;
    stats.errors += issues.filter(i => i.severity === 'error').length;
    stats.warnings += issues.filter(i => i.severity === 'warning').length;
  }

  // Analyser les templates Twig
  for (const file of twigFiles) {
    const content = readFileSync(file, 'utf-8');
    const issues = analyzeTwig(content, file);
    const relPath = relative(process.cwd(), file);
    reports.push({ file: relPath, issues });
    stats.files++;
    stats.errors += issues.filter(i => i.severity === 'error').length;
    stats.warnings += issues.filter(i => i.severity === 'warning').length;
  }

  // Analyser les fichiers SCSS/CSS
  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const issues = analyzeScss(content, file);
    const relPath = relative(process.cwd(), file);
    reports.push({ file: relPath, issues });
    stats.files++;
    stats.errors += issues.filter(i => i.severity === 'error').length;
    stats.warnings += issues.filter(i => i.severity === 'warning').length;
  }

  // Formater la sortie
  let output;
  switch (options.format) {
    case 'github':
      output = formatGithub(reports, stats);
      break;
    case 'json':
      output = formatJson(reports, stats);
      break;
    default:
      output = formatText(reports, stats);
  }

  // Écrire la sortie
  if (options.output) {
    writeFileSync(options.output, output, 'utf-8');
    console.log(`Rapport écrit dans : ${options.output}`);
  } else {
    process.stdout.write(output);
  }

  // Exit code
  const shouldFail = stats.errors > 0 || (options.strict && stats.warnings > 0);
  process.exit(shouldFail ? 1 : 0);
}