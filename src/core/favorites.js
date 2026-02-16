/**
 * Local favorites system.
 *
 * Stores saved recipes in the user's config file, works across all
 * recipe sources. Each favorite stores the recipe ID, source, title,
 * URL, and the date it was saved.
 *
 * Stored in: ~/.config/recipe-mcp/config.json under the "favorites" key.
 */

import { configGet, configSet } from './config.js';

const FAVORITES_KEY = 'favorites';

/**
 * Get all saved favorites.
 * @returns {Array<{id: string, source: string, title: string, url: string, savedAt: string}>}
 */
export function getFavorites() {
  return configGet(FAVORITES_KEY) || [];
}

/**
 * Save a recipe to favorites.
 * Deduplicates by id+source.
 *
 * @param {{id: string, source: string, title: string, url: string}} recipe
 * @returns {{success: boolean, message: string}}
 */
export function saveFavorite(recipe) {
  const favorites = getFavorites();

  const exists = favorites.some(
    f => f.id === recipe.id && f.source === recipe.source
  );
  if (exists) {
    return { success: false, message: `"${recipe.title}" is already in your favorites.` };
  }

  favorites.unshift({
    id: recipe.id,
    source: recipe.source,
    title: recipe.title,
    url: recipe.url,
    savedAt: new Date().toISOString(),
  });

  configSet(FAVORITES_KEY, favorites);
  return { success: true, message: `Saved "${recipe.title}" to favorites!` };
}

/**
 * Remove a recipe from favorites by id+source, or by index.
 *
 * @param {{id?: string, source?: string, index?: number}} opts
 * @returns {{success: boolean, message: string}}
 */
export function removeFavorite(opts) {
  const favorites = getFavorites();

  if (typeof opts.index === 'number') {
    if (opts.index < 0 || opts.index >= favorites.length) {
      return { success: false, message: `Invalid index: ${opts.index}. You have ${favorites.length} favorites.` };
    }
    const removed = favorites.splice(opts.index, 1)[0];
    configSet(FAVORITES_KEY, favorites);
    return { success: true, message: `Removed "${removed.title}" from favorites.` };
  }

  if (opts.id) {
    const idx = favorites.findIndex(
      f => f.id === opts.id && (!opts.source || f.source === opts.source)
    );
    if (idx === -1) {
      return { success: false, message: `Recipe not found in favorites.` };
    }
    const removed = favorites.splice(idx, 1)[0];
    configSet(FAVORITES_KEY, favorites);
    return { success: true, message: `Removed "${removed.title}" from favorites.` };
  }

  return { success: false, message: 'Provide either a recipe ID or an index to remove.' };
}

/**
 * Format favorites list for display.
 */
export function formatFavorites(favorites, page = 1) {
  if (!favorites.length) {
    return 'No saved favorites yet. Use `recipe_save` to save recipes you love!';
  }

  const perPage = 25;
  const start = (page - 1) * perPage;
  const pageItems = favorites.slice(start, start + perPage);
  const totalPages = Math.ceil(favorites.length / perPage);

  const lines = [`**Your Favorites** (${favorites.length} recipes)\n`];

  for (let i = 0; i < pageItems.length; i++) {
    const f = pageItems[i];
    const num = start + i + 1;
    const date = new Date(f.savedAt).toLocaleDateString();
    lines.push(`${num}. **${f.title}** — ${f.source}\n   ${f.url} (saved ${date})`);
  }

  if (totalPages > 1) {
    lines.push(`\nPage ${page} of ${totalPages}`);
  }

  return lines.join('\n');
}
