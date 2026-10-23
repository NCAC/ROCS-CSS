# ROCS — Propositions de correction à la spécification

> **Destinataire** : agent LLM chargé d'appliquer ces corrections au document `docs/en/SPECIFICATION.md` du dépôt `NCAC/ROCS-CSS`.
>
> **But** : intégrer ces corrections dans la spécification sans en dénaturer le style normatif (vocabulaire MUST/SHOULD/MAY déjà en place). Chaque correction précise sa nature (ajout, reformulation, clarification) et l'emplacement visé. Les corrections **1, 2 et 3 sont structurantes et prioritaires** ; les corrections **4 à 7 sont des clarifications** qui ferment des angles d'attaque.
>
> **Contexte conceptuel** (pour comprendre l'intention, ne pas recopier tel quel dans la spec) : la spec doit être refondée sur un principe unique — l'**isolation de portée** — dont la plupart des règles existantes sont des corollaires. Une garantie plus forte (« l'ordre de déclaration n'a aucune incidence ») a été envisagée puis volontairement abandonnée car trop forte : l'ordre *peut* compter lorsque plusieurs règles CSS visent une même classe, mais cela relève strictement de la couche CSS contrôlée, jamais du HTML. La garantie réelle et défendable est : *écrire un style sur une classe impacte cet élément et lui seul, sans effet de bord contextuel*.

---

## Correction 1 — Poser l'axiome d'isolation de portée en tête de spec (AJOUT, prioritaire)

**Problème** : la spec présente une collection de règles (une classe par élément, pas de sélecteurs combinés, pas d'`id`, pas d'`!important`, spécificité basse) sans énoncer le principe unique dont elles découlent. Chaque règle est donc attaquable isolément.

**Action** : ajouter, dans la section **§2 Normative principles**, en tête (avant §2.1), un principe fondateur, puis présenter explicitement §3.1, §6.1 et §6.2.1 comme ses corollaires.

**Contenu à intégrer** (à adapter au ton normatif anglais de la spec) :

> ### 2.0 Founding principle — Scope isolation (normative)
>
> Every ROCS class **MUST** be a **fully isolated styling target**: writing a style rule on a ROCS class affects exactly the elements carrying that class, and nothing else. The effect of styling a class **MUST NOT** depend on the element's position in the DOM tree, on the presence of any other class, or on any implicit parent context.
>
> All naming and selector rules in this specification (§3.1 single class per element, §6.1 low and uniform specificity, §6.2.1 self-sufficiency, prohibition of combined selectors, of `id`, and of `!important`) are **corollaries** of this principle: they are the necessary conditions for scope isolation to hold.

**Note pour l'agent** : ne pas supprimer les règles existantes ; les relier au principe par une phrase du type « This rule is a corollary of §2.0 » là où c'est pertinent (§3.1, §6.1, §6.2.1).

---

## Correction 2 — Délimiter ce que l'axiome couvre et ne couvre pas (AJOUT, prioritaire)

**Problème** : confusion possible entre *isolation de portée* (garantie) et *indépendance à l'ordre de déclaration* (non garantie). Sans clarification, l'objection « mais l'ordre compte quand même » paraît invalider l'axiome.

**Action** : ajouter, immédiatement après le principe §2.0, une clause de délimitation.

**Contenu à intégrer** :

> ### 2.0.1 Scope of the isolation guarantee (normative)
>
> ROCS guarantees **scope isolation** (§2.0): the *target* of a style declaration is fully determined by the ROCS class, with no contextual side effect, on the HTML controlled by the team.
>
> ROCS does **not** govern the **resolution between multiple declarations targeting the same class**. When two rules apply to the same ROCS class, declaration order and the CSS cascade decide the outcome — this is a property of CSS and **MUST** be handled entirely within the (team-controlled) CSS layer. It is never expressed or decided from the HTML.
>
> In other words: ROCS guarantees *which elements* a rule affects; it deliberately does not constrain *how several rules on the same class combine*, which is delegated to the CSS composition discipline (see contract in Annex/§ below).

---

## Correction 3 — Corriger la clause anti-`Page` (REFORMULATION, prioritaire)

**Problème** : la spec range `Page` (et par extension `Main`, `Layout`) parmi les primitives design-system à éviter, au motif de leur généricité. Ce critère est **trop large** : il confond *généricité du nom* et *appartenance au design system*. Un nom générique n'est problématique que lorsqu'il dénote un **type instanciable** ; il est légitime lorsqu'il dénote une **occurrence structurelle singulière** du document.

**Emplacement** : la clarification informative sur les « Page Blocks » dans §3.2, et toute mention de `Page` comme primitive DS dans §0.3.2 / §3.2.

**Action** : remplacer le critère « générique → DS caché → à éviter » par le critère **type instanciable vs occurrence singulière**.

**Contenu à intégrer** (remplace/complète la note « Page Blocks ») :

> #### Structural Blocks vs design-system components (normative)
>
> A generic name **MUST NOT** be used as a Block when it denotes an **instantiable, interchangeable type** — a design-system component that can exist in multiple parallel instances (e.g. `Card`, `Button`, `Modal`, `Input`, `Accordion`, `Slider`).
>
> A generic name **MAY** be used as a Block when it denotes a **singular, invariant structural role** of the document — an element that exists as a single occurrence and whose role does not vary across documentary contexts (e.g. `Page`, `Main`, `Layout`).
>
> **Operative test**:
> 1. *Can there be two of them side by side in the same document?* — Yes → instantiable type → design-system component → **forbidden** as a Block. No → candidate structural Block.
> 2. *Does its role vary across contexts (user page, product listing, FAQ, sitemap…)?* — Yes → it is not invariant → specialise it (it is no longer a single structural role). No → **legitimate** structural Block.
>
> A name passes only if it is **both singular and invariant**. The genericity of the name is not, by itself, a disqualifying criterion: only instantiability and contextual variation are.

**Note pour l'agent** : conserver l'interdiction de `Card`, `Button`, `Modal`, etc. comme Blocks. Ce qui change est uniquement le **statut de `Page` / `Main` / `Layout`**, qui deviennent des Blocks structurels légitimes sous condition de singularité + invariance.

---

## Correction 4 — Contrat de frontière avec la couche de composition (AJOUT)

**Problème** : la praticabilité de l'isolation à l'échelle (factorisation du style commun à plusieurs classes) dépend d'une couche de composition (SCSS, Less, Stylus, PostCSS). Cette dépendance est réelle mais non nommée. La spec déclare la composition « hors scope » sans en fixer les préconditions — ce qui laisse un trou perçu dans la garantie.

**Clarification de cadrage** : ROCS garantit l'isolation **par lui-même**, sans framework. Le framework de composition n'est **pas** nécessaire à la *garantie* ; il est nécessaire à la *praticabilité* de la garantie sans duplication (sinon, factoriser le style commun impose soit la duplication littérale, soit des surcharges inter-règles dépendantes de l'ordre).

**Note sur le niveau normatif** : les trois conditions ci-dessous sont formulées en SHOULD, pas en MUST. ROCS ne gouverne pas la pipeline de composition (SCSS, Less, Stylus…) — ce sont des outils tiers sur lesquels la spec n'a pas d'autorité normative. Toute mise en œuvre industrielle d'une méthodologie CSS (hors Atomic CSS qui délègue intégralement à un framework existant) présuppose une telle pipeline : ce fait est acquis, non à prescrire. Les conditions qui suivent définissent le **contrat d'alignement** : si la pipeline les respecte, les garanties de §2.0 sont préservées ; si elle les viole, c'est elle qui rompt l'isolation — pas la spec ROCS. La responsabilité est ainsi clairement localisée.

**Emplacement** : nouvelle sous-section dans §2.3 ou en Annexe A, intitulée « Composition layer — boundary contract ».

**Contenu à intégrer** :

> ### Composition layer — boundary contract (informative for the contract, implementation out of scope)
>
> ROCS guarantees scope isolation (§2.0) on its own, independently of any preprocessor. However, **factoring shared styles at scale** is impractical without a composition layer (Sass, Less, Stylus, PostCSS, native CSS features). Defining that layer is **out of ROCS scope**; any industrial-scale CSS methodology presupposes such a pipeline.
>
> To preserve the ROCS guarantees, the composition layer **SHOULD** respect the following boundary contract:
>
> 1. It **SHOULD NOT** introduce variable specificity between ROCS applicative rules (specificity should remain low and uniform — corollary of §6.1).
> 2. It **SHOULD NOT** create a dependency from one ROCS class's styling onto another ROCS selector (no cross-selector coupling — corollary of §2.0 / §6.2.1).
> 3. Any order-dependent resolution **SHOULD** be confined within the CSS layer (§2.0.1) and **SHOULD NOT** be observable from or decided by the HTML.
>
> If the composition layer violates these conditions, it is the layer that breaks scope isolation — not ROCS itself. ROCS specifies *which properties* the composition layer should preserve, not *how* to implement it.

---

## Correction 5 — Clarifier le statut du groupement par virgule (CLARIFICATION)

**Problème** : la spec utilise la **liste de sélecteurs** (`.A, .B, .C { }`) dans ses propres exemples (§3.3, factorisation des layers via mixins) sans l'autoriser explicitement. Un lecteur strict pourrait la confondre avec les sélecteurs combinés interdits par §6.2.1.

**Action** : ajouter une clarification dans §6.2 (ou §6.2.1) distinguant catégoriquement **liste de sélecteurs** (autorisée) et **sélecteurs combinés** (interdits hors exceptions).

**Contenu à intégrer** :

> #### Selector lists are not combined selectors (clarification)
>
> A **selector list** (comma-separated, e.g. `.Page, .UserPage, .FaqPage { … }`) is **allowed**. It is strictly equivalent to writing the same declarations on each target independently: it creates no dependency on DOM relationship, position, or context, and therefore fully preserves scope isolation (§2.0).
>
> This is categorically different from the **combined selectors** forbidden by §6.2.1 (descendant `.A .B`, child `.A > .B`, adjacent `.A + .B`), whose effect depends on a relationship in the tree.
>
> **Limit**: a selector list factors only **strictly identical** declarations. As soon as a target needs *common + variation*, the list alone is insufficient (adding a separate overriding rule would reintroduce order dependency). That case **MUST** be handled by the composition layer (mixins/placeholders composing common + variation *within a single isolated target*), not by inter-rule overrides.

---

## Correction 6 — Contexte de page : principe sémantique, théorème, tout-ou-rien (AJOUT normatif)

**Problème** : la spec ne dit pas quand spécialiser un Block structurel de page (`Page` → `UserPage`, `FaqPage`). Le critère de Correction 3 (singulier + invariant) est **nécessaire mais insuffisant** au niveau page : `Page` sur la page FAQ *est* singulier et *peut* être invariant — il passe le test structurel. Pourtant, il encode **ce que l'élément fait structurellement** ("conteneur de page"), non **ce qu'il est sémantiquement** ("la page FAQ"). `FaqPage` encode l'identité.

Il manque donc un second critère, complémentaire à Correction 3 : **le nom doit encoder l'identité de l'élément, pas seulement son type structurel.** Ce critère découle directement du principe que le HTML est un artefact de sens — on écrit du HTML pour décrire le rôle et le contexte des éléments, sans considération de présentation.

**Constat décisif** : ROCS n'offre **aucun moyen légal** de porter un contexte de page en dehors du nom du Block.
- Un `data-context="faq"` sur `:root`/parent encode une **variante sémantique persistante** invariante au runtime → interdit au style par §4.3 point 1 (et documenté comme anti-pattern en §4.4, analogue exact de `data-type="book"` ❌). Le `data-*` est réservé à : états dynamiques JS, métadonnées contextuelles (layout/config technique), hooks JS stables non stylés — un contexte métier persistant n'entre dans aucune de ces trois cases.
- Un sélecteur combiné depuis un Block parent viole l'auto-suffisance §6.2.1 et l'isolation de portée §2.0.

Il en résulte un **tout-ou-rien** : le régime mixte (`Page` pour certaines pages, `FaqPage` pour d'autres) est non conforme, car les pages restées génériques mais divergentes n'auraient aucun moyen légal d'exprimer leur contexte.

**Emplacement** : à la suite de la Correction 3 (Structural Blocks), ou en §3.3.

**Contenu à intégrer** :

> #### Page context — semantic principle, theorem, and all-or-nothing (normative)
>
> **Semantic principle (complement to §3.2).** The test of §3.2 (singular + invariant) is a necessary but not sufficient condition at the page level. A ROCS Block name **MUST** encode the *identity* of the element, not merely its structural type. `Page` on the FAQ page encodes a structural role ("page container"); `FaqPage` encodes an identity ("the FAQ page"). Under the ROCS principle that HTML is a semantic artefact — describing the meaning and role of elements independently of any presentational concern — a page-level Block **MUST** carry its documentary identity in its name.
>
> This is not over-engineering or verbosity: `FaqPage` is no more verbose than `page` + `data-context="faq"`, and it is semantically honest where the latter is not.
>
> **Theorem.** A persistent documentary context can be expressed, in ROCS, **only** by a ROCS class. A `data-*` attribute encoding a persistent context is forbidden for styling (§4.3 point 1, §4.4) — `data-*` is reserved for JS-driven dynamic states, technical contextual metadata (layout/configuration), and non-styled JS hooks, none of which is a persistent business context. A combined selector from a parent Block violates §6.2.1 and §2.0. Therefore, a page context that influences rendering **MUST** be carried by the Block name (`FaqPage`), never by an attribute or a parent context.
>
> **Consequence — all-or-nothing.** At the root (page) level, only two regimes are conformant:
> - **(a) Uniform `Page`** — the project **asserts** that page-level documentary context is, and will permanently remain, irrelevant to rendering. Every page shares the same root identity; all contextual variation lives entirely in child Blocks (`Faq`, `UserProfile`, …). This is a bet on future invariance: if any page ever needs to diverge structurally at the root, the HTML **MUST** be modified — contrary to the redesign-stability goal (§1). `Page` qualifies as a structural Block under §3.2 only while that bet holds.
> - **(b) Systematic `XxxPage`** — page identity is always named (`FaqPage`, `UserPage`, `OrderConfirmationPage`, …). Each is a single, complete, locatable target. A redesign that makes any page diverge touches **CSS only**: the contextual Block already exists. This regime follows directly from treating HTML as a semantic artefact.
>
> A **mixed** regime (some pages `Page`, some `XxxPage`) is **non-conformant**: divergent generic pages would have no legal way to express their context.
>
> **Relationship to §3.2.** Regime (b) does **not** contradict the structural legitimacy of `Page` established in §3.2. §3.2 defines what the specification *structurally permits* (a generic name is licit when singular and invariant); the semantic principle above adds an identity criterion that regime (b) satisfies by construction. Regime (a) is a permitted exception — a deliberate, bounded bet — not the default.

**Note pour l'agent** : le régime (a) reste conforme au sens strict de §3.2 (singulier + invariant), mais doit désormais être présenté comme une **exception à coût assumé** (pari sur l'invariance future), non comme une option symétrique au régime (b). Le régime (b) est la conséquence naturelle du principe sémantique, pas une simple politique de projet. Ne pas supprimer la légitimité structurelle de `Page`/`Main`/`Layout` posée en Correction 3.

---

## Correction 7 — Limites et coûts assumés (AJOUT informatif)

**Problème** : la spec ne reconnaît pas ses propres limites de portée ni le coût de l'isolation. Une présentation qui prétend l'axiome sans défaut déclenche la méfiance.

**Emplacement** : nouvelle annexe informative « Known limits and assumed costs ».

**Contenu à intégrer** :

> ## Annex — Known limits and assumed costs (informative)
>
> ROCS's scope-isolation guarantee holds within the **HTML controlled by the team**. Its boundaries and costs are stated here honestly.
>
> **1. Uncontrolled injected content.** WYSIWYG / editorial body content / third-party HTML that the team does not template may require combined selectors (e.g. styling raw `h2`/`p` inside an editorial region). This is handled via the scoped third-party exception (§6.2.2 point 5) and is, by definition, outside the controlled-HTML scope of §2.0.
>   - *Note*: in setups where server-side templates are fully owned and emit ROCS-compliant classes (e.g. Drupal projects using custom Twig templates with ROCS classes), this limit does **not** apply to the team's own markup — it concerns only genuinely uncontrolled content (free editorial input). It is listed as a general limit of the specification, not as a weakness of any particular templating stack.
>
> **2. Theming / dark mode / token overrides.** The cascade is the intended tool for theming. ROCS does not ban it; it channels it through zero-specificity context selectors (`:root[data-theme] :where(.Block)`) and custom properties, preserving scope isolation while allowing global contextual styling.
>
> **3. Cost of isolation.** Scope isolation is obtained partly by relocating composition complexity into the composition layer (mixins/placeholders), which is itself not order-independent. The guarantee is *conditional* on that layer respecting the boundary contract. There is also a cost in verbosity (more named nodes, potential duplication where the composition layer is not used). These are accepted trade-offs: moving non-commutativity into a tooled, factored, testable layer is preferable to leaving it implicit in the global cascade — but it is a trade-off, not a free win.
>
> **4. Cost of the uniform-`Page` regime.** Choosing regime (a) of §Correction 6 (uniform `Page`) means **betting that page-level context will never become a relevant rendering distinction**. A later redesign can falsify that bet: the day a page must structurally diverge at the root, the project must introduce a contextual Block (`FaqPage`) and therefore **touch the HTML** — contrary to the §1 redesign-stability goal. Regime (b) (systematic `XxxPage`) pays a small naming cost up front to immunise against this; regime (a) is lighter but freezes the assumption of root invariance.

---

## Annexe — ROCS vs native CSS scoping (`@scope`, `@layer`) (informatif, pour présentation)

**But** : anticiper l'objection « le scoping CSS natif (Baseline 2026) ne rend-il pas ROCS inutile ? ». Réponse : non — `@scope` et ROCS résolvent l'isolation par des philosophies opposées, et `@scope` réintroduit la dépendance au contexte que l'axiome ROCS (§2.0) élimine.

**Contenu à intégrer (annexe informative)** :

> ### ROCS and native scoping address isolation oppositely
>
> `@scope` attacks the same root problem (style isolation) but through a mechanism that **contradicts the ROCS founding axiom (§2.0)**:
>
> - `@scope` adds **scoping proximity** to the cascade: when two scopes conflict, the rule whose scope root is the fewest DOM hops away wins. The effect of a rule therefore **depends on the element's position in the DOM tree** — exactly what §2.0 forbids (effect determined by class name alone).
> - When proximity is equal, **source order** decides. `@scope` thus stacks *two* context-dependent criteria (proximity, then order) on top of specificity. It makes contextual dependency *manageable*; ROCS makes it *non-existent*.
> - `@scope` bounds (`@scope (.a) to (.b)`) are **anchors in the DOM tree**. Moving an element out of its scope root changes its styling. Under ROCS, an element keeps its class wherever it sits in the tree → stable styling → HTML free to move during a redesign (objective §1). Native scoping does not provide this as strongly.
>
> **The one thing `@scope` does that class-based methods cannot** — preventing a parent from styling a nested component (the "donut scope" via the `to` keyword) — ROCS obtains differently: a parent *cannot* accidentally style a child, because it has no selector targeting it (corollary of §6.2.1).
>
> ### Recommended use of `@scope` *within* ROCS
>
> `@scope` is best treated as a **tool for the documented exceptions**, not a competitor:
> - For **uncontrolled injected content** (editorial/WYSIWYG body), `@scope (.Article-body) to (.NestedBlock) { … }` is a cleaner native implementation of the third-party exception (§6.2.2) than a combined selector, since it confines styles without leaking into nested ROCS Blocks.
>
> ### `@layer`
>
> `@layer` is **complementary, not competing**: it orders cascade *origins* (e.g. third-party vs product styles), which is orthogonal to per-element scope isolation. ROCS **MAY** use `@layer` to isolate its applicative styles from external stylesheets without altering any ROCS rule.
>
> ### Positioning summary (for the talk)
>
> `@scope` buys isolation at the price of two contextual criteria (proximity + order) that the ROCS axiom removes. They operate at different levels: `@scope` bounds *where* DOM-coupled selectors apply; ROCS removes DOM coupling altogether. ROCS can adopt `@scope`/`@layer` as tools for its exceptions without touching its axiom.

---

## Récapitulatif des priorités

| # | Nature | Priorité | Emplacement |
|---|--------|----------|-------------|
| 1 | Axiome d'isolation de portée | **Structurante** | §2 (avant §2.1) |
| 2 | Délimitation portée vs ordre | **Structurante** | §2.0.1 |
| 3 | Critère type vs occurrence (`Page` légitime) | **Structurante** | §3.2 / §0.3.2 |
| 4 | Contrat de frontière composition | Informative (SHOULD) | §2.3 ou Annexe A |
| 5 | Liste de sélecteurs autorisée | Clarification | §6.2.1 |
| 6 | Contexte de page : principe sémantique + théorème + tout-ou-rien | Normative | §3.3 |
| 7 | Limites et coûts assumés | Informative | Nouvelle annexe |

Si seules trois corrections sont appliquées : **1, 2, 3**.
