import fs from 'fs';
import path from 'path';

const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='; // 1x1 transparent PNG
const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = [
  'pwa-512x512.png',
  'pwa-192x192.png',
  'pwa-512x512-maskable.png',
  'apple-touch-icon.png'
];

for (const file of files) {
  const outPath = path.join(outDir, file);
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  console.log('Wrote', outPath);
}
