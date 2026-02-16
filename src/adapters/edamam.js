/**
 * Edamam Recipe Search adapter.
 *
 * Free tier available with API key + app ID.
 * 2M+ recipes with full nutrition analysis.
 * https://developer.edamam.com/edamam-docs-recipe-api
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';
import { configGetAdapter, configSetAdapter } from '../core/config.js';

const BASE = 'https://api.edamam.com/api/recipes/v2';
const ADAPTER_KEY = 'edamam';

function getCredentials() {
  return {
    appId: configGetAdapter(ADAPTER_KEY, 'appId'),
    appKey: configGetAdapter(ADAPTER_KEY, 'appKey'),
  };
}

function normalizeHit(hit) {
  const r = hit.recipe;
  const id = r.uri?.split('#recipe_')[1] || '';

  const steps = [];
  // Edamam doesn't always return instructions — note this in output
  if (r.instructionLines?.length) {
    steps.push(...r.instructionLines);
  } else if (r.url) {
    steps.push(`Full instructions available at: ${r.url}`);
  }

  const nutrition = {};
  if (r.totalNutrients) {
    for (const [, n] of Object.entries(r.totalNutrients)) {
      if (['Energy', 'Fat', 'Carbs', 'Protein', 'Fiber'].some(k => n.label?.includes(k))) {
        nutrition[n.label] = `${Math.round(n.quantity)}${n.unit}`;
      }
    }
  }

  return {
    id,
    source: ADAPTER_KEY,
    title: r.label || '',
    author: r.source || '',
    description: '',
    yieldText: r.yield ? `${r.yield} servings` : '',
    time: r.totalTime ? `PT${r.totalTime}M` : '',
    prepTime: '',
    cookTime: '',
    ingredients: r.ingredientLines || [],
    steps,
    tags: [
      ...(r.cuisineType || []),
      ...(r.mealType || []),
      ...(r.dishType || []),
      ...(r.dietLabels || []),
      ...(r.healthLabels?.slice(0, 5) || []),
    ],
    image: r.image || '',
    rating: null,
    ratingCount: null,
    nutrition: Object.keys(nutrition).length ? nutrition : null,
    category: r.dishType?.[0] || '',
    cuisine: r.cuisineType?.[0] || '',
    url: r.url || '',
  };
}

function hitToSummary(hit) {
  const r = hit.recipe;
  const id = r.uri?.split('#recipe_')[1] || '';
  return {
    id,
    source: ADAPTER_KEY,
    title: r.label || '',
    author: r.source || '',
    time: r.totalTime ? `${r.totalTime} min` : '',
    image: r.images?.THUMBNAIL?.url || r.image || '',
    url: r.url || '',
    kicker: r.cuisineType?.[0] || null,
  };
}

export class EdamamAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Edamam'; }
  get requiresAuth() { return true; }

  get capabilities() {
    return new Set([Capabilities.SEARCH, Capabilities.GET_RECIPE]);
  }

  isReady() {
    const { appId, appKey } = getCredentials();
    return !!(appId && appKey);
  }

  setCredentials(appId, appKey) {
    configSetAdapter(ADAPTER_KEY, 'appId', appId);
    configSetAdapter(ADAPTER_KEY, 'appKey', appKey);
  }

  async search(query, opts = {}) {
    const { appId, appKey } = getCredentials();
    if (!appId || !appKey) throw new Error('Edamam: App ID and API key not set.');

    const url = new URL(BASE);
    url.searchParams.set('type', 'public');
    url.searchParams.set('q', query);
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);

    const res = await fetch(url.toString());
    if (res.status === 401 || res.status === 403) {
      throw new Error('Edamam: Invalid credentials.');
    }
    if (!res.ok) throw new Error(`Edamam search failed: ${res.status}`);
    const data = await res.json();
    return {
      totalResults: data.count || 0,
      recipes: (data.hits || []).slice(0, 20).map(hitToSummary),
    };
  }

  async getRecipe(id) {
    const { appId, appKey } = getCredentials();
    if (!appId || !appKey) throw new Error('Edamam: App ID and API key not set.');

    const url = new URL(`${BASE}/${id}`);
    url.searchParams.set('type', 'public');
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Edamam recipe lookup failed: ${res.status}`);
    const data = await res.json();
    return normalizeHit({ recipe: data.recipe });
  }
}
