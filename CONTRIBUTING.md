# Contributing to ROCS

Merci de votre intérêt pour contribuer à ROCS ! 🎉

## Monorepo : périmètre et sources

La racine **rocs-monorepo** est privée (`private: true`) et déclare les pnpm workspaces `packages/*` ([pnpm-workspace.yaml](pnpm-workspace.yaml)). Les versions des packages sont indépendantes :

- [@rocss/rocs](packages/rocs/README.md) **1.0.0** : spécification ROCS, CLI, API JavaScript et configurations Stylelint/ESLint. Les sources du validateur sont dans [packages/rocs/src/validator.js](packages/rocs/src/validator.js), son entrée CLI dans [packages/rocs/bin/rocs.js](packages/rocs/bin/rocs.js), et les configurations dans [packages/rocs/stylelint.config.json](packages/rocs/stylelint.config.json) et [packages/rocs/eslint.config.js](packages/rocs/eslint.config.js).
- [@rocss/sass-architecture](packages/sass-architecture/README.md) **0.1.0** : brouillon documentaire, sans mixins ni code d'exécution. Sa documentation est générée depuis [scss-rocs-framework/](scss-rocs-framework/) sans modifier le contenu des sources ni adopter automatiquement les propositions de la revue.
- [@rocss/sass](packages/sass/README.md) **0.1.0** : implémentation Sass expérimentale, toujours `private: true` et non publiée. Les tests doivent être exécutés et les contrats revus avant de retirer ce statut.

Le [guide du monorepo](docs/MONOREPO.md) détaille cette organisation. Pour ROCS, [docs/fr/](docs/fr/) fait autorité ; [docs/en/](docs/en/) en est la traduction. Modifier les sources canoniques, puis synchroniser la traduction. **Ne jamais éditer les copies de documentation dans les packages** : [tools/build-package-docs.js](tools/build-package-docs.js) les régénère avec `pnpm run build` ou le hook `prepack`.

Pour les combinators, modifier les sources canoniques dans [packages/sass/](packages/sass/) : 13 fichiers SCSS copiés/adaptés depuis le dossier local d'import initial. Le dossier d'import initial a été supprimé : `packages/sass` est la seule source. La [licence MIT du package](packages/sass/LICENSE) est une copie réelle, pas un fichier généré par la construction documentaire.

L'API fournit sept mixins : `context.media`, `context.supports`, `context.container`, `state.pseudo-class`, `state.attribute`, `scope.ancestor` et `part.pseudo-element`. Importer les familles via `@use "pkg:@rocss/sass/context"`, `/state`, `/scope` ou `/part`, avec l'importeur de packages Node de Dart Sass (CLI : `--pkg-importer=node` ; API : `importers: [new NodePackageImporter()]`). `loadPaths: ["node_modules"]` reste possible. Après `pnpm install`, la résolution utilise le workspace local, sans publication.

Le [CLI historique](tools/rocs-validate.js) est conservé comme wrapper du validateur du package. CSS a été ajouté aux extensions analysées : HTML, HTM, CSS et SCSS. Cette analyse reste **heuristique**, sans adaptateurs de templates Twig, Vue, JSX, etc. ; SCSS et CSS générés sont analysés séparément. Un résultat sans diagnostic n'est pas une preuve de conformité complète : les choix sémantiques nécessitent une revue humaine.

## Installation et contrôles

