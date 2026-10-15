import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listArchitectureShotVariants } from '../server/architecture-shots.mjs';

test('single screenshots load and numbered screenshots override them in order', async (t) => {
  const publicDir = await mkdtemp(join(tmpdir(), 'architecture-shots-'));
  t.after(() => rm(publicDir, { recursive: true, force: true }));
  assert.deepEqual(await listArchitectureShotVariants(publicDir), {});

  const root = join(publicDir, 'architecture-shots');
  for (const folder of ['rcs', 'branded-calling', 'future-topic']) {
    await mkdir(join(root, folder), { recursive: true });
  }
  for (const name of [
    'rcs/1.png', 'rcs/1-10.png', 'rcs/1-2.jpg', 'rcs/1-1.png',
    'rcs/2.png', 'branded-calling/1.png', 'branded-calling/2-2.png', 'branded-calling/2-1.png',
    'future-topic/12-3.webp', 'future-topic/12-1.jpeg',
  ]) {
    await writeFile(join(root, name), '');
  }

  const variants = await listArchitectureShotVariants(publicDir);
  assert.deepEqual(variants['rcs/1'], [
    '/architecture-shots/rcs/1-1.png',
    '/architecture-shots/rcs/1-2.jpg',
    '/architecture-shots/rcs/1-10.png',
  ]);
  assert.deepEqual(variants['branded-calling/2'], [
    '/architecture-shots/branded-calling/2-1.png',
    '/architecture-shots/branded-calling/2-2.png',
  ]);
  assert.deepEqual(variants['future-topic/12'], [
    '/architecture-shots/future-topic/12-1.jpeg',
    '/architecture-shots/future-topic/12-3.webp',
  ]);
  assert.deepEqual(variants['rcs/2'], ['/architecture-shots/rcs/2.png']);
  assert.deepEqual(variants['branded-calling/1'], ['/architecture-shots/branded-calling/1.png']);
});
