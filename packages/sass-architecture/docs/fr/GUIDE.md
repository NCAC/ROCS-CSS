# Framework SCSS - Guide d'explication pour développeur front junior

> Ce document explique la théorie du framework SCSS avec des mots simples. Il ne remplace pas le document de référence « Framework SCSS — Bases conceptuelles » (`SPECIFICATION.md` dans le package `@rocss/sass-architecture`), qui fait foi : en cas de doute ou d'écart, c'est lui qui s'applique. Les renvois « I1 », « I12 »… désignent ses invariants.
>
> Les exemples utilisent les noms des combinators canoniques fixés par I12 (`media`, `pseudo-class`, `ancestor`…), tels qu'implémentés dans `@rocss/sass`. Les `@use "pkg:…"` supposent l'importeur de packages Node de Dart Sass (`--pkg-importer=node`). Les autres noms (`heading_large`, `margin_small`…) sont des illustrations : ils relèvent de la partie pratique de chaque projet.
>
> Convention de casse (§0.3) : les mixins **du framework** sont en kebab-case, comme `sass:list` ou `sass:meta` (`state.pseudo-class`) ; les mixins **d'un projet** sont en snake_case (`from_wide`, `heading_large`). En lisant `@include`, on sait ainsi tout de suite si l'on appelle une brique de bas niveau ou un symbole du projet. Attention : Sass considère `-` et `_` comme identiques, c'est donc une convention de lecture, pas une vérification du compilateur.

## 1. Quel problème ce framework cherche-t-il à résoudre ?

Quand un projet grandit, les fichiers SCSS ont tendance à mélanger :

- les valeurs de design ;
- les calculs ;
- les déclarations CSS ;
- les règles responsive ;
- les composants ;
- les sélecteurs métier.

Au bout de quelques mois, il devient difficile de savoir :

- où ajouter une nouvelle règle ;
- où modifier une valeur ;
- quelles dépendances sont autorisées ;
- ce qui est réutilisable ou non.

L'objectif de ce framework est donc de séparer clairement les responsabilités. Chaque couche a un rôle précis et ne fait qu'une seule chose.

## 2. L'idée fondamentale

Le framework produit des briques réutilisables : des valeurs, des fonctions et des mixins.

Il ne connaît jamais le HTML de votre application.

Par exemple, le framework sait définir :

```scss
@include heading_large();
```

mais il ne sait pas si cette typographie sera utilisée pour :

```html
<h1 class="ProductSheet-title">
```

ou :

```html
<h2 class="ArticleTeaser-heading">
```

Cette décision appartient au projet, dans la **couche de consommation**, qui doit respecter ROCS.

On sépare donc :

```text
Framework
↓
capacités réutilisables

Projet (couche de consommation, conforme ROCS)
↓
sélecteurs métier
```

Attention : le CSS produit quand on inclut un mixin du framework dans une règle du projet est du CSS applicatif ROCS. Le framework doit donc produire uniquement des sélecteurs que ROCS autorise (§1, §4 du document de référence).

Le framework n'émet que deux sortes de sélecteurs :

1. des **transformations relatives** du sélecteur courant `&` (`&:hover`, `&::before`, `<ancêtre> :where(&)`…), produites par les combinators ;
2. les **sélecteurs absolus** de `bootstrap`, qui ne visent que le document (`:root`, `html`, `body`, reset).

Jamais de classe ni d'`id` écrits par le framework, et de balises seulement dans `bootstrap` (`html`, `body` et le reset).

## 3. Vue d'ensemble des couches

```text
tokens → primitives → { behaviors | combinators } → components

globals      (terminale)
bootstrap    (terminale)
```

Points importants :

- les dépendances vont toujours dans le même sens ;
- `behaviors` et `combinators` sont **sœurs** : un behavior n'utilise jamais un combinator, et inversement. Seul `components` assemble les deux ;
- `globals` et `bootstrap` sont **terminales** : personne ne les importe (I1).

L'ordre du schéma ne suffit pas. Ce que chaque couche a le droit d'importer est fixé par un tableau normatif (§2 du document de référence) :

| Couche | Peut consommer |
| --- | --- |
| `tokens` | rien |
| `primitives` | tokens |
| `behaviors` | tokens, primitives |
| `combinators` | tokens, primitives, le canonique de son propre mécanisme |
| `components` | toutes les couches de la chaîne |
| `globals` | tokens, primitives |
| `bootstrap` | tokens, primitives, combinators `context` |

