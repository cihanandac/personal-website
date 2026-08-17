// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://cihanandac.com',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			// Gruvbox's warm ochres sit in the same family as the site accent.
			// Astro emits both themes at once; global.css activates the dark one
			// under prefers-color-scheme and pins the block background to
			// --surface so the theme's own background never fights the page.
			themes: {
				light: 'gruvbox-light-medium',
				dark: 'gruvbox-dark-medium',
			},
			wrap: false,
		},
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
