# Framework SCSS — Bases conceptuelles

Oct 19, 2026 · @ncac

## 0. Statut, périmètre et conventions

Ce document est la **partie théorique** du framework : il pose les concepts, les couches et les invariants d'un framework de **définitions** Sass. Il aligne ces invariants sur la spécification ROCS, qui régit la couche de consommation.

Il ne contient volontairement aucun nom de fichier ni de mixin concret (hormis les identifiants des combinators canoniques, fixés par I12), aucune valeur de design et aucun choix de technologie de rendu. Tout cela relève de la **partie pratique**, propre à chaque projet.

Règle de lecture : un énoncé de ce document doit rester vrai si l'on change de projet, de charte graphique et de breakpoints. S'il ne le reste pas, sa place est dans la partie pratique.

### 0.1 Mots normatifs

- **DOIT / NE DOIT PAS** : exigence absolue.
- **DEVRAIT / NE DEVRAIT PAS** : recommandation forte ; une exception n'est admise que justifiée et documentée.
- **PEUT** : option permise.

Tout énoncé sans ces termes est **informatif** et ne crée aucune obligation.

### 0.2 Source de référence ROCS

La référence est la [spécification ROCS](https://github.com/NCAC/ROCS-CSS/blob/main/docs/en/SPECIFICATION.md), et non le README du dépôt. Les renvois « ROCS §x » désignent les sections de cette spécification.

### 0.3 Casse des identifiants

Les identifiants publics du framework, notamment ceux des combinators canoniques (I12), DOIVENT être écrits en **kebab-case** (`pseudo-class`), à la manière des modules intégrés de Sass (`sass:list`, `sass:meta`). Les mixins et fonctions de la partie pratique, propres à un projet (spécialisations, behaviors, components), DEVRAIENT être écrits en **snake_case** (`from_wide`, `heading_large`).

Informatif : Sass traite `-` et `_` comme équivalents dans les noms de mixins, de fonctions et de variables. Cette distinction est donc une convention de lecture, qui sépare d'un coup d'œil les primitives de bas niveau du framework et les symboles d'un projet ; elle n'est pas garantie par le compilateur.

## 1. Principe

Le framework fournit des **abstractions réutilisables** (valeurs, fonctions, mixins) et ne génère aucun sélecteur désignant un élément métier. Le mapping vers les éléments appartient à la **couche de consommation**, hors périmètre, qui DOIT se conformer à ROCS.

Le CSS produit par l'inclusion d'une définition dans une règle de consommation est du **CSS applicatif ROCS**. Toute sortie du framework DOIT donc être conforme à ROCS §6.

### 1.1 Sélecteurs émis

Le framework NE DOIT émettre que deux catégories de sélecteurs :

1. les **transformations relatives** du sélecteur courant `&`, produites par les combinators des familles `state`, `scope` et `part` ;
2. les **sélecteurs absolus** de `bootstrap`, qui ne visent que le document (`:root`, `html`, `body`, reset). Ils PEUVENT être qualifiés par un attribut de métadonnée contextuelle globale (I6 bis).

Aucun autre sélecteur n'est permis : aucun combinateur CSS hors de la forme canonique `scope` (I19), aucune classe ni `id`, et aucune balise en dehors de `html`, `body` et du reset de `bootstrap` (§1.3).

### 1.2 Précondition sur `&`

Le sélecteur courant `&` fourni par le consommateur DOIT être un **sélecteur composé sans combinateur**. En ROCS, c'est toujours une classe unique (ROCS §3.1, §6.2.1) ; la précondition est donc satisfaite par construction.

### 1.3 Reset de `bootstrap`

Le **reset** est le seul sous-régime de `bootstrap` autorisé à cibler des éléments natifs. Il est borné par les règles suivantes :

- ses sélecteurs sont des listes (séparées par des virgules) de sélecteurs universels ou de type (`*`, `html`, `body`, `button`…), chacun PEUT être suivi d'un pseudo-élément (`::before`, `::after`) ;
- ils NE DOIVENT contenir ni classe, ni `id`, ni attribut, ni combinateur, ni pseudo-classe fonctionnelle ;
- ses déclarations normalisent le rendu natif ; elles NE DOIVENT pas styler un composant ;
- seul le reset PEUT émettre `!important` (I22, ROCS §6.1).

✅ Conforme :

```scss
*, *::before, *::after { box-sizing: border-box; }
button, input, textarea, select { font: inherit; }
```

❌ Non conforme :

```scss
.Button { font: inherit; }       // classe
form input { font: inherit; }    // combinateur
:is(button, input) { margin: 0; } // pseudo-classe fonctionnelle
```

Informatif : sans cette définition, le mot « reset » deviendrait une échappatoire aux contraintes sur les sélecteurs absolus. Les surcharges de tokens sur `:root` ou `(:root | html | body)[data-*]` relèvent de I6 bis, pas du reset.

### 1.4 Principe de fermeture

Cette section est informative : elle résume ce que I12, I19, I20 et I21 imposent chacun pour leur périmètre. Toute entrée susceptible de contenir de la syntaxe CSS (argument de combinator, pseudo-classe fonctionnelle, ancêtre de `scope`, dépendance externe, appel dynamique via `sass:meta`, module agrégateur) possède un domaine fermé, validé ou statiquement borné. Une API du framework ne permet jamais de produire indirectement une construction qu'elle interdit directement.

## 2. Les couches

Les dépendances sont strictement unidirectionnelles. `behaviors` et `combinators` sont deux couches **sœurs** : aucune ne consomme l'autre, et seule `components` les assemble.

```text
tokens → primitives → { behaviors | combinators } → components

globals      (terminale)
bootstrap    (terminale)
```

Le tableau ci-dessous est **normatif** : une couche NE DOIT consommer que ce que sa ligne autorise. L'ordre du graphe est une condition nécessaire, pas suffisante.

| Couche | Nature | Produit | Peut consommer |
| --- | --- | --- | --- |
| `tokens` | valeurs de base nommées | variables Sass (aucune émission) | — |
| `primitives` | calcul pur | `@function` uniquement | tokens |
| `behaviors` | garantie CSS atomique | déclarations à l'endroit de l'inclusion | tokens, primitives |
| `combinators` | transformation de contexte | at-rule ou sélecteur relatif autour d'un `@content` | tokens, primitives, canonique de son propre mécanisme (I13) |
| `components` | composition nommée | assemblage de behaviors et combinators | toutes les couches de la chaîne |
| `globals` | symboles globaux non sélectifs | `@keyframes`, `@font-face`, `@property` | tokens, primitives |
| `bootstrap` | émission terminale | sélecteurs absolus (`:root`, `html`, `body`, reset) | tokens, primitives, combinators `context` |

`bootstrap` ne consomme ni les combinators `state`, `scope` ou `part`, ni les behaviors, ni les components. `globals` déclare des symboles réutilisables qui ne ciblent aucun sélecteur ; `bootstrap` écrit des sélecteurs.

La règle est vérifiable mécaniquement : un `@use` ou `@forward` hors de la ligne autorisée, ou qui consomme `globals` ou `bootstrap`, est une violation (voir I23).

## 3. Invariants

Les numéros de la v1 sont conservés pour la traçabilité ; I6 bis et I21 à I23 sont nouveaux.

### Dépendance et émission

**I1.** Une couche NE DOIT consommer que les couches que sa ligne du tableau §2 autorise. Aucune couche NE DOIT consommer `globals` ni `bootstrap`.

**I2.** Les couches de la chaîne NE DOIVENT rien émettre d'autonome. Une émission est **autonome** lorsqu'elle se produit au chargement du module, sans appel explicite par la couche de consommation ; le corps d'un mixin n'émet qu'à son inclusion. Seules les deux couches terminales émettent : `bootstrap` écrit les sélecteurs absolus ; `globals` est la seule couche autorisée à émettre des règles globales non sélectives (`@keyframes`, `@font-face`, `@property`).

**I3.** L'affectation d'une custom property représentant un token DOIT être émise dans `bootstrap`, seule couche qui consomme à la fois `tokens` et `primitives` tout en écrivant un sélecteur. Lorsqu'un token est enregistré par `@property`, `globals` PEUT en émettre la valeur initiale, conformément à I4. Aucune autre couche NE DOIT affecter ni enregistrer un token.

### Tokens et primitives

**I4.** Un token existe sous deux formes : le **nom** de sa custom property, c'est-à-dire son identifiant CSS (`--spacing-small`), et l'**alias** `var(--spacing-small)`. Le nom NE DOIT être consommé que par les couches qui déclarent le token au moteur CSS : `bootstrap`, qui l'affecte, et `globals`, qui l'enregistre via `@property`. Partout ailleurs, seul l'alias est consommé. Pour un token enregistré, `initial-value` DOIT provenir de la même variable Sass que la valeur par défaut émise par `bootstrap`.

Informatif : `globals` et `bootstrap` partagent alors une même variable de `tokens` sans se consommer mutuellement. La cohérence vient de la source commune, conformément à I1.

**I5.** Hors émission, une valeur DOIT être consommée via son alias, sans quoi elle est figée à la compilation. Exception : les contextes où CSS ne résout pas `var()`.

- préludes de `@media`, `@container` et `@supports` ;
- descripteurs de `@font-face` ;
- `syntax` et `initial-value` de `@property`.

Dans ces contextes, la valeur DOIT provenir d'une variable Sass de `tokens`, jamais d'un littéral écrit sur place. L'émission dans `bootstrap` consomme les valeurs par définition et n'est pas concernée.

**I6.** Un token DOIT conserver un nom et un alias uniques lorsque sa valeur varie selon le contexte. La variation produit plusieurs affectations de la même custom property dans la cascade, jamais plusieurs tokens. Répartition :

- `tokens` définit l'identité du token, son alias et les valeurs nommées nécessaires à son émission ; il ne définit aucune règle de sélection contextuelle ;
- `primitives` PEUT calculer une valeur à partir des tokens ;
- un combinator `context` définit la condition de la surcharge ;
- `bootstrap` émet la valeur initiale et les surcharges conditionnelles ;
- les autres couches consomment uniquement l'alias.

**I6 bis.** La valeur d'un token PEUT varier selon une **métadonnée contextuelle globale** (ROCS §4.7), par exemple une préférence de thème pilotée côté client. La surcharge DOIT être émise dans `bootstrap`, sur un sélecteur de forme `(:root | html | body)[data-*]`. L'attribut DOIT représenter une métadonnée applicable au document ou à l'environnement global de rendu, jamais l'état dynamique d'un composant ni une donnée métier locale. C'est la seule qualification autorisée pour les sélecteurs d'émission de tokens dans `bootstrap` (le reset est borné par §1.3), qui ne consomme toujours pas `scope`. Une variation exprimable par un token DEVRAIT passer par cette voie plutôt que par un `scope` de component.

**I7.** Les modules de `tokens` NE DOIVENT pas dépendre les uns des autres. Un module d'exposition (index) PEUT les réexporter, sans en consommer aucun ni réintroduire de dépendance entre eux.

**I8.** `primitives` NE DOIT contenir que des `@function` : jamais de `@mixin`, de `@content`, de sélecteur ni de propriété émise.

### Behaviors

**I9.** Un behavior est **output-only** : il NE DOIT contenir ni `&`, ni sélecteur, ni `@content`, ni at-rule conditionnelle ou contextuelle (`@media`, `@supports`, `@container`…). Il produit exclusivement des déclarations à l'endroit exact de son inclusion. Les at-rules de diagnostic (`@debug`, `@warn`, `@error`) PEUVENT y figurer, car elles n'émettent pas de CSS.

**I10.** Un behavior NE DOIT inclure aucun autre behavior. Toute composition de behaviors ou de combinators appartient à `components`, quelle que soit sa taille.

### Combinators

**I11.** Un combinator DOIT accepter un bloc de contenu et le transmettre **exactement une fois** dans chaque branche d'exécution valide. Il NE DOIT produire aucune déclaration indépendante de ce contenu. Dans `components`, `@content` est **facultatif** : un component PEUT être fermé ou ouvert.

**I12.** Quatre familles de combinators, jamais un sélecteur autonome : `context` enveloppe `@content` dans une at-rule sans transformer `&` ; `scope`, `state` et `part` transforment `&`. Chaque mécanisme DOIT posséder un unique combinator **canonique** exposé par l'API publique du framework, paramétré par son argument. Le canonique DOIT porter pour nom l'**identifiant** de son mécanisme, et aucun autre combinator NE DOIT porter ce nom. Tout nouveau mécanisme DOIT être introduit avec son identifiant et son canonique.

| Famille | Mécanisme | Identifiant du canonique | Forme produite | Paramètre |
| --- | --- | --- | --- | --- |
| `context` | media | `media` | `@media <condition>` | condition de média |
| `context` | supports | `supports` | `@supports <condition>` | condition de support |
| `context` | container | `container` | `@container <condition>` | condition de conteneur |
| `state` | pseudo-classe | `pseudo-class` | `&:<pseudo>` | pseudo-classe (état ou structurelle) |
| `state` | attribut | `attribute` | `&[<attribut>]` | attribut natif, ARIA ou `data-*` dynamique |
| `scope` | ancêtre | `ancestor` | `<ancêtre> :where(&)` | ancêtre |
| `part` | pseudo-élément | `pseudo-element` | `&::<pseudo>` | pseudo-élément |

L'argument d'un canonique, lorsqu'il est de nature syntaxique, DOIT avoir un domaine fermé ou être validé avant émission. Il NE DOIT permettre de produire aucune construction interdite par I15, I19 ou I21 : ni sélecteur sémantique, ni combinateur hors forme `scope`, ni sélecteur imbriqué, ni transformation relevant d'un autre mécanisme.

Contraintes sur `scope` :

- l'ancêtre est un argument fourni par le consommateur ; le framework NE DOIT jamais nommer lui-même un sélecteur métier ;
- l'ancêtre DOIT être un sélecteur composé unique, sans combinateur, de forme `<racine>[<attribut>]`, où `<racine>` ∈ {`html`, `body`, `:root`, une classe} ;
- `&` DOIT être placé dans `:where()`, dont la spécificité est nulle.

Que l'ancêtre porte une métadonnée globale ou locale au même Block (ROCS §6.2.2) est un contrat de la couche de consommation, vérifiable sur le CSS compilé.

**I13.** Un combinator PEUT consommer exclusivement le canonique de son propre mécanisme, pour en spécialiser l'argument. Cette délégation DOIT être directe, acyclique, transmettre intégralement `@content` et ne produire aucune enveloppe ni transformation supplémentaire. Toute combinaison de plusieurs mécanismes, même d'une même famille, est une composition réservée à `components`.

**I14.** Une spécialisation NE DOIT consommer aucune autre spécialisation.

**I15.** Les familles respectent la relation de précédence `context` → `scope` → `state` → `part`, de l'extérieur vers l'intérieur. Plusieurs `context` PEUVENT être imbriqués, leur ordre interne relevant de leur sémantique CSS. Plusieurs `state` PEUVENT s'appliquer successivement, dans la limite de I21. Une même signature NE DOIT contenir qu'un seul `scope` (un seul niveau d'ancêtre, soit la profondeur 2 de ROCS §6.2.2) et qu'un seul `part`.

Informatif : `state` sous `scope` donne `.T :where(.C):hover`, qui reste plus spécifique que `.T :where(.C)`. L'ordre inverse donnerait `.T :where(.C:hover)` et annulerait cet écart. `part` vient en dernier, car un pseudo-élément termine le sélecteur composé.

**I16.** Un combinator NE DOIT consommer ni behavior ni component.

### Components

**I17.** `components` est la seule couche autorisée à assembler plusieurs garanties de rendu destinées à la consommation applicative, notamment plusieurs behaviors ou plusieurs mécanismes de combinators.

Ne constituent pas une composition au sens de cet invariant :

- la spécialisation transparente autorisée par I13 ;
- l'usage de combinators `context` par `bootstrap` pour conditionner l'émission d'un token.

**I18.** Un nom de component DOIT décrire une **forme générique**, c'est-à-dire une garantie de rendu indépendante de toute entité métier, fonctionnalité applicative ou contexte produit. Ce contrôle est sémantique : il ne se vérifie pas par le seul nom.

### Sélecteurs

**I19.** Aucun mixin NE DOIT écrire de combinateur CSS (descendant, `>`, `+`, `~`) hors de la forme canonique `scope`, que ce soit dans son texte source ou par son expansion : l'inclusion du canonique `ancestor` reste le seul chemin autorisé. Aucun mixin NE DOIT écrire ni présupposer un sélecteur sémantique (classe, balise, `id`), y compris lorsque le nom est imposé par une source externe. Les pseudo-classes structurelles (`:first-child`, `:nth-child()`…) PEUVENT s'appliquer à `&` via le canonique `state/pseudo-classe`.

Informatif : un layout passe par les propriétés du conteneur (`gap`, grid, flex) ; chaque enfant stylé porte sa propre classe ROCS. Le contrat entre contenu et framework s'écrit côté consommation, par exemple `.RichText-subTitle { @include heading_level_2; }`.

### Dépendances externes

**I20.** Une couche PEUT consommer une dépendance externe uniquement si les symboles effectivement utilisés respectent les invariants de cette couche. Une dépendance externe ne confère aucune exemption aux règles d'émission, de dépendance ou de composition.

Les modules Sass purs (`sass:math`, `sass:string`, `sass:list`, `sass:map`) sont orthogonaux aux couches tant que leur usage ne produit que des valeurs. Les mixins, fonctions ou modules tiers dont les effets ne sont pas garantis DOIVENT être qualifiés selon leur comportement réel, et un appel dynamique (`sass:meta`) DOIT être traité comme l'appel de son symbole résolu.

Informatif : une dépendance est classée par ses effets, non par son origine.

### Spécificité et cascade

**I21.** La spécificité de tout sélecteur produit DOIT être calculable statiquement à partir de sa signature complète de composition et de ses paramètres, et DOIT respecter le plafond fixé par la partie pratique. Un combinator NE DOIT accepter aucun argument dont la spécificité ne peut être bornée par son contrat.

En conséquence, le canonique `pseudo-class` NE DOIT accepter aucune pseudo-classe fonctionnelle prenant un sélecteur en argument (`:is()`, `:not()`, `:has()`, `:where()`, `:nth-child(… of …)`, `:nth-last-child(… of …)`), sauf mécanisme distinct, explicitement défini avec son propre calcul. Barème :

| Élément de la signature | Contribution |
| --- | --- |
| `&` hors scope (classe ROCS) | (0,1,0) |
| `&` dans un scope | (0,0,0) |
| ancêtre `html[…]` ou `body[…]` | (0,1,1) |
| ancêtre `:root[…]` ou `.Classe[…]` | (0,2,0) |
| chaque `state` | +(0,1,0) |
| `part` | +(0,0,1) |

Informatif : avec le plafond (0,3,0) de la configuration Stylelint de référence ROCS, on peut cumuler au plus deux `state` hors scope, ou un scope suivi d'un seul `state`. Un `part` ne s'ajoute alors qu'à une signature de spécificité strictement inférieure à (0,3,0).

**I22.** Seul le reset de `bootstrap` (§1.3) PEUT émettre `!important` (ROCS §6.1).

### Vérifiabilité

**I23.** Chaque famille de combinators DOIT posséder un point d'entrée distinct. Une couche soumise à une restriction de famille DOIT importer directement le point d'entrée autorisé et NE DOIT importer aucun module agrégateur exposant des familles supplémentaires. Les dépendances transitives de ce point d'entrée DOIVENT respecter la même restriction. Ainsi, `bootstrap` → `context` est vérifiable par l'analyse des `@use` et `@forward`.

## 4. Correspondance avec ROCS

Dans cette section et en I19, `state/pseudo-classe`, `state/attribut` et `part/pseudo-élément` désignent des **mécanismes** (famille/mécanisme du tableau I12), non des identifiants Sass. Les identifiants des canoniques sont `pseudo-class`, `attribute` et `pseudo-element`.

Chaque forme de sélecteur que le framework peut produire correspond à une exception explicite de ROCS §6.2.2 ; aucune autre n'est atteignable. Cette section est informative.

| Construction du framework | Sélecteur produit | Disposition ROCS |
| --- | --- | --- |
| `state/pseudo-classe` | `.C:hover`, `.C:disabled`, `.C:first-child` | §6.2.2 (1) pseudo-classes |
| `state/attribut` (natif, ARIA) | `.C[disabled]`, `.C[aria-expanded="true"]` | §6.2.2 (2), §3.5 |
| `state/attribut` (`data-*`) | `.C[data-state="open"]` | §6.2.2 (3) état dynamique sur l'élément lui-même |
| `part/pseudo-élément` | `.C::before` | §6.2.2 (1), §3.6.3 |
| `scope`, ancêtre de classe | `.B-list[data-x="1"] :where(.B-item)` | §6.2.2 (3) métadonnée locale, profondeur 2 |
| `scope`, ancêtre global | `body[data-device-type="mobile"] :where(.C)` | §6.2.2 (4) métadonnée globale, profondeur 2 |
| `bootstrap` qualifié (I6 bis) | `:root[data-theme="dark"] { --x: … }` | §4.7 métadonnée globale |
| reset de `bootstrap` (§1.3) | `html`, `body`, `*`, … avec `!important` éventuel | §6.1 (4) |

Doctrine : pour un état natif qui dispose d'une pseudo-classe (`:disabled`, `:checked`), le mécanisme `pseudo-class` DEVRAIT être préféré. Le mécanisme `attribute` est réservé aux attributs ARIA, aux `data-*` dynamiques et aux attributs sans pseudo-classe équivalente, afin d'éviter deux signatures concurrentes pour une même sémantique.

### Ce que le framework ne couvre pas

- **Composants tiers** (ROCS §6.2.2 (5)) : les sélecteurs descendants ancrés sur le Block wrapper relèvent uniquement de la couche de consommation. I19 interdit au framework de les produire.
- **État dynamique d'un Block vers ses Elements** : ROCS §6.2.2 (3) ne l'autorise que sur l'élément lui-même. Un ancêtre de `scope` porté par une classe DOIT donc exprimer une métadonnée contextuelle, pas un état dynamique.

### Pourquoi I6 bis plutôt qu'un `scope` de thème

Un thème surchargé par tokens vit dans la cascade des custom properties : un seul sélecteur par contexte, dans `bootstrap`, et aucun sélecteur supplémentaire par composant. Un `scope` de thème multiplierait les sélecteurs de profondeur 2 et consommerait le budget de spécificité (I21). `scope` reste réservé à ce qu'un token ne peut pas exprimer, comme un changement de layout.
