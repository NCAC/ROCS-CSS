import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { checkArchitecture } from '../packages/sass-architecture/src/checker.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = join(root, 'packages/sass-architecture/bin/sass-architecture.js');

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'rocs-architecture-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function rules(files) {
  const dir = project(files);
  try {
    return checkArchitecture(dir).violations.map(v => v.rule).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const compliant = {
  'tokens/_color.scss': '$primary: #036;\n',
  'primitives/_math.scss': '@use "../tokens/color";\n@function double($n) { @return $n * 2; }\n',
  'behaviors/_truncate.scss': '@mixin truncate { overflow: hidden; text-overflow: ellipsis; }\n',
  'combinators/context/_media.scss': '@mixin media($c) { @media #{$c} { @content; } }\n',
  'combinators/state/_pseudo-class.scss': '@mixin pseudo-class($p) { &:#{$p} { @content; } }\n',
  'components/_stack.scss': '@use "../behaviors/truncate";\n@use "../combinators/state/pseudo-class";\n@mixin stack { @include truncate.truncate; }\n',
  'globals/_motion.scss': '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n',
  'bootstrap/_root.scss': '@use "../tokens/color";\n@use "../combinators/context/media";\n:root { --primary: #036; }\nbody { margin: 0 !important; }\n',
};

test('A compliant layered project has no violation', () => {
  assert.deepEqual(rules(compliant), []);
});

test('Layer dependencies follow the table of §2 (I1) and I7', () => {
  assert.deepEqual(rules({ ...compliant, 'tokens/_other.scss': '@use "color";\n' }), ['I7']);
  assert.deepEqual(rules({ ...compliant, 'primitives/_bad.scss': '@use "../behaviors/truncate";\n' }), ['I1']);
  assert.deepEqual(rules({ ...compliant, 'components/_bad.scss': '@use "../bootstrap/root";\n' }), ['I1']);
  assert.deepEqual(rules({ ...compliant, 'behaviors/_bad.scss': '@use "../combinators/context/media";\n' }), ['I1']);
});

test('bootstrap may only reach the context family (I23)', () => {
  assert.deepEqual(rules({ ...compliant, 'bootstrap/_bad.scss': '@use "../combinators/state/pseudo-class";\n' }), ['I23']);
  assert.deepEqual(rules({ ...compliant, 'bootstrap/_bad.scss': '@use "pkg:@rocss/sass";\n' }), ['I23']);
  assert.deepEqual(rules({ ...compliant, 'bootstrap/_ok.scss': '@use "pkg:@rocss/sass/context";\n' }), []);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/_index.scss': '@forward "context/media";\n@forward "state/pseudo-class";\n',
    'bootstrap/_bad.scss': '@use "../combinators";\n',
  }), ['I23']);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/context/_index.scss': '@forward "media";\n@forward "../state/pseudo-class";\n',
    'bootstrap/_bad.scss': '@use "../combinators/context";\n',
  }).filter(rule => rule === 'I23'), ['I23']);
});

test('Non-terminal layers emit nothing on their own (I2)', () => {
  assert.deepEqual(rules({ ...compliant, 'tokens/_bad.scss': 'body { color: red; }\n' }), ['I2']);
  assert.deepEqual(rules({ ...compliant, 'behaviors/_bad.scss': '@media print { .x { color: red; } }\n' }).includes('I2'), true);
  assert.deepEqual(rules({ ...compliant, 'globals/_bad.scss': 'html { color: red; }\n' }), ['I2']);
});

test('primitives hold only functions (I8) and behaviors are output-only (I9, I10)', () => {
  assert.ok(rules({ ...compliant, 'primitives/_bad.scss': '@mixin m { color: red; }\n' }).includes('I8'));
  assert.ok(rules({ ...compliant, 'behaviors/_bad.scss': '@mixin m { &:hover { color: red; } }\n' }).includes('I9'));
  assert.ok(rules({ ...compliant, 'behaviors/_bad.scss': '@mixin m { @content; }\n' }).includes('I9'));
  assert.ok(rules({ ...compliant, 'behaviors/_bad.scss': '@mixin m { @media print { color: red; } }\n' }).includes('I9'));
  assert.deepEqual(rules({ ...compliant, 'behaviors/_bad.scss': '@use "truncate";\n@mixin m { @include truncate.truncate; }\n' }), ['I10']);
});

test('Combinators forward content (I11), ignore behaviors (I16) and stay in their family (I13)', () => {
  assert.deepEqual(rules({ ...compliant, 'combinators/state/_bad.scss': '@mixin bad { color: red; }\n' }), ['I11']);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/state/_bad.scss': '@use "../../behaviors/truncate";\n@mixin bad { @include truncate.truncate; @content; }\n',
  }).sort(), ['I1', 'I16'].sort());
  assert.deepEqual(rules({ ...compliant, 'combinators/state/_bad.scss': '@use "../context/media";\n@mixin bad { @content; }\n' }), ['I13']);
});

