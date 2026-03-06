import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const src = process.argv[2] || 'assets/logo.svg';
if (!fs.existsSync(src)) throw new Error('Source logo not found: ' + src);

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  // maskable: center 432x432 on 512 canvas
  await sharp(src)
    .resize(432, 432, { fit: 'contain' })
    .png()
    .toBuffer()
    .then(buffer =>
      sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: buffer, gravity: 'center' }])
        .png()
        .toFile(path.join(outDir, 'pwa-512x512-maskable.png'))
    );

  // normal 512
  await sharp(src).resize(512, 512, { fit: 'contain' }).png().toFile(path.join(outDir, 'pwa-512x512.png'));

  // 192
  await sharp(src).resize(192, 192, { fit: 'contain' }).png().toFile(path.join(outDir, 'pwa-192x192.png'));

  // apple-touch-icon 180
  await sharp(src).resize(180, 180, { fit: 'contain' }).png().toFile(path.join(outDir, 'apple-touch-icon.png'));

  console.log('Icons generated to public/');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
