/**
 * Local favorites system with notes and tags.
 *
 * Stores saved recipes in the user's config file, works across all
 * recipe sources. Each favorite stores the recipe ID, source, title,
 * URL, tags, notes, and the date it was saved.
 *
 * Stored in: ~/.config/recipe-mcp/config.json under the "favorites" key.
 */

import { configGet, configSet } from './config.js';

const FAVORITES_KEY = 'favorites';

/**
 * Get all saved favorites.
 */
export function getFavorites() {
  return configGet(FAVORITES_KEY) || [];
}

/**
 * Save a recipe to favorites.
 * Deduplicates by id+source.
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
    tags: recipe.tags || [],
    notes: recipe.notes || '',
    savedAt: new Date().toISOString(),
  });

  configSet(FAVORITES_KEY, favorites);
  return { success: true, message: `Saved "${recipe.title}" to favorites!` };
}

/**
 * Remove a recipe from favorites by id+source, or by index.
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
 * Add or update a note on a favorite recipe.
 */
export function addNote(opts) {
  const favorites = getFavorites();
  const fav = findFavorite(favorites, opts);
  if (!fav) return { success: false, message: 'Recipe not found in favorites. Save it first!' };

  fav.notes = opts.note;
  fav.notedAt = new Date().toISOString();
  configSet(FAVORITES_KEY, favorites);
  return { success: true, message: `Note ${fav.notes ? 'updated' : 'added'} on "${fav.title}".` };
}

/**
 * Add tags to a favorite recipe.
 */
export function addTags(opts) {
  const favorites = getFavorites();
  const fav = findFavorite(favorites, opts);
  if (!fav) return { success: false, message: 'Recipe not found in favorites. Save it first!' };

  if (!fav.tags) fav.tags = [];
  const newTags = opts.tags.filter(t => !fav.tags.includes(t.toLowerCase()));
  fav.tags.push(...newTags.map(t => t.toLowerCase()));
  configSet(FAVORITES_KEY, favorites);
  return { success: true, message: `Added tags [${newTags.join(', ')}] to "${fav.title}". All tags: [${fav.tags.join(', ')}]` };
}

/**
 * Remove tags from a favorite recipe.
 */
export function removeTags(opts) {
  const favorites = getFavorites();
  const fav = findFavorite(favorites, opts);
  if (!fav) return { success: false, message: 'Recipe not found in favorites.' };

  if (!fav.tags) return { success: true, message: 'No tags to remove.' };
  const before = fav.tags.length;
  fav.tags = fav.tags.filter(t => !opts.tags.map(x => x.toLowerCase()).includes(t));
  configSet(FAVORITES_KEY, favorites);
  return { success: true, message: `Removed ${before - fav.tags.length} tags from "${fav.title}".` };
}

/**
 * Search favorites by tag.
 */
export function searchByTag(tag) {
  const favorites = getFavorites();
  return favorites.filter(f => f.tags?.includes(tag.toLowerCase()));
}

/**
 * Get all unique tags across favorites.
 */
export function getAllTags() {
  const favorites = getFavorites();
  const tagSet = new Set();
  for (const f of favorites) {
    if (f.tags) f.tags.forEach(t => tagSet.add(t));
  }
  return [...tagSet].sort();
}

/**
 * Helper: find a favorite by index or id+source.
 */
function findFavorite(favorites, opts) {
  if (typeof opts.index === 'number') {
    return favorites[opts.index] || null;
  }
  if (opts.id) {
    return favorites.find(f => f.id === opts.id && (!opts.source || f.source === opts.source)) || null;
  }
  return null;
}

/**
 * Format favorites list for display.
 */
export function formatFavorites(favorites, page = 1, tag = null) {
  let filtered = favorites;
  if (tag) {
    filtered = favorites.filter(f => f.tags?.includes(tag.toLowerCase()));
  }

  if (!filtered.length) {
    if (tag) return `No favorites with tag "${tag}". Use \`recipe_tag\` to tag your saved recipes.`;
    return 'No saved favorites yet. Use `recipe_save` to save recipes you love!';
  }

  const perPage = 25;
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const header = tag
    ? `**Favorites tagged "${tag}"** (${filtered.length} recipes)\n`
    : `**Your Favorites** (${filtered.length} recipes)\n`;
  const lines = [header];

  for (let i = 0; i < pageItems.length; i++) {
    const f = pageItems[i];
    const num = start + i + 1;
    const date = new Date(f.savedAt).toLocaleDateString();
    const tags = f.tags?.length ? ` [${f.tags.join(', ')}]` : '';
    const note = f.notes ? `\n   📝 ${f.notes}` : '';
    lines.push(`${num}. **${f.title}** — ${f.source}${tags}\n   ${f.url} (saved ${date})${note}`);
  }

  if (totalPages > 1) {
    lines.push(`\nPage ${page} of ${totalPages}`);
  }

  return lines.join('\n');
}
