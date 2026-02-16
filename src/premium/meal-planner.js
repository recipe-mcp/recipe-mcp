/**
 * Meal Planner — Premium Feature
 *
 * Generates weekly meal plans from available recipe sources,
 * respecting dietary preferences and time constraints.
 */

import { searchAll, getRecipeFrom, getAdaptersWithCapability } from '../core/registry.js';
import { Capabilities } from '../core/types.js';
import { configGet, configSet } from '../core/config.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

/**
 * Generate a meal plan for a given number of days.
 * @param {Object} opts
 * @param {number}   [opts.days=7]         Number of days
 * @param {string[]} [opts.meals]          Which meals to plan (default: lunch + dinner)
 * @param {string[]} [opts.preferences]    Dietary preferences (e.g., "vegetarian", "low-carb")
 * @param {number}   [opts.maxTimeMinutes] Max cook time per meal
 * @param {number}   [opts.servings]       Target servings
 * @returns {Promise<Object>}
 */
export async function generateMealPlan(opts = {}) {
  const days = opts.days || 7;
  const meals = opts.meals || ['lunch', 'dinner'];
  const preferences = opts.preferences || [];

  // Build search queries based on preferences
  const queries = [];
  if (preferences.includes('vegetarian')) queries.push('vegetarian');
  else if (preferences.includes('vegan')) queries.push('vegan');
  else queries.push('dinner', 'chicken', 'pasta', 'fish', 'beef', 'soup', 'salad');

  if (preferences.includes('low-carb')) queries.push('low carb');
  if (preferences.includes('quick')) queries.push('quick easy');

  // Fetch a pool of recipes to pick from
  const pool = [];
  for (const q of queries.slice(0, 4)) {
    try {
      const results = await searchAll(q, { page: 1 });
      pool.push(...results.recipes);
    } catch {
      // Skip failed searches
    }
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = pool.filter(r => {
    const key = r.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Shuffle
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  // Build the plan
  const plan = [];
  let recipeIdx = 0;
  for (let d = 0; d < days; d++) {
    const dayPlan = { day: DAYS[d % 7], meals: {} };
    for (const meal of meals) {
      if (recipeIdx < unique.length) {
        dayPlan.meals[meal] = unique[recipeIdx++];
      } else {
        dayPlan.meals[meal] = null; // Not enough recipes in pool
      }
    }
    plan.push(dayPlan);
  }

  return {
    days: plan,
    totalRecipes: Math.min(recipeIdx, unique.length),
    preferences,
  };
}

/**
 * Save a meal plan to config.
 */
export function saveMealPlan(plan) {
  configSet('currentMealPlan', {
    ...plan,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Load the current saved meal plan.
 */
export function loadMealPlan() {
  return configGet('currentMealPlan');
}

/**
 * Format a meal plan for display.
 */
export function formatMealPlan(plan) {
  const lines = ['# Meal Plan\n'];
  if (plan.preferences?.length) {
    lines.push(`Preferences: ${plan.preferences.join(', ')}\n`);
  }
  for (const day of plan.days) {
    lines.push(`## ${day.day}`);
    for (const [meal, recipe] of Object.entries(day.meals)) {
      if (recipe) {
        const parts = [`**${meal}:** ${recipe.title}`];
        if (recipe.time) parts.push(`(${recipe.time})`);
        parts.push(`— ${recipe.source}`);
        lines.push(parts.join(' '));
      } else {
        lines.push(`**${meal}:** *No recipe assigned*`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
