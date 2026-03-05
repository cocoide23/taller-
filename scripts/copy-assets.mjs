// scripts/copy-assets.mjs — copies static server assets after tsc compilation
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const items = [
  ['server/schema.sql', 'dist-server/schema.sql'],
];

for (const [src, dest] of items) {
  const dir = dest.split('/').slice(0, -1).join('/');
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(src, dest);
  console.log(`Copied: ${src} → ${dest}`);
}
