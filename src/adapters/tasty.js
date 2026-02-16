/**
 * Tasty (Buzzfeed) adapter via RapidAPI.
 *
 * Free tier on RapidAPI. Thousands of recipes with videos.
 * https://rapidapi.com/apidojo/api/tasty
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';
import { configGetAdapter, configSetAdapter } from '../core/config.js';

const BASE = 'https://tasty.p.rapidapi.com';
const ADAPTER_KEY = 'tasty';

function getApiKey() {
  return configGetAdapter(ADAPTER_KEY, 'rapidApiKey');
}

function getHeaders() {
  const key = getApiKey();
  if (!key) throw new Error('Tasty: RapidAPI key not set. Get one at rapidapi.com/apidojo/api/tasty');
  return {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'tasty.p.rapidapi.com',
  };
}

function normalize(r) {
  const ingredients = (r.sections || []).flatMap(s =>
    (s.components || []).map(c => c.raw_text || c.extra_comment || '')
  ).filter(Boolean);

  const steps = (r.instructions || [])
    .sort((a, b) => a.position - b.position)
    .map(s => s.display_text)
    .filter(Boolean);

  const tags = (r.tags || []).map(t => t.display_name).filter(Boolean);

  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.name || '',
    author: r.credits?.length ? r.credits[0].name || '' : '',
    description: r.description || '',
    yieldText: r.num_servings ? `${r.num_servings} servings` : '',
    time: r.total_time_minutes ? `PT${r.total_time_minutes}M` : '',
    prepTime: r.prep_time_minutes ? `PT${r.prep_time_minutes}M` : '',
    cookTime: r.cook_time_minutes ? `PT${r.cook_time_minutes}M` : '',
    ingredients,
    steps,
    tags,
    image: r.thumbnail_url || '',
    rating: r.user_ratings?.score ? Math.round(r.user_ratings.score * 50) / 10 : null,
    ratingCount: r.user_ratings?.count_positive || null,
    nutrition: r.nutrition
      ? {
          calories: `${r.nutrition.calories}`,
          fat: `${r.nutrition.fat}g`,
          carbs: `${r.nutrition.carbohydrates}g`,
          protein: `${r.nutrition.protein}g`,
          fiber: `${r.nutrition.fiber}g`,
          sugar: `${r.nutrition.sugar}g`,
        }
      : null,
    category: r.tags?.find(t => t.type === 'meal')?.display_name || '',
    cuisine: r.tags?.find(t => t.type === 'cuisine')?.display_name || '',
    url: r.original_video_url || `https://tasty.co/recipe/${r.slug || r.id}`,
  };
}

function toSummary(r) {
  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.name || '',
    author: '',
    time: r.total_time_minutes ? `${r.total_time_minutes} min` : '',
    image: r.thumbnail_url || '',
    url: `https://tasty.co/recipe/${r.slug || r.id}`,
    kicker: r.tags?.find(t => t.type === 'cuisine')?.display_name || null,
  };
}

export class TastyAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Tasty'; }
  get requiresAuth() { return true; }

  get capabilities() {
    return new Set([Capabilities.SEARCH, Capabilities.GET_RECIPE]);
  }

  isReady() {
    return !!getApiKey();
  }

  setApiKey(key) {
    configSetAdapter(ADAPTER_KEY, 'rapidApiKey', key);
  }

  async search(query, opts = {}) {
    const from = ((opts.page || 1) - 1) * 20;
    const url = `${BASE}/recipes/list?from=${from}&size=20&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Tasty search failed: ${res.status}`);
    const data = await res.json();
    return {
      totalResults: data.count || 0,
      recipes: (data.results || []).filter(r => r.name).map(toSummary),
    };
  }

  async getRecipe(id) {
    const recipeId = id.match(/(\d+)/)?.[1] || id;
    const url = `${BASE}/recipes/get-more-info?id=${recipeId}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Tasty recipe lookup failed: ${res.status}`);
    const data = await res.json();
    return normalize(data);
  }
}
