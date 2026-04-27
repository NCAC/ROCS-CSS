# ROCS — *Role‑Oriented CSS Semantics*

**Version 1.0.0**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> ROCS est une discipline d'architecture HTML/CSS, portée par une **spécification normative** : des classes qui décrivent le **rôle**, un HTML qui reste **stable** pendant les refontes, et une réutilisation visuelle faite **uniquement dans le CSS**.

---

## 📚 Documents

- **[Spécification (normative)](./docs/fr/SPECIFICATION.md)** — règles DOIT/NE DOIT PAS
- **[Guide d'implémentation](./docs/fr/IMPLEMENTATION_GUIDE.md)** — outillage, CI, patterns
- **[Aide-mémoire](./docs/fr/CHEATSHEET.md)** — référence rapide (patterns, décision tree, états)
- **[Glossaire](./docs/fr/GLOSSARY.md)** — définitions normatives de tous les termes ROCS
- **[Guide de migration](./docs/fr/MIGRATION_GUIDE.md)** — BEM, OOCSS et Tailwind → ROCS
- **[Exemples](./examples/)** — cas concrets annotés ([ProductCard](./examples/ProductCard/), [NavigationMain](./examples/NavigationMain/), [CheckoutForm](./examples/CheckoutForm/))
- **[Validateur CLI](./tools/rocs-validate.js)** — `node tools/rocs-validate.js --dir ./examples`
- **[Contribuer](./CONTRIBUTING.md)**

---

## Pourquoi ROCS ?

Les projets CSS à long terme se heurtent presque toujours aux mêmes problèmes :

- **Refontes coûteuses** : le HTML doit changer parce qu'il encode la présentation.
- **CSS imprévisible** : dépendances de cascade, spécificité qui dérive, effets de bord.
- **Nommage qui dérive** : “composants génériques” (type design system) utilisés comme API applicative.
- **Dette HTML** : composition via `class="..."` et multiplication de hooks de style.

ROCS vise une conséquence simple : **si le rôle fonctionnel ne change pas, le HTML ne change pas**.

---

## Équilibre des responsabilités (HTML / CSS / JS)

ROCS part d'un objectif pragmatique : clarifier *qui fait quoi*.

- **HTML** : exprime le **sens** (structure, contenu, rôles fonctionnels).
- **CSS** : porte la **présentation** (mise en forme, responsive, thèmes, réutilisation visuelle).
- **JS** : gère l'**interaction** et l'état applicatif (ce que ni le HTML ni le CSS ne peuvent exprimer de façon fiable).

Le web évolue : le HTML et le CSS deviennent plus capables (layout, animations, states via pseudo-classes…). ROCS ne cherche pas à “figer” ces progrès : il cherche à conserver un HTML **sémantique et stable** malgré l'enrichissement du CSS.

---

## À qui s'adresse ROCS ?

ROCS est particulièrement adapté aux projets **"HTML‑first"** :

- **Rendu serveur classique** : PHP (Drupal, WordPress, Symfony/Twig), Python (Django), Ruby (Rails), Go, Node.js SSR…
- **Générateurs statiques** : Hugo, 11ty, Astro, Jekyll…
- **SSR/SSG moderne** : Next.js, Nuxt, SvelteKit utilisés en mode pages/SSR avec templates stables.

**Caractéristiques communes** :
- Le HTML est produit côté serveur (ou statiquement) et consommé tel quel par le navigateur.
- Le HTML est l'**artefact stable** : il est inspecté, versionné, maintenu dans la durée.
- Les classes sont **lisibles** dans le code source rendu et dans les outils de debug.

> **Note** : ROCS s'applique au **HTML contrôlé** par l'équipe. Les classes imposées par un framework, un outil ou un composant tiers peuvent coexister, mais restent **hors périmètre ROCS** (voir la spécification).

### Dans un contexte "component‑first" (SPA / CSS‑in‑JS)

Dans les architectures où le HTML est généré dynamiquement par du code JS/TS (React SPA, Vue SPA, Svelte, apps Electron…) et où les styles sont co‑localisés (CSS Modules, styled-components, etc.) :

- **ROCS reste applicable**, mais son bénéfice principal (HTML stable = artefact lisible) est **moins central**.
- Le "contrat" de nommage se déplace vers l'**API du composant** (props, variants).
- La stabilité vient du **code** (composant) plutôt que du HTML rendu.

#### CSS Modules : des mécanismes analogues

**On retrouve souvent des mécanismes proches** des principes ROCS :

```tsx
// ProductFooter.tsx
import styles from './ProductFooter.module.css';

export function ProductFooter() {
  return (
    <footer className={styles.root}>
      <button className={styles.addToBasket}>Ajouter au panier</button>
      <span className={styles.price}>29,99 €</span>
    </footer>
  );
}
```

Ici, le **scope du module** (`ProductFooter`) est analogue à un **Bloc ROCS**, et les classes locales (`root`, `addToBasket`, `price`) sont analogues à des **Éléments ROCS**. Si on "dépliait" le scoping technique, on obtiendrait une convention proche de ROCS :

```html
<!-- Équivalent ROCS (HTML-first) -->
<footer class="ProductFooter">
  <button class="ProductFooter-addToBasket">Ajouter au panier</button>
  <span class="ProductFooter-price">29,99 €</span>
</footer>
```

**Le nommage sémantique reste essentiel** : même avec le scoping automatique, nommer `addToBasket` (rôle fonctionnel) plutôt que `primaryButton` (apparence) garantit que le code reste lisible et maintenable lors des refontes.

#### Différences clés

| Aspect | ROCS (HTML-first) | CSS Modules (component-first) |
|--------|-------------------|-------------------------------|
| **Artefact stable** | HTML rendu | Code du composant (.tsx/.vue) |
| **Isolation** | Convention de nommage | Scoping technique (hash) |
| **Lisibilité** | HTML inspectable | Code source + devtools composant |
| **Portabilité** | Indépendant de l'outillage | Dépendant du build |
| **Discipline** | Manuelle (conventions) | Partiellement automatisée (scope) |

**Recommandation** : Si vous êtes dans ce contexte, évaluez si les conventions ROCS apportent suffisamment de valeur par rapport au coût de discipline. Les architectures de scoping technique (CSS Modules, CSS‑in‑JS) résolvent déjà certains problèmes que ROCS adresse (collisions, maintenance), mais avec des compromis différents (lisibilité HTML, portabilité, dépendance outillage). **Dans tous les cas, privilégiez le nommage sémantique** (rôle/fonction) plutôt que descriptif (apparence).

---

## Philosophie de nommage (opinionated)

ROCS assume d'être **verbeux et littéral** : un nom long mais explicite (`ProductFooter-addToBasket`) est plus maintenable qu'un nom court mais ambigu (`btn`, `cta`, `.card`).

> *"There are only two hard things in Computer Science: cache invalidation and naming things."* — Phil Karlton

Le bon nommage est l'une des choses les plus difficiles en programmation. ROCS prend parti : la **lisibilité du HTML** (artefact stable, inspecté, versionné) prime sur la concision.

### Ce que ROCS privilégie

- **Explicite plutôt que concis** : `BestSellersBooks-title` dit exactement ce que c'est, sans ambiguïté.
- **Stable dans le temps** : le nom survit aux refontes graphiques, parce qu'il exprime le **rôle**, pas l'apparence.
- **Auditable** : des conventions strictes permettent l'outillage (linters, CI, refactors automatisés).

### Pour qui ?

- ✅ **Projets maintenus dans la durée** : refontes, équipes qui changent, bases de code héritées.
- ✅ **HTML comme artefact central** : SSR, générateurs statiques, templates Twig/Django/Rails.
- ✅ **Équipes qui valorisent la lisibilité** : le HTML doit pouvoir être lu par des non-développeurs (QA, design, SEO, accessibilité).

ROCS n'est **pas plus lent à écrire** qu'une autre convention disciplinée (BEM, SUIT CSS, etc.). Il demande simplement de **nommer avec intention** : réfléchir au **rôle** avant d'écrire la classe, plutôt que de cumuler des classes génériques.

---

## Retours d'expérience : ce que ROCS cherche à éviter

Cette section résume des problèmes fréquemment rencontrés sur des projets maintenus dans la durée.

### 1) Composition par classes cumulées (Tailwind / Bootstrap / utilitaires)

**Symptômes observés** :

- **HTML illisible** : le rôle devient difficile à percevoir car l'attribut `class` décrit principalement la présentation.
- **Courbe d'apprentissage côté intégration** : pour être rapide, l'intégrateur doit connaître un grand volume de classes et leurs interactions.
- **Couplage à une librairie tierce** : l'API de style de l'application dépend d'un framework CSS externe.
- **Coût élevé de personnalisation** : ajuster des fondations (ex: breakpoints, échelles d'espacement, règles de layout) conduit souvent à une multiplication d'overrides.
- **Surcoût de chargement** : même si des mécanismes de purge existent, la stratégie de dépendance reste “framework-first”.

**Pourquoi c'est attractif** :

- **Vélocité** : quand la grammaire est maîtrisée, l'intégration d'une maquette peut être très rapide.

**Position ROCS** :

- Le HTML contrôlé **ne sert pas** à composer des styles.
- La réutilisation visuelle (design system) est **dans le CSS** (mixins/placeholders/tokens), pas dans `class="..."`.

### 2) BEM (noms de classes techniques + cascade qui dérive)

**Symptômes observés** :

- **Lisibilité dégradée** : la densité de ponctuation (`__`, `--`) rend souvent les sélecteurs et le HTML moins lisibles.
- **Concept de “Bloc” ambigu** : selon les équipes, le Bloc BEM tend à devenir un “composant” générique, ce qui encourage des patterns proches d'un design system.
- **Multiplication des exceptions** : des cas d'override apparents finissent par introduire de nouvelles conventions (helpers, exceptions de cascade, namespaces, etc.).

**Position ROCS** :

- Un **Bloc ROCS** est un **contexte sémantique** (métier/page/feature), pas un composant générique.
- Un **Élément** reste local et lisible, avec une profondeur limitée.
- Les états **ne sont pas des classes** (pas de `--modifier`). Les états natifs s'expriment via attributs HTML, ARIA et pseudo-classes ; seuls les états dynamiques pilotés par JS passent par `data-*`.

---

## Ce que ROCS garantit (si la spécification est respectée)

- **HTML lisible** : la classe dit “ce que c'est” (rôle/contexte), pas “comment c'est dessiné”.
- **Refontes sereines** : on change le CSS, pas les templates.
- **CSS maintenable** : spécificité faible et règles de sélection simples.
- **Architecture vérifiable** : conventions assez strictes pour être outillées (linters / CI).

---

## Ce que ROCS n'est pas

- Une bibliothèque de composants.
- Un design system.
- Une convention de “composition dans le HTML”.

---

## ROCS en 30 secondes

### 1) Une classe ROCS (0 ou 1) par élément

```html
<!-- ✅ Une classe ROCS : un rôle -->
<button class="ProductFooter-addToBasket">Ajouter au panier</button>

<!-- ❌ Composition dans le HTML -->
<button class="btn btn-primary btn-large">Ajouter au panier</button>
```

> Les classes additionnelles imposées par un framework/tiers peuvent exister, mais elles sont **hors périmètre ROCS** et **ne doivent pas servir d'API de style applicative**.

### 2) Nommage : Bloc / Élément

- **Bloc** = PascalCase (contexte autonome)
- **Élément** = `Bloc-element` (rôle local)

> Limites (lisibilité + outillage) : **Bloc ≤ 4 segments**, **Élément ≤ 3 segments**.  
> Si un Élément devient trop complexe, il **peut être promu en Bloc** (voir la spécification §7).

```html
<section class="BestSellersBooks">
  <h2 class="BestSellersBooks-title">Meilleures ventes</h2>
  <ul class="BestSellersBooks-items">...</ul>
</section>
```

### 3) `data-*` = uniquement pour ce qui bouge (JS)

> `data-*` est réservé aux états/paramètres **pilotés par JS** (pas pour des variants **statiques/persistants**).

```html
<div class="ProductGallery" data-gallery-active="0">...</div>
```

```css
/* ✅ État dynamique */
.ProductGallery[data-gallery-active="0"] {
  /* styles */
}

/* ❌ Contexte persistant déguisé */
/* .ProductCard[data-product-type="book"] { ... } */
```

### 4) Sélecteurs simples (pas de dépendances implicites)

ROCS évite les styles “par contexte” implicite :

```css
/* ✅ Auto-suffisant */
.BestSellersBooks-title { }

/* ❌ Dépend du parent */
/* .BestSellersBooks .BestSellersBooks-title { } */
```

> Certaines exceptions (notamment pour des composants tiers) sont cadrées dans la spécification.

---

## Résumé des règles (synthèse)

- **0 ou 1 classe ROCS par élément** (le périmètre ROCS concerne le **HTML contrôlé**).
- **Pas de Blocs design system génériques** (`Button`, `Modal`, `Card`, etc.) comme API applicative.
- **Pas de composition dans le HTML** : la réutilisation est dans le CSS. Les classes utilitaires (`.flex`, `.p-4`, `.visually-hidden`, etc.) **ne doivent pas** être utilisées.
- Les états **ne sont pas des classes** (pas de `--modifier`). Les états **natifs** s'expriment via attributs HTML, ARIA et pseudo-classes ; seuls les états **dynamiques pilotés par JS** passent par `data-*`.
- **Sélecteurs simples** : pas de dépendances au contexte (sauf exceptions explicites).
- **Pas d'`id` en CSS** : les `id` sont réservés au ciblage JavaScript et aux ancres HTML.

---

## Démarrer

1. Lire la **[Spécification](./docs/fr/SPECIFICATION.md)** (ce qui est obligatoire).
2. Appliquer le **[Guide d'implémentation](./docs/fr/IMPLEMENTATION_GUIDE.md)** (outillage + CI).
3. Consulter l'**[Aide-mémoire](./docs/fr/CHEATSHEET.md)** pour avoir toutes les règles en une page.
4. Regarder les **[exemples](./examples/)** pour un modèle de structure ([ProductCard](./examples/ProductCard/README.md), [NavigationMain](./examples/NavigationMain/README.md), [CheckoutForm](./examples/CheckoutForm/README.md)).
5. Lancer le **validateur** sur votre code : `npm run validate`.

---

## Licence

MIT — voir [`LICENSE`](./LICENSE).
