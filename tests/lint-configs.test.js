import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { Linter } from 'eslint';
import stylelint from 'stylelint';
import config from '../packages/rocs/eslint.config.js';
import plugin, { DEFAULT_ALLOWED_PREFIXES } from '../packages/rocs/eslint-plugin.js';
import legacyConfig from '../eslint.config.js';

test('ESLint config parses JSX and reports the ROCS one-class rule', () => {
  assert.equal(legacyConfig, config);
  const linter = new Linter();
  const valid = linter.verify('export default function View() { return <div className="ProductCard" />; }',
    config, { filename: 'view.jsx' });
  assert.deepEqual(valid, []);
  const invalid = linter.verify('export default function View() { return <div className="ProductCard ProductCard-title" />; }',
    config, { filename: 'view.jsx' });
  assert.ok(invalid.some(issue => issue.ruleId === 'rocs/class-naming'));
  assert.ok(invalid.every(issue => !issue.fatal));
});

test('Shared ESLint config only enables ROCS rules on JSX/TSX files', () => {
  // No ESLint core rules leak into consumer projects (no js.configs.recommended).
  assert.deepEqual(config.map(entry => entry.files), [['**/*.jsx', '**/*.tsx']]);
  const linter = new Linter();
  const messages = linter.verify('const unused = 1; export default () => <div className="ProductCard" />;',
    config, { filename: 'view.jsx' });
  assert.deepEqual(messages, []);
});

test('ESLint plugin is exported on its own for custom configurations', () => {
  assert.equal(config[0].plugins.rocs, plugin);
  assert.deepEqual(Object.keys(plugin.rules).sort(), ['class-naming', 'no-state-classes']);
  const linter = new Linter();
  const messages = linter.verify('export default () => <div className="is-open" />;', [{
    files: ['**/*.jsx'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { rocs: plugin },
    rules: { 'rocs/no-state-classes': 'warn' },
  }], { filename: 'view.jsx' });
  assert.deepEqual(messages.map(m => [m.ruleId, m.severity]), [['rocs/no-state-classes', 1]]);
});

test('Non-ROCS prefixes are configurable through shared settings', () => {
  const linter = new Linter();
  const lint = (className, settings) => linter.verify(
    `export default () => <div className="${className}" />;`,
    settings ? [...config, { settings: { rocs: settings } }] : config,
    { filename: 'view.jsx' },
  ).map(message => message.ruleId);
  assert.ok(DEFAULT_ALLOWED_PREFIXES.includes('swiper-'));
  // Defaults: framework classes are ignored by both rules, even BEM-like state suffixes.
  assert.deepEqual(lint('ProductCard v-cloak swiper-slide--active'), []);
  assert.deepEqual(lint('ProductCard ais-Hits'), ['rocs/class-naming']);
  // Added prefixes extend the defaults.
  assert.deepEqual(lint('ProductCard ais-Hits v-cloak', { allowedPrefixes: ['ais-'] }), []);
  // Defaults can be dropped entirely.
  assert.deepEqual(lint('ProductCard v-cloak', { allowedPrefixes: ['ais-'], useDefaultPrefixes: false }),
    ['rocs/class-naming']);
  // ROCS classes and state classes stay checked.
  assert.deepEqual(lint('is-open', { allowedPrefixes: ['ais-'] }).sort(),
    ['rocs/class-naming', 'rocs/no-state-classes']);
  assert.throws(() => lint('ProductCard', { allowedPrefixes: 'ais-' }), /allowedPrefixes/);
  assert.throws(() => lint('ProductCard', { useDefaultPrefixes: 'no' }), /useDefaultPrefixes/);
});

test('Root Stylelint wrapper retains packaged naming checks', async () => {
  const configFile = fileURLToPath(new URL('../.stylelintrc.json', import.meta.url));
  const valid = await stylelint.lint({ code: '.ProductCard-title { display: block; }', configFile });
  assert.equal(valid.errored, false, JSON.stringify(valid.results));
  const invalid = await stylelint.lint({ code: '.invalid-class { display: block; }', configFile });
  assert.ok(invalid.results.some(result => result.warnings.some(issue => issue.rule === 'selector-class-pattern')));
});