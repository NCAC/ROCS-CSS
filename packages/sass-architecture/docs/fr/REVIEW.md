# Revue contradictoire des invariants du framework SCSS

## Statut du document

Ce document constitue une **revue contradictoire** du fichier source :

```text
Framework SCSS — Bases conceptuelles.md
```

Il est destiné à être transmis à un agent LLM travaillant directement sur le dépôt.

L'objectif n'est pas de réécrire immédiatement l'ensemble de la théorie, mais de :

1. confronter chaque invariant à des contre-exemples ;
2. repérer les ambiguïtés, contradictions, redondances et échappatoires ;
3. distinguer les défauts bloquants des simples durcissements rédactionnels ;
4. proposer des reformulations normatives ciblées ;
5. fournir une base de travail pour une future mise à jour du document source.

## Consignes pour l'agent

L'agent doit considérer le document source comme la référence normative actuelle et la présente revue comme une **analyse critique**, non comme une nouvelle spécification déjà adoptée.

Avant toute modification :

1. retrouver chaque invariant dans sa formulation exacte ;
2. vérifier les relations entre l'invariant, le tableau des dépendances, les définitions de couches, les exemples et la correspondance avec ROCS ;
3. ne pas appliquer isolément une correction qui créerait une contradiction ailleurs ;
4. préserver la séparation entre théorie stable et configuration propre à une implémentation ;
5. conserver le caractère vérifiable et, autant que possible, automatisable des règles.

Les verbes normatifs `DOIT`, `NE DOIT PAS`, `PEUT` et leurs variantes doivent conserver leur portée stricte.

---

# 1. Verdict général

Le socle conceptuel est solide, mais la spécification n'est pas encore totalement fermée.

## Classement synthétique

### Invariants robustes

- I1
- I2
- I8
- I10
- I14
- I16
- I18
- I22

### Invariants à préciser

- I4
- I6
- I6 bis
- I7
- I9
- I13
- I15
- I17
- I23

### Invariants présentant une faille ou une contradiction réelle

- I3
- I5
- I11
- I12
- I20
- I21

### Incohérence supplémentaire

La correspondance avec ROCS autour de `state/attribute` et de `:disabled` doit être corrigée.

## Trois problèmes structurants

1. Les pseudo-classes fonctionnelles rendent I21 faux dans sa formulation actuelle.
2. I20 permet implicitement à une dépendance tierce de contourner les invariants d'une couche.
3. I12 affirme que les quatre familles de combinators opèrent sur `&`, alors que les combinators de contexte enveloppent `@content` sans transformer `&`.

---

# 2. Revue détaillée des invariants

## I1. Dépendances autorisées

### Intention examinée

Une couche ne doit consommer que les couches autorisées par sa ligne du tableau des dépendances.

### Tentative de réfutation

Une couche peut respecter ses imports directs tout en consommant transitivement une couche interdite :

```text
behaviors → primitives → bibliothèque tierce → module émetteur
```

Les `@use` internes peuvent sembler conformes alors qu'une dépendance externe émet du CSS ou importe indirectement un module interdit.

### Verdict

Robuste dans le périmètre interne, mais incomplet sans articulation avec I20.

### Reformulation proposée

> **I1.** Une couche NE DOIT dépendre, directement ou transitivement, que des couches autorisées par sa ligne du tableau des dépendances. Aucune couche NE DOIT dépendre, directement ou transitivement, de `globals` ni de `bootstrap`.

Le caractère transitif est important, même si une première vérification mécanique ne porte que sur les `@use` directs.

---

## I2. Émission autonome

### Tentative de réfutation

Un module `behaviors` contenant seulement un mixin n'émet rien lors de son chargement, mais produit des déclarations lors de son inclusion. Il ne s'agit donc pas d'une émission autonome.

Le même raisonnement s'applique aux combinators.

### Verdict

Robuste, à condition de définir explicitement le terme « autonome ».

### Définition proposée

> Une émission est autonome lorsqu'elle se produit au chargement du module, sans appel explicite d'une API par la couche de consommation.

Cette définition distingue clairement :

- l'émission au chargement ;
- l'émission différée par `@include`.

---

## I3. Émission d'un token calculé

### Contre-exemple

`globals` peut consommer `tokens` et `primitives`, puis émettre :

```scss
@property --spacing-fluid {
  syntax: "<length>";
  inherits: true;
  initial-value: fluid-value(...);
}
```

`initial-value` est une valeur calculée et une émission CSS. Cependant, le modèle peut exiger que cette valeur provienne de la même variable Sass que la valeur par défaut émise dans `bootstrap`.