test('A specialization consumes no other specialization (I14)', () => {
  const special = { 'combinators/context/_viewport.scss': '@use "media";\n@mixin from_wide { @include media.media("(min-width: 60em)") { @content; } }\n' };
  assert.deepEqual(rules({ ...compliant, ...special }), []);
  assert.deepEqual(rules({
    ...compliant,
    ...special,
    'combinators/context/_chain.scss': '@use "viewport";\n@mixin from_wider { @include viewport.from_wide { @content; } }\n',
  }), ['I14']);
});

test('Each canonical is unique and lives in its own family (I12)', () => {
  assert.deepEqual(rules({
    ...compliant,
    'combinators/context/_dup.scss': '@mixin media($c) { @media #{$c} { @content; } }\n',
  }), ['I12']);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/state/_media.scss': '@mixin media($c) { &:#{$c} { @content; } }\n',
  }), ['I12', 'I12']);
  const { 'combinators/state/_pseudo-class.scss': _, ...withoutPseudoClass } = compliant;
  assert.deepEqual(rules({
    ...withoutPseudoClass,
    'components/_stack.scss': '@mixin stack { color: red; }\n',
    'combinators/part/_pseudo-class.scss': '@mixin pseudo-class($p) { &:#{$p} { @content; } }\n',
  }), ['I12']);
});

test('Combinator families nest in order, with one scope and one part (I15)', () => {
  const families = {
    ...compliant,
    'combinators/scope/_ancestor.scss': '@mixin ancestor($a) { #{$a} :where(&) { @content; } }\n',
    'combinators/part/_pseudo-element.scss': '@mixin pseudo-element($p) { &::#{$p} { @content; } }\n',
  };
  const use = '@use "../combinators/context/media";\n@use "../combinators/scope/ancestor";\n'
    + '@use "../combinators/state/pseudo-class";\n@use "../combinators/part/pseudo-element";\n';
  const stack = body => ({ ...families, 'components/_stack.scss': `${use}@mixin stack { ${body} }\n` });
  assert.deepEqual(rules(stack(
    '@include media.media(x) { @include ancestor.ancestor(y) { @include pseudo-class.pseudo-class(z) { @include pseudo-element.pseudo-element(w) { color: red; } } } }',
  )), []);
  assert.deepEqual(rules(stack(
    '@include pseudo-class.pseudo-class(z) { @include ancestor.ancestor(y) { color: red; } }',
  )), ['I15']);
  assert.deepEqual(rules(stack(
    '@include ancestor.ancestor(a) { @include ancestor.ancestor(b) { color: red; } }',
  )), ['I15']);
  assert.deepEqual(rules(stack(
    '@include pseudo-element.pseudo-element(a) { @include pseudo-element.pseudo-element(b) { color: red; } }',
  )), ['I15']);
});

test('Signature specificity stays under the (0,3,1) cap (I21)', () => {
  const families = {
    ...compliant,
    'combinators/state/_attribute.scss': '@mixin attribute($a) { &[#{$a}] { @content; } }\n',
    'combinators/scope/_ancestor.scss': '@mixin ancestor($a) { #{$a} :where(&) { @content; } }\n',
    'combinators/part/_pseudo-element.scss': '@mixin pseudo-element($p) { &::#{$p} { @content; } }\n',
  };
  const use = '@use "../combinators/scope/ancestor";\n@use "../combinators/state/pseudo-class";\n'
    + '@use "../combinators/state/attribute";\n@use "../combinators/part/pseudo-element";\n';
  const stack = body => ({ ...families, 'components/_stack.scss': `${use}@mixin stack { ${body} }\n` });
  const hover = inner => `@include pseudo-class.pseudo-class(hover) { ${inner} }`;
  const open = inner => `@include attribute.attribute(open) { ${inner} }`;
  // (0,1,0) + 2 state = (0,3,0) : accepté ; 3 state = (0,4,0) : refusé.
  assert.deepEqual(rules(stack(hover(open('color: red;')))), []);
  assert.deepEqual(rules(stack(hover(open(hover('color: red;'))))), ['I21']);
  // scope html[…] (0,1,1) + 1 state = (0,2,1) : accepté ; scope .C[…] (0,2,0) + 2 state = (0,4,0) : refusé.
  assert.deepEqual(rules(stack(`@include ancestor.ancestor("html[data-theme]") { ${hover('color: red;')} }`)), []);
  assert.deepEqual(rules(stack(`@include ancestor.ancestor(".Theme[data-x]") { ${hover(open('color: red;'))} }`)), ['I21']);
  // Un part sur (0,3,0) donne (0,3,1) : accepté ; sur html[…] + 2 state (0,3,1), il donne (0,3,2) : refusé.
  const before = '@include pseudo-element.pseudo-element(before) { content: ""; }';
  assert.deepEqual(rules(stack(hover(open(before)))), []);
  assert.deepEqual(rules(stack(`@include ancestor.ancestor("html[data-theme]") { ${hover(open(before))} }`)), ['I21']);
});