Cette règle est vérifiable mécaniquement : il suffit de lire les `@use` et `@forward` (I23).

## 4. Les tokens

Les tokens sont uniquement des valeurs nommées. La couche `tokens` ne produit que des variables Sass : elle n'émet aucun CSS (I2).

Ils répondent à la question :

> Quelle est la valeur officielle du système ?

Un token existe sous deux formes (I4) :

- le **nom** de sa custom property, c'est-à-dire son identifiant CSS, par exemple `--color-primary` ;
- l'**alias** `var(--color-primary)`.

Le nom ne s'utilise que dans les deux couches qui déclarent le token au moteur CSS :

- `bootstrap`, qui lui **affecte** sa valeur ;
- `globals`, qui peut l'**enregistrer** avec `@property`.

Partout ailleurs, on consomme l'alias.

L'affectation d'une custom property de token se fait toujours dans `bootstrap` (I3) : c'est la seule couche qui connaît à la fois les tokens et les primitives et qui a le droit d'écrire un sélecteur. Si le token est enregistré avec `@property`, son `initial-value` doit venir de la **même variable Sass** que la valeur par défaut émise par `bootstrap` (I4).

Les modules de `tokens` ne dépendent pas les uns des autres. Un fichier index peut les réexporter, sans en consommer aucun (I7).

### Un token dont la valeur change selon le contexte (I6)

Une marge peut valoir `0.75rem` sur petit écran et `1rem` sur grand écran. Ça reste **un seul token** : une seule custom property, un seul alias. Le contexte ne change pas son identité, seulement sa valeur dans la cascade.

On ne crée donc pas `--margin-sm-mobile`, `--margin-sm-tablet`, `--margin-sm-desktop`. Ces noms décriraient des valeurs successives d'un même concept.

Chaque couche a son rôle :

```text
tokens       → identité du token, alias et valeurs nommées
primitives   → comment une valeur peut être calculée
context      → dans quelle condition elle varie
bootstrap    → où sa valeur initiale et ses surcharges sont émises
consommation → utilisation de l'alias stable
```

**1. Définition du token (`tokens`)**

```scss
$margin_sm_name: --margin-sm;
$margin_sm: var(--margin-sm);

$margin_sm_default_value: 0.75rem;
$margin_sm_wide_value: 1rem;

$wide_breakpoint: 64rem;
```

**2. Combinator de contexte (`combinators`)** : il connaît la condition, pas le token. C'est une **spécialisation** du canonique `media` (voir §7).

```scss
@use "pkg:@rocss/sass/context";

@mixin from_wide {
  @include context.media("(min-width: #{$wide_breakpoint})") {
    @content;
  }
}
```

Dans un prélude de `@media`, CSS ne résout pas `var()`. La valeur du breakpoint vient donc d'une variable Sass de `tokens`, jamais d'un littéral écrit sur place (I5).

**3. Émission (`bootstrap`)**

```scss
:root {
  #{$margin_sm_name}: $margin_sm_default_value;

  @include from_wide {
    #{$margin_sm_name}: $margin_sm_wide_value;
  }
}
```

```css
:root {
  --margin-sm: 0.75rem;
}

@media (min-width: 64rem) {
  :root {
    --margin-sm: 1rem;
  }
}
```

**4. Consommation (`behaviors`)** : elle n'utilise que l'alias.

```scss
@mixin margin_small {
  margin: $margin_sm;
}
```

```css
margin: var(--margin-sm);
```

Le behavior ignore volontairement les valeurs concrètes, le breakpoint, la condition qui choisit la valeur active et le nombre de surcharges.

### Un token qui change selon le thème (I6 bis)

Une préférence de thème pilotée côté client (`data-theme="dark"` sur `body`, par exemple) est une **métadonnée contextuelle globale** au sens de ROCS §4.7. Le token reste unique : `bootstrap` émet simplement une surcharge sur un sélecteur de forme `(:root | html | body)[data-*]`.

```scss
:root[data-theme="dark"] {
  #{$color_surface_name}: $color_surface_dark_value;
}
```

