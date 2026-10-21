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
const docs = join(target, 'docs');
await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });

if (name === 'rocs') {
  await cp(join(root, 'docs'), docs, { recursive: true });
} else {
  await mkdir(join(docs, 'fr'), { recursive: true });
  const documents = [
    ['Framework SCSS — Bases conceptuelles.md', 'SPECIFICATION.md'],
    ['scss-framework-guide.md', 'GUIDE.md'],
    ['revue-contradictoire-invariants-framework-scss.md', 'REVIEW.md'],
  ];
  for (const [source, destination] of documents) {
    await copyFile(join(root, 'scss-rocs-framework', source), join(docs, 'fr', destination));
  }
}
await copyFile(join(root, 'LICENSE'), join(target, 'LICENSE'));