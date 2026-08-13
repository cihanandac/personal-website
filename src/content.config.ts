import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Sveltia CMS writes an empty string for optional fields left blank, and
   z.coerce.date('') produces an Invalid Date rather than undefined. Normalise
   blank values before they reach the validators. */
const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.preprocess(blankToUndefined, z.coerce.date().optional()),
			heroImage: z.preprocess(blankToUndefined, z.optional(image())),
		}),
});

export const collections = { blog };
