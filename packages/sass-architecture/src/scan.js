import scss from 'postcss-scss';

/**
 * @typedef {Object} ScanNode
 * @property {'block'|'statement'} kind
 * @property {string} text      Texte normalisé, contenu des chaînes masqué
 * @property {string} raw       Même texte, chaînes conservées
 * @property {number} line
 * @property {string|null} atRule  Nom de l'at-rule sans « @ »
 * @property {ScanNode[]} ancestors  Blocs englobants, du plus externe au plus interne
 */

const maskStrings = text => text.replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, match => match[0] + ' '.repeat(match.length - 2) + match[0]);

function describe(node) {
  switch (node.type) {
    case 'atrule':
      return { raw: `@${node.name} ${node.params}`.trim(), atRule: node.name };
    case 'rule':
      return { raw: node.selector, atRule: null };
    case 'decl': {
      const value = node.value ?? '';
      const important = node.important ? ' !important' : '';
      return { raw: `${node.prop}${node.raws.between ?? ':'}${value}${important}`.trim(), atRule: null };
    }
    default:
      return null;
  }
}

/**
 * Aplatit l'AST postcss-scss en nœuds ordonnés avec leurs blocs englobants.
 * @throws {Error} erreur de syntaxe SCSS (`line` et `reason` renseignés)
 * @returns {ScanNode[]}
 */
export function scan(source) {
  const root = scss.parse(source);
  const nodes = [];
  const visit = (parent, ancestors) => {
    parent.each(child => {
      const info = describe(child);
      if (!info) return;
      const block = Array.isArray(child.nodes);
      const node = {
        kind: block ? 'block' : 'statement',
        text: maskStrings(info.raw),
        raw: info.raw,
        line: child.source?.start?.line ?? 0,
        atRule: info.atRule,
        ancestors,
      };
      nodes.push(node);
      if (block) visit(child, [...ancestors, node]);
    });
  };
  visit(root, []);
  return nodes;
}
