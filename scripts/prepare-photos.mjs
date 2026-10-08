/**
 * Klargjør bildene av Atlas for nettet.
 *
 *   1. Legg originalbildene i  photos-originals/   (mappen er git-ignorert)
 *   2. Kjør                    npm run photos
 *   3. Ferdige, rensede bilder havner i public/images/atlas/
 *
 * Skriptet
 *   - fjerner ALL metadata (EXIF, GPS-posisjon, kameramodell osv.),
 *   - roterer bildet riktig vei etter EXIF-orienteringen,
 *   - lager WebP i flere bredder (480/720/1080 px) for raske mobilnedlastinger,
 *   - lager en bitte liten uskarp forhåndsvisning som vises mens bildet lastes,
 *   - skriver src/generated/photo-manifest.json som nettsiden leser.
 */
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'photos-originals');
const outputDir = path.join(root, 'public', 'images', 'atlas');
const manifestPath = path.join(root, 'src', 'generated', 'photo-manifest.json');

const WIDTHS = [480, 720, 1080];
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  if (!existsSync(inputDir)) {
    console.error(`Fant ikke mappen ${path.relative(root, inputDir)}. Legg originalbildene der først.`);
    process.exit(1);
  }

  const files = (await readdir(inputDir)).filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()));
  if (files.length === 0) {
    console.error('Ingen bilder funnet i photos-originals/ (støtter .jpg, .jpeg, .png, .webp, .tif).');
    process.exit(1);
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });

  const manifest = {};

  for (const file of files.sort()) {
    const id = slugify(path.parse(file).name);
    const source = path.join(inputDir, file);

    // .rotate() uten argument = bruk EXIF-orientering. sharp fjerner metadata som standard.
    const base = sharp(source, { failOn: 'none' }).rotate();
    const { width: srcWidth, height: srcHeight } = await base.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);

    const widths = WIDTHS.filter((w) => w < srcWidth).concat(srcWidth >= WIDTHS.at(-1) ? [] : [srcWidth]);
    const uniqueWidths = [...new Set(widths.length ? widths : [srcWidth])].sort((a, b) => a - b);

    for (const w of uniqueWidths) {
      await base
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: w <= 480 ? 74 : 70, effort: 6, smartSubsample: true })
        .toFile(path.join(outputDir, `${id}-${w}.webp`));
    }

    const placeholder = await base.clone().resize({ width: 16 }).blur(0.6).webp({ quality: 40 }).toBuffer();

    manifest[id] = {
      width: srcWidth,
      height: srcHeight,
      widths: uniqueWidths,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    };

    console.log(`✓ ${file} → ${id} (${uniqueWidths.join(', ')} px)`);
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nSkrev ${path.relative(root, manifestPath)} med ${Object.keys(manifest).length} bilder.`);
  console.log('Husk å oppdatere src/config/invitation.ts hvis du har lagt til eller byttet navn på bilder.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
