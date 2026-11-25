import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { analyzeHtml, analyzeScss, validateRocsClass } from '../packages/rocs/src/validator.js';

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