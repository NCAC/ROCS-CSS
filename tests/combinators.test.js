import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import * as sass from 'sass';

const packages = fileURLToPath(new URL('../packages/', import.meta.url));
const families = ['context', 'state', 'scope', 'part'];
const imports = families.map(name => `@use "sass/${name}" as ${name};`).join('\n');
const compile = code => sass.compileString(`${imports}\n${code}`, {
  loadPaths: [packages], style: 'compressed',
}).css;
const within = code => `.ProductCard-title { ${code} }`;
const fails = (code, pattern) => assert.throws(() => compile(code), pattern);

test('pkg: URLs resolve the workspace linked at the repository root', () => {
  const importers = [new sass.NodePackageImporter(fileURLToPath(new URL('../', import.meta.url)))];
  for (const entry of ['', ...families.map(name => `/${name}`)]) {
    assert.equal(sass.compileString(`@use "pkg:@rocss/sass${entry}";`, { importers }).css, '');
  }
});

test('All public entry points emit no CSS at load time and expose only their mixins', () => {
  for (const entry of ['', ...families.map(name => `/${name}`)]) {
    const result = sass.compileString(`@use "sass${entry}";`, { loadPaths: [packages] });
    assert.equal(result.css, '');
  }
  const surface = sass.compileString(`
    @use "sass:meta";
    @use "sass:map";
    @use "sass" as c;
    @if map.has-key(meta.module-functions("c"), "is-valid") { @error "helper leak"; }
    @if map.has-key(meta.module-variables("c"), "simple") { @error "variable leak"; }
    @if map.has-key(meta.module-mixins("c"), "media") == false { @error "missing media"; }
  `, { loadPaths: [packages] });
  assert.equal(surface.css, '');
});

test('The seven canonical mixins preserve content and selector shape', () => {
  const cases = [
    ['context.media("(min-width: 48rem)")', '@media(min-width: 48rem)'],
    ['context.supports("(display: grid)")', '@supports(display: grid)'],
    ['context.container("(min-width: 20rem)")', '@container(min-width: 20rem)'],
    ['state.pseudo-class("hover")', '.ProductCard-title:hover'],
    ['state.attribute("disabled")', '.ProductCard-title[disabled]'],
    ['state.attribute("aria-expanded", "true")', '.ProductCard-title[aria-expanded=true]'],
    ['scope.ancestor("body[data-columns]")', 'body[data-columns] :where(.ProductCard-title)'],
    ['part.pseudo-element("before")', '.ProductCard-title::before'],
  ];
  for (const [invocation, expected] of cases) {
    const css = compile(within(`@include ${invocation} { display: block; }`));
    // Quoting and whitespace in at-rule output differ across Dart Sass versions.
    const normalized = css.replaceAll('"', '').replaceAll("'", '').replace(/\s+/g, '');
    assert.ok(normalized.includes(expected.replace(/\s+/g, '')), css);
    assert.equal((css.match(/display:block/g) || []).length, 1, invocation);
  }
});

test('Composition context → scope → state → part preserves at-rules and specificity shape', () => {
  const css = compile(within(`
    @include context.media("(min-width: 48rem)") {
      @include scope.ancestor("body[data-columns]") {
        @include state.pseudo-class("hover") {
          @include part.pseudo-element("before") { display: block; }
        }
      }
    }
  `));
  assert.match(css, /@media/);
  assert.ok(css.includes('body[data-columns] :where(.ProductCard-title):hover::before'), css);
  assert.equal((css.match(/display:block/g) || []).length, 1);
  assert.equal(compile(within(`
    @include state.pseudo-class("hover") {
      @include state.pseudo-class("focus-visible") { display: block; }
    }
  `)), '.ProductCard-title:hover:focus-visible{display:block}');
});

test('A scoped Unicode attribute remains valid after Sass selector serialization', () => {
  for (const invocation of ['state.pseudo-class("hover")', 'state.attribute("disabled")',
    'part.pseudo-element("before")']) {
    const css = compile(within(`@include scope.ancestor('body[data-label="été"]') {
      @include ${invocation} { display: block; }
    }`));
    assert.ok(css.includes(':where(.ProductCard-title)'), css);
  }
  assert.ok(compile(within('@include state.attribute("data-label", "�") { display: block; }'))
    .includes('data-label'));
});

test('Index pseudo-classes accept An+B but never selector arguments', () => {
  for (const index of ['odd', 'even', '2', '-2', '+2', 'n', '-n+2', '2n + 1', '2n-1']) {
    const css = compile(within(`@include state.pseudo-class("nth-child(${index})") { display: block; }`));
    assert.ok(css.includes(':nth-child('), css);
  }
  for (const pseudo of ['is(.Other)', 'not(.Other)', 'has(.Other)', 'where(.Other)',
    'nth-child(2 of .Other)', 'nth-child(nnn)', 'nth-child(+++)', 'nth-child(2n 1)',
    'hover, .Other', 'hover > .Other', 'unknown']) {
    fails(within(`@include state.pseudo-class(${JSON.stringify(pseudo)}) { display: block; }`), /pseudo-class/);
  }
});

