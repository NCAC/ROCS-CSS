import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { discoverLayers, sourceFiles } from './checker.js';

// Couches de la chaîne : le CSS compilé d'un module doit être vide (I2).
const CHAIN = ['tokens', 'primitives', 'behaviors', 'combinators', 'components'];
// `globals` n'émet que des déclarations non sélectives (I2).
const GLOBAL_AT_RULES = ['keyframes', 'font-face', 'property'];

// Version minimale de Dart Sass (NodePackageImporter, URL `pkg:`). Aucun
// compilateur n'est déclaré en peer : la version est contrôlée ici, au chargement.
const MIN_SASS = [1, 71, 0];

function assertSassVersion(sass) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(String(sass.info ?? ''));
  if (!match) return;
  const version = match.slice(1).map(Number);
  // Premier composant qui diffère (majeure, mineure, correctif) : il décide.
  const index = version.findIndex((part, i) => part !== MIN_SASS[i]);
  if (index !== -1 && version[index] < MIN_SASS[index]) {
    throw new Error(`Le compilateur "sass" ${version.join('.')} est trop ancien : --compile exige sass >= ${MIN_SASS.join('.')}.`);
  }
}

async function loadSass(root) {
  const candidates = [
    async () => import(pathToFileURL(createRequire(join(root, 'noop.js')).resolve('sass')).href),
    async () => import('sass'),
  ];
  for (const candidate of candidates) {
    let module;
    try {
      module = await candidate();
    } catch {
      continue; // Essayer le compilateur suivant.
    }
    const sass = module.compile ? module : module.default;
    assertSassVersion(sass);
    return sass;
  }
  throw new Error(`Le compilateur "sass" (>= ${MIN_SASS.join('.')}) est introuvable : installez-le pour utiliser --compile.`);
}

/**
 * Compile chaque module des couches non terminales et vérifie qu'il n'émet rien (I2).
 * Contrairement à l'analyse statique, ce contrôle est sémantique, mais il exige que
 * les dépendances externes du projet soient résolubles.
 * @param {string} root
 * @param {{ layers?: Record<string,string> }} [options]
 * @returns {Promise<import('./checker.js').Violation[]>}
 */
export async function checkEmission(root, options = {}) {
  root = resolve(root);
  const sass = await loadSass(root);
  const layerDirs = discoverLayers(root, options.layers);
  const loadPaths = [root, ...Object.values(layerDirs).map(dirname)];
  const importers = sass.NodePackageImporter ? [new sass.NodePackageImporter(root)] : [];
  const violations = [];

  for (const { file, layer } of sourceFiles(layerDirs)) {
    if (layer === 'bootstrap') continue;
    const report = (rule, severity, message) =>
      violations.push({ rule, severity, file: relative(root, file), line: 1, layer, message });
    let css;
    try {
      ({ css } = sass.compile(file, { loadPaths, importers, charset: false, logger: sass.Logger.silent }));
    } catch (error) {
      report('COMPILE', 'warning', `Compilation impossible : ${String(error.sassMessage ?? error.message).split('\n')[0]}`);
      continue;
    }
    if (!css.trim()) continue;
    if (layer === 'globals') {
      const stray = postcss.parse(css).nodes.find(node => node.type !== 'comment'
        && !(node.type === 'atrule' && GLOBAL_AT_RULES.includes(node.name)));
      if (stray) report('I2', 'error', 'globals ne doit émettre que @keyframes, @font-face et @property (compilation).');
    } else if (CHAIN.includes(layer)) {
      report('I2', 'error', `La couche ${layer} émet du CSS au chargement (compilation).`);
    }
  }
  return violations;
}
