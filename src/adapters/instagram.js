/**
 * Instagram Recipe adapter — extracts recipes from Instagram posts.
 *
 * Instagram recipe posts typically have the recipe in the caption text.
 * Since Instagram requires authentication to view post content via API,
 * this adapter supports TWO modes:
 *
 * 1. URL mode: Attempts to fetch the post page and extract caption from
 *    meta tags / embedded JSON (works when Instagram serves server-rendered
 *    content, e.g. for some public posts or with cookies).
 *
 * 2. Caption mode (recommended): User pastes the caption text directly.
 *    This always works regardless of Instagram's scraping restrictions.
 *    Usage: recipe_instagram with url + caption parameters.
 *
 * Pro tier only.
 *
 * Strategy:
 * 1. If caption text is provided directly, parse it immediately
 * 2. Otherwise try to fetch from URL (may fail due to Instagram restrictions)
 * 3. Parse the freeform caption text into ingredients + steps
 * 4. Return a normalized RecipeDetail
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const ADAPTER_KEY = 'instagram';

/**
 * Extract Instagram post data from the HTML page.
 * Instagram embeds post data in meta tags on public posts (when available).
 */
function extractFromMeta(html, url) {
  const getMetaContent = (property) => {
    const patterns = [
      new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`, 'i'),
      new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${property}"`, 'i'),
      new RegExp(`<meta[^>]+name="${property}"[^>]+content="([^"]*)"`, 'i'),
    ];
    for (const p of patterns) {
      const match = html.match(p);
      if (match) return match[1];
    }
    return '';
  };

  const title = getMetaContent('og:title') || 'Instagram Recipe';
  const description = getMetaContent('og:description') || '';
  const image = getMetaContent('og:image') || '';
  const author = title.match(/^(.+?)\s+on\s+Instagram/i)?.[1] || '';

  return { title: author ? `${author}'s Recipe` : title, description, image, author };
}

/**
 * Try to extract the username from the embed page (which works without auth).
 */
async function fetchAuthorFromEmbed(shortcode) {
  try {
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
    const res = await fetch(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return '';
    const html = await res.text();
    const usernameMatch = html.match(/class="Username[^"]*"[^>]*>[^<]*<span[^>]*>([^<]+)<\/span>/);
    if (usernameMatch) return usernameMatch[1];
    const altMatch = html.match(/class="UsernameText">([^<]+)</);
    if (altMatch) return altMatch[1];
    const altMatch2 = html.match(/alt="([^"]+)" \/><\/a><\/div><div class="HeaderText"/);
    if (altMatch2) return altMatch2[1];
    return '';
  } catch {
    return '';
  }
}

/**
 * Parse a freeform recipe caption into structured ingredients and steps.
 *
 * Common patterns in Instagram recipe captions:
 * - "Ingredients:" followed by a list (with bullets, dashes, or newlines)
 * - "Instructions:" or "Directions:" or "Method:" followed by numbered/bulleted steps
 * - Sometimes just a list of ingredients then steps with no headers
 */
