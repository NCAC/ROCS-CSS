import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
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
  // Every package is publishable, public and stable: all three share one version
  // (Changesets `fixed` group) and publish under `latest`.
  const versions = new Set();
  for (const name of names) {
    const pkg = readJson(`packages/${name}/package.json`);
    assert.equal(pkg.private, undefined, `${name} must be publishable`);
    assert.equal(pkg.publishConfig.access, 'public');
    assert.equal(pkg.publishConfig.tag, undefined, `${name} must publish under latest`);
    assert.doesNotMatch(pkg.version, /-/, `${name} must not be a prerelease`);
    versions.add(pkg.version);
    for (const field of ['description', 'keywords', 'homepage', 'bugs', 'repository', 'license']) {
      assert.ok(pkg[field], `${name} is missing ${field}`);
    }
    assert.ok(pkg.files.includes('README.fr.md'), `${name} must ship its French README`);
    assert.ok(pkg.files.includes('CHANGELOG.md'), `${name} must ship its CHANGELOG`);
  }
  assert.equal(versions.size, 1, `Package versions must be synchronized: ${[...versions].join(', ')}`);
  assert.deepEqual(
    readJson('.changeset/config.json').fixed,
    [names.map(name => `@rocss/${name}`)],
    'Changesets must keep the three packages in one fixed group'
  );
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
      // Exercise cwd-independent builds.
      run(process.execPath, [join(root, 'tools/build-package-docs.js'), name], temporary);
    }
    const pairs = [
      ['docs/fr/SPECIFICATION.md', 'packages/rocs/docs/fr/SPECIFICATION.md'],
      ['docs/en/SPECIFICATION.md', 'packages/rocs/docs/en/SPECIFICATION.md'],
    ];
    for (const [source, destination] of pairs) {
      assert.equal(readFileSync(join(root, source), 'utf8'), readFileSync(join(root, destination), 'utf8'));
    }
    // The architecture documents are sources: building must keep them and never overwrite them.
    for (const document of ['SPECIFICATION.md', 'GUIDE.md', 'REVIEW.md']) {
      assert.ok(existsSync(join(root, 'packages/sass-architecture/docs/fr', document)), `Missing ${document}`);
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
    // Runtime dependencies of the archives (postcss-scss…) come from the npm cache or registry.
    run('npm', ['install', '--prefer-offline', '--ignore-scripts', '--legacy-peer-deps',
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
    const architecture = run(process.execPath,
      [join(temporary, 'node_modules/@rocss/sass-architecture/bin/sass-architecture.js'), '--help'], temporary);
    assert.match(architecture, /Sass Architecture Checker/);
    mkdirSync(join(temporary, 'tokens'));
    writeFileSync(join(temporary, 'tokens/_color.scss'), '$primary: #036;\n');
    run(process.execPath, [join(temporary, 'node_modules/@rocss/sass-architecture/bin/sass-architecture.js'),
      'check', temporary], temporary);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
test('Package README relative links resolve to files tracked by git', () => {
  // npm rewrites relative README links to GitHub URLs under the package
  // directory: generated, git-ignored copies (docs/, LICENSE) would 404 there.
  const tracked = new Set(
    spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split('\n').filter(Boolean)
  );
  const isTracked = path => tracked.has(path) || [...tracked].some(file => file.startsWith(`${path.replace(/\/$/, '')}/`));
  const broken = [];
  for (const name of names) {
    for (const readme of ['README.md', 'README.fr.md']) {
      const text = readFileSync(join(root, 'packages', name, readme), 'utf8');
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const path = target.split('#')[0];
        if (!path || /^[a-z]+:/i.test(path)) continue;
        const resolved = join('packages', name, path).replace(/\\/g, '/');
        if (!isTracked(resolved)) broken.push(`packages/${name}/${readme} → ${target}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});
