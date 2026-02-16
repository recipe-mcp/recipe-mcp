/**
 * DummyJSON Recipes adapter.
 *
 * Completely free, no API key required. ~50 recipes.
 * Good for demos and testing; always available.
 * https://dummyjson.com/docs/recipes
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const BASE = 'https://dummyjson.com/recipes';
const ADAPTER_KEY = 'dummyjson';

function normalize(r) {
  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.name || '',
    author: '',
    description: '',
    yieldText: r.servings ? `${r.servings} servings` : '',
    time: r.cookTimeMinutes ? `PT${r.prepTimeMinutes + r.cookTimeMinutes}M` : '',
    prepTime: r.prepTimeMinutes ? `PT${r.prepTimeMinutes}M` : '',
    cookTime: r.cookTimeMinutes ? `PT${r.cookTimeMinutes}M` : '',
    ingredients: r.ingredients || [],
    steps: r.instructions || [],
    tags: [...(r.tags || []), ...(r.mealType || [])],
    image: r.image || '',
    rating: r.rating || null,
    ratingCount: r.reviewCount || null,
    nutrition: r.caloriesPerServing ? { calories: `${r.caloriesPerServing} kcal` } : null,
    category: r.mealType?.[0] || '',
    cuisine: r.cuisine || '',
    url: `https://dummyjson.com/recipes/${r.id}`,
  };
}

function toSummary(r) {
  return {
    id: String(r.id),
    source: ADAPTER_KEY,
    title: r.name || '',
    author: '',
    time: r.cookTimeMinutes ? `${r.prepTimeMinutes + r.cookTimeMinutes} min` : '',
    image: r.image || '',
    url: `https://dummyjson.com/recipes/${r.id}`,
    kicker: r.cuisine || null,
  };
}

export class DummyJsonAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'DummyJSON Recipes'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.SEARCH, Capabilities.GET_RECIPE, Capabilities.RANDOM]);
  }

  async search(query) {
    const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`DummyJSON search failed: ${res.status}`);
    const data = await res.json();
    return { totalResults: data.total || 0, recipes: (data.recipes || []).map(toSummary) };
  }

  async getRecipe(id) {
    const recipeId = id.match(/(\d+)/)?.[1] || id;
    const res = await fetch(`${BASE}/${recipeId}`);
    if (!res.ok) throw new Error(`DummyJSON lookup failed: ${res.status}`);
    const data = await res.json();
    return normalize(data);
  }

  async getRandom() {
    // DummyJSON has ~50 recipes, pick a random ID
    const id = Math.floor(Math.random() * 50) + 1;
    return this.getRecipe(String(id));
  }
}