Avec Node.js ≥ 20, exécuter depuis la racine :

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run check
pnpm run pack:check
```

- `pnpm run build` génère la documentation embarquée des workspaces concernés.
- `pnpm test` lance les tests du dépôt, dont les tests ajoutés de compilation Sass (points d'entrée et compositions), d'arguments invalides et d'installation des trois archives hors dépôt, avec compilation depuis le package installé. Leur présence ne signifie pas qu'ils ont été exécutés ni qu'ils réussissent.
- `pnpm run check` enchaîne **build → test → lint → validate**.
- `pnpm run pack:check` inspecte à blanc les trois archives (`@rocss/rocs`, `@rocss/sass-architecture` et `@rocss/sass`) avec `pnpm pack --dry-run`, **sans publication**. Le workspace privé est inclus : `private: true` interdit la publication, pas l'archivage local avec `pnpm pack`.

### Gestionnaire de paquets

Le dépôt utilise **pnpm** exclusivement ; sa version est fixée par le champ
`packageManager` du `package.json` racine (activable avec `corepack enable`).
Seul `pnpm-lock.yaml` fait foi : ne pas créer de `package-lock.json`. La racine
déclare les trois workspaces en `devDependencies` `workspace:*` afin qu'ils
soient liés dans `node_modules/@rocss/` (résolution Sass et CLI `rocs`).
`autoInstallPeers: false` (dans `pnpm-workspace.yaml`) empêche pnpm d'installer
les peers optionnels des workspaces, notamment `sass-embedded` : les peers sont
fournis par les `devDependencies` de la racine.

La politique `allowBuilds` refuse explicitement le script natif de
`@parcel/watcher`, inutile pour les compilations et les tests actuels. Ce refus
explicite évite l'erreur `ERR_PNPM_IGNORED_BUILDS` pour cette dépendance sans
autoriser globalement les scripts tiers ni désactiver les vérifications de pnpm.
Un éventuel usage du watcher natif doit faire l'objet d'une revue séparée.
Le test d'installation hors dépôt construit les archives avec `pnpm pack`, puis
les installe avec npm, hors ligne et sans scripts, pour vérifier la compatibilité
côté consommateur : npm doit donc rester disponible pour `pnpm test`.

Après modification d'un exemple SCSS, utiliser `pnpm run compile:examples`, puis refaire les contrôles. Pour analyser un autre répertoire avec le wrapper conservé : `node tools/rocs-validate.js --dir ./src`.

## Versions et publication

**Aucun package n'est publié à ce stade. Le scope npm `@rocss` est une organisation npm détenue par le projet.** Les noms `@rocss/rocs`, `@rocss/sass` et `@rocss/sass-architecture` y sont donc disponibles, mais aucun n'est encore publié.

Les scripts de release à la racine ont été supprimés : l'ancien release global ne convient pas aux versions indépendantes. Ne pas l'utiliser pour publier les workspaces. Une éventuelle publication est **manuelle depuis le dépôt**, package par package, après revue des changements, réussite des contrôles ci-dessus, inspection du contenu des archives et vérification de l'authentification et des droits npm sur le scope. La racine et le workspace `@rocss/sass` restent privés ; ce dernier reste expérimental en **0.1.0**, dans l'attente de l'exécution des tests et de la revue des contrats. **Aucune publication par CI n'est configurée**.

## Comment contribuer

### 1. Signaler un problème

- Ouvrez une [issue](https://github.com/NCAC/ROCS-CSS/issues)
- Décrivez le contexte et le cas d'usage
- Fournissez un exemple de code si possible

### 2. Proposer une amélioration

- Fork le projet
- Créez une branche (`git checkout -b feature/amelioration`)
- Commitez vos changements (`git commit -m 'feat: description'`)
- Pushez (`git push origin feature/amelioration`)
- Ouvrez une Pull Request

### 3. Ajouter un exemple

Les nouveaux exemples sont les bienvenus !

Structure :

```text
examples/VotreComposant/
├── index.html
├── styles.scss
└── README.md
```

**Critères :**

- Respecter strictement ROCS (1 classe, PascalCase, data-*, etc.)
- Documenter les choix de design
- Inclure au moins 2 variantes

## Conventions de commit

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `example:` nouvel exemple
- `refactor:` refactorisation

## Questions ?

Ouvrez une discussion dans les [issues](https://github.com/NCAC/ROCS-CSS/issues).
