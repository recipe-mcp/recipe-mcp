/**
 * Web Recipe adapter — JSON-LD recipe extractor.
 *
 * Extracts structured recipe data from ANY website that uses
 * Schema.org/Recipe JSON-LD markup. This covers most major recipe
 * sites including AllRecipes, Serious Eats, Simply Recipes,
 * Bon Appetit, Epicurious, Food Network, and thousands of food blogs.
 *
 * No API key required — just provide a URL.
 * This is the killer differentiator: "paste any recipe URL."
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const ADAPTER_KEY = 'web';

// ── HTML parsing (same approach as the NYT adapter) ──────────────────

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseJsonLd(html) {
  const regex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Handle @graph arrays (common in Yoast SEO plugin)
      if (data['@graph']) {
        const recipe = data['@graph'].find(
          d => d['@type'] === 'Recipe' || (Array.isArray(d['@type']) && d['@type'].includes('Recipe'))
        );
        if (recipe) return recipe;
      }

      const items = Array.isArray(data) ? data : [data];
      const recipe = items.find(
        d => d['@type'] === 'Recipe' || (Array.isArray(d['@type']) && d['@type'].includes('Recipe'))
      );
      if (recipe) return recipe;
    } catch {
      // skip invalid JSON-LD blocks
    }
  }
  return null;
}

function normalizeJsonLd(ld, url) {
  const instructions = (ld.recipeInstructions || []).map((step, i) => {
    if (typeof step === 'string') return step;
    if (step['@type'] === 'HowToSection') {
      // Handle grouped instructions
      return (step.itemListElement || []).map(s => s.text || s.name || '').join(' ');
    }
    return step.text || step.name || `Step ${i + 1}`;
  }).filter(Boolean);

  const tags = [];
  if (ld.keywords) {
    if (typeof ld.keywords === 'string') tags.push(...ld.keywords.split(',').map(s => s.trim()));
    else if (Array.isArray(ld.keywords)) tags.push(...ld.keywords);
  }
  if (ld.recipeCategory) {
    const cats = Array.isArray(ld.recipeCategory) ? ld.recipeCategory : [ld.recipeCategory];
    tags.push(...cats);
  }

  return {
    id: url,
    source: ADAPTER_KEY,
    title: ld.name || '',
    author: typeof ld.author === 'string' ? ld.author
      : Array.isArray(ld.author) ? ld.author.map(a => a.name || a).join(', ')
      : ld.author?.name || '',
    description: ld.description || '',
    yieldText: Array.isArray(ld.recipeYield) ? ld.recipeYield[0] : (ld.recipeYield || ''),
    time: ld.totalTime || '',
    prepTime: ld.prepTime || '',
    cookTime: ld.cookTime || '',
    ingredients: ld.recipeIngredient || [],
    steps: instructions,
    tags,
    image: typeof ld.image === 'string' ? ld.image
      : Array.isArray(ld.image) ? ld.image[0]?.url || ld.image[0] || ''
      : ld.image?.url || '',
    rating: ld.aggregateRating?.ratingValue
      ? parseFloat(ld.aggregateRating.ratingValue)
      : null,
    ratingCount: ld.aggregateRating?.ratingCount
      ? parseInt(ld.aggregateRating.ratingCount)
      : null,
    nutrition: ld.nutrition
      ? Object.fromEntries(
          Object.entries(ld.nutrition)
            .filter(([k]) => !k.startsWith('@'))
            .map(([k, v]) => [k.replace(/Content$/, ''), v])
        )
      : null,
    category: Array.isArray(ld.recipeCategory)
      ? ld.recipeCategory[0] || ''
      : (ld.recipeCategory || ''),
    cuisine: Array.isArray(ld.recipeCuisine)
      ? ld.recipeCuisine[0] || ''
      : (ld.recipeCuisine || ''),
    url,
  };
}

export class WebRecipeAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Web Recipe (any URL)'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.GET_RECIPE]);
  }

  /**
   * Fetch and extract recipe data from any URL with JSON-LD markup.
   * Works with AllRecipes, Serious Eats, Simply Recipes, Bon Appetit,
   * Epicurious, Food Network, King Arthur, Budget Bytes, Smitten Kitchen,
   * and thousands of other recipe sites and food blogs.
   */
  async getRecipe(url) {
    if (!url.startsWith('http')) {
      throw new Error('Web adapter requires a full URL (e.g., https://www.allrecipes.com/recipe/...)');
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Web: Failed to fetch ${url}: ${res.status}`);
    const html = await res.text();

    const ld = parseJsonLd(html);
    if (!ld) {
      throw new Error(
        `No recipe data found at ${url}. This site may not use Schema.org/Recipe markup.`
      );
    }

    return normalizeJsonLd(ld, url);
  }
}
