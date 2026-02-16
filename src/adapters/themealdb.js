/**
 * TheMealDB adapter.
 *
 * Completely free, no API key required for the public API.
 * https://www.themealdb.com/api.php
 *
 * Supports: search, getRecipe, random.
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const BASE = 'https://www.themealdb.com/api/json/v1/1';
const ADAPTER_KEY = 'themealdb';

function normalizeMeal(meal) {
  // TheMealDB stores ingredients in strIngredient1..strIngredient20
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (ing) {
      ingredients.push(measure ? `${measure} ${ing}` : ing);
    }
  }

  // Steps are a single text blob; split on numbered steps or newlines
  const rawSteps = meal.strInstructions || '';
  const steps = rawSteps
    .split(/\r?\n/)
    .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(s => s.length > 0);

  const tags = meal.strTags
    ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    id: meal.idMeal,
    source: ADAPTER_KEY,
    title: meal.strMeal || '',
    author: '',
    description: '',
    yieldText: '',
    time: '',
    prepTime: '',
    cookTime: '',
    ingredients,
    steps,
    tags,
    image: meal.strMealThumb || '',
    rating: null,
    ratingCount: null,
    nutrition: null,
    category: meal.strCategory || '',
    cuisine: meal.strArea || '',
    url: `https://www.themealdb.com/meal/${meal.idMeal}`,
  };
}

function mealToSummary(meal) {
  return {
    id: meal.idMeal,
    source: ADAPTER_KEY,
    title: meal.strMeal || '',
    author: '',
    time: '',
    image: meal.strMealThumb || '',
    url: `https://www.themealdb.com/meal/${meal.idMeal}`,
    kicker: meal.strCategory || null,
  };
}

export class TheMealDbAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'TheMealDB'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([
      Capabilities.SEARCH,
      Capabilities.GET_RECIPE,
      Capabilities.RANDOM,
    ]);
  }

  async search(query, opts = {}) {
    const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`TheMealDB search failed: ${res.status}`);
    const data = await res.json();
    const meals = data.meals || [];
    return {
      totalResults: meals.length,
      recipes: meals.map(mealToSummary),
    };
  }

  async getRecipe(id) {
    // Accept either an ID or a URL
    const mealId = id.match(/\/meal\/(\d+)/)?.[1] || id;
    const res = await fetch(`${BASE}/lookup.php?i=${mealId}`);
    if (!res.ok) throw new Error(`TheMealDB lookup failed: ${res.status}`);
    const data = await res.json();
    if (!data.meals?.[0]) throw new Error(`TheMealDB: Recipe not found: ${mealId}`);
    return normalizeMeal(data.meals[0]);
  }

  async getRandom() {
    const res = await fetch(`${BASE}/random.php`);
    if (!res.ok) throw new Error(`TheMealDB random failed: ${res.status}`);
    const data = await res.json();
    if (!data.meals?.[0]) throw new Error('TheMealDB: No random recipe returned');
    return normalizeMeal(data.meals[0]);
  }
}
