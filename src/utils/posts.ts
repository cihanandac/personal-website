import { getCollection } from 'astro:content';

/**
 * Timezone the publish dates are written in.
 *
 * Frontmatter dates are date-only, so `2026-08-14` parses as `2026-08-14T00:00:00Z`.
 * Comparing that against `new Date()` would hide a post dated today for the first
 * couple of hours of a CEST day, when UTC is still on the previous date. Fixing
 * the zone also keeps behaviour identical locally and on the CI runner, which
 * builds in UTC.
 */
const AUTHORING_TIME_ZONE = 'Europe/Berlin';

/** Current day in the authoring timezone, as `YYYY-MM-DD`. */
function currentDay() {
	return new Intl.DateTimeFormat('en-CA', { timeZone: AUTHORING_TIME_ZONE }).format(new Date());
}

/** The calendar day a frontmatter date refers to, as `YYYY-MM-DD`. */
function dayOf(date: Date) {
	return date.toISOString().slice(0, 10);
}

/**
 * Blog posts that should appear on the site, newest first.
 *
 * A post dated later than today is treated as a draft and left out of the
 * production build entirely — the blog index, the home page, the RSS feed, the
 * sitemap, and its own permalink, which is never generated. Date a post today or
 * earlier to publish it.
 *
 * Future-dated posts stay visible under `astro dev` so you can preview them.
 *
 * Note that "today" is fixed at build time: a scheduled post appears on the next
 * build after its date arrives, not by itself.
 *
 * Every place that lists posts should go through this, so a scheduled post
 * cannot leak into one surface while being hidden from the others.
 */
export async function getPublishedPosts() {
	const today = currentDay();

	const posts = await getCollection(
		'blog',
		({ data }) => import.meta.env.DEV || dayOf(data.pubDate) <= today,
	);

	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
