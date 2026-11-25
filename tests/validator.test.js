import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { analyzeHtml, analyzeScss, analyzeTwig, validateRocsClass } from '../packages/rocs/src/validator.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = join(root, 'packages/rocs/bin/rocs.js');

test('API: valid roles and forbidden state classes', () => {
  assert.deepEqual(validateRocsClass('ProductCard-title'), []);
  assert.ok(validateRocsClass('is-open').some(issue => issue.rule === 'R04'));
});

test('API: HTML one-class rule and CSS ID rule', () => {
  assert.deepEqual(analyzeHtml('<div class="ProductCard"></div>', 'test.html'), []);
  assert.ok(analyzeHtml('<div class="ProductCard ProductCard-title"></div>', 'test.html')
    .some(issue => issue.rule === 'R03'));
  assert.ok(analyzeScss('#checkout { color: red; }', 'test.css')
    .some(issue => issue.rule === 'R06'));
});

test('CLI: CSS discovery, legacy entry point and strict exit status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rocs-validator-'));
  try {
    writeFileSync(join(dir, 'styles.css'), '#checkout { color: red; }');
    const args = ['--dir', dir, '--format', 'json'];
    const current = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root });
    const legacy = spawnSync(process.execPath, [join(root, 'tools/rocs-validate.js'), ...args], {
      encoding: 'utf8', cwd: root,
    });
    assert.equal(current.status, 1, current.stderr);
    assert.equal(legacy.status, current.status, legacy.stderr);
    assert.deepEqual(JSON.parse(legacy.stdout), JSON.parse(current.stdout));
    assert.equal(JSON.parse(current.stdout).stats.files, 1);
    rmSync(join(dir, 'styles.css'));
    writeFileSync(join(dir, 'test.html'), '<div class="ProductCard" data-variant="primary"></div>');
    const normal = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    const strict = spawnSync(process.execPath, [cli, ...args, '--strict'], { encoding: 'utf8' });
    assert.equal(normal.status, 0, normal.stderr);
    assert.equal(strict.status, 1, strict.stderr);
    assert.ok(JSON.parse(normal.stdout).stats.warnings > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Importing the package does not launch the CLI or exit', () => {
  const entry = new URL('../packages/rocs/src/validator.js', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `await import(${JSON.stringify(entry)}); console.log('import-ok');`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'import-ok');
});
const twigRules = source => analyzeTwig(source, 'template.html.twig').map(issue => `${issue.rule}@L${issue.line}`);

test('Twig: static classes follow the HTML rules with source line numbers', () => {
  assert.deepEqual(twigRules('<article class="ServiceCard">\n  <h2 class="ServiceCard-title">{{ title }}</h2>\n</article>'), []);
  assert.deepEqual(twigRules('<article class="ServiceCard">\n  <h2 class="ServiceCard-title is-active">{{ title }}</h2>\n</article>'), ['R04@L2']);
  assert.deepEqual(twigRules('{% block content %}\n\n<div class="ServiceCard ServiceCard-title"></div>\n{% endblock %}'), ['R03@L3']);
  assert.deepEqual(twigRules('<div class="ServiceCard" data-variant="primary"></div>'), ['R05@L1']);
});

test('Twig: comments are ignored and never shift line numbers', () => {
  assert.deepEqual(twigRules('{# <div class="is-open Bad--modifier"> #}\n<div class="ServiceCard"></div>'), []);
  assert.deepEqual(twigRules('{#\n  class="ServiceCard ServiceCard-title"\n#}\n<p class="ServiceCard-text is-open"></p>'), ['R04@L4']);
});

test('Twig: static classes stay checked inside conditional blocks', () => {
  // Conditional markup around the element.
  assert.deepEqual(twigRules('{% if featured %}\n  <span class="ServiceCard-badge is-new"></span>\n{% endif %}'), ['R04@L2']);
  // Conditional class inside the attribute.
  assert.deepEqual(twigRules('<div class="ServiceCard {% if open %}is-open{% endif %}"></div>'), ['R04@L1']);
  assert.deepEqual(twigRules('<div class="ServiceCard {% if featured %}ServiceCard-badge{% endif %}"></div>'), ['R03@L1']);
  // Exclusive branches each carry one ROCS class: compliant on every rendering path.
  assert.deepEqual(twigRules('<div class="{%- if featured -%}ServiceCardFeatured{%- else -%}ServiceCard{%- endif -%}"></div>'), []);
  assert.deepEqual(twigRules('<div class="A {% if a %}{% if b %}B{% endif %}{% else %}C D{% endif %}"></div>'), ['R03@L1']);
});

test('Twig: mixed attributes check static parts and never guess dynamic values', () => {
  assert.deepEqual(twigRules('<div class="ServiceCard {{ extra_classes }}"></div>'), []);
  assert.deepEqual(twigRules('<div class="ServiceCard ServiceCard-title {{ extra_classes }}"></div>'), ['R03@L1']);
  assert.deepEqual(twigRules('<div class="{{ classes|join(\' \') }}"></div>'), []);
  // A class glued to an expression is only known at render time.
  assert.deepEqual(twigRules('<div class="ServiceCard{{ suffix }} {{ prefix }}-title is-{{ state }}"></div>'), []);
  // Quotes and class-like text inside Twig syntax are not parsed as HTML.
  assert.deepEqual(twigRules('<div class="ServiceCard {{ open ? "is-open" : "" }}"></div>'), []);
  assert.deepEqual(twigRules('{% set markup = \'<b class="is-open">\' %}<div class="ServiceCard"></div>'), []);
});

test('CLI: discovers .twig and .html.twig templates and fails in strict mode', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rocs-twig-'));
  try {
    mkdirSync(join(dir, 'templates'));
    writeFileSync(join(dir, 'templates/service-card.html.twig'),
      '{# Composant #}\n<article class="ServiceCard {{ extra_classes }}">\n  <h2 class="ServiceCard-title">{{ title }}</h2>\n</article>\n');
    writeFileSync(join(dir, 'templates/macro.twig'), '<span class="ServiceCard-label"></span>\n');
    writeFileSync(join(dir, 'page.html'), '<main class="ServicePage"></main>');
    const args = ['--dir', dir, '--format', 'json'];
    const clean = spawnSync(process.execPath, [cli, ...args, '--strict'], { encoding: 'utf8' });
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    const report = JSON.parse(clean.stdout);
    assert.equal(report.stats.files, 3);
    assert.ok(report.reports.some(r => r.file.endsWith('service-card.html.twig')));
    assert.ok(report.reports.some(r => r.file.endsWith('macro.twig')));

    // A warning only: non-zero exit in strict mode, zero otherwise.
    writeFileSync(join(dir, 'templates/macro.twig'), '\n\n<span class="ServiceCard-label" data-variant="primary"></span>\n');
    assert.equal(spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' }).status, 0);
    const strict = spawnSync(process.execPath, [cli, ...args, '--strict'], { encoding: 'utf8' });
    assert.equal(strict.status, 1, strict.stdout);
    const github = spawnSync(process.execPath, [cli, '--dir', dir, '--format', 'github'], { encoding: 'utf8' });
    assert.match(github.stdout, /::warning file=[^,]*macro\.twig,line=3::ROCS \[R05\]/);

    // An error fails in every mode.
    writeFileSync(join(dir, 'templates/macro.twig'), '<span class="ServiceCard-label is-active"></span>\n');
    assert.equal(spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' }).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
