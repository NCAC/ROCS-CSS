import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

// Always resolve against this file, not npm's workspace-dependent cwd.
const root = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2];
if (!['rocs', 'sass-architecture'].includes(name)) {
  throw new Error('Expected package: rocs or sass-architecture');
}
const target = resolve(root, 'packages', name);

// @rocss/rocs ships a copy of the repository documentation. The documents of
// @rocss/sass-architecture are its own sources and are never regenerated.
if (name === 'rocs') {
  const docs = join(target, 'docs');
  await rm(docs, { recursive: true, force: true });
  await mkdir(docs, { recursive: true });
  await cp(join(root, 'docs'), docs, { recursive: true });
}
await copyFile(join(root, 'LICENSE'), join(target, 'LICENSE'));
