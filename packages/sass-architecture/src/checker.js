import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import selectorParser from 'postcss-selector-parser';
import { scan } from './scan.js';

export const LAYERS = ['tokens', 'primitives', 'behaviors', 'combinators', 'components', 'globals', 'bootstrap'];
export const FAMILIES = ['context', 'scope', 'state', 'part'];

// Spécification §2 : couches que chaque couche PEUT consommer (hors elle-même).
const ALLOWED = {
  tokens: [],
  primitives: ['tokens'],
  behaviors: ['tokens', 'primitives'],
  combinators: ['tokens', 'primitives'],
  components: ['tokens', 'primitives', 'behaviors', 'combinators'],
  globals: ['tokens', 'primitives'],
  bootstrap: ['tokens', 'primitives', 'combinators'],
};

const CONDITIONAL_AT_RULES = ['media', 'supports', 'container'];
const EMITTING_AT_RULES = [...CONDITIONAL_AT_RULES, 'keyframes', 'font-face', 'property', 'include'];
const GLOBAL_AT_RULES = ['keyframes', 'font-face', 'property'];
const BASES = ['', 'src', 'scss', 'styles', 'src/scss', 'src/styles'];

/**
 * @typedef {Object} Violation
 * @property {string} rule      Invariant de la spécification (I1, I8…)
 * @property {'error'|'warning'} severity
 * @property {string} file      Chemin relatif au répertoire analysé
 * @property {number} line
 * @property {string} layer
 * @property {string} message
 */

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function listScss(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listScss(path));
    else if (entry.name.endsWith('.scss')) files.push(path);
  }
  return files.sort();
}

/** Détecte un dossier par couche (convention) ; `overrides` associe une couche à un chemin. */
export function discoverLayers(root, overrides = {}) {
  const dirs = {};
  for (const layer of LAYERS) {
    if (overrides[layer]) {
      dirs[layer] = resolve(root, overrides[layer]);
      continue;
    }
    for (const base of BASES) {
      const candidate = resolve(root, base, layer);
      if (isDirectory(candidate)) {
        dirs[layer] = candidate;
        break;
      }
    }
  }
  return dirs;
}

const normalize = name => name.replaceAll('_', '-');
const inside = (dir, path) => path === dir || path.startsWith(dir + sep);

function layerOfPath(layerDirs, path) {
  let best = null;
  for (const [layer, dir] of Object.entries(layerDirs)) {
    if (inside(dir, path) && (!best || dir.length > layerDirs[best].length)) best = layer;
  }
  return best;
}

/** Fichiers SCSS de chaque couche ; une couche imbriquée dans une autre lui est retirée. */
export function sourceFiles(layerDirs) {
  return Object.entries(layerDirs).flatMap(([layer, dir]) => listScss(dir)
    .filter(file => layerOfPath(layerDirs, file) === layer).map(file => ({ file, layer })));
}

const inNthArgument = node => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'pseudo' && /^:nth-/.test(parent.value)) return true;
  }
  return false;
};

