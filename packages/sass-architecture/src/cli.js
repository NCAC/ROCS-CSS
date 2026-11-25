import { parseArgs } from 'node:util';
import process from 'node:process';
import { checkArchitecture, LAYERS } from './checker.js';
import { checkEmission } from './emission.js';

const HELP = `
ROCS Sass Architecture Checker — v0.1
Vérifie statiquement les invariants de l'architecture Sass de référence.

Usage:
  sass-architecture check [dir] [options]

Options:
  --dir <path>          Répertoire du projet (défaut: .)
  --layer <nom=chemin>  Chemin d'une couche (répétable). Couches : ${LAYERS.join(', ')}
  --format <format>     text (défaut) ou json
  --compile             Compile aussi les modules avec sass pour vérifier I2 (sass requis)
  --strict              Exit 1 sur les warnings également
  --help                Afficher cette aide

Convention : un dossier par couche, à la racine ou sous src/, scss/ ou styles/.
Les combinators sont répartis en sous-dossiers context/, scope/, state/, part/.
Codes de sortie : 0 conforme, 1 violation, 2 usage invalide.

L'analyse est heuristique : elle ne prouve pas la conformité complète.
`;

export function formatText(result) {
  const lines = ['', 'ROCS Sass Architecture — rapport', ''];
  const found = Object.entries(result.layers).map(([layer, dir]) => `${layer}=${dir}`);
  lines.push(`Couches : ${found.join(', ') || 'aucune'}`, `Fichiers analysés : ${result.files}`, '');
  for (const v of result.violations) {
    lines.push(`${v.severity === 'error' ? '❌' : '⚠️ '} [${v.rule}] ${v.file}:${v.line} — ${v.message}`);
  }
  const errors = result.violations.filter(v => v.severity === 'error').length;
  const warnings = result.violations.length - errors;
  lines.push('', `Erreurs : ${errors}  Avertissements : ${warnings}`, '');
  return lines.join('\n');
}

/** @returns {Promise<number>} code de sortie */
export async function runCli(argv = process.argv.slice(2), out = process.stdout) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        dir: { type: 'string' },
        layer: { type: 'string', multiple: true },
        format: { type: 'string', default: 'text' },
        compile: { type: 'boolean', default: false },
        strict: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: true,
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    out.write(HELP);
    return 0;
  }
  const [command = 'check', maybeDir] = positionals;
  if (command !== 'check' || !['text', 'json'].includes(values.format)) {
    process.stderr.write(`Usage invalide.${HELP}`);
    return 2;
  }
  const layers = {};
  for (const entry of values.layer ?? []) {
    const [name, path] = entry.split('=');
    if (!LAYERS.includes(name) || !path) {
      process.stderr.write(`--layer attend <nom=chemin> avec nom parmi ${LAYERS.join(', ')} : "${entry}".\n`);
      return 2;
    }
    layers[name] = path;
  }
  const directory = values.dir ?? maybeDir ?? '.';
  const result = checkArchitecture(directory, { layers });
  if (Object.keys(result.layers).length === 0) {
    process.stderr.write('Aucune couche détectée. Utilisez des dossiers nommés par couche ou --layer.\n');
    return 2;
  }
  if (values.compile) {
    try {
      const reported = new Set(result.violations.filter(v => v.rule === 'I2').map(v => v.file));
      const compiled = await checkEmission(directory, { layers });
      result.violations.push(...compiled.filter(v => v.rule !== 'I2' || !reported.has(v.file)));
      result.violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 2;
    }
  }
  out.write(values.format === 'json' ? `${JSON.stringify(result, null, 2)}\n` : formatText(result));
  const failing = result.violations.some(v => v.severity === 'error' || values.strict);
  return failing ? 1 : 0;
}