### Contradiction

I3 affirme que l'émission calculée se fait dans `bootstrap`, tandis que le modèle autorise, voire impose, une valeur calculée dans `globals` pour `@property`.

### Verdict

Correction impérative.

### Reformulation proposée

> **I3.** L'affectation d'une custom property représentant un token DOIT être émise dans `bootstrap`. Lorsqu'un token est enregistré par `@property`, `globals` PEUT également émettre sa valeur initiale conformément à I4. Aucune autre couche NE DOIT déclarer ni enregistrer un token.

La règle vise ainsi l'opération réelle, c'est-à-dire **l'affectation du token dans la cascade**, plutôt que toute apparition d'une valeur calculée.

---

## I4. Nom brut et alias

### Problème terminologique

Le « nom brut » peut désigner plusieurs notions :

```scss
$token-name: --spacing-small;
$token-alias: var(--spacing-small);
```

Une fonction Sass peut également construire la référence à partir de l'identifiant :

```scss
@function token-reference($name) {
  @return var(#{$name});
}
```

Il devient alors difficile de déterminer si `primitives` consomme un nom brut ou produit seulement une référence.

### Verdict

Conceptuellement juste, mais lexicalement ambigu.

### Vocabulaire proposé

Distinguer explicitement :

- **identifiant CSS du token** : `--spacing-small` ;
- **référence CSS au token** : `var(--spacing-small)` ;
- **valeur par défaut du token** : par exemple `1rem`.

### Reformulation proposée

> L'identifiant CSS d'un token NE DOIT être exposé qu'aux API chargées de sa déclaration, de son enregistrement ou de son interrogation explicite. Les autres API consomment une référence CSS déjà construite.

---

## I5. Consommation de la référence et exceptions

### Objection

La formule « les contextes où CSS ne résout pas `var()` » est trop générale.

Dans `@supports`, la situation dépend de la nature exacte de la condition :

```scss
@supports (display: grid) { }
@supports (color: var(--color)) { }
@supports selector(:has(*)) { }
```

Les préludes de `@media`, `@container` et `@supports` n'obéissent pas tous aux mêmes contraintes.

Certaines requêtes de style de conteneur peuvent par ailleurs interroger directement une custom property :

```scss
@container style(--theme: dark) {
  // ...
}
```

Dans ce cas, l'identifiant de la custom property fait partie de la condition. Il ne s'agit ni d'une valeur figée, ni d'une tentative de résolution par `var()`.

### Verdict

Faux par généralisation excessive.

### Reformulation proposée

> **I5.** Une valeur destinée à une déclaration CSS DOIT être consommée par sa référence CSS afin de rester résolue à l'exécution. Lorsqu'une syntaxe CSS attend une valeur au moment de l'analyse de la règle et n'admet pas une référence `var()`, cette valeur DOIT provenir de `tokens`, directement ou après calcul par `primitives`.
>
> L'identifiant d'une custom property PEUT apparaître dans une syntaxe qui interroge ou enregistre cette propriété, notamment `@property` et les requêtes de style de conteneur. Cet usage ne constitue pas une consommation de sa valeur.

Cette formulation évite d'établir une liste figée d'at-rules dont les capacités peuvent évoluer.

---

## I6. Identité stable du token

### Tentative de réfutation

Le principe d'identité stable est solide. En revanche, dire que `tokens` définit « ses valeurs possibles » peut conduire cette couche à connaître tous les contextes d'un projet.

La séparation souhaitable semble plutôt être :

- `tokens` expose les valeurs nommées ;
- `bootstrap` choisit la valeur affectée dans chaque contexte ;
- le token ne connaît pas nécessairement la totalité de ses variations futures.

### Verdict

Robuste sur l'identité, trop prescriptif sur la distribution des valeurs.

### Reformulation proposée

> `tokens` définit l'identité du token, sa référence CSS et les valeurs nommées nécessaires à son émission ; il ne définit aucune règle de sélection contextuelle.

---

## I6 bis. Métadonnée contextuelle globale

### Tentative de réfutation

La forme suivante peut être imposée :

```text
(:root | html | body)[data-*]
```

Elle exclut un sélecteur local tel que :

```scss
[data-theme="dark"]
```

mais autorise syntaxiquement :

```scss
body[data-product-id="123"]
```

La forme syntaxique ne suffit donc pas à prouver que l'attribut représente une métadonnée globale.

### Verdict

