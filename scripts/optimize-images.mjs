import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const imagesDir = path.join(root, 'public/images');
const ogDir = path.join(imagesDir, 'og');
const manifestOut = path.join(root, 'shared/mediaManifest.js');

function identify(filePath) {
  const out = execFileSync('identify', ['-format', '%w %h', filePath], { encoding: 'utf8' }).trim();
  const [width, height] = out.split(/\s+/).map(Number);
  return { width, height };
}

function convert(args) {
  execFileSync('convert', args, { stdio: 'inherit' });
}

const OG_CARDS = [
  {
    file: 'og-default.jpg',
    photo: 'street-wide.jpg',
    eyebrow: 'CALABAR · CROSS RIVER STATE',
    title: 'DigiTrans Logistics',
    subtitle: 'Delivery, market runs & waybills in Calabar',
  },
  {
    file: 'og-services.jpg',
    photo: 'hero-courier.jpg',
    eyebrow: 'DOOR-TO-DOOR & BUSINESS DISPATCH',
    title: 'Local Delivery, Market Runs & Waybills',
    subtitle: 'Same-day Calabar dispatch, student drops & tracked intercity parcels',
  },
  {
    file: 'og-cities.jpg',
    photo: 'hero-coastal-logistics.jpg',
    eyebrow: 'CITY COVERAGE',
    title: 'Calabar, Port Harcourt & Obudu',
    subtitle: 'Local Calabar zones & Cross River / Niger Delta parcel corridors',
  },
  {
    file: 'og-routes.jpg',
    photo: 'waybill.jpg',
    eyebrow: 'INTERCITY PARCEL CORRIDORS',
    title: 'Calabar ↔ Port Harcourt & Obudu',
    subtitle: 'Tracked intercity waybills with intake verification & live status updates',
  },
  {
    file: 'og-pricing.jpg',
    photo: 'market-run.jpg',
    eyebrow: 'CLEAR FARE CALCULATION',
    title: 'Transparent Delivery & Waybill Estimates',
    subtitle: 'See server-calculated local, Market Run & intercity charges before booking',
  },
  {
    file: 'og-guides.jpg',
    photo: 'handover.jpg',
    eyebrow: 'LOGISTICS GUIDES & ANSWERS',
    title: 'Calabar Delivery & Waybill Guides',
    subtitle: 'Practical checklists for Market Runs, packaging, UNICAL drops & tracking',
  },
];

async function generateWebpAssets() {
  const entries = await fs.readdir(imagesDir, { withFileTypes: true });
  const manifest = {};

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(jpe?g|png)$/i.test(entry.name)) continue;
    const srcPath = path.join(imagesDir, entry.name);
    const publicSrc = `/images/${entry.name}`;
    const stem = entry.name.replace(/\.[^.]+$/, '');
    const { width, height } = identify(srcPath);

    const webpPath = path.join(imagesDir, `${stem}.webp`);
    convert([srcPath, '-auto-orient', '-strip', '-quality', '82', webpPath]);

    const item = {
      src: publicSrc,
      width,
      height,
      webp: `/images/${stem}.webp`,
    };

    if (width > 640 && !entry.name.startsWith('Digitrans_')) {
      const w640Path = path.join(imagesDir, `${stem}-640w.webp`);
      convert([srcPath, '-auto-orient', '-strip', '-resize', '640x>', '-quality', '80', w640Path]);
      item.w640 = `/images/${stem}-640w.webp`;
    }
    if (width > 1200 && !entry.name.startsWith('Digitrans_')) {
      const w1200Path = path.join(imagesDir, `${stem}-1200w.webp`);
      convert([srcPath, '-auto-orient', '-strip', '-resize', '1200x>', '-quality', '82', w1200Path]);
      item.w1200 = `/images/${stem}-1200w.webp`;
    }
    manifest[publicSrc] = item;
  }

  return manifest;
}

async function generateOgCards(manifest) {
  await fs.mkdir(ogDir, { recursive: true });
  const logoSrc = path.join(imagesDir, 'Digitrans_App_Icon.jpeg');

  for (const card of OG_CARDS) {
    const bgSrc = path.join(imagesDir, card.photo);
    const outPath = path.join(ogDir, card.file);
    // Compose clean 1200x630 social card: photo right, deep navy left scrim, teal badge, crisp typography
    convert([
      bgSrc,
      '-auto-orient',
      '-resize', '1200x630^',
      '-gravity', 'center',
      '-extent', '1200x630',
      '(',
        '-size', '1200x630',
        'gradient:#081c2a70-#0b1b2b40',
      ')',
      '-compose', 'over',
      '-composite',
      '(',
        '-size', '1200x630',
        'xc:none',
        '-fill', '#0b1b2be8',
        '-draw', 'rectangle 0,0 740,630',
        '-fill', '#0e7c8b',
        '-draw', 'rectangle 72,64 114,70',
      ')',
      '-compose', 'over',
      '-composite',
      '(',
        logoSrc,
        '-resize', '64x64',
      ')',
      '-gravity', 'NorthWest',
      '-geometry', '+72+96',
      '-compose', 'over',
      '-composite',
      '-font', 'DejaVu-Sans-Bold',
      '-pointsize', '20',
      '-fill', '#66d6df',
      '-annotate', '+156+114', 'DIGITRANS LOGISTICS',
      '-font', 'DejaVu-Sans-Bold',
      '-pointsize', '17',
      '-fill', '#ffd0ba',
      '-annotate', '+156+142', card.eyebrow,
      '-font', 'DejaVu-Sans-Bold',
      '-pointsize', '46',
      '-fill', '#ffffff',
      '-size', '620x190',
      '-background', 'none',
      '-gravity', 'NorthWest',
      `caption:${card.title}`,
      '-geometry', '+72+205',
      '-compose', 'over',
      '-composite',
      '-font', 'DejaVu-Sans',
      '-pointsize', '24',
      '-fill', '#d5e4e8',
      '-size', '620x140',
      '-background', 'none',
      `caption:${card.subtitle}`,
      '-geometry', '+72+380',
      '-compose', 'over',
      '-composite',
      '-font', 'DejaVu-Sans-Bold',
      '-pointsize', '18',
      '-fill', '#9ac4cb',
      '-annotate', '+72+548', 'www.digitransdelivery.com  ·  Calabar, Cross River State',
      '-strip',
      '-quality', '86',
      outPath,
    ]);

    const { width, height } = identify(outPath);
    manifest[`/images/og/${card.file}`] = {
      src: `/images/og/${card.file}`,
      width,
      height,
    };
  }
}

async function main() {
  const manifest = await generateWebpAssets();
  await generateOgCards(manifest);
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  const content = `// Auto-generated by scripts/optimize-images.mjs\nexport const MEDIA_MANIFEST = Object.freeze(${JSON.stringify(sorted, null, 2)});\n`;
  await fs.writeFile(manifestOut, content);
  console.log(`Generated ${Object.keys(sorted).length} media entries into shared/mediaManifest.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
