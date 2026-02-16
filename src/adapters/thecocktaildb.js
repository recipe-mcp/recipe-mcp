/**
 * TheCocktailDB adapter.
 *
 * Free, no API key required. Covers cocktails and drinks.
 * https://www.thecocktaildb.com/api.php
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const BASE = 'https://www.thecocktaildb.com/api/json/v1/1';
const ADAPTER_KEY = 'thecocktaildb';

function normalizeDrink(drink) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`]?.trim();
    const measure = drink[`strMeasure${i}`]?.trim();
    if (ing) ingredients.push(measure ? `${measure} ${ing}` : ing);
  }

  const rawSteps = drink.strInstructions || '';
  const steps = rawSteps
    .split(/\.\s+/)
    .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(s => s.length > 2);

  const tags = [];
  if (drink.strTags) tags.push(...drink.strTags.split(',').map(t => t.trim()).filter(Boolean));
  if (drink.strCategory) tags.push(drink.strCategory);
  if (drink.strAlcoholic) tags.push(drink.strAlcoholic);

  return {
    id: drink.idDrink,
    source: ADAPTER_KEY,
    title: drink.strDrink || '',
    author: '',
    description: '',
    yieldText: drink.strGlass ? `Served in: ${drink.strGlass}` : '',
    time: '',
    prepTime: '',
    cookTime: '',
    ingredients,
    steps,
    tags,
    image: drink.strDrinkThumb || '',
    rating: null,
    ratingCount: null,
    nutrition: null,
    category: drink.strCategory || 'Cocktail',
    cuisine: drink.strAlcoholic || '',
    url: `https://www.thecocktaildb.com/drink/${drink.idDrink}`,
  };
}

function drinkToSummary(drink) {
  return {
    id: drink.idDrink,
    source: ADAPTER_KEY,
    title: drink.strDrink || '',
    author: '',
    time: '',
    image: drink.strDrinkThumb || '',
    url: `https://www.thecocktaildb.com/drink/${drink.idDrink}`,
    kicker: drink.strCategory || null,
  };
}

export class TheCocktailDbAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'TheCocktailDB'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.SEARCH, Capabilities.GET_RECIPE, Capabilities.RANDOM]);
  }

  async search(query) {
    const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`TheCocktailDB search failed: ${res.status}`);
    const data = await res.json();
    const drinks = data.drinks || [];
    return { totalResults: drinks.length, recipes: drinks.map(drinkToSummary) };
  }

  async getRecipe(id) {
    const drinkId = id.match(/\/drink\/(\d+)/)?.[1] || id;
    const res = await fetch(`${BASE}/lookup.php?i=${drinkId}`);
    if (!res.ok) throw new Error(`TheCocktailDB lookup failed: ${res.status}`);
    const data = await res.json();
    if (!data.drinks?.[0]) throw new Error(`TheCocktailDB: Drink not found: ${drinkId}`);
    return normalizeDrink(data.drinks[0]);
  }

  async getRandom() {
    const res = await fetch(`${BASE}/random.php`);
    if (!res.ok) throw new Error(`TheCocktailDB random failed: ${res.status}`);
    const data = await res.json();
    if (!data.drinks?.[0]) throw new Error('TheCocktailDB: No random drink returned');
    return normalizeDrink(data.drinks[0]);
  }
}
