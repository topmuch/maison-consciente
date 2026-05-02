/**
 * PWA Icon Generator for Maellis — Maison Consciente
 *
 * Creates PNG icons at 192x192 and 512x512 (standard + maskable)
 * from the existing logo.svg using sharp.
 *
 * Usage: bun run scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(import.meta.dir, '..');
const PUBLIC = path.join(ROOT, 'public');
const SVG_SRC = path.join(PUBLIC, 'logo.svg');

// ─── Configuration ───
const SIZES = [192, 512];
const MASKABLE_PADDING = 0.4; // 40% safe area padding for maskable icons

/**
 * Reads the source SVG and returns a Buffer
 */
function getSourceSvg() {
  const svg = fs.readFileSync(SVG_SRC, 'utf-8');
  return Buffer.from(svg);
}

/**
 * Creates a maskable version of the SVG with 40% padding
 * The icon is drawn in the center 60% of the canvas
 */
function createMaskableSvg(size) {
  const viewBoxSize = 30;
  const padding = viewBoxSize * MASKABLE_PADDING; // 12
  const innerSize = viewBoxSize - padding * 2; // 6 → actually the icon area
  // For maskable, we want the icon in center with padding around it
  // Scale the existing SVG content to fit in the center 60%
  const scale = (viewBoxSize - padding * 2) / viewBoxSize; // 0.2 → too small
  // Better approach: use the full viewBox but embed in a larger container

  const paddedViewBox = viewBoxSize / (1 - MASKABLE_PADDING); // 50
  const offset = (paddedViewBox - viewBoxSize) / 2; // 10

  // Read the original SVG and modify viewBox + add transform
  const svg = fs.readFileSync(SVG_SRC, 'utf-8');

  // Replace the viewBox and add a transform to center the icon
  const modified = svg
    .replace(
      /viewBox="0 0 30 30"/,
      `viewBox="0 0 ${paddedViewBox} ${paddedViewBox}"`
    )
    .replace(
      /(<g>)/,
      `<g transform="translate(${offset}, ${offset})">`
    );

  return Buffer.from(modified);
}

/**
 * Converts SVG buffer to PNG at specified size
 */
async function svgToPng(svgBuffer, size, outputPath) {
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`  ✓ ${path.basename(outputPath)} (${size}x${size}) — ${(stats.size / 1024).toFixed(1)} KB`);
}

/**
 * Main
 */
async function main() {
  console.log('\n🎨 Maellis PWA Icon Generator\n');

  if (!fs.existsSync(SVG_SRC)) {
    console.error(`❌ Source SVG not found: ${SVG_SRC}`);
    process.exit(1);
  }

  const sourceSvg = getSourceSvg();
  console.log(`  Source: ${SVG_SRC} (${(sourceSvg.length / 1024).toFixed(1)} KB)\n`);

  for (const size of SIZES) {
    console.log(`  Generating ${size}x${size} icons...`);

    // Standard icon (any)
    const stdPath = path.join(PUBLIC, `icon-${size}.png`);
    await svgToPng(sourceSvg, size, stdPath);

    // Maskable icon
    const maskableSvg = createMaskableSvg(size);
    const maskablePath = path.join(PUBLIC, `icon-${size}-maskable.png`);
    await svgToPng(maskableSvg, size, maskablePath);

    console.log('');
  }

  console.log('  ─────────────────────────────────');
  console.log('  ✅ All PWA icons generated!\n');
  console.log('  Files created:');
  for (const size of SIZES) {
    console.log(`    • public/icon-${size}.png (standard)`);
    console.log(`    • public/icon-${size}-maskable.png (maskable)`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
