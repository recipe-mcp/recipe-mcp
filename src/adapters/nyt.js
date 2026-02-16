/**
 * NYT Cooking adapter.
 *
 * Requires the user's NYT-S browser cookie for authentication.
 * This is a "bring your own credentials" adapter — the user accesses
 * their own NYT Cooking subscription through this interface.
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';
import { configGetAdapter, configSetAdapter, configDeleteAdapter } from '../core/config.js';

const BASE = 'https://cooking.nytimes.com';
const ADAPTER_KEY = 'nyt';

// ── HTML parsing helpers ─────────────────────────────────────────────

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseJsonLd(html) {
  const regex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      const recipe = items.find(
        d => d['@type'] === 'Recipe' || (Array.isArray(d['@type']) && d['@type'].includes('Recipe'))
      );
      if (recipe) return recipe;
    } catch {
      // skip invalid JSON-LD
    }
  }
  return null;
}

function extractNextData(html) {
  const match = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractByClassContains(html, classFragment, tag = '[a-z]+') {
  const regex = new RegExp(`<${tag}[^>]*class="[^"]*${classFragment}[^"]*"[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text) results.push(text);
  }
  return results;
}

function extractH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : '';
}

function extractLinks(html, hrefPattern) {
  const regex = new RegExp(`<a[^>]*href="(${hrefPattern})"[^>]*>([\\s\\S]*?)<\\/a>`, 'gi');
  const results = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = stripTags(match[2]).trim();
    if (href && text && !results.some(r => r.href === href)) {
      results.push({ href, text });
    }
  }
  return results;
}

// ── Normalization ────────────────────────────────────────────────────

function normalizeJsonLd(ld) {
  const instructions = (ld.recipeInstructions || []).map((step, i) => {
    if (typeof step === 'string') return step;
    return step.text || step.name || `Step ${i + 1}`;
  });

  return {
    id: null, // filled by caller
    source: ADAPTER_KEY,
    title: ld.name || '',
    author: typeof ld.author === 'string' ? ld.author : ld.author?.name || '',
    description: ld.description || '',
    yieldText: ld.recipeYield || '',
    time: ld.totalTime || '',
    prepTime: ld.prepTime || '',
    cookTime: ld.cookTime || '',
    ingredients: ld.recipeIngredient || [],
    steps: instructions,
    tags: ld.keywords
      ? (typeof ld.keywords === 'string' ? ld.keywords.split(',').map(s => s.trim()) : ld.keywords)
      : [],
    image: ld.image?.url || ld.image || '',
    rating: ld.aggregateRating?.ratingValue || null,
    ratingCount: ld.aggregateRating?.ratingCount || null,
    nutrition: ld.nutrition || null,
    category: ld.recipeCategory || '',
    cuisine: ld.recipeCuisine || '',
    url: '',
  };
}

function parseHtmlFallback(html) {
  return {
    id: null,
    source: ADAPTER_KEY,
    title: extractH1(html),
    author: '',
    description: '',
    yieldText: '',
    time: '',
    ingredients: extractByClassContains(html, 'ingredient'),
    steps: extractByClassContains(html, 'step'),
    tags: extractByClassContains(html, 'tag', 'a'),
    url: '',
  };
}

// ── HTTP helpers ─────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = configGetAdapter(ADAPTER_KEY, 'token');
  if (!token) throw new Error('NYT Cooking: Not authenticated. Set your NYT-S cookie first.');
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Cookie': `NYT-S=${token}`,
  };
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (res.status === 403 || res.status === 401) {
    throw new Error('NYT Cooking: Authentication failed — cookie may be expired.');
  }
  if (!res.ok) throw new Error(`NYT Cooking: Request failed: ${res.status}`);
  return res.text();
}

async function fetchApi(path) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { ...getAuthHeaders(), 'Accept': 'application/json', 'Referer': `${BASE}/recipe-box` };
  const res = await fetch(url, { headers });
  if (res.status === 403 || res.status === 401) {
    throw new Error('NYT Cooking: Authentication failed — cookie may be expired.');
  }
  if (!res.ok) throw new Error(`NYT Cooking: API request failed: ${res.status}`);
  return res.json();
}

// ── Adapter class ────────────────────────────────────────────────────

export class NytAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'NYT Cooking'; }
  get requiresAuth() { return true; }

  get capabilities() {
    return new Set([
      Capabilities.SEARCH,
      Capabilities.GET_RECIPE,
      Capabilities.RECIPE_BOX,
      Capabilities.COLLECTIONS,
    ]);
  }

  isReady() {
    return !!configGetAdapter(ADAPTER_KEY, 'token');
  }

  /** Set the NYT-S cookie. */
  setToken(token) {
    configSetAdapter(ADAPTER_KEY, 'token', token);
    configSetAdapter(ADAPTER_KEY, 'tokenCreated', Date.now());
  }

  /** Clear the stored token. */
  logout() {
    configDeleteAdapter(ADAPTER_KEY, 'token');
    configDeleteAdapter(ADAPTER_KEY, 'tokenCreated');
  }

  /** Get token age in days, or null. */
  tokenAgeDays() {
    const created = configGetAdapter(ADAPTER_KEY, 'tokenCreated');
    if (!created) return null;
    return (Date.now() - created) / (1000 * 60 * 60 * 24);
  }

  async search(query, opts = {}) {
    const page = opts.page || 1;
    const params = new URLSearchParams({ q: query, page: String(page) });
    const url = `${BASE}/search?${params}`;
    const html = await fetchPage(url);

    const nextData = extractNextData(html);
    if (nextData?.props?.pageProps?.results) {
      const { results, size } = nextData.props.pageProps;
      return {
        totalResults: size || results.length,
        recipes: results
          .filter(r => r.type === 'recipe')
          .map(r => ({
            id: String(r.id),
            source: ADAPTER_KEY,
            title: r.title || '',
            author: r.contentAttribution?.cardByline || '',
            time: r.time || '',
            image: r.image?.src?.card || '',
            url: `${BASE}/recipes/${r.id}`,
            kicker: r.kicker?.name || null,
          })),
      };
    }
    return { totalResults: 0, recipes: [] };
  }

  async getRecipe(idOrUrl) {
    const url = idOrUrl.startsWith('http') ? idOrUrl : `${BASE}/recipes/${idOrUrl}`;
    const id = url.match(/\/recipes\/(\d+)/)?.[1] || idOrUrl;
    const html = await fetchPage(url);

    const ld = parseJsonLd(html);
    if (ld) {
      const recipe = normalizeJsonLd(ld);
      recipe.id = id;
      recipe.url = url;
      return recipe;
    }

    const recipe = parseHtmlFallback(html);
    recipe.id = id;
    recipe.url = url;
    return recipe;
  }

  async getRecipeBox(opts = {}) {
    const page = opts.page || 1;
    const url = `${BASE}/recipe-box/all?page=${page}`;
    const html = await fetchPage(url);
    const links = extractLinks(html, '[^"]*\\/recipes\\/[^"]*');
    return links.map(l => ({
      id: l.href.match(/\/recipes\/(\d+)/)?.[1] || null,
      source: ADAPTER_KEY,
      title: l.text,
      url: l.href.startsWith('http') ? l.href : `${BASE}${l.href}`,
    }));
  }

  async getCollections() {
    const data = await fetchApi('/api/v2/users/me/collections');
    return (data.collections || []).map(c => ({
      id: String(c.id),
      name: c.name,
      description: c.description ? stripTags(c.description) : '',
      recipeCount: c.collectables_count || 0,
      url: c.url || `${BASE}/0/${c.slug}`,
    }));
  }
}