L'attribut doit représenter une métadonnée du document ou de l'environnement de rendu, jamais l'état d'un composant ni une donnée métier locale. C'est la seule qualification permise pour les sélecteurs d'émission de tokens dans `bootstrap`. Quand une variation peut s'exprimer par un token, on préfère cette voie à un `scope` dans un component : un seul sélecteur par contexte, et aucun coût de spécificité pour les composants (§4 du document de référence).

## 5. Les primitives

Les primitives réalisent des calculs.

Elles ne produisent pas de CSS.

Une primitive est toujours une fonction Sass (`@function`) : jamais de `@mixin`, de `@content`, de sélecteur ni de propriété émise (I8).

## 6. Les behaviors

Les behaviors produisent directement des propriétés CSS, à l'endroit exact où on les inclut.

Un behavior doit rester atomique (I9) :

- pas de `&` ;
- pas de sélecteur ;
- pas de `@content` ;
- pas d'at-rule conditionnelle ou contextuelle (`@media`, `@supports`, `@container`…).

Les at-rules de diagnostic (`@debug`, `@warn`, `@error`) restent permises, car elles n'émettent pas de CSS.

Un behavior n'inclut jamais un autre behavior (I10), même si l'assemblage ne fait que deux lignes. Dès qu'on assemble, on écrit un component.

## 7. Les combinators

Les combinators modifient le contexte d'exécution d'un bloc de contenu.

Quatre familles existent (I12) :

- `context` : enveloppe le contenu dans `@media`, `@supports` ou `@container`, sans toucher à `&` ;
- `state` : ajoute une pseudo-classe ou un attribut à `&` (`&:hover`, `&[aria-expanded="true"]`…) ;
- `scope` : replace `&` sous un ancêtre (`<ancêtre> :where(&)`) ;
- `part` : ajoute un pseudo-élément à `&` (`&::before`).

Un combinator ne fournit jamais un sélecteur autonome : il applique une **transformation relative** au sélecteur courant `&`. Ce `&` doit être un sélecteur composé sans combinateur ; en ROCS, c'est toujours une classe unique, donc la condition est remplie d'office (§1.2).

### Le combinator canonique

Dans une famille, il peut exister plusieurs **mécanismes**. Chaque mécanisme a **un seul combinator canonique**, qui prend son argument en paramètre. Son nom est l'**identifiant** du mécanisme, et aucun autre combinator ne peut porter ce nom (I12) :

```text
context/media          → media($condition)
context/supports       → supports($condition)
context/container      → container($condition)

state/pseudo-classe    → pseudo-class($pseudo)
state/attribut         → attribute($name, $value)

scope/ancêtre          → ancestor($ancestor)

part/pseudo-élément    → pseudo-element($pseudo)
```

Pour un état natif qui a une pseudo-classe (`:disabled`, `:checked`), on préfère `pseudo-class` ; `attribute` sert aux attributs ARIA, aux `data-*` dynamiques et aux attributs sans pseudo-classe équivalente. Ainsi, une même sémantique n'a pas deux signatures concurrentes.

L'argument d'un canonique doit avoir un domaine fermé ou être validé avant émission. Par exemple, `pseudo-class` refuse `:is()`, `:not()`, `:has()`, `:where()` et `:nth-child(… of …)` : ces pseudo-classes prennent un sélecteur en argument, et leur spécificité ne peut pas être bornée (I21).

### Le combinator `scope`

L'ancêtre d'un `scope` est un **argument** : le framework ne connaît aucun nom de sélecteur métier (I19). Cet ancêtre doit être un sélecteur composé unique, sans combinateur, de forme `<racine>[<attribut>]`, où `<racine>` est `html`, `body`, `:root` ou une classe.

Côté projet, c'est le consommateur qui nomme l'ancêtre :

```scss
@use "pkg:@rocss/sass/scope";

.ProductCard-gallery {
  @include scope.ancestor('body[data-device-type="mobile"]') {
    // déclarations propres au mobile
  }
}
// produit : body[data-device-type="mobile"] :where(.ProductCard-gallery) { … }
```

`:where()` a une spécificité nulle : la complexité du sélecteur consommateur n'influence jamais la spécificité du scope. Seul l'ancêtre compte.

