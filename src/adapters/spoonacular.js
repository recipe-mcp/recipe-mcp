/**
 * Spoonacular adapter.
 *
 * Free tier: 150 requests/day with an API key.
 * https://spoonacular.com/food-api
 *
 * Supports: search, getRecipe, random.
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';
import { configGetAdapter, configSetAdapter } from '../core/config.js';

const BASE = 'https://api.spoonacular.com';
const ADAPTER_KEY = 'spoonacular';

function getApiKey() {
  return configGetAdapter(ADAPTER_KEY, 'apiKey');
}

async function apiFetch(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Spoonacular: API key not set. Get a free key at spoonacular.com/food-api');
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('apiKey', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (res.status === 401 || res.status === 402) {
    throw new Error('Spoonacular: Invalid API key or quota exceeded.');
  }
  if (!res.ok) throw new Error(`Spoonacular: Request failed: ${res.status}`);
  return res.json();
}

function normalizeRecipe(r) {
  const ingredients = (r.extendedIngredients || []).map(i => i.original || i.name || '');
  const steps = [];
  for (const section of (r.analyzedInstructions || [])) {
    for (const step of (section.steps || [])) {
      steps.push(step.step);
    }
  }

  // If no analyzed instructions, try the HTML instructions field
  if (steps.length === 0 && r.instructions) {
    const cleaned = r.instructions.replace(/<[^>]+>/g, '');
    steps.push(...cleaned.split(/\.\s+/).filter(s => s.trim()));
  }

  const tags = [
    ...(r.dishTypes || []),
    ...(r.diets || []),
    ...(r.occasions || []),
  ];

  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.title || '',
    author: r.creditsText || r.sourceName || '',
    description: r.summary ? r.summary.replace(/<[^>]+>/g, '').slice(0, 300) : '',
    yieldText: r.servings ? `${r.servings} servings` : '',
    time: r.readyInMinutes ? `PT${r.readyInMinutes}M` : '',
    prepTime: r.preparationMinutes ? `PT${r.preparationMinutes}M` : '',
    cookTime: r.cookingMinutes ? `PT${r.cookingMinutes}M` : '',
    ingredients,
    steps,
    tags,
    image: r.image || '',
    rating: r.spoonacularScore ? Math.round(r.spoonacularScore / 20 * 10) / 10 : null,
    ratingCount: null,
    nutrition: r.nutrition?.nutrients
      ? Object.fromEntries(
          r.nutrition.nutrients.slice(0, 8).map(n => [n.name, `${n.amount}${n.unit}`])
        )
      : null,
    category: r.dishTypes?.[0] || '',
    cuisine: r.cuisines?.[0] || '',
    url: r.sourceUrl || `https://spoonacular.com/recipes/${r.title?.replace(/\s+/g, '-')}-${r.id}`,
  };
}

function recipeToSummary(r) {
  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.title || '',
    author: '',
    time: r.readyInMinutes ? `${r.readyInMinutes} min` : '',
    image: r.image || '',
    url: `https://spoonacular.com/recipes/${r.title?.replace(/\s+/g, '-')}-${r.id}`,
    kicker: null,
  };
}

export class SpoonacularAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Spoonacular'; }
  get requiresAuth() { return true; }

  get capabilities() {
    return new Set([
      Capabilities.SEARCH,
      Capabilities.GET_RECIPE,
      Capabilities.RANDOM,
    ]);
  }

  isReady() {
    return !!getApiKey();
  }

  setApiKey(key) {
    configSetAdapter(ADAPTER_KEY, 'apiKey', key);
  }

  async search(query, opts = {}) {
    const page = opts.page || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const data = await apiFetch('/recipes/complexSearch', {
      query,
      number: pageSize,
      offset,
      addRecipeInformation: false,
    });
    return {
      totalResults: data.totalResults || 0,
      recipes: (data.results || []).map(recipeToSummary),
    };
  }

  async getRecipe(id) {
    const recipeId = id.match(/(\d+)/)?.[1] || id;
    const data = await apiFetch(`/recipes/${recipeId}/information`, {
      includeNutrition: true,
    });
    return normalizeRecipe(data);
  }

  async getRandom() {
    const data = await apiFetch('/recipes/random', { number: 1 });
    if (!data.recipes?.[0]) throw new Error('Spoonacular: No random recipe returned');
    return normalizeRecipe(data.recipes[0]);
  }
}
