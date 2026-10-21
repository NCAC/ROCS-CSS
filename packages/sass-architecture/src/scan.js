// Scanner SCSS minimal : suffisant pour une analyse structurelle heuristique
// (imports, mixins, at-rules, sélecteurs), pas un parseur Sass complet.

/**
 * @typedef {Object} ScanNode
 * @property {'block'|'statement'} kind
 * @property {string} text      Texte sans commentaires ni contenu de chaînes
 * @property {string} raw       Texte sans commentaires, chaînes conservées
 * @property {number} line
 * @property {string|null} atRule  Nom de l'at-rule sans « @ »
 * @property {ScanNode[]} ancestors  Blocs englobants, du plus externe au plus interne
 */

/** Remplace commentaires (et contenu des chaînes pour `masked`) en conservant offsets et lignes. */
function mask(source) {
  let clean = '';
  let masked = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      for (; i < stop; i++) {
        const blank = source[i] === '\n' ? '\n' : ' ';
        clean += blank;
        masked += blank;
      }
    } else if (c === '/' && next === '/' && source[i - 1] !== ':') {
      while (i < source.length && source[i] !== '\n') {
        clean += ' ';
        masked += ' ';
        i++;
      }
    } else if (c === '"' || c === "'") {
      clean += c;
      masked += c;
      i++;
      while (i < source.length && source[i] !== c && source[i] !== '\n') {
        if (source[i] === '\\' && i + 1 < source.length) {
          clean += source[i];
          masked += ' ';
          i++;
        }
        clean += source[i];
        masked += ' ';
        i++;
      }
      if (i < source.length && source[i] === c) {
        clean += c;
        masked += c;
        i++;
      }
    } else {
      clean += c;
      masked += c;
      i++;
    }
  }
  return { clean, masked };
}

function skipInterpolation(text, index) {
  let depth = 1;
  let i = index + 2;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  return i - 1;
}

/** @returns {ScanNode[]} */
export function scan(source) {
  const { clean, masked } = mask(source);
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') lineStarts.push(i + 1);
  const lineAt = offset => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (lineStarts[mid] <= offset) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  };

  const nodes = [];
  const stack = [];
  let start = 0;

  const make = (kind, end) => {
    const text = masked.slice(start, end);
    const trimmed = text.trim();
    if (!trimmed) return null;
    const first = start + text.indexOf(trimmed[0]);
    const atRule = /^@([\w-]+)/.exec(trimmed)?.[1] ?? null;
    return {
      kind,
      text: trimmed,
      raw: clean.slice(first, end).trim(),
      line: lineAt(first),
      atRule,
      ancestors: [...stack],
    };
  };

  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (c === '#' && masked[i + 1] === '{') {
      i = skipInterpolation(masked, i);
    } else if (c === '{') {
      const node = make('block', i);
      if (node) {
        nodes.push(node);
        stack.push(node);
      } else {
        stack.push({ kind: 'block', text: '', raw: '', line: lineAt(i), atRule: null, ancestors: [...stack] });
      }
      start = i + 1;
    } else if (c === '}') {
      const node = make('statement', i);
      if (node) nodes.push(node);
      stack.pop();
      start = i + 1;
    } else if (c === ';') {
      const node = make('statement', i);
      if (node) nodes.push(node);
      start = i + 1;
    }
  }
  return nodes;
}
