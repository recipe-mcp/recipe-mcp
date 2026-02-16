/**
 * Instagram Recipe adapter — extracts recipes from Instagram posts.
 *
 * Instagram recipe posts typically have the recipe in the caption text.
 * This adapter fetches the post via Instagram's oEmbed endpoint (or page
 * scraping) and parses the caption into a structured recipe format.
 *
 * Pro tier — works with public posts only.
 *
 * Strategy:
 * 1. Fetch the Instagram post page
 * 2. Extract the caption from meta tags / JSON-LD
 * 3. Parse the freeform caption text into ingredients + steps
 * 4. Return a normalized RecipeDetail
 */

import { RecipeAdapter } from '../core/adapter.js';
import { Capabilities } from '../core/types.js';

const ADAPTER_KEY = 'instagram';

/**
 * Extract Instagram post data from the HTML page.
 * Instagram embeds post data in meta tags on public posts.
 */
function extractFromMeta(html, url) {
  const getMetaContent = (property) => {
    // Try og: and regular meta tags
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
  const instructionHeaders = /(?:instructions?|directions?|method|steps?|how to make|how to)[:\s]*\n/i;

  let ingredients = [];
  let steps = [];
  let description = '';

  const ingredientMatch = decoded.search(ingredientHeaders);
  const instructionMatch = decoded.search(instructionHeaders);

  if (ingredientMatch !== -1 && instructionMatch !== -1) {
    // Both sections found
    const ingStart = decoded.indexOf('\n', ingredientMatch) + 1;

    if (ingredientMatch < instructionMatch) {
      // Ingredients first, then instructions
      const ingText = decoded.slice(ingStart, instructionMatch).trim();
      const stepStart = decoded.indexOf('\n', instructionMatch) + 1;
      const stepText = decoded.slice(stepStart).trim();

      ingredients = parseListItems(ingText);
      steps = parseListItems(stepText);
      description = decoded.slice(0, ingredientMatch).trim();
    } else {
      // Instructions first (less common)
      const stepStart = decoded.indexOf('\n', instructionMatch) + 1;
      const stepText = decoded.slice(stepStart, ingredientMatch).trim();
      const ingText = decoded.slice(ingStart).trim();

      ingredients = parseListItems(ingText);
      steps = parseListItems(stepText);
      description = decoded.slice(0, instructionMatch).trim();
    }
  } else if (ingredientMatch !== -1) {
    // Only ingredients header found
    const ingStart = decoded.indexOf('\n', ingredientMatch) + 1;
    const ingText = decoded.slice(ingStart).trim();
    ingredients = parseListItems(ingText);
    description = decoded.slice(0, ingredientMatch).trim();
  } else if (instructionMatch !== -1) {
    // Only instructions header found
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

  // Remove empty items
  ingredients = ingredients.filter(i => i.length > 2);
  steps = steps.filter(s => s.length > 5);

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
      // Strip common list prefixes
      return line
        .replace(/^[-•*▪▸►→➤]\s*/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^[🔸🔹🔺🔻⭐✅☑️✔️🟢🟡🔴]\s*/, '')
        .trim();
    })
    .filter(item => item.length > 1);
}

/**
 * Smart parse: when there are no clear headers, try to detect
 * ingredients vs instructions by content.
 *
 * Ingredients tend to: start with quantities, be shorter, contain units
 * Steps tend to: start with verbs, be longer, describe actions
 */
function smartParse(lines) {
  const ingredientPattern = /^\d|^[½¼¾⅓⅔⅛]|cup|tbsp|tsp|tablespoon|teaspoon|oz|lb|pound|gram|ml|liter|pinch|dash|clove|bunch|can\b|package|stick/i;
  const stepPattern = /^(preheat|heat|cook|bake|mix|stir|combine|add|pour|whisk|fold|season|serve|place|set|let|bring|simmer|boil|sauté|saute|chop|dice|slice|mince|grill|roast|fry|drain|remove|transfer|top|garnish|blend|process|pulse|spread|layer|arrange|brush|drizzle|toss|marinate)/i;

  const ingredients = [];
  const steps = [];
  let description = '';
  let mode = 'unknown';

  for (const line of lines) {
    // Skip hashtag lines
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
   * Extract a recipe from an Instagram post URL.
   * Works with public posts that have recipe content in the caption.
   */
  async getRecipe(url) {
    // Normalize URL
    let postUrl = url;
    if (url.includes('instagram.com')) {
      // Ensure it's a proper post URL
      const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
      if (match) {
        postUrl = `https://www.instagram.com/p/${match[1]}/`;
      }
    } else {
      throw new Error('Instagram adapter requires an Instagram post or reel URL.');
    }

    // Fetch the Instagram post page
    const res = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Instagram post: ${res.status}. Make sure the post is public.`);
    }

    const html = await res.text();
    const meta = extractFromMeta(html, postUrl);

    // Try to get more content from embedded JSON data
    let caption = meta.description;

    // Instagram sometimes embeds full data in shared_data or additional_data scripts
    const jsonMatch = html.match(/"caption":\s*\{[^}]*"text":\s*"((?:[^"\\]|\\.)*)"/);
    if (jsonMatch) {
      try {
        caption = JSON.parse(`"${jsonMatch[1]}"`);
      } catch { /* use meta description */ }
    }

    // Also try the edge_media_to_caption path
    const captionMatch2 = html.match(/"edge_media_to_caption":\s*\{"edges":\s*\[\s*\{"node":\s*\{"text":\s*"((?:[^"\\]|\\.)*)"/);
    if (captionMatch2) {
      try {
        caption = JSON.parse(`"${captionMatch2[1]}"`);
      } catch { /* use what we have */ }
    }

    if (!caption || caption.length < 20) {
      throw new Error(
        'Could not extract recipe content from this Instagram post. ' +
        'The post may be private, or it may not contain a recipe in the caption. ' +
        'Try copying the caption text and using recipe_get with a blog URL instead.'
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
