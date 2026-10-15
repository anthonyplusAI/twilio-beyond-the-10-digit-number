import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// A slide references a base such as "rcs/1". A single 1.png image appears by
// itself; numbered files like 1-1.png and 1-2.png replace it in order.
export async function listArchitectureShotVariants(publicDir) {
  const imageRoot = resolve(publicDir, 'architecture-shots');
  let folders;
  try {
    folders = await readdir(imageRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }

  const groups = new Map();
  const singles = new Map();
  const extensionOrder = ['png', 'jpg', 'jpeg', 'webp'];
  for (const folder of folders) {
    if (!folder.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/i.test(folder.name)) continue;
    const files = await readdir(resolve(imageRoot, folder.name), { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      const numbered = /^([1-9]\d*)-([1-9]\d*)\.(png|jpe?g|webp)$/i.exec(file.name);
      if (numbered) {
        const key = `${folder.name}/${numbered[1]}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          number: BigInt(numbered[2]),
          name: file.name,
          url: `/architecture-shots/${folder.name}/${file.name}`,
        });
        continue;
      }
      const single = /^([1-9]\d*)\.(png|jpe?g|webp)$/i.exec(file.name);
      if (!single) continue;
      const key = `${folder.name}/${single[1]}`;
      const priority = extensionOrder.indexOf(single[2].toLowerCase());
      const previous = singles.get(key);
      if (!previous || priority < previous.priority) {
        singles.set(key, {
          priority,
          url: `/architecture-shots/${folder.name}/${file.name}`,
        });
      }
    }
  }

  const manifest = {};
  for (const [key, shot] of singles) manifest[key] = [shot.url];
  for (const [key, shots] of groups) {
    shots.sort((a, b) => a.number < b.number ? -1 : a.number > b.number ? 1 : a.name.localeCompare(b.name));
    manifest[key] = shots.map((shot) => shot.url);
  }
  return manifest;
}
