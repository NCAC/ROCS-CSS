# @rocss/sass-architecture

**Brouillon d'architecture de référence**, version 0.1.0, ciblant ROCS 1.0.
Ce package est documentaire : il ne fournit ni JavaScript ni mixins Sass.

Après publication : `npm install --save-dev @rocss/sass-architecture`.
Les fichiers Markdown sont consultables directement ou localisables via les
sous-chemins `@rocss/sass-architecture/specification` et
`@rocss/sass-architecture/guide` ; ils ne sont pas des modules JavaScript à importer.

- [Spécification d'architecture](docs/fr/SPECIFICATION.md) : référence normative du brouillon.
- [Guide pédagogique](docs/fr/GUIDE.md) : informatif, pas encore entièrement synchronisé.
- [Revue contradictoire](docs/fr/REVIEW.md) : document de travail, propositions non automatiquement adoptées.

La spécification distingue `tokens`, `primitives`, `behaviors`, `combinators`,
`components`, `globals` et `bootstrap`. Ses contraintes supplémentaires ne
constituent pas des obligations pour toute application ROCS.

La source canonique reste le dossier
[scss-rocs-framework](https://github.com/NCAC/ROCS-CSS/tree/main/scss-rocs-framework)
du dépôt. La construction copie les documents dans ce package sans modifier
leur contenu ni adopter les propositions de la revue. Le guide et la revue
doivent encore être harmonisés avec le texte normatif actuel.

Les versions des packages sont indépendantes. La conformité à ROCS ne dépend
ni de l'adoption de cette architecture, ni de l'installation de ce package.
