/**
 * Cook history — track what you've cooked and when.
 *
 * Answers questions like "what did I cook last week?" and
 * "how many times have I made this recipe?"
 *
 * Stored in: ~/.config/recipe-mcp/config.json under the "history" key.
 */

import { configGet, configSet } from './config.js';

const HISTORY_KEY = 'history';

/**
 * Get cook history.
 */
export function getHistory() {
  return configGet(HISTORY_KEY) || [];
}

/**
 * Log a recipe as cooked.
 */
export function logCooked(recipe) {
  const history = getHistory();

  history.unshift({
    id: recipe.id,
    source: recipe.source,
    title: recipe.title,
    url: recipe.url,
    cookedAt: new Date().toISOString(),
    rating: recipe.rating || null,   // personal rating 1-5
    notes: recipe.notes || '',
  });

  // Keep last 500 entries
  if (history.length > 500) history.length = 500;

  configSet(HISTORY_KEY, history);
  return { success: true, message: `Logged "${recipe.title}" as cooked! 🍳` };
}

/**
 * Get how many times a recipe has been cooked.
 */
export function getCookCount(id, source) {
  const history = getHistory();
  return history.filter(h => h.id === id && (!source || h.source === source)).length;
}

/**
 * Get recently cooked recipes.
 */
export function getRecent(limit = 10) {
  return getHistory().slice(0, limit);
}

/**
 * Get most frequently cooked recipes.
 */
export function getMostCooked(limit = 10) {
  const history = getHistory();
  const counts = new Map();

  for (const entry of history) {
    const key = `${entry.source}:${entry.id}`;
    if (!counts.has(key)) {
      counts.set(key, { ...entry, count: 0 });
    }
    counts.get(key).count++;
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Search history by date range.
 */
export function getHistoryByDate(startDate, endDate) {
  const history = getHistory();
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Date.now();

  return history.filter(h => {
    const t = new Date(h.cookedAt).getTime();
    return t >= start && t <= end;
  });
}

/**
 * Format history for display.
 */
export function formatHistory(entries, title = 'Cook History') {
  if (!entries.length) {
    return 'No cook history yet. Use `recipe_log` after cooking a recipe to track it!';
  }

  const lines = [`**${title}** (${entries.length} entries)\n`];

  for (const entry of entries) {
    const date = new Date(entry.cookedAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    const stars = entry.rating ? ' ' + '⭐'.repeat(entry.rating) : '';
    const count = entry.count ? ` (cooked ${entry.count}×)` : '';
    const note = entry.notes ? `\n   📝 ${entry.notes}` : '';
    lines.push(`- **${entry.title}** — ${date}${stars}${count}\n  ${entry.source} · ${entry.url}${note}`);
  }

  return lines.join('\n');
}
