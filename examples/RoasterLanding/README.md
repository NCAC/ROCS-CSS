# RoasterLanding

Landing page statique d'un torréfacteur fictif. C'est un test « en vrai » des trois packages du dépôt :

- **ROCS** (`@rocss/rocs`) : HTML à 0 ou 1 classe par élément, sélecteurs auto-suffisants.
- **Architecture Sass** (`@rocss/sass-architecture`) : couches `tokens → primitives → {behaviors | combinators} → components`, plus `globals` et `bootstrap`.
- **Combinators** (`@rocss/sass`) : les sept mixins canoniques, atteints uniquement via des spécialisations.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page. Classes ROCS uniquement. |
| `app.js` | Seul code qui modifie l'état : `aria-expanded`, `aria-pressed`, `data-state`, `data-theme`. |
| `styles.scss` | Point d'entrée : `globals`, `bootstrap`, puis `blocks`. Hors couches. |
| `scss/<couche>/` | Une couche par dossier, convention reconnue par `sass-architecture check`. |
| `scss/blocks/` | Couche de consommation : seule à nommer des classes ROCS. |

## Blocks ROCS

`RoasterMasthead`, `RoasterHero`, `BeanRange`, `BeanCard`, `RoasterFaq`, `RoasterColophon`. Aucun nom générique interdit. Les variantes de contenu (origine, prix) sont du texte, pas des classes ni des `data-*` statiques.

## États dynamiques

| Interaction | Attribut | Cible CSS |
| --- | --- | --- |
| Menu mobile | `aria-expanded` (bouton), `data-state` (panneau) | l'élément lui-même (ROCS §6.2.2 (3)) |
| Question de FAQ | `aria-expanded` (bouton) + `hidden` (réponse) | `.RoasterFaq-question[aria-expanded]::after` |
| Thème | `data-theme` sur `<html>` | `bootstrap` (I6 bis) et `scope.ancestor` |

## Où chaque mixin de `@rocss/sass` est utilisé

| Mixin | Spécialisation | Usage |
| --- | --- | --- |
| `context.media` | `from_medium`, `from_wide`, `reduced_motion`, `prefers_dark` | grille, navigation, préférences |
| `context.supports` | `with_backdrop_blur` | en-tête translucide |
| `context.container` | `when_container_wide` | `BeanCard` selon la largeur de sa cellule |
| `state.pseudo-class` | `on_hover`, `on_focus_visible` | actions, liens |
| `state.attribute` | `when_expanded`, `when_pressed`, `when_current`, `when_open` | états ARIA et `data-state` |
| `scope.ancestor` | `in_dark_theme` | `BeanCard-photo` |
| `part.pseudo-element` | `before`, `after` | filet de l'eyebrow, chevron de FAQ |

## Écarts assumés

- `in_dark_theme` : la doctrine (I6 bis) préfère un token à un `scope` pour une variation de thème. Un token `--filter-photo` existe d'ailleurs, et le scope n'est conservé que pour exercer `scope.ancestor` en conditions réelles.
- Le scope dépend de `data-theme` posé par `app.js`. Sans JavaScript, `prefers-color-scheme` pilote les tokens (via `bootstrap`) mais pas ce scope.

## Commandes

```bash
pnpm exec sass --pkg-importer=node examples/RoasterLanding/styles.scss examples/RoasterLanding/styles.css
pnpm exec sass-architecture check examples/RoasterLanding --compile
node tools/rocs-validate.js --dir ./examples/RoasterLanding
```
