# ROCS — *Role‑Oriented CSS Semantics*

**Version 1.0**

> ROCS est une **spécification normative** d'architecture HTML/CSS : un HTML porteur de sens, des classes CSS qui expriment ce sens, et une composition de styles faite exclusivement côté CSS.
>
> ROCS est **agnostique** vis‑à‑vis des frameworks JavaScript : il décrit une discipline de structure HTML et de styles CSS.

> **Note informative** : un document séparé (guide/manifeste) pourra dériver de cette spécification.

---

## Table des matières
1. [Conventions normatives](#0-conventions-normatives)
2. [Objectifs et rôles](#1-objectifs-et-rôles)
3. [Principes](#2-principes)
4. [Nommage](#3-nommage)
5. [Attributs `data-*`](#4-attributs-data-libres-mais-strictement-réservés-au-js)
6. [Identifiants (`id`)](#5-id-interdits-en-css)
7. [Sélecteurs CSS](#6-sélecteurs-spécificité-cascade)
8. [Promotion](#7-promotion)
- [Annexe A. Architecture & optimisation CSS](#annexe-a-architecture--optimisation-css-recommandations)
- [Annexe B. Cas pratiques (FAQ)](#annexe-b-cas-pratiques-faq)
- [Annexe C. Outillage](#annexe-c-outillage-recommandations)
- [Annexe D. Licence](#annexe-d-licence)

---

## 0. Conventions normatives

### 0.1 Statut des énoncés

Dans ce document, les mots suivants ont un sens **normatif** :

- **DOIT / NE DOIT PAS** : exigence absolue.
- **DEVRAIT / NE DEVRAIT PAS** : recommandation forte ; une exception est possible uniquement si elle est justifiée et documentée.
- **PEUT** : option autorisée.

Tout énoncé qui n'emploie pas ces termes est **informatif** (exemples, explications, contexte) et ne crée pas d'obligation.

### 0.2 Portée

ROCS spécifie un **contrat HTML/CSS** :

- les **classes** expriment un rôle/contexte (sémantique de structure) ;
- la **réutilisation visuelle** (design system) se fait dans le CSS (mixins, placeholders, etc.) ;
- les `data-*` sont réservés aux **états/paramètres dynamiques pilotés par JavaScript** et aux **métadonnées contextuelles** (paramètres de layout/configuration) ;
- les `id` sont réservés au **ciblage JavaScript** et **NE DOIVENT PAS** être utilisés en CSS.

### 0.3 Définitions normatives

#### 0.3.1 Classe ROCS

Une **classe ROCS** est une classe CSS qui respecte les contraintes suivantes :

1. **Syntaxe** :
   - **Bloc** : `^[A-Z][a-zA-Z0-9]*$` (PascalCase, commence par une majuscule)
   - **Élément** : `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$` (Bloc + tiret + camelCase strict limité à 3 segments)

2. **Profondeur maximale du nom** :
   - Pour un **Bloc**, la profondeur est le nombre de **segments PascalCase** (ex : `ProductCheckoutSummary` = 3 segments `Product` + `Checkout` + `Summary`).
   - Pour un **Élément**, la profondeur est le nombre de **segments camelCase** après le tiret (ex : `closeButtonIcon` = 3 segments `close` + `Button` + `Icon`).

   Règles associées :
   - Un nom d'Élément (partie après le tiret) **NE DOIT PAS** dépasser **3 segments**.
   - Le premier segment d'un Élément **DOIT** commencer par une lettre minuscule.
   - Les segments suivants **DOIVENT** commencer par une majuscule, suivie de lettres minuscules.
   - Les suites d'acronymes en majuscules (ex: `URL`, `API`) **NE SONT PAS** autorisées dans la partie Élément.
   - Les chiffres **PEUVENT** être utilisés en suffixe de segment (ex: `step2Title`).

3. **Sémantique** : exprime un **rôle/contexte** dans le document, jamais un style visuel.

#### 0.3.2 Bloc

Un **Bloc** est une classe ROCS de **niveau 1** (sans tiret) qui représente :
- une **unité sémantique autonome** (métier, page, fonctionnalité) ;
- un **contexte** dans lequel des Éléments existent ;
- généralement une section, un composant métier, un module de contenu.

**Exemples valides** : `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`, `CookiesConsentModal`, `ProductCard`.

**Exemples invalides** : `Button` (trop générique, design system), `Modal` (mécanisme UI générique / design system), `card` (pas PascalCase), `Best_Sellers` (underscore interdit).

#### 0.3.3 Élément

Un **Élément** est une classe ROCS de **niveau 2** (format `Bloc-element`) qui représente :
- un **rôle local** à l'intérieur d'un Bloc ;
- un composant **dépendant** de son contexte parent.

**Exemples valides** : `BestSellersBooks-title`, `CookiesConsentModal-closeButton`, `ProductCard-image`, `CookiesConsentModal-headerTitle`.

**Exemples invalides** : `BestSellersBooks-Title` (pas camelCase après le tiret), `BestSellersBooks_title` (underscore interdit).

#### 0.3.4 Profondeur des noms d'Éléments

Le nom après le tiret est en **camelCase** et peut contenir plusieurs mots (ex: `closeButton`, `headerTitle`). La **profondeur du nom** se mesure au nombre de segments camelCase.

**Règle** : La profondeur **NE DOIT PAS** dépasser **3 segments**.

> **Important** : La structure du DOM **correspond souvent** au sens — c'est naturel qu'un `CookiesConsentModal-headerTitle` soit un enfant de l'élément portant le header. Mais cette correspondance n'est **pas le critère de nommage**. Le nom exprime le **rôle sémantique** de l'élément dans le contexte du Bloc, pas sa position dans l'arbre HTML. Un `CookiesConsentModal-headerTitle` pourrait techniquement se trouver à n'importe quel niveau d'imbrication si la structure HTML l'exige.

**Limite** : si un Élément devient trop complexe (structure interne riche, réutilisation, logique autonome), il **DEVRAIT** être promu en Bloc (voir §7).

#### 0.3.5 Promotion

Une **promotion** est la transformation d'un **Élément** en **Bloc** autonome.

Les règles et recommandations normatives relatives à la promotion sont définies en §7.

#### 0.3.6 État/paramètre dynamique

Un **état/paramètre dynamique** est une information stockée dans le DOM sous forme d'attribut `data-*` dont la valeur **DOIT** pouvoir varier au cours du cycle de vie d'une page et **DOIT** être effectivement modifiée par JavaScript (interaction utilisateur, timers, requêtes, navigation interne, etc.).

#### 0.3.7 Métadonnée contextuelle

Une **métadonnée contextuelle** est une information qui caractérise une **configuration** ou un **paramètre de layout** (nombre d'éléments, orientation, colonnes, type de device, etc.) sans définir le **rôle/contexte sémantique** de l'élément. Cette information est persistante mais **n'est pas une composition de style**.

Une métadonnée contextuelle se distingue d'un variant sémantique si :
1. elle n'encode **pas** un variant/catégorie sémantique (qui mériterait une classe ROCS distincte) ;
2. elle n'encode **pas** un style design system (`primary`, `large`, `compact`, etc.) ;
3. une classe ROCS distincte **par valeur** serait déraisonnable.

#### 0.3.8 Périmètre d'application

ROCS s'applique au **HTML contrôlé** par l'équipe de développement.

**Exceptions normatives** :
- **Composants tiers** (bibliothèques externes) : encapsuler dans un Bloc ROCS, ne pas modifier leurs classes internes.
- **Frameworks JavaScript** (React, Vue, etc.) : les classes techniques de framework (ex: `v-cloak`, `data-v-*`) sont **hors périmètre** ROCS.
- **Classes vides** (`class=""`) : autorisées si l'attribut `class` est requis par le framework ou le templating.

**API de style applicatif (normatif)** :
- Dans le HTML contrôlé, la **classe ROCS** (unique, cf. §3.1) est l'**unique API de style applicatif** sous responsabilité de l'équipe intégratrice.

**Classes non-ROCS (coexistence avec une classe ROCS)** :
- Un élément HTML **PEUT** porter, en plus de sa classe ROCS (cf. §3.1), une ou plusieurs classes **non-ROCS** uniquement si :
  1. elles sont **imposées** par un outil, un framework ou un composant tiers ; ou
  2. elles sont **strictement techniques** (non sémantiques) et clairement identifiables (par convention de projet, par exemple via un préfixe dédié).
- Ces classes **non-ROCS** ne sont pas sous la responsabilité ROCS de l'équipe intégratrice.
- Les classes **non-ROCS** **NE DOIVENT PAS** être utilisées pour composer ou porter les styles applicatifs ROCS (elles ne servent pas de hooks CSS dans l'architecture ROCS).

> **Clarification normative** : la règle §3.1 (« 0 ou 1 classe ROCS ») concerne exclusivement la (les) **classe(s) ROCS**. Les classes additionnelles autorisées par la présente section (framework/tiers/technique) sont **hors périmètre ROCS** et ne doivent pas être interprétées comme une autorisation de composer des styles applicatifs via l'attribut `class`.

---

## 1. Objectif

ROCS vise à :

- préserver un **HTML stable** lors des refontes graphiques ;
- rendre le code **lisible** (le rôle avant la technique) ;
- rendre la base CSS **prévisible** (spécificité faible, règles simples) ;
- éviter la **dette HTML** (pas de classes utilitaires / pas de composition dans le HTML).

> **Positionnement** : ROCS n'est ni un framework CSS, ni une bibliothèque de composants. C'est une **discipline de nommage et de structuration** qui se superpose à n'importe quel outillage existant (Sass, PostCSS, CSS natif, design tokens, etc.). ROCS ne dicte pas *comment* écrire le CSS (propriétés, valeurs, architecture de fichiers), mais *comment nommer les classes HTML* et *où composer les styles* (toujours côté CSS, jamais côté HTML).

---

### 1.1 Rôles des mécanismes (résumé)

- **Classes CSS** : expriment le **rôle / contexte** d’un élément. Elles **PEUVENT** être lues par JS, mais **NE DOIVENT PAS** représenter un état (elles ne changent pas à l’exécution).
- **Attributs `data-*`** : expriment des **états/paramètres dynamiques** pilotés par JS, ou des **métadonnées contextuelles** (paramètres de layout/configuration). Ils **NE DOIVENT PAS** représenter un variant sémantique ou un contexte métier persistant (qui doit être une classe ROCS).
- **`id`** : réservés au **ciblage JS** (et éventuellement ancrage/navigation). **NE DOIVENT JAMAIS** être utilisés dans les sélecteurs CSS.

---

### 1.2 Terminologie

Les termes ci-dessous sont utilisés dans tout le document.

- **Rôle** : signification fonctionnelle d’un élément dans le document (ce qu’il *est* / à quoi il *sert*), indépendamment du style.
  - exemple : “titre de la strate *Meilleures ventes*”, “bouton *ajouter au panier*”, “slider de la strate”.
- **Contexte** : périmètre sémantique dans lequel un rôle existe.
  - exemple : le rôle `*-title` n’a de sens qu’à l’intérieur d’une strate donnée (`BestSellersBooks`, `StaffPicksBooks`, etc.).
- **Bloc** : unité sémantique principale (métier/page/contenu) qui définit un contexte.
  - ex : `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`.
- **Élément** : rôle local à un Bloc, exprimé sous la forme `Bloc-element`.
  - ex : `BestSellersBooks-title`, `BestSellersBooks-slider`.

---

## 2. Principes normatifs

### 2.1 Le HTML décrit le sens (normatif)

Le HTML **DOIT** exprimer la structure et la signification (rôle) du document.

- Une refonte graphique **NE DOIT PAS** imposer de modifier le HTML porteur de classes ROCS.
- Les attributs natifs (`disabled`, `aria-*`, etc.) **DOIVENT** conserver leur signification sémantique.

### 2.2 Une classe CSS exprime le rôle de l'élément (normatif)

Une classe ROCS **DOIT** être un **nom de rôle** : elle représente *ce qu'est* l'élément dans le document (son contexte), **jamais** *à quoi il ressemble*.

**Exemple conforme** : un bouton d'ajout au panier situé dans le footer d'un produit.

```html
<button class="ProductFooter-addToBasket">Ajouter au panier</button>
```

**Exemples non conformes** :

```html
<!-- composition de composant / variantes dans le HTML -->
<button class="Button" data-button-type="cta" data-button-level="primary">

<!-- classes utilitaires / design dans le HTML -->
<button class="btn btn--action btn--action-primary">
```

### 2.3 La composition de styles se fait côté CSS (normatif)

Les styles réutilisables **DOIVENT** être factorisés **dans le CSS**, jamais dans l'attribut `class` du HTML.

**Interdictions** :
- Dans le **HTML contrôlé** (cf. §0.3.8), les classes utilitaires (ex: `.visually-hidden`, `.flex`, `.p-4`) **NE DOIVENT PAS** être utilisées.
- La composition de styles dans l'attribut `class` **NE DOIT PAS** être utilisée.

> **Note informative — Outillage** : En pratique, cette exigence implique l'usage d'un mécanisme de factorisation CSS (préprocesseur Sass/Less, PostCSS, ou fonctionnalités CSS natives comme `@layer`, `@scope`, custom properties). Sans un tel outil, la factorisation des styles réutilisables devient impraticable. Voir [Annexe A](#annexe-a-architecture--optimisation-css-recommandations) pour les recommandations d'architecture.

**Exemple** (avec préprocesseur SCSS) :

```scss
.ProductFooter-addToBasket {
  @include btn_cta();
  @include btn_primary();
}
```

---

## 3. Nommage (normatif)

### 3.1 Règle "une classe maximum par élément"

Un élément HTML **DOIT** porter **0 ou 1 classe** ROCS.

- La classe **DOIT** être un **nom de rôle**, jamais un assemblage d'apparences.
- L'utilisation de **plusieurs classes ROCS** sur un même élément (ex: `class="Button Button--primary"`) **NE DOIT PAS** exister.

> Note : cf. §0.3.8 pour les exceptions (classes techniques de frameworks, composants tiers).

### 3.2 Conventions de nommage (normatif)

Les classes ROCS **DOIVENT** respecter les patterns suivants :

- **Bloc** : **PascalCase** (pattern: `^[A-Z][a-zA-Z0-9]*$`)
  - ex : `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`
- **Élément** : `Bloc-element` où `element` est en **camelCase** (pattern: `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$`)
  - ex : `BestSellersBooks-title`, `ProductFooter-addToBasket`, `CookiesConsentModal-headerTitle`

**Profondeur du nom (Bloc)** : un nom de Bloc en PascalCase est composé de **segments** (ex: `ProductCard` = 2 segments : `Product` + `Card`). Un nom de Bloc **NE DOIT PAS** dépasser **4 segments**.

- ✅ `ProductCard` (2 segments)
- ✅ `CookiesConsentModal` (3 segments)
- ✅ `MarketplaceProductCard` (3 segments)
- ✅ `ProductCheckoutSummary` (3 segments)
- ❌ `AccountCheckoutShippingAddressForm` (5 segments)

**Profondeur du nom (Élément)** : le camelCase peut contenir plusieurs segments (ex: `headerTitle`, `closeButtonIcon`), mais **NE DOIT PAS** dépasser **3 segments** pour rester lisible.

**Interdictions** :
- Le `snake_case` **NE DOIT PAS** être utilisé (ex: `Best_Sellers`, `product_card`).
- Le `kebab-case` pour les Blocs **NE DOIT PAS** être utilisé (ex: `best-sellers-books`).
- Les classes génériques de design system **NE DOIVENT PAS** être utilisées comme Blocs (ex: `Button`, `Card`, `Input`, `Modal`, `Accordion`, `Menu`, `Slider`).

> **Clarification (informatif) — Blocs de page** : un Bloc purement générique comme `Page` (layout/structure, sans sémantique métier) se comporte comme une primitive de design system et **NE DEVRAIT PAS** être utilisé comme Bloc ROCS.
>
> Alternatives conformes, peu verbeuses, et sans encoder la hiérarchie DOM :
> - `ProductsPage`, `FaqPage`, `AboutPage` (rôle de page explicite)
> - ou un nom de page plus métier : `ProductsListing`, `HelpCenter`, `LegalNotices`

> **Convention recommandée — ordre "rôle → type"** : lorsque le nom d'un Bloc (ou d'un Élément) combine un **rôle métier** et un **type de composant** (ex: `Page`, `Modal`, `Card`, `List`, `Header`, `Title`), l'ordre **DEVRAIT** être : **rôle d'abord, type ensuite**.
>
> Objectifs : améliorer la lisibilité (le rôle en premier), réduire la tentation de faire des Blocs DS (`Page`, `Modal`, `Card`), et éviter des noms qui encodent la hiérarchie du DOM.
>
> Exemples (Blocs) :
> - ✅ `ProductsPage`, `FaqPage`, `AboutPage`
> - ✅ `CookiesConsentModal`
> - ❌ `PageProducts`, `PageFaq` (type avant rôle)
>
> Exemples (Éléments) :
> - ✅ `ProductCard-image`, `ProductCard-title`
> - ✅ `CookiesConsentModal-closeButton`, `CookiesConsentModal-acceptAction`
> - ❌ `ProductCard-cardImage` (type redondant / peu informatif)

### 3.3 Convention de nom

ROCS utilise une convention inspirée “Bloc/Élément”, mais interprétée comme **contexte sémantique**.

- `Bloc` en **PascalCase** : unité sémantique principale, généralement **métier/page/contenu**, pas un “composant DS”.
  - ex: `BestSellersBooks`, `StaffPicksBooks`, `TopRatedBooks`, `CheckoutSummary`
- `Bloc-element` : sous-rôle situé dans le contexte du bloc.
  - ex: `BestSellersBooks-title`, `BestSellersBooks-slider`

> ROCS sépare volontairement :
> - **le sens** (dans le HTML, via les classes)
> - **la réutilisation visuelle/DS** (dans le CSS, via mixins, placeholders, etc.)

#### Exemple : 3 strates métier, même look & feel

```html
<section class="BestSellersBooks">
  <h2 class="BestSellersBooks-title">Meilleures ventes</h2>
  <ul class="BestSellersBooks-slider">
    <!-- ... -->
  </ul>
</section>

<section class="StaffPicksBooks">
  <h2 class="StaffPicksBooks-title">Sélection de l’équipe</h2>
  <ul class="StaffPicksBooks-slider">
    <!-- ... -->
  </ul>
</section>

<section class="TopRatedBooks">
  <h2 class="TopRatedBooks-title">Mieux notés</h2>
  <ul class="TopRatedBooks-slider">
    <!-- ... -->
  </ul>
</section>
```

```scss
.BestSellersBooks,
.StaffPicksBooks,
.TopRatedBooks {
  @include product_layer();
}

.BestSellersBooks-title,
.StaffPicksBooks-title,
.TopRatedBooks-title {
  @include layer_title();
}

.BestSellersBooks-slider,
.StaffPicksBooks-slider,
.TopRatedBooks-slider {
  @include layer_slider();
}
```

Si un jour une seule strate doit diverger visuellement, on ne modifie que le CSS associé au rôle concerné.

### 3.4 Profondeur des noms d'Éléments

Le nom d'un Élément (partie après le tiret) peut contenir plusieurs segments en camelCase :

| Profondeur | Exemple | Conformité |
|------------|---------|------------|
| 1 segment | `CookiesConsentModal-header` | ✅ Conforme |
| 2 segments | `CookiesConsentModal-closeButton` | ✅ Conforme |
| 3 segments | `CookiesConsentModal-headerTitleBadge` | ✅ Conforme (limite) |
| 4+ segments | `CookiesConsentModal-headerTitleBadgeIcon` | ❌ Non conforme |

#### Quand la profondeur devient problématique

Si vous atteignez 3+ segments, c'est souvent le signe que :
- L'Élément est devenu **trop complexe** → envisager la **promotion** en Bloc
- Le nommage essaie de refléter la **hiérarchie DOM** → ce n'est pas l'objectif

**Rappel** : Le nom d'un Élément exprime son **rôle sémantique**, pas sa position dans le DOM.

#### Quand promouvoir en Bloc ?

Un Élément **DEVRAIT** être promu en Bloc quand :
- Il contient des enfants structurés (heuristique : ~3 descendants stylés)
- Il pourrait exister dans d'autres contextes
- Il porte une logique autonome (état, interaction)

→ Voir §7 pour les détails sur la promotion.

### 3.5 Classes d'état (interdiction)

Les classes d'état de type BEM modifier ou équivalent **NE DOIVENT PAS** être utilisées dans ROCS.

**Patterns interdits** :

- `--is-*`, `--has-*`, `--no-*` (modifiers BEM)
- `is-*`, `has-*` (classes d'état globales)
- `is-active`, `is-loading`, `is-hidden`, `is-open`, etc.
- `Element--modifier` (syntaxe BEM modifier)

**Exemples ❌ non conformes** :

```html
<button class="CookiesConsentModal-closeButton--isDisabled">...</button>
<nav class="CheckoutNavigation is-open">...</nav>
<div class="ProductFaq-panel--expanded">...</div>
```

**Raisonnement** : les états dynamiques **DOIVENT** être exprimés via :

1. **Attributs `data-*`** pour les états pilotés par JavaScript (cf. §4)
2. **Pseudo-classes natives** (`:hover`, `:focus`, `:disabled`, `:checked`, etc.)
3. **Attributs HTML natifs** (`disabled`, `hidden`, `aria-expanded`, etc.)

**Exemples ✅ conformes** :

```html
<button class="CookiesConsentModal-closeButton" disabled>...</button>
<nav class="CheckoutNavigation" data-state="open">...</nav>
<div class="ProductFaq-panel" aria-expanded="true">...</div>
```

```css
.CookiesConsentModal-closeButton:disabled { /* styles désactivé */ }
.CheckoutNavigation[data-state="open"] { /* styles ouvert */ }
.ProductFaq-panel[aria-expanded="true"] { /* styles déplié */ }
```

---


### 3.6 Cas multi-rôle (rôle primaire, wrappers, icônes, tracking)

La règle §3.1 (« 0 ou 1 classe ROCS par élément ») implique qu'un même nœud du DOM ne peut pas porter plusieurs rôles sémantiques.

#### 3.6.1 Choisir le rôle primaire (normatif)

Quand un élément semble porter plusieurs intentions (ex: « bouton » + « action » + « icône »), le rôle ROCS porté par la classe **DOIT** être le **rôle primaire**.

Le rôle primaire est celui qui :
- correspond à la fonction attendue par l'utilisateur (ce que l'élément *fait*) ;
- resterait vrai si le design change (ce que l'élément *est*) ;
- est le meilleur point d'ancrage pour la règle CSS principale.

**Exemple** : un bouton « Ajouter au panier » dans un footer produit.

```html
<button class="ProductFooter-addToBasket">Ajouter au panier</button>
```

#### 3.6.2 Quand ajouter un wrapper (normatif)

Un wrapper **PEUT** être ajouté si nécessaire (layout, contraintes de structure, contraintes framework), mais :

- Si le wrapper n'a aucun style applicatif à porter, il **PEUT** ne pas avoir de classe ROCS (0 classe est autorisé).
- Si le wrapper est requis pour le style applicatif, il **DOIT** recevoir une classe ROCS qui exprime son rôle dans le Bloc (ex: conteneur d'actions, zone de prix, en-tête).

**Exemple** (wrapper sémantique d'actions) :

```html
<div class="ProductFooter-actions">
  <button class="ProductFooter-addToBasket">Ajouter</button>
  <a class="ProductFooter-viewDetails" href="...">Détails</a>
</div>
```

#### 3.6.3 Icônes et sous-parties (recommandations)

- Si l'icône est purement décorative et ne doit pas exister comme nœud stylé dédié, elle **DEVRAIT** être rendue via un pseudo-élément (`::before`/`::after`) ou une image de fond.
- Si l'icône est un nœud réel (SVG/`img`) nécessitant des styles propres (taille, alignement, animation, thèmes), elle **DEVRAIT** être un Élément ROCS distinct.

**Exemple** (icône et libellé stylés explicitement) :

```html
<button class="ProductFooter-addToBasket">
  <svg class="ProductFooter-addToBasketIcon" aria-hidden="true">...</svg>
  <span class="ProductFooter-addToBasketLabel">Ajouter</span>
</button>
```

#### 3.6.4 Tracking, instrumentation, tests (normatif)

Les besoins de tracking, instrumentation et tests **NE DOIVENT PAS** conduire à ajouter des classes supplémentaires.

- Les hooks JS stables **DEVRAIENT** être portés par des `data-*` dédiés (ex: `data-testid`, `data-analytics-*`), conformément à §4.3.
- Ces `data-*` **NE DOIVENT PAS** être utilisés comme hooks CSS.

#### 3.6.5 Quand promouvoir en Bloc (rappel)

Si la décomposition en sous-éléments fait croître la complexité (structure interne riche, sous-parties réutilisables, logique autonome), l'ensemble **DEVRAIT** être promu en Bloc conformément à §7.

## 4. Attributs `data-*` (libres, mais strictement réservés au JS)

Les `data-*` sont libres, mais doivent être utilisés **uniquement** pour :

- des **états/paramètres pilotés par JavaScript** (altérés par JS) ;
- des informations **requises par JavaScript** (identifiants, index, hooks non-stylistiques).

> **Arbre de décision rapide** :
> ```
> L'information est-elle modifiée par JS côté client ?
>   ├── OUI → data-* (état dynamique)           → §4.2, §4.3 point 2
>   └── NON → L'information est-elle un variant sémantique / catégorie métier ?
>         ├── OUI → Classe ROCS distincte        → §4.3 point 1
>         └── NON → Une classe par valeur serait-elle raisonnable ?
>               ├── OUI → Classe ROCS            → §4.3 point 1
>               └── NON → data-* (métadonnée contextuelle) + :where()  → §4.3 point 4, §6.2.2
> ```

### 4.1 Règle générale (normative)

Les sélecteurs CSS basés sur des attributs `data-*` **NE DOIVENT** cibler que des `data-*` représentant un **état/paramètre dynamique** (au sens de §4.2) piloté par JavaScript.

Tout `data-*` utilisé comme **hook stable** (instrumentation/analytics, tests, identifiants non-stylistiques, etc.) **NE DOIT PAS** être utilisé pour composer des styles.

### 4.2 Définitions (normatives)

- **État/paramètre dynamique** : information stockée dans le DOM sous forme d'attribut `data-*` dont la valeur **DOIT** pouvoir varier au cours du cycle de vie d'une page et **DOIT** être effectivement modifiée par JavaScript (interaction utilisateur, timers, requêtes, navigation interne, etc.).

- **Contexte persistant (statique)** : information qui caractérise un contenu/objet (contexte métier, variant métier, segmentation) et dont la valeur **NE DOIT PAS** varier au cours du cycle de vie d'une page.

- **Métadonnée contextuelle** : information qui caractérise une **configuration** ou un **paramètre de layout** (nombre d'éléments, orientation, colonnes, type de device, etc.) sans définir le **rôle/contexte sémantique** de l'élément. Cette information est persistante mais **n'est pas une composition de style**.

  **Critères** : une métadonnée contextuelle se distingue d'un contexte persistant (interdit) si :
  1. elle n'encode **pas** un variant/catégorie sémantique (qui mériterait une classe ROCS distincte) ;
  2. elle n'encode **pas** un style design system (`primary`, `large`, `compact`, etc.) ;
  3. une classe ROCS distincte **par valeur** serait déraisonnable (ex : `MostRecentArticles1Items`, `MostRecentArticles2Items`, … → absurde).

  **Note distinctive** : contrairement à un variant sémantique (qui définit *ce qu'est* l'élément dans le contexte métier), une métadonnée contextuelle décrit *comment* l'élément s'organise ou se comporte techniquement, sans changer sa nature sémantique fondamentale.

### 4.3 Règle d'usage (normative)

1. Un attribut `data-*` qui représente un **contexte persistant (statique)** **NE DOIT PAS** être utilisé pour le style.
   - Dans le HTML contrôlé, ce contexte **DOIT** être exprimé par une **classe ROCS distincte** (Bloc ou Élement).

2. Un attribut `data-*` qui représente un **état/paramètre dynamique** **PEUT** exister.
   - Si l'état influence le rendu, il **PEUT** être utilisé dans des sélecteurs CSS conformément à §6.2.2.

3. Un attribut `data-*` requis par JavaScript comme **hook stable** (ex : instrumentation/analytics, identifiants, index, hooks non-stylistiques) **PEUT** exister même si sa valeur ne varie pas.
   - Dans ce cas, il **NE DOIT PAS** exprimer un contexte métier/variant.
   - Dans ce cas, il **NE DOIT PAS** être utilisé pour composer des styles.

4. Un attribut `data-*` qui représente des **métadonnées contextuelles** (cf. §4.2) **PEUT** exister et **PEUT** être utilisé dans des sélecteurs CSS si :
   - il respecte les 3 critères de la définition (pas de variant sémantique, pas de DS, pas d'alternative classe raisonnable) ;
   - il est utilisé conformément aux exceptions de §6.2.2 (sélecteurs combinés autorisés pour métadonnées contextuelles).

> Note informative : ROCS privilégie des classes "qui disent ce que c'est" (contexte/rôle) et réserve les `data-*` à "ce qui bouge" (états dynamiques), aux métadonnées contextuelles (paramètres techniques de layout/configuration), ou à un usage JS non-stylistique (hooks d'instrumentation).

### 4.4 Anti-patterns (informatif)

- ❌ `data-*` statiques pour des variants métier persistants :

```html
<div class="Product" data-type="book" data-marketplace="false">…</div>
```

✅ Corriger en exprimant le contexte via des classes ROCS distinctes :

```html
<!-- Option 1 : Bloc distinct par type -->
<article class="ProductBook">…</article>
<article class="ProductDvd">…</article>

<!-- Option 2 : Bloc + contexte si la distinction est importante -->
<article class="MarketplaceProductBook">…</article>
<article class="DirectProductBook">…</article>
```

> **Note** : Le choix du nom dépend de la granularité métier. Si "marketplace vs direct" est une distinction importante dans votre domaine, elle mérite d'apparaître dans le nom du Bloc.

### 4.5 Convention de nommage (recommandée)

Recommandations :

- noms en **kebab-case** : `data-gallery-active`, `data-slide-index`.
  - raison : cohérent avec le format HTML (`data-...`) et lisible dans le DOM.
- valeurs : libres, mais doivent représenter un état/paramètre **réellement dynamique** (susceptible de changer à l'exécution).

Règle pratique : **si la valeur d'un `data-*` ne peut jamais changer à l'exécution**, alors la logique correspondante doit être portée par une **classe ROCS** (rôle/contexte), pas par un attribut.

**Exemple : variantes métier statiques**

Si vous avez besoin de différencier des types de produits (livre, DVD, eBook), utilisez des **classes ROCS distinctes** qui expriment le contexte métier :

```html
<!-- ✅ Correct : classes ROCS distinctes -->
<article class="ProductCardBook">...</article>
<article class="ProductCardDvd">...</article>
<article class="ProductCardEbook">...</article>
```

```html
<!-- ❌ Incorrect : data-* statique pour une variante -->
<article class="ProductCard" data-product-type="book">...</article>
```

**Exemple : états dynamiques**

```html
<div class="ProductGallery" data-gallery-active="0">
  <button class="ProductGallery-prev">Previous</button>
  <ul class="ProductGallery-list">
    <li class="ProductGallery-item" data-slide-index="0">First</li>
    <li class="ProductGallery-item" data-slide-index="1">Second</li>
  </ul>
</div>
```

**Interdit** (par convention ROCS) :

- encoder des variations purement "design system" dans les `data-*` : `data-variant="primary"`, `data-size="large"`, etc.
- utiliser des `data-*` **statiques** pour un **contexte persistant** (variant métier, catégorie sémantique) qui devrait être une classe ROCS.

**Autorisé** (métadonnées contextuelles) :

```html
<!-- ✅ Métadonnée contextuelle : nombre d'éléments (paramètre de layout) -->
<!-- Justification : MostRecentArticles1Items, MostRecentArticles2Items... seraient absurdes -->
<ul class="MostRecentArticles-list" data-articles-length="6">
  <li class="MostRecentArticles-item">...</li>
  <!-- etc. -->
</ul>

<!-- ✅ Métadonnée contextuelle globale : type de device (contexte technique) -->
<!-- Justification : information technique de viewport, pas un variant sémantique -->
<body data-device-type="mobile">
  ...
</body>

<!-- ✅ Métadonnée contextuelle : colonnes (paramètre de layout responsive) -->
<!-- Justification : configuration technique, pas une catégorie métier -->
<div class="ProductGrid" data-columns="3">
  ...
</div>
```

> **Test décisif** : *"Est-ce qu'une classe ROCS distincte serait raisonnable pour chaque valeur ?"*
> - `ProductCardBook`, `ProductCardDvd` → ✅ raisonnable → utiliser une classe ROCS (variants sémantiques)
> - `MostRecentArticles1Items`, `MostRecentArticles2Items`, … → ❌ absurde → métadonnée contextuelle autorisée
>
> **Test complémentaire** : *"L'information change-t-elle la nature sémantique de l'élément ?"*
> - `data-product-type="book"` → ✅ change la nature → classe ROCS obligatoire
> - `data-articles-length="3"` → ❌ ne change pas la nature → métadonnée contextuelle autorisée

### 4.6 Server-Side Rendering (SSR) et `data-*`

**Question** : En SSR (Next.js, Nuxt, etc.), peut-on utiliser des `data-*` générés côté serveur pour différencier des variantes ?

**Réponse** : **Non**, sauf si ces attributs sont **effectivement modifiés par JavaScript côté client**.

#### Pattern non conforme

```jsx
// ❌ SSR : data-* statique basé sur les props serveur
export function ProductCard({ product }) {
  return (
    <article class="ProductCard" data-product-type={product.type}>
      ...
    </article>
  );
}
```

**Problème** : `data-product-type` est rendu côté serveur et ne change jamais côté client. C'est un **contexte persistant** déguisé.

#### Pattern conforme : classes ROCS distinctes

```jsx
// ✅ SSR : classe ROCS exprimant le contexte
export function ProductCard({ product }) {
  const className = `ProductCard${product.type.charAt(0).toUpperCase() + product.type.slice(1)}`;
  // → ProductCardBook, ProductCardDvd, etc.
  
  return <article class={className}>...</article>;
}
```

#### Exception : `data-*` serveur + hydratation JavaScript

Si un attribut `data-*` est **initialisé côté serveur** mais **modifié côté client**, il reste conforme :

```jsx
// ✅ Acceptable : data-* initialisé serveur mais dynamique client
export function ProductFaq({ items, initialOpen = 0 }) {
  return (
    <div class="ProductFaq" data-active-panel={initialOpen}>
      {/* JavaScript client modifiera data-active-panel */}
    </div>
  );
}
```

**Justification** : `data-active-panel` est un **état dynamique** même si sa valeur initiale vient du serveur.

#### Règle pratique SSR

| Attribut | Modifié par JS client ? | ROCS conforme ? | Alternative |
|----------|-------------------------|-----------------|-------------|
| `data-product-type="book"` | ❌ Non | ❌ Non | Classe `ProductCardBook` |
| `data-user-role="admin"` | ❌ Non | ❌ Non | Classe `DashboardAdmin` |
| `data-theme="dark"` | ✅ Oui (toggle) | ✅ Oui | Acceptable si toggle client |
| `data-active-tab="0"` | ✅ Oui (navigation) | ✅ Oui | Acceptable |


### 4.7 Métadonnées contextuelles globales vs locales (normatif)

ROCS distingue deux usages des métadonnées contextuelles (cf. §4.2) :

1. **Métadonnées contextuelles globales** (page entière)
   - Elles **PEUVENT** être portées par `body`, `html` ou `:root`.
   - Elles **DOIVENT** être des informations **techniques** (environnement, capacités, préférences utilisateur) et **NE DOIVENT PAS** exprimer un variant sémantique métier ni un variant de design system.
   - Leur usage CSS est défini en §6.2.2 (sélecteurs combinés autorisés avec `:where()` et profondeur limitée).

   **Exemples** : `data-device-type`, `data-theme` (si modifié côté client), `data-orientation`, `data-reduced-motion`.

2. **Métadonnées contextuelles locales** (à l'intérieur d'un Bloc)
   - Elles **PEUVENT** être portées par un élément ROCS (typiquement un Bloc) pour exprimer un paramètre de layout/configuration local.
   - Elles **NE DOIVENT PAS** servir à reconstituer une composition de styles dans le DOM.
   - Leur usage CSS est défini en §6.2.2 (sélecteurs descendants autorisés avec `:where()` et profondeur limitée).

   **Exemples** : `data-columns`, `data-items-length`, `data-layout` (si c'est une configuration technique bornée et non une variation sémantique).

---

## 5. `id` (interdits en CSS)

Les `id` sont **interdits** dans la logique CSS ROCS :

- ❌ **NE DOIT JAMAIS** être ciblé en CSS : `#something { ... }`
- ✅ **PEUT** être utilisé pour le ciblage JavaScript ou les ancres HTML.

---

## 6. Sélecteurs CSS (spécificité, cascade)

### 6.1 Spécificité (normatif)

Les sélecteurs CSS **DOIVENT** respecter les règles suivantes :

1. **Spécificité faible** : privilégier les sélecteurs de classe (`.ClassName`) ou d'attribut (`[data-*]`).
2. **Pas de sélecteurs d'`id`** : les `id` sont réservés au JavaScript.
3. **Sélecteurs combinés** : dans le CSS applicatif ROCS, les sélecteurs combinés (descendants, enfants directs, adjacents, etc.) **NE DOIVENT PAS** être utilisés, sauf dans les exceptions explicitement définies en §6.2.2.
4. **`!important`** : la déclaration `!important` **NE DOIT PAS** être utilisée dans le CSS applicatif ROCS. Elle compromet la prévisibilité de la cascade et rend le débogage difficile. Les seuls cas acceptables sont les feuilles de style de reset/normalisation et les surcharges de composants tiers non modifiables.

### 6.2 Cascade et sélecteurs combinés (normatif)

La cascade CSS **DOIT** être maîtrisée pour garantir la prévisibilité et la maintenabilité du code.

#### 6.2.1 Auto-suffisance des classes ROCS

Les classes ROCS **DOIVENT** être auto-suffisantes : chaque classe doit définir ses propres styles sans dépendre d'un contexte parent implicite.

**Interdiction** : Les sélecteurs combinés (descendants `.Parent .Child`, enfants directs `.Parent > .Child`, adjacents `.Element + .Sibling`, etc.) **NE DOIVENT PAS** être utilisés pour styliser un élément en fonction de son contexte parent.

**Exemple non conforme** :

```css
/* ❌ Dépendance implicite au parent */
.BestSellersBooks .BestSellersBooks-title {
  font-size: 1.5rem;
}

/* ❌ Sélecteur enfant direct */
.ProductCard > .ProductCard-image {
  width: 100%;
}

/* ❌ Sélecteur adjacent */
.ProductFooter-addToBasket + .ProductFooter-basketInfo {
  margin-left: 1rem;
}
```

**Exemple conforme** :

```css
/* ✅ Classe ROCS auto-suffisante */
.BestSellersBooks-title {
  font-size: 1.5rem;
}

/* ✅ Chaque élément a sa propre classe */
.ProductCard-image {
  width: 100%;
}

/* ✅ Espacement géré par la classe elle-même ou un conteneur */
.ProductFooter-action {
  margin-left: 1rem;
}

.ProductFooter-action:first-child {
  margin-left: 0;
}
```

#### 6.2.2 Exceptions autorisées

Les sélecteurs combinés **PEUVENT** être utilisés dans les cas suivants :

1. **Pseudo-classes et pseudo-éléments** : toujours autorisés

```css
/* ✅ Pseudo-classes */
.CookiesConsentModal-closeButton:hover { }
.CookiesConsentModal-closeButton:focus { }
.CookiesConsentModal-closeButton:disabled { }

/* ✅ Pseudo-éléments */
.CookiesConsentModal-closeButton::before { }
.CookiesConsentModal-closeButton::after { }
```

2. **États via attributs natifs/ARIA** : autorisés

Les attributs natifs HTML et ARIA (ex: `disabled`, `hidden`, `aria-expanded`, etc.), lorsqu'ils représentent un **état**, **PEUVENT** être ciblés en CSS.

```css
/* ✅ États via attributs natifs/ARIA */
.CookiesConsentModal-closeButton:disabled { }
.ProductFaq-panel[aria-expanded="true"] { }
```

3. **Sélecteurs d'attributs `data-*`** (états dynamiques et métadonnées contextuelles)

```css
/* ✅ États dynamiques (attribut sur l'élément lui-même) */
.CheckoutNavigation[data-state="open"] { }
```

**Sélecteurs combinés pour métadonnées contextuelles locales** : lorsqu'un attribut `data-*` représentant des métadonnées contextuelles est posé sur un élément ROCS parent, le sélecteur descendant **DOIT** utiliser `:where()` pour préserver la spécificité du bloc ciblé. La profondeur est limitée à **2 niveaux** (parent + descendant ciblé).

```css
/* ✅ Correct : :where() préserve la spécificité */
.MostRecentArticles-list[data-articles-length="1"] :where(.MostRecentArticles-item) {
  width: 100%;
}
.MostRecentArticles-list[data-articles-length="2"] :where(.MostRecentArticles-item) {
  width: 50%;
}

/* ❌ Interdit : spécificité trop haute */
.MostRecentArticles-list[data-articles-length="1"] .MostRecentArticles-item {
  width: 100%;
}

/* ❌ Interdit : profondeur > 2 */
.MostRecentArticles-list[data-articles-length="1"] :where(.MostRecentArticles-item) :where(.MostRecentArticles-itemTitle) {
  font-size: 1.2rem;
}
```

4. **Métadonnées contextuelles globales** (`body`, `html`, `:root`)

Les attributs `data-*` représentant des **métadonnées contextuelles globales** (type de device, thème, capacités, orientation viewport, etc.) sur `body`, `html` ou `:root` **PEUVENT** être utilisés dans des sélecteurs combinés.

Une métadonnée contextuelle globale caractérise l'environnement technique de la page entière (viewport, capacités navigateur, préférences utilisateur) sans définir un variant sémantique.

Ces sélecteurs sont autorisés car le "parent" n'est pas un Bloc ROCS, c'est un **contexte global de page**.

**Règles obligatoires** :
- Le sélecteur descendant **DOIT** utiliser `:where()` pour préserver la spécificité du bloc ciblé.
- La profondeur est limitée à **2 niveaux** (ancêtre global + bloc ciblé).

```css
/* ✅ Correct : :where() obligatoire */
body[data-device-type="mobile"] :where(.ProductCard) {
  /* layout mobile */
}
body[data-device-type="tablet"] :where(.ProductCard) {
  /* layout tablet */
}
html[data-orientation="landscape"] :where(.ProductGallery) {
  /* layout paysage */
}
:root[data-theme="dark"] :where(.EditorialSummary) {
  /* styles dark mode */
}

/* ❌ Interdit : sans :where(), spécificité trop haute */
body[data-device-type="mobile"] .ProductCard {
  /* layout mobile */
}

/* ❌ Interdit : profondeur > 2 */
body[data-device-type="mobile"] :where(.ProductCard) :where(.ProductCard-title) {
  font-size: 1rem;
}
```

> **Justification** : `:where()` garantit que le Bloc ciblé reste **maître de ses propres styles**. Le contexte global *informe*, il ne *force* pas.

5. **Intégration de composants tiers (exception cadrée)**

Dans le cadre d'une intégration de composant tiers encapsulé (cf. §0.3.6) :
- Les sélecteurs descendants **PEUVENT** être utilisés **uniquement** à l'intérieur du **Bloc wrapper ROCS** dédié à ce composant.
- Les sélecteurs d'intégration **DOIVENT** être **ancrés** sur ce wrapper (le wrapper est la racine de tous les sélecteurs tiers).
- Les sélecteurs d'intégration **NE DOIVENT PAS** cibler des éléments ROCS applicatifs ; ils ne servent qu'à styliser des classes/éléments internes du tiers.
  - En conséquence, un sélecteur d'intégration **NE DOIT PAS** contenir de classe ROCS autre que la classe du wrapper.
- Les sélecteurs descendants **NE DOIVENT PAS** dépasser **2 niveaux** après le wrapper.
  - ✅ Autorisé : `.PaymentProviderWidget .tp-button`, `.PaymentProviderWidget .tp-row .tp-cell`
  - ❌ Interdit : `.PaymentProviderWidget .tp-a .tp-b .tp-c`
- Ils **DOIVENT** conserver une spécificité faible et rester simples (éviter l'enchaînement profond de descendants, les sélecteurs d'`id`, et les patterns difficiles à maintenir).

**Exemples (tiers) — conformes** :

```css
/* ✅ OK : ancré sur le wrapper, ne cible que des classes du tiers */
.PaymentProviderWidget .tp-button { }
.PaymentProviderWidget .tp-row .tp-cell { }
```

**Exemples (tiers) — non conformes** :

```css
/* ❌ Interdit : non ancré sur le wrapper */
.tp-button { }

/* ❌ Interdit : mélange tiers + classe ROCS autre que le wrapper */
.PaymentProviderWidget .CheckoutSummary-title { }

/* ❌ Interdit : profondeur > 2 */
.PaymentProviderWidget .tp-a .tp-b .tp-c { }
```

---

## 7. Promotion

### 7.1 Quand promouvoir un Élément en Bloc ?

Un Élément **DEVRAIT** être promu en Bloc quand :
- Il atteint une **complexité structurelle significative** (heuristique : environ 3 descendants stylés).
- Il est **réutilisé dans plusieurs Blocs** distincts.
- Il porte une **logique autonome** (état, interaction complexe).

### 7.2 Exemple de promotion

Avant promotion :

```html
<div class="ProductGallery">
  <div class="ProductGallery-header">
    <h2 class="ProductGallery-headerTitle">Titre</h2>
  </div>
</div>
```

Après promotion :

```html
<div class="ProductGallery">
  <div class="ProductGalleryHeader">
    <h2 class="ProductGalleryHeader-title">Titre</h2>
  </div>
</div>
```

---

## Annexe A. Architecture & optimisation CSS (recommandations)

> **Note informative** : Les annexes sont **informatives** et ne créent pas d'obligations normatives.

### A.1 Organisation des fichiers

- **Par Bloc** : chaque Bloc ROCS peut avoir son propre fichier CSS/SCSS.
- **Par fonctionnalité** : regrouper les styles communs (ex: variables, mixins, animations).

### A.2 Préprocesseurs CSS

L'utilisation d'un préprocesseur (Sass, Less) est fortement recommandée pour :
- Factoriser les styles réutilisables.
- Gérer les media queries et container queries.

---

## Annexe B. Cas pratiques (FAQ)

### B.1 Comment gérer les composants tiers ?

Encapsulez-les dans un Bloc ROCS et ne modifiez pas leurs classes internes.

---

## Annexe C. Outillage (recommandations)

La conformité ROCS peut être automatisée via des linters et outils d'analyse statique.

### C.1 Validation automatique

**Stylelint** peut valider les conventions de nommage ROCS :

```json
{
  "extends": "stylelint-config-standard-scss",
  "rules": {
    "selector-class-pattern": "^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$"
  }
}
```

**ESLint** peut valider les classes dans JSX/HTML avec des plugins personnalisés.

> **Pour des configurations complètes et prêtes à l'emploi** (Stylelint, ESLint, GitHub Actions, pre-commit hooks, tests visuels), consultez le **[Guide d'implémentation ROCS](./IMPLEMENTATION_GUIDE.md)**.

---

## Annexe D. Licence

ROCS est publié sous licence MIT.
