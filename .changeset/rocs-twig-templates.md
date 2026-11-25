---
"@rocss/rocs": minor
---

Le CLI analyse les templates Twig (`.twig`, `.html.twig`) avec les règles HTML : commentaires ignorés, classes statiques vérifiées dans les blocs conditionnels et les attributs mixtes, diagnostics à la ligne du template source. Nouvelle fonction exportée `analyzeTwig`. Les valeurs dynamiques ne sont pas devinées.