test('Attribute and ancestor arguments reject injections and malformed identifiers', () => {
  for (const name of ['1name', '-1name', '-', ':name', 'data-x] .Other', 'data x']) {
    fails(within(`@include state.attribute(${JSON.stringify(name)}) { display: block; }`), /attribute/);
  }
  for (const value of ['"', "'", '[', ']', '\\']) {
    fails(within(`@include state.attribute("data-state", ${JSON.stringify(value)}) { display: block; }`), /attribute/);
  }
  assert.match(compile(within('@include state.attribute("data-count", 2) { display: block; }')), /\[data-count=.?2/);
  assert.match(compile(within('@include state.attribute("data-label", "two words") { display: block; }')), /two words/);
  for (const ancestor of ['body', 'body .Other[data-x]', 'body[data-x] .Other',
    'body[data-x], .Other[data-x]', 'body[data-x][data-y]', '#root[data-x]',
    '.1Invalid[data-x]', 'body[data-x="open"], .Other[data-x="x"]']) {
    fails(within(`@include scope.ancestor(${JSON.stringify(ancestor)}) { display: block; }`), /ancestor/);
  }
  for (const ancestor of ['html[data-columns]', 'body[data-columns="2"]',
    ':root[data-columns]', '.ProductCard[data-columns="2"]']) {
    assert.ok(compile(within(`@include scope.ancestor(${JSON.stringify(ancestor)}) { display: block; }`))
      .includes(':where(.ProductCard-title)'));
  }
});

test('Context conditions and pseudo-elements have bounded input domains', () => {
  for (const mechanism of ['media', 'supports', 'container']) {
    for (const condition of ['""', '"   "', '42', '"screen;"', '"screen {"', '"screen }"']) {
      fails(within(`@include context.${mechanism}(${condition}) { display: block; }`), new RegExp(mechanism));
    }
  }
  for (const pseudo of ['unknown', 'before:hover', 'before, .Other']) {
    fails(within(`@include part.pseudo-element(${JSON.stringify(pseudo)}) { display: block; }`), /pseudo-element/);
  }
});

test('All canonical mixins require a content block', () => {
  for (const invocation of ['context.media("screen")', 'context.supports("(display: grid)")',
    'context.container("(width > 10rem)")', 'state.pseudo-class("hover")',
    'state.attribute("disabled")', 'scope.ancestor("body[data-columns]")', 'part.pseudo-element("before")']) {
    fails(within(`@include ${invocation};`), /content obligatoire/);
  }
});

test('Complex parents, selector lists and nested scopes are rejected', () => {
  for (const parent of ['.ProductCard .ProductCard-title', '.ProductCard, .CheckoutForm']) {
    for (const invocation of ['state.pseudo-class("hover")', 'state.attribute("disabled")',
      'scope.ancestor("body[data-columns]")', 'part.pseudo-element("before")']) {
      fails(`${parent} { @include ${invocation} { display: block; } }`, /doit être/);
    }
  }
  fails(within(`@include scope.ancestor("body[data-columns]") {
    @include scope.ancestor("html[data-layout]") { display: block; }
  }`), /ancestor/);
});

test('Family entry points cannot import or forward a sibling family', () => {
  const packageRoot = join(packages, 'sass');
  for (const family of families) {
    const pending = [join(packageRoot, family, '_index.scss')];
    const visited = new Set();
    while (pending.length > 0) {
      const file = pending.pop();
      if (visited.has(file)) continue;
      visited.add(file);
      const packagePath = relative(packageRoot, file);
      assert.ok(!packagePath.startsWith('..'), `Import outside package: ${file}`);
      const owner = packagePath.split('/')[0];
      assert.ok(owner === family || owner === 'internal', `${family} imports ${packagePath}`);
      const source = readFileSync(file, 'utf8');
      for (const [, target] of source.matchAll(/@(?:use|forward)\s+["']([^"']+)["']/g)) {
        if (target.startsWith('sass:')) continue;
        const full = resolve(dirname(file), target);
        const candidates = [full, `${full}.scss`, join(dirname(full), `_${full.split('/').at(-1)}.scss`),
          join(full, '_index.scss')];
        const dependency = candidates.find(candidate => candidate.endsWith('.scss') && existsSync(candidate));
        assert.ok(dependency, `Unresolved import: ${target} in ${file}`);
        pending.push(dependency);
      }
    }
  }
});