Correct architecturalement, mais la propriété « globale » ne peut pas être déduite du seul sélecteur.

### Renforcement proposé

> L'attribut DOIT représenter une métadonnée applicable au document ou à l'environnement global de rendu, et non l'état dynamique d'un composant ou une donnée métier locale.

La formule « seule qualification de sélecteur autorisée dans `bootstrap` » peut également entrer en tension avec les sélecteurs du reset.

### Reformulation plus précise

> Cette forme est la seule qualification autorisée pour les sélecteurs d'émission de tokens dans `bootstrap`.

---

## I7. Indépendance des fichiers de tokens

### Objection

L'expression « les seuils de breakpoint peuvent être consommés par leurs pairs » peut autoriser des dépendances mutuelles :

```text
breakpoints-a → breakpoints-b
breakpoints-b → breakpoints-a
```

L'exception peut donc détruire l'indépendance et créer un cycle.

De plus, le fait que les breakpoints soient la seule catégorie autorisée à partager des valeurs semble relever d'une configuration particulière plutôt que de la théorie générale.

### Verdict

À préciser, voire à sortir des invariants fondamentaux.

### Option stricte recommandée

> **I7.** Les modules de `tokens` NE DOIVENT pas dépendre les uns des autres.

Les regroupements, index et alias éventuels sont alors définis dans un module d'exposition distinct, qui ne doit pas réintroduire de dépendance inverse.

### Option alternative

> **I7.** Les dépendances entre modules de `tokens` DOIVENT former un graphe acyclique. Un module de tokens NE DOIT dériver aucune valeur d'un autre module s'il peut recevoir directement cette valeur depuis la configuration.

L'option stricte est préférable car elle est plus nette et plus facilement vérifiable.

---

## I8. Pureté des primitives

### Tentative de réfutation

Une fonction Sass peut accéder à une configuration globale, déclencher des diagnostics ou appeler une fonction tierce. Elle peut néanmoins continuer à retourner uniquement une valeur et à n'émettre ni sélecteur ni déclaration CSS.

### Verdict

Robuste, sous réserve de la correction de I20.

### Définition proposée

> À arguments et configuration identiques, une primitive produit la même valeur et ne provoque aucune émission CSS.

---

## I9. Behavior output-only

### Contre-exemple

Le behavior suivant respecte littéralement une interdiction limitée à `&`, aux sélecteurs et à `@content` :

```scss
@mixin responsive-padding {
  @media (width >= 40rem) {
    padding: 2rem;
  }
}
```

Il ne contient ni `&`, ni sélecteur, ni `@content`. Pourtant, il absorbe un mécanisme de contexte qui devrait appartenir à `combinators`, puis être assemblé par `components`.

### Verdict

Faille réelle dans la formulation.

### Reformulation proposée

> **I9.** Un behavior est output-only : il NE DOIT contenir ni `&`, ni sélecteur, ni `@content`, ni at-rule conditionnelle ou contextuelle. Il produit exclusivement un ensemble de déclarations à l'endroit exact de son inclusion.

La spécification doit également décider si les at-rules de diagnostic comme `@debug`, `@warn` et `@error` sont admises. Elles peuvent être autorisées sans changer la nature de la couche, à condition qu'elles n'émettent pas de CSS.

---

## I10. Non-composition des behaviors

### Tentative de réfutation

Un behavior peut déléguer à une fonction retournant une map, puis parcourir cette map pour émettre plusieurs propriétés. Cela ne constitue pas l'inclusion d'un autre behavior.

### Verdict

Robuste.

La frontière entre behavior atomique et ensemble cohérent de déclarations reste sémantique. Un behavior peut garantir une propriété composée ou un petit ensemble indissociable sans devenir un component.

---

## I11. Obligation de `@content`

### Contre-exemples

Le canonique suivant contient `@content`, mais l'exécute deux fois :

```scss
@mixin media($condition) {
  @media #{$condition} {
    @content;
    @content;
  }
}
```

Autre cas :

```scss
@mixin media($condition, $enabled: true) {
  @if $enabled {
    @media #{$condition} {
      @content;
    }
  }
}
```

`@content` est présent, mais peut ne jamais être transmis.

### Verdict

Insuffisant pour garantir la transparence d'un combinator.

### Reformulation proposée

> **I11.** Un combinator DOIT accepter un bloc de contenu et le transmettre exactement une fois dans chaque branche d'exécution valide. Il NE DOIT produire aucune déclaration indépendante de ce contenu.