function parseCaption(text) {
  if (!text) return { ingredients: [], steps: [], description: '' };

  // Decode HTML entities
  const decoded = text
    .replace(/&#10;/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\\n/g, '\n');

  // Try to find ingredient and instruction sections
  const ingredientHeaders = /(?:ingredients?|what you.?ll need|you.?ll need|shopping list)[:\s]*\n/i;
  const instructionHeaders = /(?:instructions?|directions?|method|steps?|how to make|how to|preparation)[:\s]*\n/i;

  let ingredients = [];
  let steps = [];
  let description = '';

  const ingredientMatch = decoded.search(ingredientHeaders);
  const instructionMatch = decoded.search(instructionHeaders);

  if (ingredientMatch !== -1 && instructionMatch !== -1) {
    const ingStart = decoded.indexOf('\n', ingredientMatch) + 1;

    if (ingredientMatch < instructionMatch) {
      const ingText = decoded.slice(ingStart, instructionMatch).trim();
      const stepStart = decoded.indexOf('\n', instructionMatch) + 1;
      const stepText = decoded.slice(stepStart).trim();

      ingredients = parseListItems(ingText);
      steps = parseListItems(stepText);
      description = decoded.slice(0, ingredientMatch).trim();
    } else {
      const stepStart = decoded.indexOf('\n', instructionMatch) + 1;
      const stepText = decoded.slice(stepStart, ingredientMatch).trim();
      const ingText = decoded.slice(ingStart).trim();

      ingredients = parseListItems(ingText);
      steps = parseListItems(stepText);
      description = decoded.slice(0, instructionMatch).trim();
    }
  } else if (ingredientMatch !== -1) {
    const ingStart = decoded.indexOf('\n', ingredientMatch) + 1;
    const ingText = decoded.slice(ingStart).trim();
    ingredients = parseListItems(ingText);
    description = decoded.slice(0, ingredientMatch).trim();
  } else if (instructionMatch !== -1) {
    const stepStart = decoded.indexOf('\n', instructionMatch) + 1;
    const stepText = decoded.slice(stepStart).trim();
    steps = parseListItems(stepText);
    description = decoded.slice(0, instructionMatch).trim();
  } else {
    // No clear sections — try to detect by content patterns
    const lines = decoded.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = smartParse(lines);
    ingredients = parsed.ingredients;
    steps = parsed.steps;
    description = parsed.description;
  }

  // Clean up: remove hashtags from description
  description = description.replace(/#\w+/g, '').trim();

  // Remove empty items and hashtag-only lines
  ingredients = ingredients.filter(i => i.length > 2 && !i.match(/^#\w/));
  steps = steps.filter(s => s.length > 5 && !s.match(/^#\w/));

  return { ingredients, steps, description };
}

/**
 * Parse a text block into list items.
 * Handles: bullet points (-, •, *, ▪), numbered items (1., 1), emoji bullets
 */
function parseListItems(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      return line
        .replace(/^[-•*▪▸►→➤]\s*/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^[🔸🔹🔺🔻⭐✅☑️✔️🟢🟡🔴🧈🥚🍳🥣🧂🧅🧄]\s*/, '')
        .trim();
    })
    .filter(item => item.length > 1);
}

/**
 * Smart parse: when there are no clear headers, try to detect
 * ingredients vs instructions by content.
 */
function smartParse(lines) {
  const ingredientPattern = /^\d|^[½¼¾⅓⅔⅛]|cup|tbsp|tsp|tablespoon|teaspoon|oz|lb|pound|gram|ml|liter|pinch|dash|clove|bunch|can\b|package|stick/i;
  const stepPattern = /^(preheat|heat|cook|bake|mix|stir|combine|add|pour|whisk|fold|season|serve|place|set|let|bring|simmer|boil|sauté|saute|chop|dice|slice|mince|grill|roast|fry|drain|remove|transfer|top|garnish|blend|process|pulse|spread|layer|arrange|brush|drizzle|toss|marinate|roll|knead|cover|refrigerate|freeze|thaw|melt|reduce|deglaze)/i;

  const ingredients = [];
  const steps = [];
  let description = '';
  let mode = 'unknown';

  for (const line of lines) {
    if (line.match(/^#\w/) && !line.match(/^#\d/)) continue;

    if (ingredientPattern.test(line)) {
      ingredients.push(line.replace(/^[-•*]\s*/, ''));
      mode = 'ingredient';
    } else if (stepPattern.test(line) || (mode === 'step' && line.length > 30)) {
      steps.push(line.replace(/^\d+[.)]\s*/, ''));
      mode = 'step';
    } else if (mode === 'ingredient' && line.length < 50) {
      ingredients.push(line.replace(/^[-•*]\s*/, ''));
    } else if (mode === 'unknown') {
      description += (description ? ' ' : '') + line;
    }
  }

  return { ingredients, steps, description };
}


export class InstagramAdapter extends RecipeAdapter {
  get key() { return ADAPTER_KEY; }
  get name() { return 'Instagram Recipes'; }
  get requiresAuth() { return false; }

  get capabilities() {
    return new Set([Capabilities.GET_RECIPE]);
  }

  /**
   * Extract a recipe from an Instagram post.
   *
   * @param {string} url - The Instagram post URL
   * @param {object} [opts] - Options
   * @param {string} [opts.caption] - Caption text pasted directly (recommended)
   * @param {string} [opts.author] - Author name override
   */
  async getRecipe(url, opts = {}) {
    // Normalize URL
    let postUrl = url;
    let shortcode = '';
    if (url.includes('instagram.com')) {
      const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
      if (match) {
        shortcode = match[1];
        postUrl = `https://www.instagram.com/p/${shortcode}/`;
      }
    } else if (!opts.caption) {
      throw new Error('Instagram adapter requires an Instagram post/reel URL, or provide caption text directly.');
    }

    // Mode 1: Caption provided directly (always works)
    if (opts.caption) {
      const parsed = parseCaption(opts.caption);
      const author = opts.author || (shortcode ? await fetchAuthorFromEmbed(shortcode) : '') || 'Instagram';
      const titleLine = parsed.description?.split(/[.\n]/)[0]?.slice(0, 80) || `${author}'s Recipe`;

      return {
        id: postUrl || 'instagram-paste',
        source: ADAPTER_KEY,
        title: titleLine,
        author,
        description: parsed.description || '',
        yieldText: '',
        time: '',
        prepTime: '',
        cookTime: '',
        ingredients: parsed.ingredients,
        steps: parsed.steps.length
          ? parsed.steps
          : ['Full step-by-step instructions were not clearly separated in the caption. See the original post for details.'],
        tags: ['instagram'],
        image: '',
        rating: null,
        ratingCount: null,
        nutrition: null,
        category: '',
        cuisine: '',
        url: postUrl,
      };
    }

    // Mode 2: Try to fetch from URL (may fail due to Instagram restrictions)
    let caption = '';
    let meta = { title: 'Instagram Recipe', description: '', image: '', author: '' };

    try {
      const res = await fetch(postUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const html = await res.text();
        meta = extractFromMeta(html, postUrl);
        caption = meta.description;

        // Try embedded JSON data paths
        const jsonMatch = html.match(/"caption":\s*\{[^}]*"text":\s*"((?:[^"\\]|\\.)*)"/);
        if (jsonMatch) {
          try { caption = JSON.parse(`"${jsonMatch[1]}"`); } catch { /* use meta */ }
        }

        const captionMatch2 = html.match(/"edge_media_to_caption":\s*\{"edges":\s*\[\s*\{"node":\s*\{"text":\s*"((?:[^"\\]|\\.)*)"/);
        if (captionMatch2) {
          try { caption = JSON.parse(`"${captionMatch2[1]}"`); } catch { /* use what we have */ }
        }
      }
    } catch {
      // Fetch failed — that's okay, we'll ask for caption
    }

    // If we couldn't get the caption, try embed for author and return helpful error
    if (!caption || caption.length < 20) {
      const author = shortcode ? await fetchAuthorFromEmbed(shortcode) : '';
      const authorMsg = author ? ` (post by @${author})` : '';
      throw new Error(
        `Could not extract recipe caption from this Instagram post${authorMsg}. ` +
        `Instagram requires login to view most post content.\n\n` +
        `**How to use instead:** Copy the caption text from the Instagram app, then use:\n` +
        `recipe_instagram with url "${postUrl}" and caption "paste the caption text here"\n\n` +
        `In the Instagram app: tap the post → tap "more" on the caption → long press to copy the text.`
      );
    }

    // Parse the caption into structured recipe data
    const parsed = parseCaption(caption);

    return {
      id: postUrl,
      source: ADAPTER_KEY,
      title: parsed.description?.slice(0, 80)?.replace(/[.\n].*/, '') || meta.title,
      author: meta.author || 'Instagram',
      description: parsed.description || meta.description,
      yieldText: '',
      time: '',
      prepTime: '',
      cookTime: '',
      ingredients: parsed.ingredients,
      steps: parsed.steps.length
        ? parsed.steps
        : ['Full instructions were not found in the caption. Check the post or linked blog for complete steps.'],
      tags: ['instagram'],
      image: meta.image,
      rating: null,
      ratingCount: null,
      nutrition: null,
      category: '',
      cuisine: '',
      url: postUrl,
    };
  }
}
