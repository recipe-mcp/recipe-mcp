/**
 * Blog Search adapter — searches popular recipe blogs.
 *
 * Most major recipe blogs run on WordPress, which exposes a REST API
 * at /wp-json/wp/v2/posts?search=QUERY. This adapter searches across
 * a curated list of popular food blogs and returns results that can
 * be fetched in full via the Web Recipe (JSON-LD) adapter.
 *
 * Free tier — no API key required.
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const ADAPTER_KEY = 'blogs';

// Top recipe blogs by monthly traffic (WordPress REST API searchable)
// Curated for highest-traffic food blogs on the internet.
// Each has JSON-LD recipe markup on individual post pages.
// Sorted roughly by Similarweb/SEMrush traffic estimates.
const BLOGS = [
  // Tier 1: 10M+ monthly visits
  { name: 'Skinnytaste', domain: 'skinnytaste.com', wp: true },
  { name: 'Pinch of Yum', domain: 'pinchofyum.com', wp: true },
  { name: 'Half Baked Harvest', domain: 'halfbakedharvest.com', wp: true },
  { name: 'Sally\'s Baking Addiction', domain: 'sallysbakingaddiction.com', wp: true },
  { name: 'Damn Delicious', domain: 'damndelicious.net', wp: true },
  { name: 'Spend with Pennies', domain: 'spendwithpennies.com', wp: true },
  { name: 'RecipeTin Eats', domain: 'recipetineats.com', wp: true },
  { name: 'Natasha\'s Kitchen', domain: 'natashaskitchen.com', wp: true },
  { name: 'Budget Bytes', domain: 'budgetbytes.com', wp: true },
  { name: 'Cafe Delites', domain: 'cafedelites.com', wp: true },
  // Tier 2: 3-10M monthly visits
  { name: 'Gimme Some Oven', domain: 'gimmesomeoven.com', wp: true },
  { name: 'Minimalist Baker', domain: 'minimalistbaker.com', wp: true },
  { name: 'Cookie and Kate', domain: 'cookieandkate.com', wp: true },
  { name: 'Love and Lemons', domain: 'loveandlemons.com', wp: true },
  { name: 'Two Peas and Their Pod', domain: 'twopeasandtheirpod.com', wp: true },
  { name: 'Well Plated', domain: 'wellplated.com', wp: true },
  { name: 'Smitten Kitchen', domain: 'smittenkitchen.com', wp: true },
  { name: 'Downshiftology', domain: 'downshiftology.com', wp: true },
  { name: 'The Pioneer Woman', domain: 'thepioneerwoman.com', wp: true },
  { name: 'Ambitious Kitchen', domain: 'ambitiouskitchen.com', wp: true },
  { name: 'Oh She Glows', domain: 'ohsheglows.com', wp: true },
  { name: 'Dinner at the Zoo', domain: 'dinneratthezoo.com', wp: true },
  { name: 'Wholesomelicious', domain: 'wholesomelicious.com', wp: true },
  { name: 'The Recipe Critic', domain: 'therecipecritic.com', wp: true },
  { name: 'Cooking Classy', domain: 'cookingclassy.com', wp: true },
  // Also supports these major sites via JSON-LD (not WP searchable, but recipe_get works)
  { name: 'Delish', domain: 'delish.com', wp: false },
  { name: 'Taste of Home', domain: 'tasteofhome.com', wp: false },
  { name: 'Simply Recipes', domain: 'simplyrecipes.com', wp: false },
  { name: 'Serious Eats', domain: 'seriouseats.com', wp: false },
  { name: 'Bon Appetit', domain: 'bonappetit.com', wp: false },
  { name: 'Food Network', domain: 'foodnetwork.com', wp: false },
  { name: 'Epicurious', domain: 'epicurious.com', wp: false },
  { name: 'King Arthur Baking', domain: 'kingarthurbaking.com', wp: false },
];

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ').trim();
}

/**
 * Search a single WordPress blog via its REST API.
 */
async function searchWordPressBlog(blog, query, perPage = 3) {
  const url = `https://${blog.domain}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&per_page=${perPage}&_fields=id,title,link,excerpt,date`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const posts = await res.json();
    return posts.map(post => ({
      id: post.link,
      source: ADAPTER_KEY,
      title: stripHtml(post.title?.rendered || post.title),
      author: blog.name,
      url: post.link,
      time: '',
      kicker: blog.name,
    }));
  } catch {
    return [];
  }
}

export class BlogSearchAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Recipe Blogs (25+ popular sites)'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.SEARCH]);
  }

  /**
   * Get the list of supported blogs.
   */
  getBlogs() {
    return BLOGS;
  }

  /**
   * Search across all WordPress-based recipe blogs concurrently.
   * Returns combined results from all blogs that respond in time.
   */
  async search(query, opts = {}) {
    const wpBlogs = BLOGS.filter(b => b.wp);

    // Search all WordPress blogs concurrently (3 results each)
    const results = await Promise.allSettled(
      wpBlogs.map(blog => searchWordPressBlog(blog, query, 3))
    );

    const recipes = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length) {
        recipes.push(...r.value);
      }
    }

    // Sort by relevance — title contains query words
    const queryWords = query.toLowerCase().split(/\s+/);
    recipes.sort((a, b) => {
      const aScore = queryWords.filter(w => a.title.toLowerCase().includes(w)).length;
      const bScore = queryWords.filter(w => b.title.toLowerCase().includes(w)).length;
      return bScore - aScore;
    });

    const page = opts.page || 1;
    const perPage = 20;
    const start = (page - 1) * perPage;
    const pageRecipes = recipes.slice(start, start + perPage);

    return {
      totalResults: recipes.length,
      recipes: pageRecipes,
    };
  }
}