Si la duplication intentionnelle de contenu doit exister, elle doit être définie comme un mécanisme distinct. Dans le modèle actuel, elle paraît devoir rester interdite.

---

## I12. Familles et canoniques

### Première contradiction : tous les combinators n'opèrent pas sur `&`

Un combinator tel que :

```scss
@include media(...) {
  // ...
}
```

ne transforme pas `&`. Il enveloppe le contenu dans une at-rule.

### Deuxième faille : argument syntaxique non contraint

Un canonique de pseudo-classe peut théoriquement recevoir :

```scss
@include pseudo_class("not(.Other > .Child)") {
  // ...
}
```

Il peut alors produire un sélecteur contenant :

- une autre classe ;
- un combinateur ;
- une structure contraire à I19 ;
- une spécificité incompatible avec I21.

Le problème existe également avec :

```scss
@include pseudo_class("has(.Other)");
@include pseudo_class("nth-child(2 of .Featured)");
```

### Troisième faille : périmètre de l'unicité

La formule « chaque mécanisme possède un unique combinator canonique » ne précise pas le périmètre :

- par module ;
- par framework ;
- par espace de noms Sass ;
- dans la seule API publique.

### Verdict

Invariant central à durcir.

### Reformulation structurelle proposée

> **I12.** Les combinators appartiennent à quatre familles :
>
> - `context` enveloppe `@content` dans une at-rule sans transformer le sélecteur courant ;
> - `scope`, `state` et `part` transforment le sélecteur courant `&`.
>
> Chaque mécanisme possède exactement un canonique exposé par l'API publique du framework.

Ajouter ensuite :

> Les arguments d'un canonique NE DOIVENT permettre de produire aucune construction interdite par I15, I19 ou I21. Lorsqu'un argument est de nature syntaxique, son domaine admissible DOIT être fermé ou validé avant émission.

Sans cette fermeture, l'API canonique devient une porte d'injection de sélecteurs arbitraires.

---

## I13. Spécialisation d'un canonique

### Tentative de réfutation

« Transmettre intégralement `@content` » ne signifie pas nécessairement :

- exactement une fois ;
- sans contenu ajouté avant ou après ;
- sans altération conditionnelle.

La règle peut interdire une enveloppe ou une transformation supplémentaire sans interdire explicitement l'ajout de déclarations à l'intérieur du bloc transmis.

### Verdict

Solide dans l'intention, légèrement ambigu.

### Reformulation proposée

> La spécialisation DOIT déléguer exactement une fois au canonique, en lui transmettant `@content` sans ajout, suppression, duplication ni branchement supplémentaire.

---

## I14. Non-chaînage des spécialisations

### Tentative de réfutation

Une spécialisation peut reproduire elle-même l'argument d'une autre spécialisation sans la consommer. Cela crée une duplication, mais ne viole pas directement I14.

### Verdict

Robuste comme règle de dépendance.

La duplication d'arguments relève davantage de la qualité d'implémentation que de l'architecture fondamentale.

---

## I15. Ordre d'imbrication

### Première ambiguïté : répétition des contexts

La relation est définie entre familles :

```text
context ⊃ scope ⊃ state ⊃ part
```

mais pas au sein de `context` :

```scss
@media (...) {
  @supports (...) {
    @container (...) {
      // ...
    }
  }
}
```

L'ordre de ces contexts peut être sémantique. Si plusieurs contexts ont le même rang, il ne s'agit pas strictement d'un ordre total.

### Deuxième ambiguïté : profondeur des scopes

La formule « un scope ne doit pas être imbriqué dans un autre scope, profondeur 2 » peut être mal comprise. Un scope unique produit déjà une relation entre deux niveaux :

```scss
.Ancestor :where(.Current)
```

### Troisième ambiguïté : répétition des states

Si I21 envisage deux states hors scope, les states doivent pouvoir être composés :

```scss
.C:hover:focus-visible
```

Cette répétition doit être explicitement autorisée.

### Verdict

Concept pertinent, terminologie mathématique inexacte.

### Reformulation proposée

> **I15.** Les familles de transformation respectent la relation de précédence suivante :
>
> ```text
> context → scope → state → part
> ```
>
> Plusieurs combinators `context` PEUVENT être imbriqués. Leur ordre interne relève de leur sémantique CSS. Plusieurs `state` PEUVENT être appliqués successivement dans la limite de I21. Un seul `scope` et un seul `part` sont autorisés dans une même signature.

---

## I16. Isolation des combinators

### Verdict

Robuste.

