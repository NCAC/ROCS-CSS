# CheckoutForm — Exemple ROCS

Formulaire de paiement multi-étapes illustrant les patterns ROCS pour la gestion des **états de formulaire**, des **états dynamiques JS** et de la **promotion de Bloc**.

---

## Patterns ROCS démontrés

| Pattern | Implémentation | Section spec |
|---------|---------------|--------------|
| Bloc autonome | `CheckoutForm` | §3.2 |
| Éléments nommés par rôle | `CheckoutForm-field`, `CheckoutForm-input`, `CheckoutForm-fieldError` | §3.4 |
| État d'erreur sans classe | `[aria-invalid="true"]` sur l'`<input>` | §3.5, §6.2.2 |
| État valide sans classe | `:valid:not(:placeholder-shown)` | §3.5 |
| État désactivé sans classe | `:disabled` | §3.5 |
| État multi-étapes | `data-step="1|2|3"` sur `<form>`, `hidden` sur les panels | §4, §4.2 |
| Option sélectionnée sans classe | `:has(input[type="radio"]:checked)` | §3.5 |
| Sélecteur conditionnel | `[data-delivery-type="express"]` avec `:where()` | §6.2.2 |
| Promotion en Bloc | `CheckoutFormSummary` promu depuis `CheckoutForm-panel` | §7 |
| Nom d'animation camelCase | `@keyframes panelFadeIn` | Guide §2.1 |
| Sélecteur d'étape courante | `[aria-current="step"]` avec `:where()` | §6.2.2 |

---

## Structure du Bloc `CheckoutForm`

```
CheckoutForm                      ← Bloc (formulaire entier)
├── CheckoutForm-steps            ← liste des étapes (indicateur)
│   └── CheckoutForm-step         ← une étape
│       ├── CheckoutForm-stepNumber
│       └── CheckoutForm-stepLabel
├── CheckoutForm-panel [data-panel="1|2|3"]  ← contenu de chaque étape
│   ├── CheckoutForm-panelTitle
│   ├── CheckoutForm-field        ← wrapper label + input + erreur
│   │   ├── CheckoutForm-label
│   │   ├── CheckoutForm-input
│   │   └── CheckoutForm-fieldError
│   ├── CheckoutForm-row          ← grille de champs côte à côte
│   ├── CheckoutForm-options      ← groupe de radios
│   │   └── CheckoutForm-option
│   │       └── CheckoutForm-optionLabel
│   └── CheckoutForm-actions
│       ├── CheckoutForm-prevStep
│       ├── CheckoutForm-nextStep
│       └── CheckoutForm-submit
└── CheckoutFormSummary           ← Bloc PROMU (§7)
    ├── CheckoutFormSummary-title
    ├── CheckoutFormSummary-message
    ├── CheckoutFormSummary-details
    │   ├── CheckoutFormSummary-detailLabel
    │   └── CheckoutFormSummary-detailValue
    └── CheckoutFormSummary-cta
```

---

## Décisions ROCS commentées

### Pourquoi pas de classe `is-error` ?

> **§3.5** — Les états dynamiques DOIVENT être portés par des attributs HTML (`aria-invalid`, `aria-expanded`, `disabled`, etc.) ou des attributs `data-*`, jamais par des classes CSS.

L'état d'erreur est encodé en deux endroits :
1. `aria-invalid="true"` sur l'`<input>` → ciblé par `[aria-invalid="true"]` en CSS
2. L'attribut `hidden` est retiré de `.CheckoutForm-fieldError` → le message apparaît

JS n'ajoute jamais de classe CSS ; il gère uniquement `aria-*` et `hidden`.

### Pourquoi `data-step` et non des classes `is-step-1`, `is-step-2` ?

> **§4.2** — Un état multi-valeurs (étape 1, 2, ou 3) est un état dynamique à valeur scalaire. `data-step="1"` est sémantiquement plus riche qu'une classe booléenne et peut être ciblé par des sélecteurs CSS.

### Pourquoi `:where()` sur `[data-delivery-type]` ?

> **§6.2.2** — Tout sélecteur `[data-*]` qui se combine avec un sélecteur de classe ROCS DOIT être enveloppé dans `:where()` pour neutraliser la spécificité additionnelle.

```scss
// ✅ Correct — spécificité neutralisée
.CheckoutForm-options:where([data-delivery-type="express"]) { … }

// ✗ Non-conforme — spécificité trop élevée
.CheckoutForm-options[data-delivery-type="express"] { … }
```

### Pourquoi `CheckoutFormSummary` est-il un Bloc promu ?

> **§7** — Quand un Élément atteint une richesse structurelle autonome (≥ 5 sous-éléments, réutilisabilité hors contexte), il DOIT être promu en Bloc.

`CheckoutFormSummary` réunit les critères :
- 5 éléments internes stylés (`title`, `message`, `details`, `detailLabel`, `detailValue`, `cta`)
- Peut être réutilisé dans une page "Historique des commandes" sans `CheckoutForm`
- Porte son propre comportement `aria-live="polite"`

---

## Ce que cet exemple ne fait PAS

| Interdit | Raison |
|----------|--------|
| ~~`class="is-error"`~~ | État → attribut natif `aria-invalid` |
| ~~`class="is-loading"`~~ | État → `data-state` ou `disabled` |
| ~~`class="is-active"`~~ | État → `aria-current` |
| ~~`class="is-selected"`~~ | État → `:has(input:checked)` |
| ~~`#checkout-form { color: red }`~~ | id → jamais en CSS (§5), seulement pour `for`/ARIA |

---

## Lancement

```bash
# Compiler le SCSS
npx sass examples/CheckoutForm/styles.scss examples/CheckoutForm/styles.css

# Ouvrir dans le navigateur
open examples/CheckoutForm/index.html
```
