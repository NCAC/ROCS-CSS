# @rocss/sass

Mixins Sass canoniques, issues d'un import initial puis adaptées dans ce workspace.
Le workspace est désormais la source de référence du monorepo ; le dossier
d'origine reste intact.

**Version expérimentale 0.1.0, encore privée, non publiée.** Les tests doivent
être exécutés et les contrats revus avant de retirer `private: true`.
Références ciblées : ROCS 1.0 et architecture Sass 0.1.0 (brouillon).

## Imports

Après `pnpm install` à la racine, les workspaces sont liés dans `node_modules/@rocss/`
(dépendances `workspace:*` de la racine).
Après une future publication, l'installation sera
`npm install --save-dev @rocss/sass sass`.

Le compilateur n'est pas fourni : `sass` et `sass-embedded` (≥ 1.71.0, pour les
URL `pkg:`) sont déclarés en `peerDependencies` optionnelles. Installer l'un des
deux ; le gestionnaire de paquets signale alors une version trop ancienne.

### Voie recommandée : URL `pkg:`

Les URL `pkg:` (Dart Sass ≥ 1.71.0) résolvent le package selon l'algorithme de
Node.js, à partir des `exports` du manifeste (condition `sass`). Elles ne
dépendent ni de l'emplacement de `node_modules` ni de son organisation, et
fonctionnent donc aussi avec pnpm ou dans un monorepo.

```scss
@use "pkg:@rocss/sass/context";
@use "pkg:@rocss/sass/state";

.ProductCard-title {
 @include context.media("(min-width: 48rem)") {
  @include state.pseudo-class("hover") {
   text-decoration: underline;
  }
 }
}
```

Il faut activer l'importeur de packages Node, qui n'est pas actif par défaut :

```sh
# CLI
sass --pkg-importer=node input.scss output.css
```

```js
// API JavaScript
import * as sass from 'sass';

const result = sass.compile('input.scss', {
  importers: [new sass.NodePackageImporter()],
});
```

`NodePackageImporter` résout depuis le dossier du script d'entrée. Sans script
d'entrée (`node -e`, REPL, certains outils), passer explicitement le dossier de
départ : `new sass.NodePackageImporter(process.cwd())`. Avec un bundler, fournir
le même importeur via ses options Sass (par exemple `importers` dans
`css.preprocessorOptions.scss` de Vite ou dans `sassOptions` de `sass-loader`).

`@use "pkg:@rocss/sass"` charge l'entrée agrégée ; une couche restreinte à une
famille importe directement son sous-chemin (I23).

### Alternative : chemin de chargement

Sans `pkg:`, ajouter `node_modules` aux chemins de chargement et importer sans
préfixe :

```scss
@use "@rocss/sass/state";
```

```sh
sass --load-path=node_modules input.scss output.css
```

ou `loadPaths: ["node_modules"]` avec l'API. Cette voie suppose que
`node_modules/@rocss/sass` existe à l'emplacement indiqué : c'est le cas pour une
dépendance directe, mais pas toujours avec pnpm (dépendance transitive) ni dans
un sous-package de monorepo. Les fichiers SCSS ne sont pas des modules
JavaScript.

| Famille | Mixins et arguments |
| --- | --- |
| `context` | `media($condition)`, `supports($condition)`, `container($condition)` |
| `state` | `pseudo-class($pseudo)`, `attribute($name, $value: null)` |
| `scope` | `ancestor($ancestor)` |
| `part` | `pseudo-element($pseudo)` |

Les mixins du package sont en **kebab-case**, comme les modules intégrés
`sass:list` ou `sass:meta` ; les mixins d'un projet qui les consomme (spécialisations,
behaviors, components) sont en **snake_case** (architecture Sass §0.3). Sass traitant
`-` et `_` comme équivalents, `state.pseudo_class` reste accepté : c'est une
convention de lecture, non une contrainte du compilateur.

Chaque famille est importable par son sous-chemin (`/context`, `/state`,
`/scope`, `/part`). L'entrée principale agrège les sept mixins sans émettre
de CSS au chargement. Une couche restreinte à une famille doit importer son
sous-chemin, pas l'agrégateur (I23). Les utilitaires internes ne font pas partie
de l'API publique.

Chaque mixin exige un bloc de contenu et le transmet une fois. Exemple de scope :

```scss
@use "pkg:@rocss/sass/scope";
@use "pkg:@rocss/sass/state";

.ProductCard-title {
 @include scope.ancestor('body[data-device-type="mobile"]') {
  @include state.pseudo-class("focus-visible") {
   outline-style: solid;
  }
 }
}
```

## Validation et limites

- Pseudo-classes simples : liste fermée dans la source. Les quatre variantes
 `nth-*` acceptent des indices `An+B`, des entiers, `odd` et `even`.
 Les arguments sélecteurs (`is`, `not`, `has`, `where`, `nth-child(... of ...)`)
 sont refusés par ce mécanisme.
- Attributs : identifiants ASCII et valeurs chaîne/nombre sans guillemets,
 antislash, crochets ni retours à la ligne.
- Ancêtres : un composé `<racine>[<attribut>]`, avec racine `html`, `body`,
 `:root` ou une classe. Le parent initial doit être un composé unique ; les
 scopes imbriqués sont refusés. L'ancêtre est fourni par le projet.
- Pseudo-éléments : liste fermée dans la source.
- Conditions : chaînes non blanches, sans `{`, `}` ni `;`. Ce contrôle n'est
 pas un parseur complet des requêtes CSS ; Sass et le navigateur complètent
 la validation syntaxique.

Les contrôles sont syntaxiques, pas une preuve de conformité sémantique ROCS.
Le consommateur reste responsable du sens des attributs, de l'appartenance
au même Block, du parent ROCS, de l'ordre `context → scope → state → part`
et du plafond de spécificité. Ce package ne fournit ni tokens de design,
ni composants visuels, ni contrôle automatique du graphe architectural.

## Vérifications

Depuis la racine : `pnpm test` compile les points d'entrée et les compositions,
teste les arguments refusés et installe les trois archives dans un projet
temporaire hors dépôt. `pnpm run pack:check` inspecte aussi l'archive Sass.
La présence de tests ne signifie pas qu'ils ont déjà été exécutés.