Aucun contre-exemple sérieux ne subsiste si I20 interdit effectivement qu'une dépendance tierce introduise des émissions ou transformations non déclarées.

---

## I17. Exclusivité de composition des components

### Contre-exemples potentiels

`bootstrap` peut avoir besoin de composer plusieurs contexts :

```scss
@include media(...) {
  @include supports(...) {
    :root {
      --token: ...;
    }
  }
}
```

Or `bootstrap` est autorisé à consommer les combinators `context`.

Autre exception : une spécialisation consomme son canonique. Elle compose donc deux mixins au sens structurel, même si elle n'assemble qu'un seul mécanisme.

### Verdict

Ambigu autour du mot « composer ».

### Reformulation proposée

> **I17.** `components` est la seule couche autorisée à assembler plusieurs garanties de rendu destinées à la consommation applicative, notamment plusieurs behaviors ou plusieurs mécanismes de combinators.
>
> Ne constituent pas une composition de component :
>
> - la spécialisation transparente autorisée par I13 ;
> - l'usage de combinators `context` par `bootstrap` pour conditionner l'émission d'un token.

Sans cette exception, I17 et le tableau des dépendances peuvent entrer en tension.

---

## I18. Nom générique des components

### Tentative de réfutation

Des noms tels que :

```text
card
hero
toolbar
stack
cluster
media-object
```

peuvent désigner une forme générique ou devenir des rôles métier selon le projet.

La distinction ne peut pas être vérifiée uniquement par le nom.

### Verdict

Conceptuellement robuste, volontairement sémantique.

### Reformulation proposée

Remplacer « forme générique » par :

> une garantie de rendu générique indépendante de toute entité métier, fonctionnalité applicative ou contexte produit.

---

## I19. Interdiction des sélecteurs sémantiques

### Première observation

Le mixin canonique `scope` produit bien un combinateur descendant :

```scss
<ancêtre> :where(&)
```

L'exception prévue est donc nécessaire.

### Deuxième ambiguïté

Un mixin `component` n'écrit pas littéralement le combinateur, mais peut inclure `ancestor()`. Son expansion produit alors le combinateur.

La formulation « aucun mixin ne doit écrire » peut signifier :

- aucun mixin ne contient littéralement la syntaxe ;
- aucune expansion de mixin ne peut la produire, sauf via le canonique autorisé.

### Troisième faille

Les pseudo-classes fonctionnelles peuvent contourner l'interdiction :

```scss
@include pseudo_class("has(.Other > .Child)") {
  // ...
}
```

Le mécanisme `state` introduit alors indirectement classes et combinateurs.

### Verdict

I19 dépend d'une fermeture correcte du domaine des arguments de I12.

### Reformulation proposée

> Aucun argument fourni à un combinator NE DOIT contenir ni introduire un sélecteur sémantique, un combinateur ou une transformation relevant d'un autre mécanisme, sauf lorsque cette structure constitue précisément l'argument validé du canonique `scope`.

---

## I20. Dépendances externes orthogonales

### Contre-exemple décisif

Une bibliothèque tierce peut exposer :

```scss
@mixin button-component {
  .Button > span {
    color: red !important;
  }
}
```

Si un behavior l'inclut, l'usage de la dépendance :

- émet un sélecteur ;
- émet un combinateur ;
- utilise une classe ;
- utilise `!important` ;
- transforme le behavior en composition.

L'usage de la dépendance change donc la nature de la couche.

Même `sass:meta` peut permettre d'appeler dynamiquement des fonctions ou mixins dont la nature n'est pas garantie par le seul import.

### Verdict

Invariant faux en l'état et faille architecturale majeure.

### Reformulation proposée

> **I20.** Une couche PEUT consommer une dépendance externe uniquement si les symboles effectivement utilisés respectent les invariants de cette couche. Une dépendance externe ne confère aucune exemption aux règles d'émission, de dépendance ou de composition.
>
> Les modules Sass purs, tels que `sass:math`, `sass:string`, `sass:list` et `sass:map`, sont orthogonaux aux couches tant que leur usage produit uniquement des valeurs. Les mixins, fonctions ou modules tiers dont les effets ne sont pas garantis DOIVENT être qualifiés selon leur comportement réel.

### Principe à retenir

> **Une dépendance est classée par ses effets, non par son origine.**

---

## I21. Calcul statique de la spécificité

### Contre-exemple décisif

Le barème « chaque state ajoute `(0,1,0)` » est valable pour certains states :

```scss
:hover
:focus
:disabled
:nth-child(2)
```