test('Selectors and !important follow I19 and I22', () => {
  assert.deepEqual(rules({
    ...compliant,
    'combinators/state/_bad.scss': '@mixin bad { .Child { @content; } }\n',
  }), ['I19']);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/state/_bad.scss': '@mixin bad { & > span { @content; } }\n',
  }), ['I19']);
  assert.deepEqual(rules({
    ...compliant,
    'combinators/state/_ok.scss': '@mixin ok($s) { &:nth-child(2n + 1)#{$s}[data-x~="y"] { @content; } }\n',
  }), []);
  assert.deepEqual(rules({ ...compliant, 'behaviors/_bad.scss': '@mixin m { color: red !important; }\n' }), ['I22']);
});

test('CLI reports violations, supports JSON and rejects missing layers', () => {
  const dir = project({ ...compliant, 'tokens/_bad.scss': 'body { color: red; }\n' });
  try {
    const failed = spawnSync(process.execPath, [cli, 'check', dir, '--format', 'json'], { encoding: 'utf8' });
    assert.equal(failed.status, 1, failed.stderr);
    assert.deepEqual(JSON.parse(failed.stdout).violations.map(v => v.rule), ['I2']);
    const empty = project({ 'readme.txt': 'x' });
    try {
      const none = spawnSync(process.execPath, [cli, 'check', empty], { encoding: 'utf8' });
      assert.equal(none.status, 2);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
    const custom = project({ 'a/colors/_c.scss': '$x: 1;\n', 'a/helpers/_f.scss': '@function f() { @return 1; }\n' });
    try {
      const ok = spawnSync(process.execPath, [cli, 'check', custom, '--layer', 'tokens=a/colors',
        '--layer', 'primitives=a/helpers'], { encoding: 'utf8' });
      assert.equal(ok.status, 0, ok.stdout + ok.stderr);
      const invalid = spawnSync(process.execPath, [cli, 'check', custom, '--layer', 'unknown=a'], { encoding: 'utf8' });
      assert.equal(invalid.status, 2);
    } finally {
      rmSync(custom, { recursive: true, force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI help shows the package version from its manifest', () => {
  const { version } = JSON.parse(readFileSync(join(root, 'packages/sass-architecture/package.json'), 'utf8'));
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.ok(help.stdout.includes(`ROCS Sass Architecture Checker — v${version}`), help.stdout);
});

test('The @rocss/sass workspace satisfies its own architecture checks', () => {
  const result = checkArchitecture(join(root, 'packages/sass'), {
    layers: { combinators: '.' },
  });
  assert.deepEqual(result.violations.filter(v => v.severity === 'error').map(v => `${v.rule} ${v.file}`), []);
});

test('Parsing tolerates comments, strings, interpolation and maps, and reports syntax errors', () => {
  assert.deepEqual(rules({
    ...compliant,
    'tokens/_tricky.scss': `// body { color: red; }
/* .Fake { } */
$map: (a: "} { ;", b: url(http://example.com/a.png));
$name: "#{'x'}";
`,
    'combinators/state/_tricky.scss': `@mixin tricky($s) {
  // @include truncate;
  &:#{$s} { content: "} .Child {"; @content; }
}
`,
  }), []);
  assert.deepEqual(rules({ ...compliant, 'tokens/_broken.scss': '$a: (1;\n.x { color: red;\n' }), ['SYNTAX']);
  assert.ok(rules({ ...compliant, 'combinators/state/_bad.scss': '@mixin bad { :where(.Child) & { @content; } }\n' }).includes('I19'));
  assert.deepEqual(rules({
    ...compliant,
    'combinators/scope/_ok.scss': '@mixin ancestor($a) { #{$a} & { @content; } }\n',
  }), []);
});

test('--compile detects emission that static analysis cannot see (I2)', () => {
  const run = files => {
    const dir = project(files);
    try {
      const result = spawnSync(process.execPath, [cli, 'check', dir, '--compile', '--format', 'json'], { encoding: 'utf8' });
      return { status: result.status, stderr: result.stderr, violations: result.stdout ? JSON.parse(result.stdout).violations : [] };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const ok = run(compliant);
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(ok.violations, []);

  // Dépendance externe aux couches qui émet du CSS à son chargement : invisible pour l'analyse statique.
  const hidden = run({
    ...compliant,
    'vendor/_reset.scss': 'body { margin: 0; }\n',
    'components/_emit.scss': '@use "../vendor/reset";\n',
  });
  assert.equal(hidden.status, 1, hidden.stderr);
  assert.ok(hidden.violations.some(v => v.rule === 'I2' && v.file.endsWith('_emit.scss')));

  // Pas de doublon quand l'analyse statique signale déjà le fichier.
  const duplicate = run({ ...compliant, 'tokens/_bad.scss': 'body { color: red; }\n' });
  assert.deepEqual(duplicate.violations.filter(v => v.rule === 'I2').length, 1);

  const stray = run({ ...compliant, 'globals/_emit.scss': '@mixin m { .X { color: red; } }\n@include m;\n' });
  assert.ok(stray.violations.some(v => v.rule === 'I2' && v.file.endsWith('_emit.scss')));

  const broken = run({ ...compliant, 'tokens/_missing.scss': '@use "does-not-exist";\n' });
  assert.equal(broken.status, 0);
  assert.deepEqual(broken.violations.map(v => v.rule), ['COMPILE']);
});