/** Problèmes I19 d'un sélecteur ; les interpolations sont neutralisées, une syntaxe inconnue est ignorée. */
function selectorProblems(selector, layer, family) {
  const problems = new Set();
  try {
    selectorParser(root => {
      root.walk(node => {
        if (node.type === 'class' || node.type === 'id') {
          problems.add('Sélecteur sémantique (classe ou id) interdit');
        } else if (node.type === 'combinator' && layer !== 'bootstrap' && !inNthArgument(node)) {
          const descendant = !node.value.trim();
          if (!descendant || family !== 'scope') problems.add('Combinateur CSS interdit hors forme canonique scope');
        }
      });
    }).processSync(selector.replace(/#\{[^}]*\}/g, '__interpolation__'));
  } catch {
    // Pas un sélecteur (ex. étape de @keyframes) : rien à contrôler.
  }
  return problems;
}

/**
 * Vérifie l'architecture en couches (invariants I1, I2, I3, I7–I11, I13, I16, I19, I22, I23).
 * L'analyse est statique et heuristique : elle ne prouve pas la conformité complète.
 * @param {string} root
 * @param {{ layers?: Record<string,string> }} [options]
 * @returns {{ layers: Record<string,string>, files: number, violations: Violation[] }}
 */
export function checkArchitecture(root, options = {}) {
  root = resolve(root);
  const layerDirs = discoverLayers(root, options.layers);
  const violations = [];
  const cache = new Map();

  const layerOf = path => layerOfPath(layerDirs, path);
  const familyOf = path => {
    const dir = layerDirs.combinators;
    if (!dir || !inside(dir, path)) return null;
    const first = relative(dir, path).split(sep)[0];
    return FAMILIES.includes(first) ? first : null;
  };

  const load = file => {
    if (!cache.has(file)) {
      let nodes = [];
      let error = null;
      try {
        nodes = scan(readFileSync(file, 'utf8'));
      } catch (e) {
        error = { line: e.line ?? 1, message: e.reason ?? e.message };
      }
      const imports = [];
      for (const node of nodes) {
        if (node.atRule !== 'use' && node.atRule !== 'forward') continue;
        const spec = /^@(?:use|forward)\s+(["'])(.+?)\1/.exec(node.raw)?.[2];
        if (spec) imports.push({ spec, line: node.line });
      }
      cache.set(file, { nodes, imports, error });
    }
    return cache.get(file);
  };

  const resolveFile = abs => {
    const name = basename(abs);
    const candidates = [`${abs}.scss`, join(dirname(abs), `_${name}.scss`), join(abs, '_index.scss'),
      join(abs, 'index.scss'), abs];
    return candidates.find(path => path.endsWith('.scss') && existsSync(path) && !isDirectory(path)) ?? null;
  };

  /** @returns {{ layer: string, family: string|null, file: string|null, external?: boolean }|null} */
  const resolveImport = (spec, from) => {
    if (spec.startsWith('sass:')) return null;
    const pkg = /^(?:pkg:)?@rocss\/sass(?:\/([\w-]+))?$/.exec(spec);
    if (pkg) return { layer: 'combinators', family: pkg[1] ?? '*', file: null, external: true };
    const bare = !spec.startsWith('.') && !spec.startsWith('/');
    // Sass résout d'abord relativement au fichier courant, puis via les loadPaths.
    const candidates = bare
      ? [dirname(from), root, ...Object.values(layerDirs).map(dirname)].map(base => resolve(base, spec))
      : [resolve(dirname(from), spec)];
    // Un import qui ne désigne aucun fichier existant est ignoré : le compilateur le signalera.
    const found = candidates.find(abs => resolveFile(abs) && layerOf(resolveFile(abs)));
    if (!found) return null;
    const file = resolveFile(found);
    const path = file;
    return { layer: layerOf(path), family: familyOf(path), file };
  };

  /** Familles de combinators atteintes depuis un fichier, dépendances transitives comprises. */
  const reachableFamilies = (file, seen = new Set()) => {
    const families = new Set();
    if (!file || seen.has(file)) return families;
    seen.add(file);
    if (familyOf(file)) families.add(familyOf(file));
    for (const { spec } of load(file).imports) {
      const target = resolveImport(spec, file);
      if (target?.layer !== 'combinators') continue;
      if (target.family) families.add(target.family);
      for (const family of reachableFamilies(target.file, seen)) families.add(family);
    }
    return families;
  };

  // Première passe : noms de mixins par couche (I10, I16).
  const files = sourceFiles(layerDirs);
  const mixinLayers = new Map();
  for (const { file, layer } of files) {
    for (const node of load(file).nodes) {
      const name = node.atRule === 'mixin' && /^@mixin\s+([\w-]+)/.exec(node.text)?.[1];
      if (!name) continue;
      const key = normalize(name);
      mixinLayers.set(key, new Set([...(mixinLayers.get(key) ?? []), layer]));
    }
  }

  for (const { file, layer } of files) {
    const rel = relative(root, file);
    const { nodes, imports, error } = load(file);
    const report = (rule, line, message, severity = 'error') =>
      violations.push({ rule, severity, file: rel, line, layer, message });

    if (error) report('SYNTAX', error.line, `Syntaxe SCSS invalide : ${error.message}`);

    for (const { spec, line } of imports) {
      const target = resolveImport(spec, file);
      if (!target) continue;
      const to = target.layer;
      if (to === layer) {
        if (layer === 'tokens' && basename(file) !== '_index.scss' && target.file !== file) {
          report('I7', line, `Les modules de tokens ne doivent pas dépendre les uns des autres ("${spec}").`);
        }
        if (layer === 'combinators' && target.family && familyOf(file) && target.family !== familyOf(file)) {
          report('I13', line, `Un combinator ne peut consommer que le canonique de sa propre famille ("${spec}").`);
        }
        continue;
      }
      if (to === 'globals' || to === 'bootstrap') {
        report('I1', line, `Aucune couche ne doit consommer ${to} ("${spec}").`);
      } else if (!ALLOWED[layer].includes(to)) {
        report('I1', line, `La couche ${layer} ne peut pas consommer ${to} ("${spec}").`);
      } else if (layer === 'bootstrap' && to === 'combinators') {
        const families = target.external
          ? new Set([target.family])
          : new Set([...(target.family ? [target.family] : []), ...reachableFamilies(target.file)]);
        if (target.family === null && !target.file) families.add('*');
        const extra = [...families].filter(family => family !== 'context');
        if (extra.length > 0) {
          report('I23', line, `bootstrap ne peut importer que la famille context ; "${spec}" expose ${extra.join(', ')}.`);
        }
      }
    }

    const callable = node => node.ancestors.some(a => a.atRule === 'mixin' || a.atRule === 'function');
    const isRule = node => node.kind === 'block' && !node.atRule && !node.text.endsWith(':');
    const isDeclaration = node => node.kind === 'statement' && !node.atRule && /^[^$@][^:]*:/.test(node.text);

    for (const node of nodes) {
      const { text, line, atRule } = node;

      if (/!\s*important/.test(text) && layer !== 'bootstrap') {
        report('I22', line, '!important est réservé au reset de bootstrap.');
      }

      if (isDeclaration(node) && /^--[\w-]+\s*:/.test(text) && layer !== 'bootstrap' && layer !== 'globals') {
        report('I3', line, "L'affectation d'une custom property de token relève de bootstrap.", 'warning');
      }

      // Émission autonome (I2).
      if (layer !== 'bootstrap' && !callable(node)) {
        const emitting = n => isRule(n) || isDeclaration(n) || EMITTING_AT_RULES.includes(n.atRule);
        const permitted = layer === 'globals' && GLOBAL_AT_RULES.includes(atRule);
        const insidePermitted = layer === 'globals' && node.ancestors.some(a => GLOBAL_AT_RULES.includes(a.atRule));
        // Seule l'émission la plus externe est signalée.
        if (emitting(node) && !permitted && !insidePermitted && !node.ancestors.some(emitting)) {
          report('I2', line, `La couche ${layer} ne doit rien émettre d'autonome.`);
        }
      }

      // Sélecteurs (I19), analysés avec postcss-selector-parser.
      if (isRule(node)) {
        for (const problem of selectorProblems(text, layer, familyOf(file))) {
          report('I19', line, `${problem} : "${text}".`);
        }
      }

      if (layer === 'primitives') {
        if (atRule === 'mixin') report('I8', line, 'primitives ne contient que des @function.');
        if (atRule === 'content') report('I8', line, 'primitives ne contient pas de @content.');
        if (isRule(node) || isDeclaration(node)) report('I8', line, 'primitives ne produit aucun sélecteur ni propriété.');
      }

      if (layer === 'behaviors' && callable(node)) {
        if (atRule === 'content') report('I9', line, 'Un behavior est output-only : @content interdit.');
        if (CONDITIONAL_AT_RULES.includes(atRule)) report('I9', line, `Un behavior ne contient pas @${atRule}.`);
        if (isRule(node)) report('I9', line, `Un behavior ne contient aucun sélecteur : "${text}".`);
        if (/&/.test(text) && atRule !== 'include' && !isDeclaration(node)) report('I9', line, 'Un behavior ne référence pas &.');
      }

      if (atRule === 'include' && (layer === 'behaviors' || layer === 'combinators')) {
        const name = /^@include\s+(?:[\w-]+\.)?([\w-]+)/.exec(text)?.[1];
        const defined = name && mixinLayers.get(normalize(name));
        if (layer === 'behaviors' && defined?.has('behaviors')) {
          report('I10', line, `Un behavior n'inclut aucun autre behavior ("${name}").`);
        }
        if (layer === 'combinators' && (defined?.has('behaviors') || defined?.has('components'))) {
          report('I16', line, `Un combinator ne consomme ni behavior ni component ("${name}").`);
        }
      }
    }

    if (layer === 'combinators') {
      for (const mixin of nodes.filter(node => node.atRule === 'mixin')) {
        const hasContent = nodes.some(node => node.atRule === 'content' && node.ancestors.includes(mixin));
        if (!hasContent) report('I11', mixin.line, `Le combinator "${mixin.text.replace(/\s*\(.*$/, '')}" doit transmettre @content.`);
      }
    }
  }

  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  return {
    layers: Object.fromEntries(Object.entries(layerDirs).map(([layer, dir]) => [layer, relative(root, dir) || '.'])),
    files: files.length,
    violations,
  };
}
