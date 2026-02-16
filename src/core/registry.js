/**
 * Adapter registry — the central switchboard.
 *
 * Adapters register themselves here. The MCP server and CLI query the
 * registry to discover available sources, check capabilities, and
 * dispatch requests.
 */

/** @type {Map<string, import('./adapter.js').RecipeAdapter>} */
const adapters = new Map();

/** Register an adapter instance. */
export function registerAdapter(adapter) {
  adapters.set(adapter.key, adapter);
}

/** Get a single adapter by key. */
export function getAdapter(key) {
  return adapters.get(key) || null;
}

/** Get all registered adapters. */
export function getAllAdapters() {
  return [...adapters.values()];
}

/** Get adapters that are currently ready (authenticated / configured). */
export function getReadyAdapters() {
  return getAllAdapters().filter(a => a.isReady());
}

/** Get adapters that support a given capability. */
export function getAdaptersWithCapability(capability) {
  return getReadyAdapters().filter(a => a.capabilities.has(capability));
}

/**
 * Search across all ready adapters that support search.
 * Merges results into a single list, tagged by source.
 */
export async function searchAll(query, opts = {}) {
  const { Capabilities } = await import('./types.js');
  const searchAdapters = getAdaptersWithCapability(Capabilities.SEARCH);

  if (opts.source) {
    const adapter = getAdapter(opts.source);
    if (!adapter) throw new Error(`Unknown source: ${opts.source}`);
    if (!adapter.isReady()) throw new Error(`${adapter.name} is not configured`);
    return adapter.search(query, opts);
  }

  const results = await Promise.allSettled(
    searchAdapters.map(a => a.search(query, opts))
  );

  const merged = { totalResults: 0, recipes: [] };
  for (const r of results) {
    if (r.status === 'fulfilled') {
      merged.totalResults += r.value.totalResults;
      merged.recipes.push(...r.value.recipes);
    }
  }
  return merged;
}

/**
 * Get a recipe from the appropriate adapter.
 * If no source is specified, tries to infer from the ID/URL.
 */
export async function getRecipeFrom(idOrUrl, source) {
  if (source) {
    const adapter = getAdapter(source);
    if (!adapter) throw new Error(`Unknown source: ${source}`);
    return adapter.getRecipe(idOrUrl);
  }

  // Try to infer source from URL
  if (idOrUrl.includes('nytimes.com') || idOrUrl.includes('cooking.nytimes')) {
    const nyt = getAdapter('nyt');
    if (nyt?.isReady()) return nyt.getRecipe(idOrUrl);
  }
  if (idOrUrl.includes('themealdb.com')) {
    const mealdb = getAdapter('themealdb');
    if (mealdb?.isReady()) return mealdb.getRecipe(idOrUrl);
  }
  if (idOrUrl.includes('thecocktaildb.com')) {
    const cocktaildb = getAdapter('thecocktaildb');
    if (cocktaildb?.isReady()) return cocktaildb.getRecipe(idOrUrl);
  }
  if (idOrUrl.includes('dummyjson.com')) {
    const dj = getAdapter('dummyjson');
    if (dj?.isReady()) return dj.getRecipe(idOrUrl);
  }
  if (idOrUrl.includes('tasty.co')) {
    const tasty = getAdapter('tasty');
    if (tasty?.isReady()) return tasty.getRecipe(idOrUrl);
  }
  if (idOrUrl.includes('instagram.com')) {
    const ig = getAdapter('instagram');
    if (ig) return ig.getRecipe(idOrUrl);
  }

  // If it's a full URL to any website, try the web (JSON-LD) adapter
  if (idOrUrl.startsWith('http')) {
    const web = getAdapter('web');
    if (web) {
      try { return await web.getRecipe(idOrUrl); } catch { /* fall through */ }
    }
  }

  // If it's a plain numeric ID, try each ready adapter
  const { Capabilities } = await import('./types.js');
  const recipeAdapters = getAdaptersWithCapability(Capabilities.GET_RECIPE);

  for (const adapter of recipeAdapters) {
    try {
      return await adapter.getRecipe(idOrUrl);
    } catch {
      continue;
    }
  }
  throw new Error(`Could not find recipe: ${idOrUrl}`);
}