Un ancêtre porté par une classe doit exprimer une **métadonnée contextuelle**, pas un état dynamique : ROCS §6.2.2 (3) n'autorise l'état dynamique que sur l'élément lui-même (§4 du document de référence).

### Les spécialisations

Tous les autres combinators sont des **spécialisations directes** d'un canonique : ils fixent l'argument et délèguent.

```scss
@use "pkg:@rocss/sass/context";

// Spécialisation du canonique context/media
@mixin from($breakpoint) {
  @include context.media("(min-width: #{$breakpoint})") {
    @content;
  }
}
```

Une spécialisation doit (I13, I14) :

- appeler **directement** le canonique de **son propre mécanisme** (jamais celui d'un autre) ;
- transmettre `@content` en entier, sans rien ajouter autour ;
- ne jamais appeler une autre spécialisation (pas de `from` qui s'appuie sur `desktop`, par exemple).

Si on veut combiner deux mécanismes, même dans la même famille (`media` + `supports`), ce n'est plus une spécialisation mais une **composition** : elle va dans `components`.

### Règles à retenir

- `@content` est **obligatoire** dans un combinator et transmis **exactement une fois** dans chaque branche d'exécution valide (I11). Un combinator ne produit aucune déclaration par lui-même.
- Quand on imbrique, l'ordre va de l'extérieur vers l'intérieur : `context` → `scope` → `state` → `part` (I15). On peut imbriquer plusieurs `context` et appliquer plusieurs `state`, mais une signature ne contient qu'**un seul** `scope` et **un seul** `part`.
- Un combinator n'utilise jamais un behavior ni un component (I16).

Pourquoi `state` sous `scope`, et pas l'inverse ? `state` sous `scope` donne `.T :where(.C):hover`, qui reste plus spécifique que `.T :where(.C)`. L'ordre inverse donnerait `.T :where(.C:hover)` et ferait disparaître cet écart. `part` vient en dernier, car un pseudo-élément termine le sélecteur.

```scss
.ProductCard-title {
  @include context.media("(min-width: 48rem)") {
    @include state.pseudo-class("hover") {
      text-decoration: underline;
    }
  }
}
```

### Le budget de spécificité (I21)

La spécificité de chaque sélecteur produit doit pouvoir se calculer à la lecture de la composition :

| Élément | Contribution |
| --- | --- |
| `&` hors scope (classe ROCS) | (0,1,0) |
| `&` dans un scope | (0,0,0) |
| ancêtre `html[…]` ou `body[…]` | (0,1,1) |
| ancêtre `:root[…]` ou `.Classe[…]` | (0,2,0) |
| chaque `state` | +(0,1,0) |
| `part` | +(0,0,1) |

Avec le plafond (0,3,0) de la configuration Stylelint ROCS, on peut cumuler au plus deux `state` hors scope, ou un scope suivi d'un seul `state`. Un `part` ne s'ajoute qu'à une signature strictement sous (0,3,0).

### Un point d'entrée par famille (I23)

Chaque famille a son propre point d'entrée (`/context`, `/state`, `/scope`, `/part`). Une couche limitée à une famille, comme `bootstrap` avec `context`, importe directement ce point d'entrée, jamais un module qui exposerait aussi les autres familles.

## 8. Les components

Les components servent à assembler plusieurs behaviors et/ou plusieurs mécanismes de combinators.

Dès qu'il y a composition, nous sommes dans `components`. Cette couche est la seule autorisée à composer (I17). Ne sont pas des compositions : une spécialisation transparente (I13), et l'usage de `context` par `bootstrap` pour émettre un token.

`@content` y est **facultatif** (I11) : un component peut être _fermé_ (`@include card();`, composition figée) ou _ouvert_ (`@include card() { … }`, composition extensible).

Son nom décrit une **forme générique** (`card`, `stack`) : une garantie de rendu indépendante de toute entité métier, fonctionnalité applicative ou contexte produit, comme `product-card` (I18). Ce contrôle est sémantique, le nom seul ne suffit pas.

## 9. Les globals

Cette couche contient les déclarations globales **sans sélecteur** :

```scss
@keyframes
@font-face
@property
```

Ces règles déclarent des symboles globaux réutilisables. `globals` est la seule couche autorisée à les émettre (I2). Elle ne consomme que `tokens` et `primitives`.

## 10. Le bootstrap

Le bootstrap est le point terminal du système.

Il contient notamment :

```scss
:root
html
body
```

ainsi que le reset.

Le bootstrap peut utiliser les `tokens`, les `primitives` et les combinators de famille `context` (pour émettre les surcharges d'un token selon le contexte, voir I6). Il n'utilise ni les combinators `state`, `scope` ou `part`, ni les behaviors, ni les components.

Ses sélecteurs d'émission de tokens peuvent être qualifiés par un attribut de métadonnée contextuelle globale, sous la forme `(:root | html | body)[data-*]` (I6 bis).

Le **reset** est le seul endroit où le framework cible des éléments natifs (§1.3 du document de référence). Ses sélecteurs sont des listes de sélecteurs universels ou de type, éventuellement avec `::before` ou `::after`, sans classe, `id`, attribut, combinateur ni pseudo-classe fonctionnelle :

```scss
*, *::before, *::after { box-sizing: border-box; }   // conforme
button, input, textarea, select { font: inherit; }   // conforme
form input { font: inherit; }                        // non conforme : combinateur
```

Seul le reset de `bootstrap` peut utiliser `!important` (I22, ROCS §6.1).

## 11. Pourquoi les sélecteurs métier sont interdits ?

Le framework ne doit jamais dépendre du métier du projet.

Les sélecteurs métier appartiennent toujours à la couche de consommation du projet.

Cela vaut aussi pour les enfants (I19), y compris lorsque la construction interdite viendrait de l'expansion d'un mixin plutôt que de son texte. Un mixin du framework n'écrit jamais `h2`, `.icon` ou `.ArticleTeaser-title`, **même si le nom vient d'une source externe** (contenu éditorial, sprite SVG…). Il n'écrit pas non plus de combinateur CSS (descendant, `>`, `+`, `~`) en dehors de la forme canonique `scope` : `& > *` est donc interdit.

Les pseudo-classes structurelles (`:first-child`, `:nth-child()`…) restent possibles, mais uniquement sur `&` lui-même, via le canonique `state.pseudo-class`.

Pour un layout, on passe par les propriétés du conteneur (`gap`, grid, flex), et chaque enfant stylé porte sa propre classe ROCS.

Le contrat entre le contenu et le framework s'écrit donc côté projet :

```scss
// Couche de consommation (projet)
.RichText-subTitle {
  @include heading_level_2;
}
```

Jamais l'inverse : le framework ne contient pas `<selecteur> { @include heading_level_2; }` en dur.

## 12. Pourquoi tout passe par les tokens ?

Une valeur codée en dur est figée à la compilation.

Une custom property permet au contraire les surcharges runtime, les thèmes et les personnalisations. C'est pourquoi, hors émission, une valeur se consomme via son alias `var(--nom)` (I5).

Exceptions : les endroits où CSS ne résout pas `var()` :

- préludes de `@media`, `@container` et `@supports` ;
- descripteurs de `@font-face` ;
- `syntax` et `initial-value` de `@property`.

Là, on utilise une variable Sass de `tokens`, jamais un littéral écrit sur place.

## 13. Les dépendances externes

Une dépendance externe est classée selon **ce qu'elle fait**, pas selon son origine (I20).

Les modules Sass purs sont orthogonaux aux couches tant qu'ils ne produisent que des valeurs :

```scss
sass:math
sass:string
sass:list
sass:map
```

Une bibliothèque tierce, elle, n'apporte aucune exemption : si une couche utilise un de ses mixins ou une de ses fonctions, ce symbole doit respecter les règles de cette couche. Un mixin tiers qui écrit des sélecteurs ne peut donc pas être utilisé dans un behavior.

Un appel dynamique via `sass:meta` (par exemple `meta.apply()`) compte comme un appel direct au symbole qu'il résout.

## Résumé

| Je veux... | Couche |
| --- | --- |
| stocker une valeur | tokens |
| faire un calcul | primitives |
| écrire des propriétés CSS atomiques | behaviors |
| modifier un contexte ou transformer `&` | combinators |
| assembler plusieurs briques | components |
| déclarer un symbole global sans sélecteur | globals |
| affecter les tokens et écrire le CSS global de `:root`, `html`, `body` | bootstrap |

> Une couche = une responsabilité. Toute responsabilité doit être identifiable et vérifiable mécaniquement.
