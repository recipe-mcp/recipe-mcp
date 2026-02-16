/**
 * RecipePuppy adapter.
 *
 * Free, no API key required. 1M+ recipes.
 * http://www.recipepuppy.com/api/
 *
 * Note: This API can be flaky with pagination. We handle errors gracefully.
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const BASE = 'http://www.recipepuppy.com/api/';
const ADAPTER_KEY = 'recipepuppy';

function toSummary(r) {
  return {
    id: r.href || '',
    source: ADAPTER_KEY,
    title: (r.title || '').trim(),
    author: '',
    time: '',
    image: r.thumbnail || '',
    url: r.href || '',
    kicker: r.ingredients ? r.ingredients.split(',').slice(0, 3).join(', ') : null,
  };
}

export class RecipePuppyAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'RecipePuppy'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.SEARCH]);
  }

  async search(query, opts = {}) {
    const page = opts.page || 1;
    const url = `${BASE}?q=${encodeURIComponent(query)}&p=${page}`;

    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000), // 8s timeout for flaky API
      });
      if (!res.ok) throw new Error(`RecipePuppy: ${res.status}`);
      const data = await res.json();
      const recipes = (data.results || []).filter(r => r.title?.trim()).map(toSummary);
      return { totalResults: recipes.length, recipes };
    } catch (err) {
      // RecipePuppy is known to be flaky; return empty rather than throw
      return { totalResults: 0, recipes: [] };
    }
  }
}