Il ne l'est pas universellement pour :

```scss
:not(.Other)
:is(.A, #B)
:has(.Parent > .Child)
:nth-child(2 of .Featured)
:where(.Anything)
```

Les pseudo-classes fonctionnelles n'ont pas toutes une spécificité constante :

- `:is()`, `:not()` et `:has()` dépendent de leurs arguments ;
- `:where()` a une spécificité nulle ;
- `:nth-child(... of selector)` ajoute la spécificité de son argument sélecteur.

Exemple :

```scss
.C:not(#critical)
```

ne possède pas la spécificité :

```text
(0,2,0)
```

mais :

```text
(1,1,0)
```

Autre exemple :

```scss
.C:where(.Other)
```

conserve :

```text
(0,1,0)
```

et non :

```text
(0,2,0)
```

### Difficulté supplémentaire

Si la signature de composition contient seulement :

```text
state + state
```

elle ne suffit pas au calcul. Il faut connaître la syntaxe et les arguments exacts de chaque state.

### Verdict

Invariant faux en l'état. Il s'agit de l'un des points les plus importants de la revue.

### Solution A : fermer le canonique général

Interdire au canonique `pseudo_class` les pseudo-classes dont la spécificité dépend d'un sélecteur argument.

> Le canonique `pseudo_class` NE DOIT accepter aucune pseudo-classe dont la spécificité dépend d'un sélecteur argument, sauf si celle-ci fait l'objet d'un mécanisme distinct doté de son propre calcul statique.

Cette solution exclut notamment du canonique général :

- `:is()` ;
- `:not()` avec sélecteur ;
- `:has()` ;
- `:nth-child(... of ...)` ;
- `:nth-last-child(... of ...)`.

### Solution B : enrichir la signature

La signature pourrait contenir :

```text
state/not(.Classe)
state/has(.A > .B)
state/where(.Classe)
```

Le calcul reste alors possible, mais exige un véritable parseur de sélecteurs.

### Solution C : créer des mécanismes distincts

Par exemple :

```text
pseudo_simple
pseudo_zero_specificity
pseudo_selector_argument
```

Cette solution est précise, mais probablement trop lourde.

### Recommandation

Privilégier la solution A, plus cohérente avec l'objectif de vérifiabilité structurelle.

### Reformulation proposée

> **I21.** La spécificité de tout sélecteur produit DOIT être calculable statiquement à partir de sa signature complète de composition et de ses paramètres. Un combinator NE DOIT accepter aucun argument dont la spécificité ne peut être bornée par son contrat.
>
> Les pseudo-classes dont la spécificité dépend d'un sélecteur argument NE DOIVENT pas être admises par le canonique général `pseudo_class`, sauf mécanisme explicitement défini avec son propre calcul.

---

## I22. `!important`

### Tentative de réfutation

Une dépendance tierce peut en émettre. Ce problème relève toutefois du défaut actuel de I20.

### Verdict

Robuste une fois I20 corrigé.

### Précision proposée

> Seules les déclarations appartenant effectivement au reset de `bootstrap` PEUVENT porter `!important`.

Cette formulation évite qu'une autre partie de `bootstrap` bénéficie implicitement de l'autorisation.

---

## I23. Vérifiabilité par les modules

### Contre-exemple

Imaginons :

```text
combinators/_context.scss
combinators/_state.scss
combinators/_index.scss
```

Le module `_index.scss` réexporte tout :

```scss
@forward "context";
@forward "state";
```

Puis `bootstrap` importe l'index général :

```scss
@use "../combinators";
```

Les familles possèdent bien des modules distincts, mais l'import de `bootstrap` ne permet plus de vérifier qu'il ne consomme que `context`.

Autre cas : le module `context` importe lui-même le barrel général. La séparation physique existe, mais pas la séparation du graphe.

### Verdict

Condition nécessaire, mais insuffisante.

### Reformulation proposée

> **I23.** Chaque famille de combinators DOIT posséder un point d'entrée distinct. Une couche soumise à une restriction de famille DOIT importer directement le point d'entrée autorisé et NE DOIT importer aucun module agrégateur exposant des familles supplémentaires. Les dépendances transitives de ce point d'entrée DOIVENT respecter la même restriction.

Cette formulation rend vérifiable :

```text
bootstrap → combinators/context
```

et interdit :

```text
bootstrap → combinators/all
```

---

# 3. Incohérences transversales hors invariants

## 3.1. `state/attribute` et `:disabled`

La correspondance avec ROCS associe potentiellement le mécanisme `state/attribute` à :

