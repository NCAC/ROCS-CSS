---
"@rocss/sass": patch
---

`@rocss/sass` ne déclare plus de compilateur en `peerDependencies` (ni `sass` ni `sass-embedded`) : le package ne contient que du SCSS. Le prérequis, Dart Sass ≥ 1.71.0 via `sass` ou `sass-embedded`, est documenté dans le README.
