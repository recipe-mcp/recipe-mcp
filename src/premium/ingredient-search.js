/**
 * Ingredient-Based Search — Premium Feature
 *
 * "What can I cook with what's in my fridge?"
 * Takes a list of ingredients the user has and finds recipes
 * that use them, ranked by how many ingredients match.
 */

import { searchAll, getAdaptersWithCapability } from '../core/registry.js';
import { Capabilities } from '../core/types.js';

/**
 * Normalize an ingredient name for matching.
 */
function normalize(ing) {
  return ing
    .toLowerCase()
    .replace(/\b(fresh|dried|frozen|canned|chopped|diced|minced|sliced|ground|whole|large|small|medium|organic|extra.?virgin)\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' ');
}

/**
 * Check if a recipe ingredient matches a user ingredient.
 */
function ingredientMatches(recipeIng, userIng) {
  const rNorm = normalize(recipeIng);
  const uNorm = normalize(userIng);

  // Exact match
  if (rNorm.includes(uNorm) || uNorm.includes(rNorm)) return true;

  // Word-level match (e.g., "chicken" matches "chicken breast")
  const uWords = uNorm.split(/\s+/);
  return uWords.some(w => rNorm.includes(w));
}

/**
 * Search for recipes using available ingredients.
 *
 * @param {string[]} ingredients - List of ingredients the user has
 * @param {Object} opts
 * @param {number} [opts.minMatch=2] - Minimum ingredient matches to include
 * @param {string} [opts.source] - Specific source to search
 * @returns {Promise<Object>}
 */
export async function searchByIngredients(ingredients, opts = {}) {
  const minMatch = opts.minMatch || 2;
  const normalizedUser = ingredients.map(i => i.trim()).filter(Boolean);

  if (normalizedUser.length === 0) {
    throw new Error('Please provide at least one ingredient.');
  }

  // Search for each ingredient to build a candidate pool
  const candidateMap = new Map(); // id+source → recipe data

  // Search top 3 ingredients (most likely to yield useful results)
  const searchTerms = normalizedUser.slice(0, 3);

  for (const term of searchTerms) {
    try {
      const results = await searchAll(term, { source: opts.source, page: 1 });
      for (const recipe of results.recipes) {
        const key = `${recipe.source}:${recipe.id}`;
        if (!candidateMap.has(key)) {
          candidateMap.set(key, recipe);
        }
      }
    } catch {
      // Skip failed searches
    }
  }

  // Also try a combined search
  if (normalizedUser.length >= 2) {
    try {
      const combined = normalizedUser.slice(0, 2).join(' ');
      const results = await searchAll(combined, { source: opts.source, page: 1 });
      for (const recipe of results.recipes) {
        const key = `${recipe.source}:${recipe.id}`;
        if (!candidateMap.has(key)) {
          candidateMap.set(key, recipe);
        }
      }
    } catch {
      // Skip
    }
  }

  const candidates = [...candidateMap.values()];

  // Score each candidate by how many user ingredients appear in the title/kicker
  // (We can't check full ingredient lists without fetching each recipe,
  //  but titles and kickers give us a good signal)
  const scored = candidates.map(recipe => {
    let matchCount = 0;
    const matched = [];

    for (const userIng of normalizedUser) {
      const titleMatch = normalize(recipe.title).includes(normalize(userIng));
      const kickerMatch = recipe.kicker && normalize(recipe.kicker).includes(normalize(userIng));

      if (titleMatch || kickerMatch) {
        matchCount++;
        matched.push(userIng);
      }
    }

    return { recipe, matchCount, matchedIngredients: matched };
  });

  // Sort by match count, then filter
  scored.sort((a, b) => b.matchCount - a.matchCount);

  // Lower the threshold if we don't have enough results
  const effectiveMin = Math.min(minMatch, 1);
  const filtered = scored.filter(s => s.matchCount >= effectiveMin);

  return {
    totalResults: filtered.length,
    userIngredients: normalizedUser,
    recipes: filtered.slice(0, 20).map(s => ({
      ...s.recipe,
      matchCount: s.matchCount,
      matchedIngredients: s.matchedIngredients,
    })),
  };
}

/**
 * Format ingredient search results for display.
 */
export function formatIngredientSearch(results) {
  const lines = [
    `# What Can I Cook?`,
    `Ingredients: ${results.userIngredients.join(', ')}`,
    `Found ${results.totalResults} recipes\n`,
  ];

  for (const r of results.recipes) {
    const matchInfo = r.matchedIngredients?.length
      ? ` (matches: ${r.matchedIngredients.join(', ')})`
      : '';
    lines.push(`**${r.title}**${matchInfo}`);
    if (r.time) lines.push(`Time: ${r.time}`);
    lines.push(`Source: ${r.source} — ${r.url}\n`);
  }

  return lines.join('\n');
}
