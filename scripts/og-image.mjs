/**
 * Generates public/og-default.png — the social preview card used for any page
 * without its own hero image.
 *
 * Run with: node scripts/og-image.mjs
 *
 * Satori is used for the text because it embeds glyphs as paths from a font
 * buffer we supply. Rendering text through sharp/librsvg instead falls back to a
 * default sans, since this environment has no fontconfig — so the card would not
 * be set in Atkinson.
 *
 * The mark is composited from the existing icon rather than redrawn, so it can
 * never drift from public/favicon.svg.
 */
import { readFile, writeFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 90;
const MARK = 132;

const BG = '#14140f';
const INK = '#e8e4d8';
const MUTED = '#8f8a7a';
const ACCENT = '#c9973f';

const [regular, bold] = await Promise.all([
	readFile('src/assets/fonts/atkinson-regular.woff'),
	readFile('src/assets/fonts/atkinson-bold.woff'),
]);

const el = (type, style, children) => ({ type, props: { style, children } });

const svg = await satori(
	el(
		'div',
		{
			width: WIDTH,
			height: HEIGHT,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'flex-end',
			backgroundColor: BG,
			padding: PAD,
			// Leaves room for the mark, composited in below.
			paddingTop: PAD + MARK,
		},
		[
			el('div', { display: 'flex', fontSize: 86, fontWeight: 700, color: INK }, 'Cihan Andac'),
			el(
				'div',
				{ display: 'flex', fontSize: 34, color: MUTED, marginTop: 18 },
				'Notes on software, systems and whatever else',
			),
			el('div', { display: 'flex', fontSize: 30, color: ACCENT, marginTop: 34 }, 'cihanandac.com'),
		],
	),
	{
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Atkinson', data: regular, weight: 400, style: 'normal' },
			{ name: 'Atkinson', data: bold, weight: 700, style: 'normal' },
		],
	},
);

const base = await sharp(Buffer.from(svg)).png().toBuffer();
const mark = await sharp('public/apple-touch-icon.png')
	.resize(MARK, MARK)
	.composite([
		{
			// Re-apply the rounded corners the touch icon deliberately omits.
			input: Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" width="${MARK}" height="${MARK}"><rect width="${MARK}" height="${MARK}" rx="27" fill="#fff"/></svg>`,
			),
			blend: 'dest-in',
		},
	])
	.png()
	.toBuffer();

const out = await sharp(base)
	.composite([{ input: mark, top: PAD, left: PAD }])
	.png()
	.toBuffer();

await writeFile('public/og-default.png', out);

const { width, height, size } = await sharp(out).metadata();
console.log(`wrote public/og-default.png — ${width}x${height}, ${(size / 1024).toFixed(1)}kB`);