```scss
.C:disabled
.C[aria-expanded="true"]
```

Mais selon la classification des mécanismes :

- `:disabled` relève de `pseudo_class` ;
- `[disabled]` relève de `attribute`.

### Correction proposée

```text
state/pseudo-classe
.C:hover, .C:disabled, .C:first-child

state/attribut natif ou ARIA
.C[disabled], .C[aria-expanded="true"]
```

### Décision doctrinale recommandée

Pour un état natif disposant d'une pseudo-classe :

- préférer la pseudo-classe native lorsqu'elle existe ;
- réserver le mécanisme d'attribut aux attributs ARIA, aux `data-*` et aux attributs sans pseudo-classe équivalente.

Cela évite deux signatures concurrentes pour une même sémantique.

---

## 3.2. Interdiction générale des balises

Une formulation telle que « aucun autre sélecteur : aucune classe, balise ou id » peut entrer en contradiction avec l'autorisation explicite de :

```text
html
body
```

### Reformulation proposée

> Aucun autre sélecteur métier ou applicatif n'est permis : aucune classe, balise ou id en dehors des formes absolues explicitement autorisées à `bootstrap`.

---

## 3.3. Exception du reset insuffisamment définie

La catégorie « reset » peut contenir des sélecteurs très variés :

```scss
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

ou :

```scss
button,
input,
textarea,
select {
  font: inherit;
}
```

Si le mot `reset` constitue une exception générale, il peut devenir une échappatoire aux contraintes sur les sélecteurs absolus.

### Options de correction

1. définir formellement les sélecteurs permis dans le reset ;
2. renvoyer à une liste fermée de la spécification ROCS ;
3. déclarer que le reset constitue un sous-régime normatif séparé, avec ses propres invariants.

La troisième option est la plus évolutive, à condition que ce sous-régime reste explicitement borné.

---

# 4. Corrections prioritaires

## Priorité 1 : corrections bloquantes

### A. Réécrire I20

Empêcher qu'une dépendance externe contourne le modèle de couches et les règles d'émission.

### B. Réécrire I21

Traiter explicitement les pseudo-classes fonctionnelles :

- `:is()` ;
- `:not()` ;
- `:has()` ;
- `:where()` ;
- `:nth-child(... of ...)` ;
- `:nth-last-child(... of ...)`.

### C. Corriger I12

Distinguer clairement :

- l'enveloppement contextuel de `@content` ;
- la transformation du sélecteur courant `&`.

Fermer ou valider le domaine de tous les arguments syntaxiques.

### D. Corriger I3

Distinguer :

- l'affectation du token dans `bootstrap` ;
- son enregistrement et son `initial-value` dans `globals`.

## Priorité 2 : corrections importantes

### E. Compléter I9

Interdire les at-rules conditionnelles et contextuelles dans les behaviors.

### F. Compléter I11

Imposer une transmission de `@content` exactement une fois.

### G. Clarifier I15

Remplacer la notion d'ordre total par une relation de précédence entre familles et définir les répétitions autorisées.

### H. Clarifier I17

Exclure explicitement de la notion de composition :

- les spécialisations transparentes ;
- les contexts utilisés par `bootstrap` pour l'émission conditionnelle des tokens.

### I. Renforcer I23

Raisonner en points d'entrée et dépendances transitives, et non en seule séparation physique des modules.

## Priorité 3 : durcissements rédactionnels

- définir « émission autonome » ;
- remplacer « nom brut » par « identifiant CSS du token » ;
- clarifier l'indépendance des fichiers de tokens ;
- circonscrire l'exception du reset ;
- corriger la ligne `state/attribute` ;
- distinguer les interdictions visant les sélecteurs métier des balises structurelles autorisées à `bootstrap`.

---

# 5. Principe transversal proposé

Les principales failles ont une origine commune : une API apparemment conforme peut accepter un argument ou une dépendance capable de réintroduire indirectement une construction interdite.

Le principe transversal suivant permettrait de consolider simultanément I12, I19, I20 et I21 :

> **Toute entrée susceptible de contenir de la syntaxe CSS DOIT posséder un domaine fermé, validé ou statiquement borné. Une API du framework NE DOIT jamais permettre de produire indirectement une construction qu'elle interdit directement.**

Ce principe s'applique notamment :

- aux arguments des combinators ;
- aux pseudo-classes fonctionnelles ;
- aux sélecteurs passés au scope ;
- aux bibliothèques externes ;
- aux appels dynamiques via `sass:meta` ;
- aux modules agrégateurs qui exposent plus de capacités que la couche n'est autorisée à consommer.

---

# 6. Plan de modification recommandé pour l'agent

## Étape 1. Cartographier les impacts

Pour chaque correction prioritaire, identifier :

- la définition de couche concernée ;
- l'invariant concerné ;
- les autres invariants liés ;
- le tableau des dépendances ;
- les exemples de code ;
- la correspondance avec ROCS ;
- les éventuels tests ou règles de lint présents dans le dépôt.

## Étape 2. Corriger les contradictions structurelles

Traiter dans cet ordre :

1. I20, effets des dépendances externes ;
2. I12, nature des familles et arguments admissibles ;
3. I21, calcul de spécificité ;
4. I3 et I5, cycle de vie des tokens et custom properties.

Cet ordre limite les réécritures successives, car I12 et I20 conditionnent plusieurs autres invariants.

## Étape 3. Durcir les contrats d'exécution

Mettre à jour :

- I9 ;
- I11 ;
- I13 ;
- I15 ;
- I17 ;
- I23.

## Étape 4. Harmoniser les exemples et le vocabulaire

Vérifier systématiquement :

- `identifiant CSS du token` ;
- `référence CSS au token` ;
- `valeur du token` ;
- `émission autonome` ;
- `composition` ;
- `transformation de &` ;
- `enveloppement de @content` ;
- `state/pseudo-classe` ;
- `state/attribut` ;
- `reset`.

## Étape 5. Ajouter ou proposer des vérifications mécanisables

Lorsque le dépôt le permet, prévoir des tests ou règles pour vérifier :

- les dépendances directes et transitives entre couches ;
- l'absence d'émission autonome hors `globals` et `bootstrap` ;
- l'absence de sélecteurs et d'at-rules contextuelles dans les behaviors ;
- la transmission unique de `@content` ;
- l'import direct du point d'entrée de famille autorisé ;
- l'absence de barrel trop permissif dans les couches restreintes ;
- la fermeture des arguments des combinators ;
- la spécificité maximale des signatures autorisées ;
- l'usage de `!important` limité au reset.

---

# 7. Critères d'acceptation de la révision

La future version peut être considérée comme conceptuellement stabilisée si les critères suivants sont remplis.

## Cohérence normative

- Aucun invariant ne contredit une définition de couche ou un autre invariant.
- Une exception est toujours explicitement bornée.
- Les termes utilisés possèdent une définition unique et stable.

## Fermeture des API

- Aucun argument libre ne permet d'injecter un sélecteur arbitraire.
- Une dépendance externe ne permet pas de contourner les contraintes d'une couche.
- Les pseudo-classes à spécificité variable font l'objet d'une interdiction ou d'un mécanisme dédié.

## Vérifiabilité

- Les restrictions de consommation sont visibles dans le graphe des modules.
- Les points d'entrée n'exposent pas plus de capacités que la couche n'est autorisée à utiliser.
- Les règles structurelles importantes peuvent être testées sans interprétation métier.

## Stabilité théorique

- Les invariants restent vrais si la charte graphique, les tokens, les breakpoints, le produit ou le projet changent.
- Les choix propres à une implémentation ne sont pas élevés au rang d'invariants fondamentaux.

## Alignement ROCS

- Les mécanismes `state`, `scope`, `part` et `context` sont classés sans ambiguïté.
- Les exemples ROCS utilisent le combinator correspondant à leur syntaxe réelle.
- Les exceptions de `bootstrap` et du reset sont compatibles avec la convention de sélecteurs.

---

# 8. Conclusion

Le document ne présente pas de défaut de conception générale. Les difficultés apparaissent surtout aux frontières d'ouverture :

- arguments libres transmis aux combinators ;
- dépendances externes au comportement inconnu ;
- pseudo-classes fonctionnelles acceptant elles-mêmes des sélecteurs ;
- exception générique appelée `reset` ;
- distinction insuffisante entre composition architecturale, spécialisation transparente et simple délégation.

L'architecture est cohérente tant que toutes les entrées restent disciplinées. Plusieurs invariants présument cependant cette discipline au lieu de la rendre obligatoire.

La révision doit donc chercher moins à multiplier les règles qu'à **fermer les points d'entrée** et à **classer les opérations selon leurs effets réels**.

Après correction prioritaire de I3, I5, I12, I20 et I21, puis durcissement de I9, I11, I15, I17 et I23, la base conceptuelle pourra raisonnablement être considérée comme stabilisée.
