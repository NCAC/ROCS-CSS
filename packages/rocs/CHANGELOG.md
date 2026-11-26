# @rocss/rocs

## 1.1.2

No changes in this release.

## 1.1.1

No changes in this release.

## 1.1.0

### Minor Changes

- 2d7461a: Le CLI analyse les templates Twig (`.twig`, `.html.twig`) avec les règles HTML : commentaires ignorés, classes statiques vérifiées dans les blocs conditionnels et les attributs mixtes, diagnostics à la ligne du template source. Nouvelle fonction exportée `analyzeTwig`. Les valeurs dynamiques ne sont pas devinées.

### Patch Changes

- 51fe118: Les liens « Spécification française » et « Version anglaise » du README pointent vers les sources canoniques sur GitHub : les liens relatifs vers les copies générées menaient à une 404 depuis npmjs.com.
