# Exemple ROCS — NavigationMain

## Ce que cet exemple illustre

| Point ROCS | Section spec | Démonstration |
|---|---|---|
| Bloc applicatif (pas de `Nav` générique) | §3.2 | `NavigationMain` |
| 0 ou 1 classe ROCS par élément | §3.1 | Chaque élément HTML porte exactement 1 classe |
| États via ARIA (jamais de classes d'état) | §3.5 | `aria-expanded`, `aria-hidden`, `aria-current` |
| Métadonnée contextuelle + `:where()` | §4.2, §6.2.2 | `data-has-submenu` |
| État dynamique JS | §4 | `data-nav-state="open/idle"` sur le `<nav>` |
| Auto-suffisance des sélecteurs | §6.2.1 | `.NavigationMain-link { }` sans sélecteur parent |
| `id` réservés au JS/ancres | §5 | `id="navigation-toggle"` utilisé uniquement en `aria-controls` |
| `@keyframes` nommés par mouvement | Guide §2.1 | `@keyframes fadeIn` |
| Responsive via `@media` | Guide §3 | Aucune classe ajoutée en JS pour le responsive |
| Icône décorative via `::after` | §3.6.3 | Flèche du trigger en pseudo-élément |

## Structure HTML expliquée

```
NavigationMain              ← Bloc : barre de navigation complète
├── NavigationMain-logo     ← Élément : lien vers l'accueil
│   └── NavigationMain-logoText
├── NavigationMain-nav      ← Élément : zone de navigation (avec data-nav-state)
│   ├── NavigationMain-menuToggle  ← Élément : bouton hamburger (mobile)
│   │   └── NavigationMain-menuToggleBar (×3)
│   └── NavigationMain-list
│       ├── NavigationMain-item     (aria-current="page" sur le link actif)
│       │   └── NavigationMain-link
│       └── NavigationMain-item     (data-has-submenu="true")
│           ├── NavigationMain-trigger  (aria-expanded="true/false")
│           └── NavigationMain-submenu  (aria-hidden="true/false")
│               └── NavigationMain-subitem
│                   └── NavigationMain-sublink
└── NavigationMain-actions
    └── NavigationMain-githubLink
```

## Pourquoi `data-has-submenu` est une métadonnée contextuelle valide

Test des 3 critères §4.2 :
1. ✅ N'encode pas un variant sémantique (un item avec sous-menu *est* le même rôle sémantique qu'un item sans)
2. ✅ N'encode pas un style design system
3. ✅ `NavigationMain-itemWithSubmenu` serait une classe ROCS acceptable mais inutilement verbeuse pour un simple paramètre de layout

**Usage CSS** : `data-has-submenu` n'est pas ciblé directement en CSS dans cet exemple (la flèche est sur `.NavigationMain-trigger::after`). Si besoin de l'utiliser : `:where()` obligatoire.

## Lancer l'exemple

```bash
# Compiler le SCSS
npx sass examples/NavigationMain/styles.scss examples/NavigationMain/styles.css

# Valider la conformité ROCS
node tools/rocs-validate.js --dir examples/NavigationMain

# Lint CSS
npx stylelint examples/NavigationMain/styles.scss
```
