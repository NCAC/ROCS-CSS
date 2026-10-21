# Comparaison — ROCS, BEM et Atomic CSS

> Document **informatif** (non normatif). Les règles de ROCS sont dans [`SPECIFICATION.md`](./SPECIFICATION.md). Pour migrer un projet existant, voir [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md).

ROCS, BEM et Atomic CSS (entendu ici au sens **utility-first** : Tailwind, Bootstrap utilities, Tachyons…) répondent à la même question — *comment organiser le HTML et le CSS pour qu'un projet reste maintenable ?* — mais avec **trois réponses différentes** sur où placer la connaissance du style et sur ce que doit dire le HTML. Aucune n'est universellement supérieure : chacune optimise un axe différent.

Ce document compare les trois sur des axes concrets, montre le **même composant** rendu dans chaque convention, puis indique dans quels contextes l'une ou l'autre est plus adaptée.

## Sommaire

1. [Les trois philosophies en une phrase](#1-les-trois-philosophies-en-une-phrase)
2. [Tableau comparatif](#2-tableau-comparatif)
3. [Note sur BEM : une convention sans décision architecturale](#3-note-sur-bem--une-convention-sans-décision-architecturale)
4. [Le même composant rendu dans les trois conventions](#4-le-même-composant-rendu-dans-les-trois-conventions)
5. [Quand choisir quoi](#5-quand-choisir-quoi)
6. [Voir aussi](#6-voir-aussi)

---

## 1. Les trois philosophies en une phrase

- **Atomic CSS (utility-first)** — *Le HTML compose le style à partir de classes utilitaires fournies par une librairie (Tailwind, Bootstrap…).* La connaissance visuelle est portée par l'**attribut `class`**. Le CSS est largement écrit une fois pour toutes (par la librairie) et purgé à la build.
- **BEM** — *Le HTML déclare des composants (`Block`, `__Element`, `--modifier`) ; le CSS définit l'apparence de chaque composant.* La connaissance visuelle est portée par le **CSS du composant**, mais les variantes et états remontent dans le HTML via les modifiers.
- **ROCS** — *Le HTML déclare un rôle local (0 ou 1 classe par élément) ; tout le style et toute la composition sont dans le CSS.* La connaissance visuelle est portée par le **CSS seul**. Le HTML reste stable même quand la présentation change.

> **À noter.** La définition d'un "Block" en BEM est volontairement ouverte : selon les équipes, il peut désigner un composant UI réutilisable (`.button`, `.modal`) ou un contexte applicatif (`.product-card`). Cette ouverture a des conséquences pratiques importantes — voir la [Note sur BEM](#3-note-sur-bem--une-convention-sans-décision-architecturale) après le tableau.

---

## 2. Tableau comparatif

### Philosophie & rôle de la classe

| Axe | Atomic CSS (Tailwind/Bootstrap) | BEM | ROCS |
|---|---|---|---|
| Objectif principal | Vélocité d'écriture, prototypage, livraison rapide | Convention de nommage pour structurer un projet CSS | Lisibilité du HTML et maintenabilité long terme |
| Choix fondamental privilégié | Vitesse d'intégration | Convention partagée et explicite | Stabilité de l'artefact HTML |
| Rôle de la classe CSS | Propriété visuelle atomique (`p-4`, `text-lg`) | Composant ou variante de composant | Rôle local dans un contexte applicatif |
| Lieu de la composition du style | Dans le HTML (`class="…"`) | Partagée : structure en CSS, variantes/états dans le HTML | Dans le CSS uniquement (mixins, placeholders, tokens) |
| Lieu de la réutilisation | HTML (classes répétées) | CSS (Block réutilisé) + HTML (mixin de classes) | CSS (mixins / placeholders) |

### Lecture du HTML

| Axe | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Lisibilité du HTML sans connaître la convention | Faible — le `class` décrit l'apparence, pas le rôle | Moyenne — le rôle est lisible mais brouillé par les modifiers | Élevée — la classe nomme le rôle |
| Charge cognitive à la lecture du HTML | Élevée (volume de classes par élément) | Modérée (grammaire `__` / `--` à internaliser) | Faible une fois la convention apprise (noms longs mais littéraux) |
| Couplage HTML ↔ apparence | Fort (changer l'apparence ⇒ réécrire le `class`) | Moyen (les modifiers visuels vivent dans le HTML) | Faible (le HTML ne décrit que le rôle) |

### Architecture CSS & états

| Axe | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Spécificité des sélecteurs | Atomique (une classe = une règle), très basse | Variable, dépend de la discipline | Cadrée à 0,1,0 par construction |
| Risque de cascade involontaire | Très faible (utilities indépendantes) | Réel si descendants imbriqués (`.Block .Block__el`) | Très faible (sélecteurs auto-suffisants) |
| Gestion des états | Variantes prefixées (`hover:`, `focus:`, `data-[state=open]:`) | Modifiers `--state` ajoutés dans le HTML | Attributs natifs HTML, ARIA, pseudo-classes ; `data-*` pour états dynamiques JS |
| Séparation structure / état | Faible (mêmes classes utilitaires partout) | Mélangée (état remonte dans `class`) | Claire (l'état est un attribut, pas une classe) |

### Refontes & maintenance

| Axe | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Refonte graphique sans toucher au HTML | Difficile (les classes décrivent l'apparence) | Partielle (les variantes visuelles sont dans le HTML) | Native (le CSS change, le HTML ne bouge pas) |
| Refonte sémantique (renommer un rôle) sans toucher au CSS | Sans objet (le HTML ne porte pas de rôle) | Renommer un Block ⇒ HTML + CSS | Renommer un Block ⇒ HTML + CSS, mais portée locale et outillée |
| Lisibilité à froid (6 mois plus tard) | Faible — il faut décrypter le `class` | Moyenne — la grammaire aide mais les modifiers brouillent | Élevée — la classe lit le rôle |
| Coût d'apprentissage initial | Modéré à élevé (mémoriser le vocabulaire de la librairie) | Faible (3 conventions : Block, Element, Modifier) | Modéré (règles strictes, mais peu nombreuses) |

### Outillage & écosystème

| Axe | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Outillage natif | Très riche (Tailwind, plugins, IntelliSense, JIT) | Aucun outil officiel — conventions à internaliser | Linter Stylelint + ESLint + validateur custom (ce repo) |
| Bundle CSS final | Très petit après purge (seules les classes utilisées sont émises) | Dépend de la discipline (CSS écrit à la main) | Dépend de la discipline (CSS écrit à la main, factorisé via mixins) |
| Couplage à un fournisseur tiers | Fort (l'API de style = celle de la librairie) | Aucun | Aucun |
| Écosystème (composants, thèmes prêts à l'emploi) | Très riche | Modéré | Émergent |

---

## 3. Note sur BEM : une convention sans décision architecturale

Atomic CSS et ROCS répondent **explicitement** à une question structurante — *où la composition du style se produit-elle ?* :

- **Atomic CSS** répond : dans le HTML, par accumulation de classes utilitaires.
- **ROCS** répond : dans le CSS, via mixins et placeholders ; le HTML ne porte qu'un rôle.

**BEM ne répond pas à cette question.** Il fournit une grammaire (`Block__Element--modifier`) mais laisse à l'équipe le soin de décider ce qu'est un Block. Du coup, deux projets "100 % BEM" peuvent être radicalement différents en esprit : l'un traite Block comme **primitive UI réutilisable** (`.button`, `.modal`, `.input`) — BEM y joue le rôle d'un design system implicite —, l'autre comme **feature applicative** (`.product-card`, `.checkout-form`) — BEM y joue le rôle d'une taxonomie sémantique. Les deux sont conformes à BEM.

### 3.1 Les deux pôles d'attraction

Sur un projet maintenu, deux pressions tirent dans des sens opposés :

1. **Pression DRY** — *"j'écris le même style de bouton à 10 endroits, factorisons-le"* → glissement vers la primitive UI (`.button`, `.button--primary`).
2. **Pression sémantique** — *"ce bouton dans le panier porte un rôle particulier"* → modifiers contextuels ou combinaison de Blocks (`class="button button--primary product-card__cta"`) → glissement vers le contexte.

Sans règle pour trancher, le développeur arbitre au cas par cas. Une base de code finit fréquemment par mélanger les deux registres sans qu'on puisse prédire de quel type est un Block donné avant d'en lire la définition.

### 3.2 Le coût quotidien : nommer un élément

Le développeur qui doit nommer une nouvelle classe BEM ne dispose d'**aucune procédure**. La grammaire lui dit *comment écrire* le nom, pas *quoi représenter*. Devant un nouvel élément, il doit trancher seul :

- Block autonome ou Element d'un Block existant ?
- Si Block : nommé par sa forme (`.card`), par son rôle (`.product-card`), par son emplacement (`.sidebar-item`) ?
- Si Element : rattaché à quel Block parmi les candidats parents dans la page ?
- Variante visuelle : modifier, nouveau Block, ou combinaison de Blocks ?

Faute de règle, il s'en remet à l'**archéologie** (regarder ce qui s'est déjà fait dans le projet), à l'intuition, ou à un collègue. La convention se transmet alors par imitation des premières décisions de nommage, qui figent implicitement l'architecture pour toute la durée du projet — sans que cette architecture ait jamais été écrite ni arbitrée explicitement. Quand l'équipe tourne, ce mode de transmission devient un coût notable : chaque nouveau dev doit reconstruire les règles tacites par lecture du code existant.

### 3.3 Indice empirique : les conventions dérivées

Les grandes adoptions BEM ont presque toutes ajouté une **couche complémentaire** pour combler ce vide :

- **ITCSS** (Harry Roberts) — préfixes de namespace `o-` (objet), `c-` (composant), `u-` (utility), `is-` (état), `js-` (hook JS) pour rendre explicite ce qu'un Block représente.
- **BEMIT** — combine ITCSS et BEM pour clarifier la taxonomie.
- **SUIT CSS** — fixe Block = composant (syntaxe `PascalCase-camelCase--modifier`).
- **rscss** — penche dans l'autre sens, plus sémantique et contextuel.

Ces conventions existent **précisément parce que BEM ne tranche pas**. Elles patchent une sous-spécification qui n'est pas accidentelle mais structurelle.

### 3.4 Lecture juste

Cette note n'est pas une condamnation. BEM est une **convention de nommage qui laisse l'architecture ouverte** : c'est un degré de liberté précieux dans certains contextes (équipe stable et expérimentée, périmètre fixé d'avance, projet court) et un coût dans d'autres (équipe rotative, cycle de vie long, refontes multiples). BEM a été conçu chez Yandex pour un contexte à très forte discipline interne, où cette ouverture ne mordait pas. La difficulté apparaît surtout quand BEM est adopté sans la discipline structurante qui l'accompagnait à l'origine.

Atomic CSS et ROCS prennent chacun **un parti** sur la question — opposés mais explicites. BEM choisit de ne pas choisir : c'est un choix défendable, qu'il faut juste connaître quand on adopte la méthode.

---

## 4. Le même composant rendu dans les trois conventions

Pour rendre les différences concrètes, voici un même `ProductCard` (header avec badge et bouton favori, image, titre, description, prix, CTA) dans les trois conventions.

### 4.1 Version Atomic CSS (Tailwind)

```html
<article class="bg-white border-2 border-emerald-500 rounded-lg shadow-sm hover:shadow-md p-6 grid gap-4 transition-shadow">
  <div class="flex items-center justify-between">
    <span class="px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-white rounded">
      Nouveau
    </span>
    <button class="bg-transparent border-0 text-2xl text-gray-500 hover:text-red-500 cursor-pointer"
            aria-label="Ajouter aux favoris">♥</button>
  </div>

  <img class="w-full aspect-[4/3] object-cover rounded-lg" src="…" alt="Produit exemple">

  <div class="grid gap-3">
    <h3 class="text-xl font-semibold text-gray-900">Nom du produit</h3>
    <p class="text-sm text-gray-500 leading-relaxed line-clamp-3">
      Description courte du produit avec quelques détails importants.
    </p>
    <div class="flex items-center justify-between mt-2">
      <span class="text-2xl font-bold text-emerald-500">49,99 €</span>
      <button class="px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        Ajouter au panier
      </button>
    </div>
  </div>
</article>
```

**Ce qu'on lit** : la mise en forme exacte (couleurs, espacements, tailles). Le **rôle métier** (carte produit, badge, CTA) doit être déduit de la structure HTML et des libellés. Refondre l'apparence sans toucher au HTML est difficile — les classes *sont* l'apparence.

### 4.2 Version BEM

```html
<article class="product-card product-card--featured">
  <div class="product-card__header">
    <span class="product-card__badge product-card__badge--new">Nouveau</span>
    <button class="product-card__favorite" aria-label="Ajouter aux favoris">♥</button>
  </div>

  <img class="product-card__media" src="…" alt="Produit exemple">

  <div class="product-card__content">
    <h3 class="product-card__title">Nom du produit</h3>
    <p class="product-card__description">
      Description courte du produit avec quelques détails importants.
    </p>
    <div class="product-card__footer">
      <span class="product-card__price product-card__price--highlight">49,99 €</span>
      <button class="product-card__cta product-card__cta--primary">
        Ajouter au panier
      </button>
    </div>
  </div>
</article>
```

**Ce qu'on lit** : le rôle de chaque élément (`__header`, `__title`, `__cta`) et ses variantes (`--featured`, `--primary`). Le HTML reste cohérent même si l'apparence change, mais les **variantes visuelles** (`--primary`, `--highlight`) remontent dans le `class` : refondre la palette graphique impose de toucher au HTML pour ajuster ou retirer des modifiers.

### 4.3 Version ROCS

```html
<article class="ProductCard" data-featured>
  <div class="ProductCard-header">
    <span class="ProductCard-headerBadge">Nouveau</span>
    <button class="ProductCard-headerFavorite" aria-label="Ajouter aux favoris">♥</button>
  </div>

  <img class="ProductCard-media" src="…" alt="Produit exemple">

  <div class="ProductCard-content">
    <h3 class="ProductCard-title">Nom du produit</h3>
    <p class="ProductCard-description">
      Description courte du produit avec quelques détails importants.
    </p>
    <div class="ProductCard-footer">
      <span class="ProductCard-price" data-tone="highlight">49,99 €</span>
      <button class="ProductCard-cta">Ajouter au panier</button>
    </div>
  </div>
</article>
```

**Ce qu'on lit** : seulement le rôle. Aucune classe de variante visuelle — `data-featured` est un attribut booléen positionnel, `data-tone="highlight"` est un paramètre client. Le **CSS** définit ce que "featured" et "highlight" signifient visuellement ; refondre la palette graphique ne touche pas au HTML.

> Voir l'exemple complet (avec SCSS et état `data-state="expanded"`) dans [`examples/ProductCard/`](../../examples/ProductCard/).

---

## 5. Quand choisir quoi

Aucune des trois approches ne disqualifie les autres. Le choix dépend de la **forme du projet**, de l'**équipe** et du **cycle de vie attendu**.

### Atomic CSS / utility-first est plus adapté quand…

- Le projet privilégie la **vélocité d'intégration** (prototypes, MVP, design qui bouge encore).
- L'équipe est **front-only** et maîtrise l'écosystème de la librairie (Tailwind notamment).
- Le HTML est **généré dynamiquement** par des composants (React, Vue, Svelte) où la classe n'est lue qu'au build, pas inspectée en production.
- Le **bundle CSS minimal** est une priorité forte (purge agressive).
- Le design system est **fourni** par la librairie ou par une couche au-dessus (Headless UI + Tailwind, shadcn/ui…).

### BEM est plus adapté quand…

- Le périmètre du projet est une **bibliothèque de composants UI distribuable**, où l'identité "Block = composant primitif" s'aligne naturellement et où les modifiers documentent les variantes du composant.
- L'équipe valorise la **familiarité** d'une convention largement adoptée dans l'industrie : onboarding accéléré pour les intégrateurs déjà formés, abondance de ressources et de littérature.
- L'équipe **accepte que les variantes visuelles vivent dans le HTML** (`--primary`, `--featured`) plutôt que d'être encapsulées dans le CSS — modèle proche d'un design system explicite.
- Le projet **ne cherche pas à imposer un parti pris architectural** (Block = composant *ou* contexte) ; la flexibilité de la définition de Block est vue comme un atout (voir §3). À l'inverse, si le projet **fixe explicitement** ce parti pris et s'y tient, BEM convient ; sans ce choix, on hérite de l'ambiguïté décrite plus haut.

### ROCS est plus adapté quand…

- Le HTML est **rendu côté serveur** ou **statiquement** (Drupal, WordPress, Symfony/Twig, Django, Rails, Hugo, 11ty, Astro, Next.js SSR…) et constitue un **artefact stable inspecté et versionné**.
- Le projet vise un **cycle de vie long** avec **plusieurs refontes graphiques** prévues sans réécrire les templates.
- L'équipe valorise un HTML **lisible par des non-développeurs** (QA, design, SEO, accessibilité).
- Le périmètre métier est **applicatif** plutôt que "bibliothèque de composants distribuée".
- Le projet veut une **convention HTML/CSS autonome**, sans dépendance à une librairie ou un framework CSS tiers.
- L'équipe est **mixte** (front + back) et veut une grammaire qui se lit aussi bien dans un template SSR (Twig, Django, Rails) que dans un composant SSR (Next.js, Nuxt).
- L'équipe accepte de s'aligner sur une **discipline cadrée par la spécification** et soutenue par l'outillage (linter, validateur, CI) — règles plus nombreuses que BEM, mais explicites et vérifiables, ce qui aide notamment les équipes qui tournent (la spec remplace l'archéologie).

### En pratique

Les trois approches **peuvent coexister** dans un même projet pendant une transition (voir [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)). Une équipe peut aussi choisir ROCS pour le **HTML qu'elle contrôle** et accepter qu'un framework tiers impose des classes utilitaires hors périmètre — ROCS prévoit explicitement ce cas (§ classes "hors périmètre").

---

## 6. Voir aussi

- [`SPECIFICATION.md`](./SPECIFICATION.md) — règles normatives de ROCS
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) — passer d'un projet BEM, OOCSS ou Tailwind à ROCS, étape par étape
- [`GLOSSARY.md`](./GLOSSARY.md) — définitions précises de "Block", "Element", "modifier", etc.
- [`examples/ProductCard/`](../../examples/ProductCard/) — l'exemple complet en ROCS, avec SCSS commenté
