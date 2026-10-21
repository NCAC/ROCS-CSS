# ROCS — *Role‑Oriented CSS Semantics*

**Version 1.0**

> ROCS is a **normative specification** for HTML/CSS architecture: HTML that carries meaning, CSS classes that express that meaning, and style composition done exclusively in CSS.
>
> ROCS is **framework‑agnostic** regarding JavaScript: it defines a discipline for HTML structure and CSS styling.

> **Informative note**: a separate document (guide/manifesto) may be derived from this specification.

---

## Table of contents
1. [Normative conventions](#0-normative-conventions)
2. [Goals and roles](#1-goals-and-roles)
3. [Principles](#2-normative-principles) — including [§2.0 Scope isolation](#20-founding-principle--scope-isolation-normative), [§2.0.1 Scope of the guarantee](#201-scope-of-the-isolation-guarantee-normative)
4. [Naming](#3-naming-normative)
5. [`data-*` attributes](#4-data-attributes-free-but-strictly-reserved-for-js)
6. [Identifiers (`id`)](#5-id-forbidden-in-css)
7. [CSS selectors](#6-css-selectors-specificity-cascade)
8. [Promotion](#7-promotion)
- [Annex A. CSS Architecture & optimisation](#annex-a-css-architecture--optimisation-recommendations)
- [Annex B. Practical cases (FAQ)](#annex-b-practical-cases-faq)
- [Annex C. Tooling](#annex-c-tooling-recommendations)
- [Annex D. License](#annex-d-license)
- [Annex E. Known limits and assumed costs](#annex-e-known-limits-and-assumed-costs-informative)
- [Annex F. ROCS and native CSS scoping](#annex-f-rocs-and-native-css-scoping-scope-layer-informative)

---

## 0. Normative conventions

### 0.1 Statement status

In this document, the following words have **normative** meaning:

- **MUST / MUST NOT**: absolute requirement.
- **SHOULD / SHOULD NOT**: strong recommendation; an exception is permitted only if justified and documented.
- **MAY**: permitted option.

Any statement that does not use these terms is **informative** (examples, explanations, context) and creates no obligation.

### 0.2 Scope

ROCS specifies an **HTML/CSS contract**:

- **classes** express a role/context (structural semantics);
- **visual reuse** (design system) is done in CSS (mixins, placeholders, etc.);
- `data-*` are reserved for **JS‑driven dynamic states/parameters** and **contextual metadata** (layout/configuration parameters);
- `id` are reserved for **JavaScript targeting** and **MUST NOT** be used in CSS.

### 0.3 Normative definitions

#### 0.3.1 ROCS class

A **ROCS class** is a CSS class that satisfies the following constraints:

1. **Syntax**:
   - **Block**: `^[A-Z][a-zA-Z0-9]*$` (PascalCase, starts with an uppercase letter)
   - **Element**: `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$` (Block + hyphen + strict camelCase limited to 3 segments)

2. **Maximum name depth**:
   - For a **Block**, depth is the number of **PascalCase segments** (e.g. `ProductCheckoutSummary` = 3 segments `Product` + `Checkout` + `Summary`).
   - For an **Element**, depth is the number of **camelCase segments** after the hyphen (e.g. `closeButtonIcon` = 3 segments `close` + `Button` + `Icon`).

   Associated rules:
   - An Element name (the part after the hyphen) **MUST NOT** exceed **3 segments**.
   - The first segment of an Element **MUST** start with a lowercase letter.
   - Subsequent segments **MUST** start with an uppercase letter followed by lowercase letters.
   - All-caps acronym sequences (e.g. `URL`, `API`) are **NOT** allowed in the Element part.
   - Digits **MAY** be used as segment suffixes (e.g. `step2Title`).

3. **Semantics**: expresses a **role/context** in the document, never a visual style.

#### 0.3.2 Block

A **Block** is a level‑1 ROCS class (no hyphen) that represents:
- an **autonomous semantic unit** (business, page, feature);
- a **context** in which Elements exist;
- generally a section, a business component, or a content module.

**Valid examples**: `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`, `CookiesConsentModal`, `ProductCard`.

**Invalid examples**: `Button` (too generic, design system), `Modal` (generic UI mechanism / design system), `card` (not PascalCase), `Best_Sellers` (underscore forbidden).

#### 0.3.3 Element

An **Element** is a level‑2 ROCS class (format `Block-element`) that represents:
- a **local role** inside a Block;
- a component **dependent** on its parent context.

**Valid examples**: `BestSellersBooks-title`, `CookiesConsentModal-closeButton`, `ProductCard-image`, `CookiesConsentModal-headerTitle`.

**Invalid examples**: `BestSellersBooks-Title` (not camelCase after the hyphen), `BestSellersBooks_title` (underscore forbidden).

#### 0.3.4 Element name depth

The name after the hyphen is in **camelCase** and may contain multiple words (e.g. `closeButton`, `headerTitle`). **Name depth** is measured by the number of camelCase segments.

**Rule**: Depth **MUST NOT** exceed **3 segments**.

> **Important**: The DOM structure **often corresponds** to meaning — it is natural for a `CookiesConsentModal-headerTitle` to be a child of the element carrying the header. But this correspondence is **not the naming criterion**. The name expresses the **semantic role** of the element in the Block's context, not its position in the HTML tree. A `CookiesConsentModal-headerTitle` could technically appear at any nesting level if the HTML structure requires it.

**Limit**: if an Element becomes too complex (rich internal structure, reuse, autonomous logic), it **SHOULD** be promoted to a Block (see §7).

#### 0.3.5 Promotion

A **promotion** is the transformation of an **Element** into an autonomous **Block**.

The normative rules and recommendations for promotion are defined in §7.

#### 0.3.6 Dynamic state/parameter

A **dynamic state/parameter** is information stored in the DOM as a `data-*` attribute whose value **MUST** be able to vary during the lifecycle of a page and **MUST** be effectively modified by JavaScript (user interaction, timers, requests, internal navigation, etc.).

#### 0.3.7 Contextual metadata

**Contextual metadata** is information that characterises a **configuration** or **layout parameter** (number of items, orientation, columns, device type, etc.) without defining the **semantic role/context** of the element. This information is persistent but **is not style composition**.

Contextual metadata is distinguished from a semantic variant if:
1. it does **not** encode a semantic variant/category (which would warrant a distinct ROCS class);
2. it does **not** encode a design‑system style (`primary`, `large`, `compact`, etc.);
3. a distinct ROCS class **per value** would be unreasonable.

#### 0.3.8 Scope of application

ROCS applies to **HTML controlled** by the development team.

**Normative exceptions**:
- **Third‑party components** (external libraries): wrap in a ROCS Block, do not modify their internal classes.
- **JavaScript frameworks** (React, Vue, etc.): framework technical classes (e.g. `v-cloak`, `data-v-*`) are **outside** ROCS scope.
- **Empty classes** (`class=""`): allowed if the `class` attribute is required by the framework or templating engine.

**Applicative style API (normative)**:
- In controlled HTML, the **ROCS class** (unique, cf. §3.1) is the **sole applicative style API** under the integrator team's responsibility.

**Non‑ROCS classes (coexistence with a ROCS class)**:
- An HTML element **MAY** carry, in addition to its ROCS class (cf. §3.1), one or more **non‑ROCS** classes only if:
  1. they are **imposed** by a tool, framework, or third‑party component; or
  2. they are **strictly technical** (non‑semantic) and clearly identifiable (by project convention, e.g. via a dedicated prefix).
- These **non‑ROCS** classes are not under the ROCS responsibility of the integrator team.
- **Non‑ROCS** classes **MUST NOT** be used to compose or carry applicative ROCS styles (they do not serve as CSS hooks in the ROCS architecture).

> **Normative clarification**: rule §3.1 ("0 or 1 ROCS class") concerns exclusively the **ROCS class(es)**. The additional classes permitted by this section (framework/third‑party/technical) are **outside ROCS scope** and must not be interpreted as authorisation to compose applicative styles via the `class` attribute.

---

## 1. Goals and roles

ROCS aims to:

- preserve **stable HTML** during visual redesigns;
- make code **readable** (role before technique);
- keep the CSS codebase **predictable** (low specificity, simple rules);
- avoid **HTML debt** (no utility classes / no composition in HTML).

> **Positioning**: ROCS is neither a CSS framework nor a component library. It is a **naming and structuring discipline** that overlays any existing tooling (Sass, PostCSS, native CSS, design tokens, etc.). ROCS does not dictate *how* to write CSS (properties, values, file architecture), but *how to name HTML classes* and *where to compose styles* (always in CSS, never in HTML).

---

### 1.1 Roles of the mechanisms (summary)

- **CSS classes**: express the **role / context** of an element. They **MAY** be read by JS, but **MUST NOT** represent a state (they do not change at runtime).
- **`data-*` attributes**: express **JS‑driven dynamic states/parameters**, or **contextual metadata** (layout/configuration parameters). They **MUST NOT** represent a persistent semantic variant or business context (which must be a ROCS class).
- **`id`**: reserved for **JS targeting** (and possibly anchors/navigation). **MUST NEVER** be used in CSS selectors.

---

### 1.2 Terminology

The following terms are used throughout this document.

- **Role**: functional meaning of an element in the document (what it *is* / what it *does*), independently of styling.
  - example: "title of the *Best Sellers* layer", "*add to cart* button", "layer slider".
- **Context**: the semantic scope in which a role exists.
  - example: the `*-title` role only makes sense within a given layer (`BestSellersBooks`, `StaffPicksBooks`, etc.).
- **Block**: top‑level semantic unit (business/page/content) that defines a context.
  - e.g. `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`.
- **Element**: role local to a Block, expressed as `Block-element`.
  - e.g. `BestSellersBooks-title`, `BestSellersBooks-slider`.

---

## 2. Normative principles

### 2.0 Founding principle — Scope isolation (normative)

Every ROCS class **MUST** be a **fully isolated styling target**: writing a style rule on a ROCS class affects exactly the elements carrying that class, and nothing else. The effect of styling a class **MUST NOT** depend on the element's position in the DOM tree, on the presence of any other class, or on any implicit parent context.

All naming and selector rules in this specification (§3.1 single class per element, §6.1 low and uniform specificity, §6.2.1 self-sufficiency, prohibition of combined selectors, of `id`, and of `!important`) are **corollaries** of this principle: they are the necessary conditions for scope isolation to hold.

### 2.0.1 Scope of the isolation guarantee (normative)

ROCS guarantees **scope isolation** (§2.0): the *target* of a style declaration is fully determined by the ROCS class, with no contextual side effect, on the HTML controlled by the team.

ROCS does **not** govern the **resolution between multiple declarations targeting the same class**. When two rules apply to the same ROCS class, declaration order and the CSS cascade decide the outcome — this is a property of CSS and **MUST** be handled entirely within the CSS layer controlled by the team. It is never expressed or decided from the HTML.

In other words: ROCS guarantees *which elements* a rule affects; it deliberately does not constrain *how several rules on the same class combine*, which is delegated to the CSS composition discipline (see §2.3 and Annex A).

### 2.1 HTML carries meaning (normative)

HTML **MUST** express the structure and meaning (role) of the document.

- A visual redesign **MUST NOT** force changes to HTML that carries ROCS classes.
- Native attributes (`disabled`, `aria-*`, etc.) **MUST** retain their semantic meaning.

### 2.2 A CSS class expresses the element's role (normative)

A ROCS class **MUST** be a **role name**: it represents *what the element is* in the document (its context), **never** *what it looks like*.

**Compliant example**: an "add to cart" button located in a product footer.

```html
<button class="ProductFooter-addToBasket">Add to cart</button>
```

**Non-compliant examples**:

```html
<!-- component composition / variants in HTML -->
<button class="Button" data-button-type="cta" data-button-level="primary">

<!-- utility / design tokens in HTML -->
<button class="btn btn--action btn--action-primary">
```

### 2.3 Style composition happens in CSS (normative)

Reusable styles **MUST** be factored **in CSS**, never in the HTML `class` attribute.

**Prohibitions**:
- In **controlled HTML** (cf. §0.3.8), utility classes (e.g. `.visually-hidden`, `.flex`, `.p-4`) **MUST NOT** be used.
- Style composition in the `class` attribute **MUST NOT** be used.

> **Informative note — Tooling**: In practice, this requirement implies the use of a CSS factoring mechanism (Sass/Less preprocessor, PostCSS, or native CSS features such as `@layer`, `@scope`, custom properties). Without such a tool, factoring reusable styles becomes impractical. See [Annex A](#annex-a-css-architecture--optimisation-recommendations) for architecture recommendations.

#### Boundary contract with the composition layer (informative — SHOULD)

ROCS guarantees scope isolation (§2.0) on its own, independently of any preprocessor. Any industrial-scale CSS methodology presupposes a composition layer (Sass, Less, Stylus, PostCSS, native CSS features) — this is an established fact, not a normative requirement of ROCS. Defining that layer is **out of ROCS scope**.

To preserve the ROCS guarantees, the composition layer **SHOULD** respect the following boundary contract:

1. It **SHOULD NOT** introduce variable specificity between ROCS applicative rules (specificity should remain low and uniform — corollary of §6.1).
2. It **SHOULD NOT** create a dependency from one ROCS class's styling onto another ROCS selector (no cross-selector coupling — corollary of §2.0 / §6.2.1).
3. Any order-dependent resolution **SHOULD** be confined within the CSS layer (§2.0.1) and **SHOULD NOT** be observable from or decided by the HTML.

If the composition layer violates these conditions, it is the layer that breaks scope isolation — not ROCS itself. ROCS specifies *which properties* the composition layer should preserve, not *how* to implement it.

**Example** (with SCSS preprocessor):

```scss
.ProductFooter-addToBasket {
  @include btn_cta();
  @include btn_primary();
}
```

---

## 3. Naming (normative)

### 3.1 "One class maximum per element" rule

> *Corollary of §2.0 — scope isolation.*

An HTML element **MUST** carry **0 or 1** ROCS class.

- The class **MUST** be a **role name**, never an assembly of appearances.
- Using **multiple ROCS classes** on the same element (e.g. `class="Button Button--primary"`) **MUST NOT** occur.

> Note: cf. §0.3.8 for exceptions (framework technical classes, third‑party components).

### 3.2 Naming conventions (normative)

ROCS classes **MUST** follow these patterns:

- **Block**: **PascalCase** (pattern: `^[A-Z][a-zA-Z0-9]*$`)
  - e.g. `BestSellersBooks`, `CheckoutSummary`, `ArticleHeader`
- **Element**: `Block-element` where `element` is in **camelCase** (pattern: `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$`)
  - e.g. `BestSellersBooks-title`, `ProductFooter-addToBasket`, `CookiesConsentModal-headerTitle`

**Block name depth**: a PascalCase Block name is composed of **segments** (e.g. `ProductCard` = 2 segments: `Product` + `Card`). A Block name **MUST NOT** exceed **4 segments**.

- ✅ `ProductCard` (2 segments)
- ✅ `CookiesConsentModal` (3 segments)
- ✅ `MarketplaceProductCard` (3 segments)
- ✅ `ProductCheckoutSummary` (3 segments)
- ❌ `AccountCheckoutShippingAddressForm` (5 segments)

**Element name depth**: camelCase may contain multiple segments (e.g. `headerTitle`, `closeButtonIcon`), but **MUST NOT** exceed **3 segments** to remain readable.

**Prohibitions**:
- `snake_case` **MUST NOT** be used (e.g. `Best_Sellers`, `product_card`).
- `kebab-case` for Blocks **MUST NOT** be used (e.g. `best-sellers-books`).
- Generic design‑system classes **MUST NOT** be used as Blocks (e.g. `Button`, `Card`, `Input`, `Modal`, `Accordion`, `Menu`, `Slider`).

#### Structural Blocks vs. design-system components (normative)

A generic name **MUST NOT** be used as a Block when it denotes an **instantiable, interchangeable type** — a design-system component that can exist in multiple parallel instances (e.g. `Card`, `Button`, `Modal`, `Input`, `Accordion`, `Slider`).

A generic name **MAY** be used as a Block when it denotes a **singular, invariant structural role** of the document — an element that exists as a single occurrence and whose role does not vary across documentary contexts (e.g. `Page`, `Main`, `Layout`).

**Operative test**:
1. *Can there be two of them side by side in the same document?* — Yes → instantiable type → design-system component → **forbidden** as a Block. No → candidate structural Block.
2. *Does its role vary across contexts (user page, product listing, FAQ, sitemap…)?* — Yes → it is not invariant → specialise it. No → **legitimate** structural Block.

A name passes only if it is **both singular and invariant**. The genericity of the name is not, by itself, a disqualifying criterion: only instantiability and contextual variation are.

#### Identity vs. structural type (normative, complement to the test above)

The singularity + invariance test is a necessary but not sufficient condition at the page level. A ROCS Block name **MUST** encode the *identity* of the element, not merely its structural type. `Page` on the FAQ page encodes a structural role ("page container"); `FaqPage` encodes an identity ("the FAQ page"). Under the ROCS principle that HTML is a semantic artefact — describing the meaning and role of elements independently of any presentational concern — a page-level Block **MUST** carry its documentary identity in its name.

This is not over-engineering: `FaqPage` is no more verbose than `page` + `data-context="faq"`, and it is semantically honest where the latter is not.

#### Page context — theorem and all-or-nothing (normative)

**Theorem.** A persistent documentary context can be expressed, in ROCS, **only** by a ROCS class. A `data-*` attribute encoding a persistent context is forbidden for styling (§4.3 point 1, §4.4) — `data-*` is reserved for JS-driven dynamic states, technical contextual metadata (layout/configuration), and non-styled JS hooks, none of which is a persistent business context. A combined selector from a parent Block violates §6.2.1 and §2.0. Therefore, a page context that influences rendering **MUST** be carried by the Block name (`FaqPage`), never by an attribute or a parent context.

**Consequence — all-or-nothing.** At the root (page) level, only two regimes are conformant:

- **(a) Uniform `Page`** — the project **asserts** that page-level documentary context is, and will permanently remain, irrelevant to rendering. Every page shares the same root identity; all contextual variation lives entirely in child Blocks (`Faq`, `UserProfile`, …). This is a bet on future invariance: if any page must ever diverge structurally at the root, the HTML **MUST** be modified — contrary to the redesign-stability goal (§1). `Page` qualifies as a structural Block (see above) only while that bet holds.

- **(b) Systematic `XxxPage`** — page identity is always named (`FaqPage`, `UserPage`, `OrderConfirmationPage`, …). Each is a single, complete, locatable target. A redesign that makes any page diverge touches **CSS only**: the contextual Block already exists. This regime follows directly from treating HTML as a semantic artefact.

A **mixed** regime (some pages `Page`, some `XxxPage`) is **non-conformant**: divergent generic pages would have no legal way to express their context.

**Relationship to the singularity test.** Regime (b) does not contradict the structural legitimacy of `Page` established above. The test defines what the specification *structurally permits*; the identity principle adds a criterion that regime (b) satisfies by construction. Regime (a) is a permitted exception — a deliberate, bounded bet — not the default.

> **Recommended convention — "role → type" order**: when the name of a Block (or Element) combines a **business role** and a **component type** (e.g. `Page`, `Modal`, `Card`, `List`, `Header`, `Title`), the order **SHOULD** be: **role first, type last**.
>
> Goals: improve readability (role comes first), reduce the temptation to create DS Blocks (`Page`, `Modal`, `Card`), and avoid names that encode DOM hierarchy.
>
> Block examples:
> - ✅ `ProductsPage`, `FaqPage`, `AboutPage`
> - ✅ `CookiesConsentModal`
> - ❌ `PageProducts`, `PageFaq` (type before role)
>
> Element examples:
> - ✅ `ProductCard-image`, `ProductCard-title`
> - ✅ `CookiesConsentModal-closeButton`, `CookiesConsentModal-acceptAction`
> - ❌ `ProductCard-cardImage` (redundant type / uninformative)

### 3.3 Naming intent

ROCS uses a "Block/Element" convention, interpreted as **semantic context**.

- `Block` in **PascalCase**: primary semantic unit, generally **business/page/content**, not a "DS component".
  - e.g. `BestSellersBooks`, `StaffPicksBooks`, `TopRatedBooks`, `CheckoutSummary`
- `Block-element`: sub‑role located in the Block's context.
  - e.g. `BestSellersBooks-title`, `BestSellersBooks-slider`

> ROCS deliberately separates:
> - **meaning** (in HTML, via classes)
> - **visual/DS reuse** (in CSS, via mixins, placeholders, etc.)

#### Example: 3 business layers, same look & feel

```html
<section class="BestSellersBooks">
  <h2 class="BestSellersBooks-title">Best sellers</h2>
  <ul class="BestSellersBooks-slider">
    <!-- ... -->
  </ul>
</section>

<section class="StaffPicksBooks">
  <h2 class="StaffPicksBooks-title">Staff picks</h2>
  <ul class="StaffPicksBooks-slider">
    <!-- ... -->
  </ul>
</section>

<section class="TopRatedBooks">
  <h2 class="TopRatedBooks-title">Top rated</h2>
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

If one layer must diverge visually later, only the CSS for that role/context changes.

### 3.4 Element name depth

An Element name (the part after the hyphen) may contain multiple camelCase segments:

| Depth | Example | Compliance |
|-------|---------|------------|
| 1 segment | `CookiesConsentModal-header` | ✅ Compliant |
| 2 segments | `CookiesConsentModal-closeButton` | ✅ Compliant |
| 3 segments | `CookiesConsentModal-headerTitleBadge` | ✅ Compliant (limit) |
| 4+ segments | `CookiesConsentModal-headerTitleBadgeIcon` | ❌ Non-compliant |

#### When depth becomes problematic

Reaching 3+ segments is often a sign that:
- The Element has become **too complex** → consider **promotion** to Block
- The naming is trying to reflect **DOM hierarchy** → that is not the objective

**Reminder**: An Element name expresses its **semantic role**, not its position in the DOM.

#### When to promote to Block?

An Element **SHOULD** be promoted to a Block when:
- It contains structured children (heuristic: ~3 styled descendants)
- It could exist in other contexts
- It carries autonomous logic (state, interaction)

→ See §7 for promotion details.

### 3.5 State classes (prohibition)

BEM‑modifier‑style or equivalent state classes **MUST NOT** be used in ROCS.

**Forbidden patterns**:

- `--is-*`, `--has-*`, `--no-*` (BEM modifiers)
- `is-*`, `has-*` (global state classes)
- `is-active`, `is-loading`, `is-hidden`, `is-open`, etc.
- `Element--modifier` (BEM modifier syntax)

**Non-compliant examples ❌**:

```html
<button class="CookiesConsentModal-closeButton--isDisabled">...</button>
<nav class="CheckoutNavigation is-open">...</nav>
<div class="ProductFaq-panel--expanded">...</div>
```

**Rationale**: dynamic states **MUST** be expressed via:

1. **`data-*` attributes** for JS‑driven states (cf. §4)
2. **Native pseudo‑classes** (`:hover`, `:focus`, `:disabled`, `:checked`, etc.)
3. **Native HTML attributes** (`disabled`, `hidden`, `aria-expanded`, etc.)

**Compliant examples ✅**:

```html
<button class="CookiesConsentModal-closeButton" disabled>...</button>
<nav class="CheckoutNavigation" data-state="open">...</nav>
<div class="ProductFaq-panel" aria-expanded="true">...</div>
```

```css
.CookiesConsentModal-closeButton:disabled { /* disabled styles */ }
.CheckoutNavigation[data-state="open"] { /* open styles */ }
.ProductFaq-panel[aria-expanded="true"] { /* expanded styles */ }
```

---

### 3.6 Multi‑role cases (primary role, wrappers, icons, tracking)

Rule §3.1 ("0 or 1 ROCS class per element") means a single DOM node cannot carry multiple semantic roles.

#### 3.6.1 Choosing the primary role (normative)

When an element seems to carry multiple intentions (e.g. "button" + "action" + "icon"), the ROCS role carried by the class **MUST** be the **primary role**.

The primary role is the one that:
- corresponds to the function expected by the user (what the element *does*);
- would remain true if the design changes (what the element *is*);
- is the best anchor for the main CSS rule.

**Example**: an "Add to cart" button in a product footer.

```html
<button class="ProductFooter-addToBasket">Add to cart</button>
```

#### 3.6.2 When to add a wrapper (normative)

A wrapper **MAY** be added if necessary (layout, structural constraints, framework constraints), but:

- If the wrapper has no applicative style to carry, it **MAY** have no ROCS class (0 classes is allowed).
- If the wrapper is required for applicative styling, it **MUST** receive a ROCS class that expresses its role in the Block (e.g. actions container, price zone, header).

**Example** (semantic actions wrapper):

```html
<div class="ProductFooter-actions">
  <button class="ProductFooter-addToBasket">Add</button>
  <a class="ProductFooter-viewDetails" href="...">Details</a>
</div>
```

#### 3.6.3 Icons and sub‑parts (recommendations)

- If an icon is purely decorative and does not need to exist as a dedicated styled node, it **SHOULD** be rendered via a pseudo‑element (`::before`/`::after`) or a background image.
- If an icon is a real node (SVG/`img`) requiring its own styles (size, alignment, animation, themes), it **SHOULD** be a distinct ROCS Element.

**Example** (explicitly styled icon and label):

```html
<button class="ProductFooter-addToBasket">
  <svg class="ProductFooter-addToBasketIcon" aria-hidden="true">...</svg>
  <span class="ProductFooter-addToBasketLabel">Add</span>
</button>
```

#### 3.6.4 Tracking, instrumentation, tests (normative)

Tracking, instrumentation, and testing needs **MUST NOT** lead to adding extra classes.

- Stable JS hooks **SHOULD** be carried by dedicated `data-*` attributes (e.g. `data-testid`, `data-analytics-*`), in accordance with §4.3.
- These `data-*` attributes **MUST NOT** be used as CSS hooks.

#### 3.6.5 When to promote to Block (reminder)

If decomposing into sub‑elements grows in complexity (rich internal structure, reusable sub‑parts, autonomous logic), the whole **SHOULD** be promoted to a Block in accordance with §7.

---

## 4. `data-*` attributes (free, but strictly reserved for JS)

`data-*` attributes are free, but must be used **only** for:

- **JS‑driven states/parameters** (mutated by JS);
- information **required by JavaScript** (identifiers, indices, non‑styling hooks).

> **Quick decision tree**:
> ```
> Is the information modified by JS client-side?
>   ├── YES → data-* (dynamic state)              → §4.2, §4.3 point 2
>   └── NO  → Is it a semantic variant / business category?
>         ├── YES → Distinct ROCS class            → §4.3 point 1
>         └── NO  → Would a class per value be reasonable?
>               ├── YES → ROCS class               → §4.3 point 1
>               └── NO  → data-* (contextual metadata) + :where()  → §4.3 point 4, §6.2.2
> ```

### 4.1 General rule (normative)

CSS selectors based on `data-*` attributes **MUST** only target `data-*` representing a **dynamic state/parameter** (as defined in §4.2) driven by JavaScript.

Any `data-*` used as a **stable hook** (instrumentation/analytics, tests, non-styling identifiers, etc.) **MUST NOT** be used to compose styles.

### 4.2 Definitions (normative)

- **Dynamic state/parameter**: information stored in the DOM as a `data-*` attribute whose value **MUST** be able to vary during the lifecycle of a page and **MUST** be effectively modified by JavaScript (user interaction, timers, requests, internal navigation, etc.).

- **Persistent (static) context**: information that characterises content/an object (business context, business variant, segmentation) and whose value **MUST NOT** vary during the lifecycle of a page.

- **Contextual metadata**: information that characterises a **configuration** or **layout parameter** (number of items, orientation, columns, device type, etc.) without defining the **semantic role/context** of the element. This information is persistent but **is not style composition**.

  **Criteria**: contextual metadata is distinguished from a persistent context (forbidden) if:
  1. it does **not** encode a semantic variant/category (which would warrant a distinct ROCS class);
  2. it does **not** encode a design‑system style (`primary`, `large`, `compact`, etc.);
  3. a distinct ROCS class **per value** would be unreasonable (e.g. `MostRecentArticles1Items`, `MostRecentArticles2Items`, … → absurd).

  **Distinctive note**: unlike a semantic variant (which defines *what* the element is in the business context), contextual metadata describes *how* the element is technically organised or behaves, without changing its fundamental semantic nature.

### 4.3 Usage rule (normative)

1. A `data-*` attribute representing a **persistent (static) context** **MUST NOT** be used for styling.
   - In controlled HTML, this context **MUST** be expressed by a **distinct ROCS class** (Block or Element).

2. A `data-*` attribute representing a **dynamic state/parameter** **MAY** exist.
   - If the state influences rendering, it **MAY** be used in CSS selectors in accordance with §6.2.2.

3. A `data-*` attribute required by JavaScript as a **stable hook** (e.g. instrumentation/analytics, identifiers, indices, non‑styling hooks) **MAY** exist even if its value does not vary.
   - In that case, it **MUST NOT** express a business context/variant.
   - In that case, it **MUST NOT** be used to compose styles.

4. A `data-*` attribute representing **contextual metadata** (cf. §4.2) **MAY** exist and **MAY** be used in CSS selectors if:
   - it meets the 3 criteria from the definition (no semantic variant, no DS style, no reasonable class alternative);
   - it is used in accordance with the exceptions in §6.2.2 (combined selectors allowed for contextual metadata).

> Informative note: ROCS favours classes that "say what something is" (context/role) and reserves `data-*` for "what moves" (dynamic states), contextual metadata (technical layout/configuration parameters), or non‑styling JS usage (instrumentation hooks).

### 4.4 Anti‑patterns (informative)

- ❌ Static `data-*` for persistent business variants:

```html
<div class="Product" data-type="book" data-marketplace="false">…</div>
```

✅ Fix by expressing context via distinct ROCS classes:

```html
<!-- Option 1: distinct Block per type -->
<article class="ProductBook">…</article>
<article class="ProductDvd">…</article>

<!-- Option 2: Block + context if the distinction matters -->
<article class="MarketplaceProductBook">…</article>
<article class="DirectProductBook">…</article>
```

> **Note**: the choice of name depends on business granularity. If "marketplace vs. direct" is an important distinction in your domain, it deserves to appear in the Block name.

### 4.5 Naming convention (recommended)

Recommendations:

- names in **kebab-case**: `data-gallery-active`, `data-slide-index`.
  - reason: consistent with HTML format (`data-...`) and readable in the DOM.
- values: free, but must represent a **genuinely dynamic** state/parameter (liable to change at runtime).

Practical rule: **if a `data-*` value can never change at runtime**, then the corresponding logic must be carried by a **ROCS class** (role/context), not by an attribute.

**Example: static business variants**

If you need to differentiate product types (book, DVD, eBook), use **distinct ROCS classes** that express the business context:

```html
<!-- ✅ Correct: distinct ROCS classes -->
<article class="ProductCardBook">...</article>
<article class="ProductCardDvd">...</article>
<article class="ProductCardEbook">...</article>
```

```html
<!-- ❌ Incorrect: static data-* for a variant -->
<article class="ProductCard" data-product-type="book">...</article>
```

**Example: dynamic states**

```html
<div class="ProductGallery" data-gallery-active="0">
  <button class="ProductGallery-prev">Previous</button>
  <ul class="ProductGallery-list">
    <li class="ProductGallery-item" data-slide-index="0">First</li>
    <li class="ProductGallery-item" data-slide-index="1">Second</li>
  </ul>
</div>
```

**Forbidden** (by ROCS convention):

- encoding purely "design‑system" variations in `data-*`: `data-variant="primary"`, `data-size="large"`, etc.
- using **static** `data-*` for a **persistent context** (business variant, semantic category) that should be a ROCS class.

**Allowed** (contextual metadata):

```html
<!-- ✅ Contextual metadata: number of items (layout parameter) -->
<!-- Justification: MostRecentArticles1Items, MostRecentArticles2Items... would be absurd -->
<ul class="MostRecentArticles-list" data-articles-length="6">
  <li class="MostRecentArticles-item">...</li>
  <!-- etc. -->
</ul>

<!-- ✅ Global contextual metadata: device type (technical context) -->
<!-- Justification: technical viewport information, not a semantic variant -->
<body data-device-type="mobile">
  ...
</body>

<!-- ✅ Contextual metadata: columns (responsive layout parameter) -->
<!-- Justification: technical configuration, not a business category -->
<div class="ProductGrid" data-columns="3">
  ...
</div>
```

> **Decisive test**: *"Would a distinct ROCS class be reasonable for each value?"*
> - `ProductCardBook`, `ProductCardDvd` → ✅ reasonable → use a ROCS class (semantic variants)
> - `MostRecentArticles1Items`, `MostRecentArticles2Items`, … → ❌ absurd → contextual metadata allowed
>
> **Complementary test**: *"Does the information change the semantic nature of the element?"*
> - `data-product-type="book"` → ✅ changes nature → ROCS class required
> - `data-articles-length="3"` → ❌ does not change nature → contextual metadata allowed

### 4.6 Server‑Side Rendering (SSR) and `data-*`

**Question**: In SSR (Next.js, Nuxt, etc.), can server‑generated `data-*` be used to differentiate variants?

**Answer**: **No**, unless those attributes are **effectively modified by JavaScript client‑side**.

#### Non-compliant pattern

```jsx
// ❌ SSR: static data-* based on server props
export function ProductCard({ product }) {
  return (
    <article class="ProductCard" data-product-type={product.type}>
      ...
    </article>
  );
}
```

**Problem**: `data-product-type` is rendered server‑side and never changes client‑side. It is a **persistent context** in disguise.

#### Compliant pattern: distinct ROCS classes

```jsx
// ✅ SSR: ROCS class expressing context
export function ProductCard({ product }) {
  const className = `ProductCard${product.type.charAt(0).toUpperCase() + product.type.slice(1)}`;
  // → ProductCardBook, ProductCardDvd, etc.
  
  return <article class={className}>...</article>;
}
```

#### Exception: server `data-*` + JavaScript hydration

If a `data-*` attribute is **initialised server‑side** but **modified client‑side**, it remains compliant:

```jsx
// ✅ Acceptable: data-* initialised server-side but dynamic client-side
export function ProductFaq({ items, initialOpen = 0 }) {
  return (
    <div class="ProductFaq" data-active-panel={initialOpen}>
      {/* Client JavaScript will modify data-active-panel */}
    </div>
  );
}
```

**Justification**: `data-active-panel` is a **dynamic state** even if its initial value comes from the server.

#### Practical SSR rule

| Attribute | Modified by JS client? | ROCS compliant? | Alternative |
|-----------|------------------------|-----------------|-------------|
| `data-product-type="book"` | ❌ No | ❌ No | Class `ProductCardBook` |
| `data-user-role="admin"` | ❌ No | ❌ No | Class `DashboardAdmin` |
| `data-theme="dark"` | ✅ Yes (toggle) | ✅ Yes | Acceptable if client toggle |
| `data-active-tab="0"` | ✅ Yes (navigation) | ✅ Yes | Acceptable |

### 4.7 Global vs. local contextual metadata (normative)

ROCS distinguishes two uses of contextual metadata (cf. §4.2):

1. **Global contextual metadata** (entire page)
   - It **MAY** be carried by `body`, `html`, or `:root`.
   - It **MUST** be **technical** information (environment, capabilities, user preferences) and **MUST NOT** express a semantic business variant or design‑system variant.
   - Its CSS usage is defined in §6.2.2 (combined selectors allowed with `:where()` and limited depth).

   **Examples**: `data-device-type`, `data-theme` (if modified client‑side), `data-orientation`, `data-reduced-motion`.

2. **Local contextual metadata** (inside a Block)
   - It **MAY** be carried by a ROCS element (typically a Block) to express a local layout/configuration parameter.
   - It **MUST NOT** be used to reconstitute style composition in the DOM.
   - Its CSS usage is defined in §6.2.2 (descendant selectors allowed with `:where()` and limited depth).

   **Examples**: `data-columns`, `data-items-length`, `data-layout` (if it is a bounded technical configuration and not a semantic variation).

---

## 5. `id` (forbidden in CSS)

`id` attributes are **forbidden** in ROCS CSS logic:

- ❌ **MUST NEVER** be targeted in CSS: `#something { ... }`
- ✅ **MAY** be used for JavaScript targeting or HTML anchors.

---

## 6. CSS selectors (specificity, cascade)

### 6.1 Specificity (normative)

> *Corollaries of §2.0 — scope isolation.*

CSS selectors **MUST** comply with the following rules:

1. **Low specificity**: prefer class selectors (`.ClassName`) or attribute selectors (`[data-*]`).
2. **No `id` selectors**: `id` are reserved for JavaScript.
3. **Combined selectors**: in applicative ROCS CSS, combined selectors (descendants, direct children, adjacent, etc.) **MUST NOT** be used, except in the exceptions explicitly defined in §6.2.2.
4. **`!important`**: the `!important` declaration **MUST NOT** be used in applicative ROCS CSS. It compromises the predictability of the cascade and makes debugging difficult. The only acceptable cases are reset/normalisation stylesheets and overrides of unmodifiable third‑party components.

### 6.2 Cascade and combined selectors (normative)

The CSS cascade **MUST** be controlled to guarantee predictability and maintainability.

#### 6.2.1 ROCS class self‑sufficiency

> *Corollary of §2.0 — scope isolation.*

ROCS classes **MUST** be self‑sufficient: each class must define its own styles without depending on an implicit parent context.

**Prohibition**: combined selectors (descendants `.Parent .Child`, direct children `.Parent > .Child`, adjacent `.Element + .Sibling`, etc.) **MUST NOT** be used to style an element based on its parent context.

**Non-compliant example**:

```css
/* ❌ Implicit dependency on parent */
.BestSellersBooks .BestSellersBooks-title {
  font-size: 1.5rem;
}

/* ❌ Direct child selector */
.ProductCard > .ProductCard-image {
  width: 100%;
}

/* ❌ Adjacent selector */
.ProductFooter-addToBasket + .ProductFooter-basketInfo {
  margin-left: 1rem;
}
```

**Compliant example**:

```css
/* ✅ Self-sufficient ROCS class */
.BestSellersBooks-title {
  font-size: 1.5rem;
}

/* ✅ Each element has its own class */
.ProductCard-image {
  width: 100%;
}

/* ✅ Spacing managed by the class itself or a container */
.ProductFooter-action {
  margin-left: 1rem;
}

.ProductFooter-action:first-child {
  margin-left: 0;
}
```

#### Selector lists are not combined selectors (clarification)

A **selector list** (comma-separated, e.g. `.BestSellersBooks, .StaffPicksBooks, .TopRatedBooks { … }`) is **allowed**. It is strictly equivalent to writing the same declarations on each target independently: it creates no dependency on DOM relationship, position, or context, and therefore fully preserves scope isolation (§2.0).

This is categorically different from the **combined selectors** forbidden by §6.2.1 (descendant `.A .B`, child `.A > .B`, adjacent `.A + .B`), whose effect depends on a relationship in the tree.

**Limit**: a selector list factors only **strictly identical** declarations. As soon as a target needs *common + variation*, the list alone is insufficient — adding a separate overriding rule would reintroduce order dependency. That case **MUST** be handled by the composition layer (mixins/placeholders composing common + variation *within a single isolated target*), not by inter-rule overrides.

#### 6.2.2 Allowed exceptions

Combined selectors **MAY** be used in the following cases:

1. **Pseudo‑classes and pseudo‑elements**: always allowed

```css
/* ✅ Pseudo-classes */
.CookiesConsentModal-closeButton:hover { }
.CookiesConsentModal-closeButton:focus { }
.CookiesConsentModal-closeButton:disabled { }

/* ✅ Pseudo-elements */
.CookiesConsentModal-closeButton::before { }
.CookiesConsentModal-closeButton::after { }
```

2. **States via native/ARIA attributes**: allowed

Native HTML and ARIA attributes (e.g. `disabled`, `hidden`, `aria-expanded`, etc.), when representing a **state**, **MAY** be targeted in CSS.

```css
/* ✅ States via native/ARIA attributes */
.CookiesConsentModal-closeButton:disabled { }
.ProductFaq-panel[aria-expanded="true"] { }
```

3. **`data-*` attribute selectors** (dynamic states and contextual metadata)

```css
/* ✅ Dynamic states (attribute on the element itself) */
.CheckoutNavigation[data-state="open"] { }
```

**Combined selectors for local contextual metadata**: when a `data-*` attribute representing contextual metadata is placed on a parent ROCS element, the descendant selector **MUST** use `:where()` to preserve the specificity of the targeted block. Depth is limited to **2 levels** (parent + targeted descendant).

```css
/* ✅ Correct: :where() preserves specificity */
.MostRecentArticles-list[data-articles-length="1"] :where(.MostRecentArticles-item) {
  width: 100%;
}
.MostRecentArticles-list[data-articles-length="2"] :where(.MostRecentArticles-item) {
  width: 50%;
}

/* ❌ Forbidden: specificity too high */
.MostRecentArticles-list[data-articles-length="1"] .MostRecentArticles-item {
  width: 100%;
}

/* ❌ Forbidden: depth > 2 */
.MostRecentArticles-list[data-articles-length="1"] :where(.MostRecentArticles-item) :where(.MostRecentArticles-itemTitle) {
  font-size: 1.2rem;
}
```

4. **Global contextual metadata** (`body`, `html`, `:root`)

`data-*` attributes representing **global contextual metadata** (device type, theme, capabilities, viewport orientation, etc.) on `body`, `html`, or `:root` **MAY** be used in combined selectors.

A global contextual metadata characterises the technical environment of the entire page (viewport, browser capabilities, user preferences) without defining a semantic variant.

These selectors are allowed because the "parent" is not a ROCS Block — it is a **global page context**.

**Mandatory rules**:
- The descendant selector **MUST** use `:where()` to preserve the specificity of the targeted block.
- Depth is limited to **2 levels** (global ancestor + targeted block).

```css
/* ✅ Correct: :where() mandatory */
body[data-device-type="mobile"] :where(.ProductCard) {
  /* mobile layout */
}
body[data-device-type="tablet"] :where(.ProductCard) {
  /* tablet layout */
}
html[data-orientation="landscape"] :where(.ProductGallery) {
  /* landscape layout */
}
:root[data-theme="dark"] :where(.EditorialSummary) {
  /* dark mode styles */
}

/* ❌ Forbidden: without :where(), specificity too high */
body[data-device-type="mobile"] .ProductCard {
  /* mobile layout */
}

/* ❌ Forbidden: depth > 2 */
body[data-device-type="mobile"] :where(.ProductCard) :where(.ProductCard-title) {
  font-size: 1rem;
}
```

> **Justification**: `:where()` guarantees that the targeted Block remains **master of its own styles**. The global context *informs*, it does not *force*.

5. **Third‑party component integration (scoped exception)**

When integrating an encapsulated third‑party component (cf. §0.3.8):
- Descendant selectors **MAY** be used **only** inside the **ROCS wrapper Block** dedicated to that component.
- Integration selectors **MUST** be **anchored** on that wrapper (the wrapper is the root of all third‑party selectors).
- Integration selectors **MUST NOT** target applicative ROCS elements; they only style internal classes/elements of the third party.
  - Consequently, an integration selector **MUST NOT** contain any ROCS class other than the wrapper class.
- Descendant selectors **MUST NOT** exceed **2 levels** after the wrapper.
  - ✅ Allowed: `.PaymentProviderWidget .tp-button`, `.PaymentProviderWidget .tp-row .tp-cell`
  - ❌ Forbidden: `.PaymentProviderWidget .tp-a .tp-b .tp-c`
- They **MUST** maintain low specificity and remain simple (avoid deep descendant chaining, `id` selectors, and hard‑to‑maintain patterns).

**Third-party examples — compliant**:

```css
/* ✅ OK: anchored on the wrapper, targets only third-party classes */
.PaymentProviderWidget .tp-button { }
.PaymentProviderWidget .tp-row .tp-cell { }
```

**Third-party examples — non-compliant**:

```css
/* ❌ Forbidden: not anchored on the wrapper */
.tp-button { }

/* ❌ Forbidden: mixes third-party + ROCS class other than the wrapper */
.PaymentProviderWidget .CheckoutSummary-title { }

/* ❌ Forbidden: depth > 2 */
.PaymentProviderWidget .tp-a .tp-b .tp-c { }
```

---

## 7. Promotion

### 7.1 When to promote an Element to a Block?

An Element **SHOULD** be promoted to a Block when:
- It reaches **significant structural complexity** (heuristic: approximately 3 styled descendants).
- It is **reused across multiple distinct Blocks**.
- It carries **autonomous logic** (state, complex interaction).

### 7.2 Promotion example

Before promotion:

```html
<div class="ProductGallery">
  <div class="ProductGallery-header">
    <h2 class="ProductGallery-headerTitle">Title</h2>
  </div>
</div>
```

After promotion:

```html
<div class="ProductGallery">
  <div class="ProductGalleryHeader">
    <h2 class="ProductGalleryHeader-title">Title</h2>
  </div>
</div>
```

---

## Annex A. CSS Architecture & optimisation (recommendations)

> **Informative note**: Annexes are **informative** and create no normative obligations.

### A.1 File organisation

- **Per Block**: each ROCS Block may have its own CSS/SCSS file.
- **Per feature**: group shared styles (e.g. variables, mixins, animations).

### A.2 CSS preprocessors

Using a preprocessor (Sass, Less) is strongly recommended for:
- Factoring reusable styles.
- Managing media queries and container queries.

---

## Annex B. Practical cases (FAQ)

### B.1 How to handle third‑party components?

Wrap them in a ROCS Block and do not modify their internal classes.

---

## Annex C. Tooling (recommendations)

ROCS compliance can be automated via linters and static analysis tools.

### C.1 Automatic validation

**Stylelint** can validate ROCS naming conventions:

```json
{
  "extends": "stylelint-config-standard-scss",
  "rules": {
    "selector-class-pattern": "^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$"
  }
}
```

**ESLint** can validate classes in JSX/HTML with custom plugins.

> **For complete, ready‑to‑use configurations** (Stylelint, ESLint, GitHub Actions, pre‑commit hooks, visual tests), see the **[ROCS Implementation Guide](./IMPLEMENTATION_GUIDE.md)**.

---

## Annex D. License

ROCS is published under the MIT license.

---

## Annex E. Known limits and assumed costs (informative)

ROCS's scope-isolation guarantee holds within the **HTML controlled by the team**. Its boundaries and costs are stated here honestly.

**1. Uncontrolled injected content.** WYSIWYG / editorial body content / third-party HTML that the team does not template may require combined selectors (e.g. styling raw `h2`/`p` inside an editorial region). This is handled via the scoped third-party exception (§6.2.2 point 5) and is, by definition, outside the controlled-HTML scope of §2.0.

  *Note*: in setups where server-side templates are fully owned and emit ROCS-compliant classes (e.g. Drupal projects using custom Twig templates with ROCS classes), this limit does **not** apply to the team's own markup — it concerns only genuinely uncontrolled content (free editorial input). It is listed as a general limit of the specification, not as a weakness of any particular templating stack.

**2. Theming / dark mode / token overrides.** The cascade is the intended tool for theming. ROCS does not ban it; it channels it through zero-specificity context selectors (`:root[data-theme] :where(.Block)`) and custom properties, preserving scope isolation while allowing global contextual styling.

**3. Cost of isolation.** Scope isolation is obtained partly by relocating composition complexity into the composition layer (mixins/placeholders), which is itself not order-independent. The guarantee is *conditional* on that layer respecting the boundary contract in §2.3. There is also a cost in verbosity (more named nodes, potential duplication where the composition layer is not used). These are accepted trade-offs: moving non-commutativity into a tooled, factored, testable layer is preferable to leaving it implicit in the global cascade — but it is a trade-off, not a free win.

**4. Cost of the uniform `Page` regime.** Choosing regime (a) from §3.2 (uniform `Page`) means **betting that page-level context will never become a relevant rendering distinction**. A later redesign can falsify that bet: the day a page must structurally diverge at the root, the project must introduce a contextual Block (`FaqPage`) and therefore **touch the HTML** — contrary to the redesign-stability goal (§1). Regime (b) (systematic `XxxPage`) pays a small naming cost up front to immunise against this; regime (a) is lighter but freezes the assumption of root invariance.

---

## Annex F. ROCS and native CSS scoping (`@scope`, `@layer`) (informative)

### `@scope` and ROCS: two opposite philosophies

`@scope` (Baseline 2026) attacks the same root problem (style isolation) but through a mechanism that **contradicts the ROCS founding axiom (§2.0)**:

- `@scope` adds **scoping proximity** to the cascade: when two scopes conflict, the rule whose scope root is the fewest DOM hops away wins. The effect of a rule therefore **depends on the element's position in the DOM tree** — exactly what §2.0 forbids.
- When proximity is equal, **source order** decides. `@scope` thus stacks *two* context-dependent criteria (proximity, then order) on top of specificity. It makes contextual dependency *manageable*; ROCS makes it *non-existent*.
- `@scope` bounds (`.a` to `.b`) are **anchors in the DOM tree**. Moving an element out of its scope root changes its styling. Under ROCS, an element keeps its class wherever it sits in the tree → stable styling → HTML free to move during a redesign (objective §1). Native scoping does not provide this as strongly.

**The one thing `@scope` does that class-based methods cannot** — preventing a parent from styling a nested component (the "donut scope" via the `to` keyword) — ROCS obtains differently: a parent *cannot* accidentally style a child, because it has no selector targeting it (corollary of §6.2.1).

### Recommended use of `@scope` *within* ROCS

`@scope` is best treated as a **tool for the documented exceptions**, not a competitor:

- For **uncontrolled injected content** (editorial/WYSIWYG body), `@scope (.Article-body) to (.NestedBlock) { … }` is a cleaner native implementation of the third-party exception (§6.2.2 point 5) than a bare combined selector, since it confines styles without leaking into nested ROCS Blocks.

### `@layer`

`@layer` is **complementary, not competing**: it orders cascade *origins* (e.g. third-party vs. product styles), which is orthogonal to per-element scope isolation. ROCS **MAY** use `@layer` to isolate its applicative styles from external stylesheets without altering any ROCS rule.

### Summary

`@scope` buys isolation at the price of two contextual criteria (proximity + order) that the ROCS axiom removes. They operate at different levels: `@scope` bounds *where* DOM-coupled selectors apply; ROCS removes DOM coupling altogether. ROCS can adopt `@scope`/`@layer` as tools for its exceptions without touching its axiom.
