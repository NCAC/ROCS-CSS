# @rocss/sass-architecture

## 1.1.2

### Patch Changes

- 234e942: `@rocss/sass-architecture` ne déclare plus `sass` en `peerDependency` optionnelle. Le compilateur, utilisé seulement par `--compile`, reste cherché d'abord dans le projet analysé. Sa version est désormais contrôlée au chargement : un `sass` antérieur à 1.71.0 arrête la commande avec un message explicite et le code 2.

## 1.1.1

No changes in this release.

## 1.1.0

### Patch Changes

- a5c9a0b: `sass-architecture --help` affiche la version lue dans `package.json` au lieu de « v0.1 » codé en dur.
