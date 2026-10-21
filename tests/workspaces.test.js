import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import * as sass from 'sass';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const names = ['rocs', 'sass-architecture', 'sass'];

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 10 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  return result.stdout;
}

test('Private root and pnpm lockfile match workspace manifests', () => {
  const manifest = readJson('package.json');
  const workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
  assert.equal(manifest.private, true);
  assert.match(manifest.packageManager, /^pnpm@\d+\.\d+\.\d+$/);
  assert.equal(manifest.workspaces, undefined, 'Workspaces are declared in pnpm-workspace.yaml');
  assert.match(workspace, /^packages:\n\s+- packages\/\*$/m);
  assert.ok(!existsSync(join(root, 'package-lock.json')), 'npm lockfile must not coexist with pnpm-lock.yaml');
  for (const name of names) {
    const pkg = readJson(`packages/${name}/package.json`);
    assert.equal(pkg.name, `@rocss/${name}`);
    // Root links each workspace so node_modules resolves @rocss/* for Sass and the CLI.
    assert.equal(manifest.devDependencies[`@rocss/${name}`], 'workspace:*');
    assert.match(lock, new RegExp(`^  packages/${name}:`, 'm'), `Missing lockfile importer: ${name}`);
  }
  assert.equal(readJson('packages/sass/package.json').private, true);
  // Consumers bring their own compiler; pkg: URLs require Dart Sass >= 1.71.0.
  const { peerDependencies, peerDependenciesMeta } = readJson('packages/sass/package.json');
  for (const compiler of ['sass', 'sass-embedded']) {
    assert.equal(peerDependencies[compiler], '>=1.71.0');
    assert.equal(peerDependenciesMeta[compiler].optional, true);
  }
});

test('Build and tarballs work outside the monorepo', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'rocs-packages-'));
  try {
    for (const name of ['rocs', 'sass-architecture']) {
      // Exercise cwd-independent builds, including paths with spaces in sources.
      run(process.execPath, [join(root, 'tools/build-package-docs.js'), name], temporary);
    }
    const pairs = [
      ['docs/fr/SPECIFICATION.md', 'packages/rocs/docs/fr/SPECIFICATION.md'],
      ['docs/en/SPECIFICATION.md', 'packages/rocs/docs/en/SPECIFICATION.md'],
      ['scss-rocs-framework/Framework SCSS — Bases conceptuelles.md',
        'packages/sass-architecture/docs/fr/SPECIFICATION.md'],
      ['scss-rocs-framework/scss-framework-guide.md',
        'packages/sass-architecture/docs/fr/GUIDE.md'],
      ['scss-rocs-framework/revue-contradictoire-invariants-framework-scss.md',
        'packages/sass-architecture/docs/fr/REVIEW.md'],
    ];
    for (const [source, destination] of pairs) {
      assert.equal(readFileSync(join(root, source), 'utf8'), readFileSync(join(root, destination), 'utf8'));
    }
    const archives = [];
    for (const name of names) {
      const packed = JSON.parse(run('pnpm', ['--filter', `@rocss/${name}`, 'pack', '--json',
        '--pack-destination', temporary]));
      const paths = packed.files.map(file => file.path);
      assert.ok(paths.includes('LICENSE'));
      if (name !== 'sass') {
        assert.ok(paths.includes('docs/fr/SPECIFICATION.md'));
      } else {
        for (const path of ['_index.scss', 'context/_index.scss', 'state/_index.scss',
          'scope/_index.scss', 'part/_index.scss', 'internal/_validate.scss']) {
          assert.ok(paths.includes(path), `Missing Sass source: ${path}`);
        }
      }
      if (name === 'sass-architecture') {
        assert.ok(paths.includes('bin/sass-architecture.js'));
        assert.ok(paths.includes('src/checker.js'));
      }
      if (name === 'rocs') {
        assert.ok(paths.includes('bin/rocs.js'));
        assert.ok(paths.includes('src/validator.js'));
        assert.ok(paths.includes('stylelint.config.json'));
        assert.ok(paths.includes('eslint-plugin.js'));
      }
      archives.push(packed.filename);
    }
    writeFileSync(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    // Consumers may use npm: install the pnpm-built archives with npm to check compatibility.
    run('npm', ['install', '--offline', '--ignore-scripts', '--legacy-peer-deps',
      '--no-audit', '--no-fund', ...archives], temporary);
    const imported = run(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { analyzeHtml } from '@rocss/rocs';
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      assert.deepEqual(analyzeHtml('<div class="ProductCard"></div>', 'test.html'), []);
      assert.ok(require.resolve('@rocss/rocs/stylelint').endsWith('stylelint.config.json'));
      assert.ok(require.resolve('@rocss/rocs/eslint-plugin').endsWith('eslint-plugin.js'));
      assert.ok(require.resolve('@rocss/sass-architecture/specification').endsWith('SPECIFICATION.md'));
      console.log('installed-ok');
    `], temporary);
    assert.equal(imported.trim(), 'installed-ok');
    // Resolve the installed archive, not the workspace or the original folder.
    for (const entry of ['', '/context', '/state', '/scope', '/part']) {
      assert.equal(sass.compileString(`@use "@rocss/sass${entry}";`, {
        loadPaths: [join(temporary, 'node_modules')],
      }).css, '');
    }
    const installedCss = sass.compileString(`
      @use "@rocss/sass/state";
      .ProductCard { @include state.pseudo-class("hover") { display: block; } }
    `, { loadPaths: [join(temporary, 'node_modules')], style: 'compressed' }).css;
    assert.equal(installedCss, '.ProductCard:hover{display:block}');
    const scopedCss = sass.compileString(`
      @use "@rocss/sass/scope";
      @use "@rocss/sass/state";
      .ProductCard-title {
        @include scope.ancestor('body[data-label="été"]') {
          @include state.pseudo-class("hover") { display: block; }
        }
      }
    `, { loadPaths: [join(temporary, 'node_modules')], style: 'compressed' }).css;
    assert.ok(scopedCss.includes(':where(.ProductCard-title):hover'), scopedCss);
    // Documented pkg: URLs resolve the installed archive through its `sass` export condition.
    const importers = [new sass.NodePackageImporter(temporary)];
    for (const entry of ['', '/context', '/state', '/scope', '/part']) {
      assert.equal(sass.compileString(`@use "pkg:@rocss/sass${entry}";`, { importers }).css, '');
    }
    const pkgCss = sass.compileString(`
      @use "pkg:@rocss/sass/state";
      .ProductCard { @include state.pseudo-class("hover") { display: block; } }
    `, { importers, style: 'compressed' }).css;
    assert.equal(pkgCss, '.ProductCard:hover{display:block}');
    const help = run(process.execPath, [join(temporary, 'node_modules/@rocss/rocs/bin/rocs.js'), '--help'], temporary);
    assert.match(help, /ROCS Validator/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});