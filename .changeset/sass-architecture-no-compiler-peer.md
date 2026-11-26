---
"@rocss/sass-architecture": patch
---

`@rocss/sass-architecture` ne déclare plus `sass` en `peerDependency` optionnelle. Le compilateur, utilisé seulement par `--compile`, reste cherché d'abord dans le projet analysé. Sa version est désormais contrôlée au chargement : un `sass` antérieur à 1.71.0 arrête la commande avec un message explicite et le code 2.
