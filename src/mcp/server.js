#!/usr/bin/env node

/**
 * recipe-mcp — Universal Recipe MCP Server
 *
 * Multi-source recipe server implementing the Model Context Protocol.
 * Searches across all configured recipe sources, normalizes results,
 * and exposes a unified tool interface for LLM clients.
 *
 * Protocol: JSON-RPC 2.0 over stdin/stdout
 * Spec: https://modelcontextprotocol.io
 */

import { createInterface } from 'readline';

// Register all adapters
import '../adapters/index.js';

// Premium features
import { generateMealPlan, formatMealPlan } from '../premium/meal-planner.js';
import { generateGroceryList, groceryListFromMealPlan, formatGroceryList } from '../premium/grocery-list.js';
import { checkDiet, adaptRecipe, filterByDiet, analyzeDietary, getAvailableDiets, formatAdaptedRecipe, formatDietaryAnalysis } from '../premium/dietary-filter.js';
import { scaleRecipe, convertUnits, formatScaledRecipe } from '../premium/recipe-scaler.js';
import { searchByIngredients, formatIngredientSearch } from '../premium/ingredient-search.js';
import { createTimeline, getStep, formatTimeline } from '../premium/cooking-timer.js';
import { findSubstitutions, findRecipeSubstitutions, formatSubstitutions } from '../premium/smart-subs.js';
import { startCookMode, getCookSession, getCurrentStep, nextStep, prevStep, goToStep, endCookMode, formatCookStep, formatCookStart } from '../premium/cook-mode.js';
import { getSeasonalProduce, getSeasonalSearchTerms, formatSeasonal } from '../premium/seasonal.js';
import { exportRecipe, exportGroceryList as exportGroceryMd, exportMealPlan as exportMealMd } from '../premium/export.js';
import { compareNutrition, formatNutritionComparison } from '../premium/nutrition-compare.js';
import { formatShareCard } from '../premium/share.js';

// Favorites & history system
import { getFavorites, saveFavorite, removeFavorite, addNote, addTags, removeTags, searchByTag, getAllTags, formatFavorites } from '../core/favorites.js';
import { getHistory, logCooked, getRecent, getMostCooked, formatHistory } from '../core/history.js';
import { getPantry, addToPantry, removeFromPantry, clearPantry, getPantryIngredients, formatPantry } from '../core/pantry.js';

// License system
import { getCurrentTier, getCurrentTierConfig, isSourceAllowed, hasPremiumFeatures, hasAllSources, activateLicense, getLicenseStatus, getAllTiers } from '../core/license.js';

import {
  getAllAdapters,
  getReadyAdapters,
  getAdapter,
  getAdaptersWithCapability,
  searchAll,
  getRecipeFrom,
} from '../core/registry.js';
import { Capabilities } from '../core/types.js';

// ── License gate helpers ────────────────────────────────────────────

function requirePlus(featureName) {
  if (!hasAllSources()) {
    throw new Error(
      `"${featureName}" requires Plus or Pro. ` +
      `You're on the Free tier.\n\n` +
      `Upgrade to Plus ($8/year) to unlock:\n` +
      `- All recipe sources + blog search\n` +
      `- Favorites with notes & tags\n` +
      `- Cook history tracking\n\n` +
      `Or Pro ($19/year) for everything in Plus + premium features.`
    );
  }
}

function requirePro(featureName) {
  if (!hasPremiumFeatures()) {
    const tier = getCurrentTier();
    throw new Error(
      `"${featureName}" is a Pro feature. ` +
      `You're on the ${tier === 'plus' ? 'Plus' : 'Free'} tier.\n\n` +
      `Upgrade to Pro ($19/year) to unlock:\n` +
      `- Smart dietary adaptation with substitutions\n` +
      `- Recipe scaling & unit conversion\n` +
      `- Cook mode (step-by-step)\n` +
      `- Smart ingredient substitutions\n` +
      `- Pantry tracking\n` +
      `- Seasonal produce suggestions\n` +
      `- Instagram recipe extraction\n` +
      `- Nutrition comparison\n` +
      `- Recipe export (Notion, Google Docs, etc.)\n` +
      `- Meal planning & grocery lists`
    );
  }
}

// ── Tool definitions ─────────────────────────────────────────────────

const TOOLS = [
  // ── Free tier tools ──────────────────────────────────────────────
  {
    name: 'recipe_search',
    description:
      'Search for recipes across all configured sources (TheMealDB, NYT Cooking, Spoonacular, etc.). ' +
      'Returns titles, authors, cook times, source, and URLs. ' +
      'Optionally filter by a specific source or dietary restrictions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "chicken tikka", "quick pasta")' },
        source: {
          type: 'string',
          description: 'Optional: limit search to a specific source (e.g., "nyt", "themealdb", "spoonacular", "blogs")',
        },
        page: { type: 'number', description: 'Page number for pagination (default: 1)', default: 1 },
        diets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional (Pro): dietary filters to sort results by compatibility (e.g., ["vegan", "gluten-free", "kosher"])',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'recipe_get',
    description:
      'Get full recipe details by ID or URL. Returns title, author, description, ingredients, ' +
      'step-by-step instructions, cook/prep time, nutrition, rating, and tags. ' +
      'Works with ANY recipe URL from ANY website (AllRecipes, Bon Appetit, food blogs, etc.) — ' +
      'just paste the URL. Also accepts source-specific IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Recipe ID or full URL (any recipe website URL, or source-specific ID like "52772" for TheMealDB)',
        },
        source: {
          type: 'string',
          description: 'Optional: source adapter key (e.g., "nyt", "themealdb", "spoonacular")',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'recipe_random',
    description: 'Get a random recipe. Great for inspiration or "what should I cook?" questions.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Optional: source to get random recipe from (default: any available source)',
        },
      },
    },
  },
  {
    name: 'recipe_sources',
    description:
      'List all available recipe sources, their status (ready/needs config), and capabilities. ' +
      'Use this to see which sources are configured and what they can do.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'recipe_collections',
    description: "Get the user's recipe collections/folders (for sources that support it, like NYT Cooking).",
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source adapter key (default: "nyt")', default: 'nyt' },
      },
    },
  },
  {
    name: 'recipe_configure',
    description:
      'Configure a recipe source. Use this to set API keys or authentication tokens. ' +
      'For NYT Cooking: set your NYT-S browser cookie. ' +
      'For Spoonacular: set your free API key from spoonacular.com/food-api.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source adapter key (e.g., "nyt", "spoonacular")' },
        credential: { type: 'string', description: 'API key or auth token for the source' },
      },
      required: ['source', 'credential'],
    },
  },
  {
    name: 'recipe_license',
    description:
      'Activate a Pro license key or check current license status. ' +
      'Pro unlocks: all recipe sources, dietary adaptation, recipe scaling, ' +
      'cook mode, pantry tracking, Instagram recipes, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'License key to activate (format: RMCP-XXXX-XXXX-XXXX). Omit to check current status.',
        },
      },
    },
  },
  {
    name: 'list_diets',
    description:
      'List all available dietary profiles and what they filter/adapt for. ' +
      'Includes: vegetarian, vegan, gluten-free, dairy-free, nut-free, pescatarian, ' +
      'keto, low-carb, paleo, shellfish-free, kosher, halal.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── Plus tier tools ─────────────────────────────────────────────
  {
    name: 'recipe_save',
    description:
      '🔒 Plus — Save a recipe to your local favorites. Works with any source. ' +
      'Provide a recipe ID/URL to fetch and save it, or provide title and URL directly.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to save' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        title: { type: 'string', description: 'Optional: recipe title (if providing URL directly)' },
        url: { type: 'string', description: 'Optional: recipe URL (if not using ID lookup)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'recipe_favorites',
    description:
      '🔒 Plus — List your saved favorite recipes across all sources. Filter by tag.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (default: 1)', default: 1 },
        tag: { type: 'string', description: 'Optional: filter by tag (e.g., "weeknight", "meal-prep")' },
      },
    },
  },
  {
    name: 'recipe_unsave',
    description:
      '🔒 Plus — Remove a recipe from your favorites by ID or by list number.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID to remove' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        index: { type: 'number', description: 'Optional: remove by list number (from recipe_favorites)' },
      },
    },
  },
  {
    name: 'recipe_note',
    description:
      '🔒 Plus — Add a personal note to a saved favorite. ' +
      '"Doubled the garlic, kids loved it" or "needs more salt next time."',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Favorite number (from recipe_favorites list)' },
        id: { type: 'string', description: 'Or: recipe ID' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        note: { type: 'string', description: 'Your personal note about this recipe' },
      },
      required: ['note'],
    },
  },
  {
    name: 'recipe_tag',
    description:
      '🔒 Plus — Add custom tags to a saved favorite. ' +
      'Tags like "weeknight", "meal-prep", "date-night", "kid-friendly".',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Favorite number (from recipe_favorites list)' },
        id: { type: 'string', description: 'Or: recipe ID' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add (e.g., ["weeknight", "quick", "comfort-food"])',
        },
      },
      required: ['tags'],
    },
  },
  {
    name: 'recipe_log',
    description:
      '🔒 Plus — Log a recipe as cooked. Track what you make and when. ' +
      'Optionally rate it 1-5 and add notes.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL that you cooked' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        rating: { type: 'number', description: 'Optional: personal rating 1-5' },
        notes: { type: 'string', description: 'Optional: notes about how it went' },
      },
      required: ['id'],
    },
  },
  {
    name: 'recipe_history',
    description:
      '🔒 Plus — View your cook history. See what you cooked recently, ' +
      'your most-made recipes, or search by date.',
    inputSchema: {
      type: 'object',
      properties: {
        view: {
          type: 'string',
          enum: ['recent', 'most_cooked'],
          description: 'View type: "recent" (default) or "most_cooked"',
        },
        limit: { type: 'number', description: 'Number of entries to show (default: 10)', default: 10 },
      },
    },
  },

  // ── Pro tier tools ───────────────────────────────────────────────
  {
    name: 'recipe_adapt',
    description:
      '🔒 Pro — Adapt a recipe for dietary restrictions. Instead of rejecting recipes, ' +
      'this intelligently suggests substitutions. Supports: vegetarian, vegan, gluten-free, ' +
      'dairy-free, nut-free, pescatarian, keto, low-carb, paleo, shellfish-free, kosher, halal.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to adapt' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        diets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Diet(s) to adapt for (e.g., ["dairy-free"], ["kosher"], ["vegan", "gluten-free"])',
        },
      },
      required: ['id', 'diets'],
    },
  },
  {
    name: 'recipe_analyze_diet',
    description:
      '🔒 Pro — Analyze a recipe for compatibility with ALL dietary profiles at once. ' +
      'Shows which diets it works for, which it can be adapted for, and which would be difficult.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to analyze' },
        source: { type: 'string', description: 'Optional: source adapter key' },
      },
      required: ['id'],
    },
  },
  {
    name: 'recipe_scale',
    description:
      '🔒 Pro — Scale a recipe up or down. Doubles, halves, or scales by any factor. ' +
      'Also converts between metric and imperial units (cups↔ml, oz↔g, °F↔°C).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to scale' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        scale: { type: 'number', description: 'Scale factor (e.g., 2 = double, 0.5 = half, 3 = triple)' },
        convert: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'Optional: convert units to metric or imperial',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'ingredient_search',
    description:
      '🔒 Pro — "What can I cook with what\'s in my fridge?" ' +
      'Give a list of ingredients you have and find recipes that use them. ' +
      'Set from_pantry=true to search using your saved pantry items.',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ingredients you have (e.g., ["chicken", "rice", "garlic", "soy sauce"])',
        },
        from_pantry: { type: 'boolean', description: 'If true, use ingredients from your pantry' },
        source: { type: 'string', description: 'Optional: limit to a specific source' },
      },
    },
  },
  {
    name: 'cooking_timeline',
    description:
      '🔒 Pro — Create a cooking timeline from a recipe. Breaks down each step with timing, ' +
      'categorizes actions (prep, cook, wait, mix, serve), calculates active vs passive time.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL' },
        source: { type: 'string', description: 'Optional: source adapter key' },
      },
      required: ['id'],
    },
  },
  {
    name: 'meal_plan',
    description:
      '🔒 Pro — Generate a weekly meal plan based on preferences. ' +
      'Searches across all configured recipe sources and creates a balanced plan.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to plan (default: 7)', default: 7 },
        meals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which meals to plan (default: ["lunch", "dinner"]). Options: breakfast, lunch, dinner, snack.',
        },
        preferences: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary preferences (e.g., ["vegetarian", "quick", "low-carb"])',
        },
      },
    },
  },
  {
    name: 'grocery_list',
    description:
      '🔒 Pro — Generate a categorized grocery list from recipes or a meal plan. ' +
      'Deduplicates ingredients and groups by store aisle.',
    inputSchema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Recipe ID or URL' },
              source: { type: 'string', description: 'Source adapter key' },
            },
            required: ['id'],
          },
          description: 'Array of recipes to build grocery list from',
        },
        from_meal_plan: {
          type: 'boolean',
          description: 'If true, generates grocery list from the most recently generated meal plan',
        },
      },
    },
  },
  {
    name: 'recipe_substitute',
    description:
      '🔒 Pro — Smart ingredient substitutions. "I don\'t have heavy cream" → ' +
      'suggests alternatives with adjusted quantities and notes.',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredients you need substitutes for (e.g., ["heavy cream", "eggs", "butter"])',
        },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'recipe_cook',
    description:
      '🔒 Pro — Start cook mode: step-by-step recipe walker. ' +
      'Navigate with "next step", "previous step", or jump to a step number. ' +
      'Perfect for hands-free cooking with a voice assistant.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to cook' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        action: {
          type: 'string',
          enum: ['start', 'next', 'prev', 'goto', 'status', 'done'],
          description: 'Cook mode action (default: "start")',
        },
        step: { type: 'number', description: 'Step number (for "goto" action)' },
      },
    },
  },
  {
    name: 'recipe_seasonal',
    description:
      '🔒 Pro — What\'s in season? Shows seasonal produce for the current month ' +
      'and suggests recipes using those ingredients.',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Month number 1-12 (default: current month)' },
      },
    },
  },
  {
    name: 'pantry_add',
    description:
      '🔒 Pro — Add ingredients to your pantry. Track what you have on hand. ' +
      'Use with ingredient_search to find recipes from your pantry.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredients to add (e.g., ["chicken breast", "rice", "soy sauce", "garlic"])',
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'pantry_remove',
    description:
      '🔒 Pro — Remove ingredients from your pantry (used them up!).',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredients to remove',
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'pantry_list',
    description:
      '🔒 Pro — View your pantry, organized by category (Produce, Meat, Dairy, Pantry Staples, etc.).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'recipe_export',
    description:
      '🔒 Pro — Export a recipe, meal plan, or grocery list in a format ready for ' +
      'Notion, Google Docs, Google Keep, Todoist, or plain markdown. ' +
      'Formats data perfectly for other MCP servers to paste.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to export' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        format: {
          type: 'string',
          enum: ['markdown', 'notion', 'checklist', 'keep', 'todoist'],
          description: 'Export format (default: "markdown")',
        },
        type: {
          type: 'string',
          enum: ['recipe', 'grocery', 'mealplan'],
          description: 'What to export (default: "recipe")',
        },
      },
    },
  },
  {
    name: 'recipe_share',
    description:
      '🔒 Pro — Format a recipe as a compact shareable card for Slack, Discord, text/SMS, or markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Recipe ID or URL to share' },
        source: { type: 'string', description: 'Optional: source adapter key' },
        format: {
          type: 'string',
          enum: ['text', 'slack', 'discord', 'markdown'],
          description: 'Share format (default: "text")',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'recipe_compare',
    description:
      '🔒 Pro — Compare nutrition data of 2+ recipes side by side. ' +
      'Shows a table with winners highlighted (lower calories, higher protein, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Recipe ID or URL' },
              source: { type: 'string', description: 'Optional: source adapter key' },
            },
            required: ['id'],
          },
          description: 'Recipes to compare (2 or more)',
        },
      },
      required: ['recipes'],
    },
  },
  {
    name: 'recipe_instagram',
    description:
      '🔒 Pro — Extract a recipe from an Instagram post or reel. ' +
      'Turns messy Instagram captions into structured, cookable recipes ' +
      'with ingredients and step-by-step instructions. Works with public posts.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Instagram post or reel URL' },
      },
      required: ['url'],
    },
  },
];

// ── Tool handlers ────────────────────────────────────────────────────

function formatDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  return [m[1] && `${m[1]}h`, m[2] && `${m[2]}m`].filter(Boolean).join(' ') || iso;
}

function formatRecipeDetail(recipe) {
  const parts = [`# ${recipe.title}`];
  if (recipe.author) parts.push(`**By ${recipe.author}**`);
  parts.push(`*Source: ${recipe.source}*`);
  if (recipe.description) parts.push(`\n${recipe.description}`);

  const meta = [];
  if (recipe.yieldText) meta.push(`Yield: ${recipe.yieldText}`);
  if (recipe.time) meta.push(`Total time: ${formatDuration(recipe.time)}`);
  if (recipe.prepTime) meta.push(`Prep: ${formatDuration(recipe.prepTime)}`);
  if (recipe.cookTime) meta.push(`Cook: ${formatDuration(recipe.cookTime)}`);
  if (recipe.rating) meta.push(`Rating: ${recipe.rating}/5${recipe.ratingCount ? ` (${recipe.ratingCount} reviews)` : ''}`);
  if (meta.length) parts.push(`\n${meta.join(' | ')}`);

  if (recipe.category || recipe.cuisine) {
    parts.push(`\nCategory: ${[recipe.category, recipe.cuisine].filter(Boolean).join(', ')}`);
  }
  if (recipe.tags?.length) parts.push(`Tags: ${recipe.tags.join(', ')}`);

  if (recipe.ingredients?.length) {
    parts.push('\n## Ingredients');
    for (const ing of recipe.ingredients) parts.push(`- ${ing}`);
  }

  if (recipe.steps?.length) {
    parts.push('\n## Instructions');
    recipe.steps.forEach((step, i) => {
      parts.push(`\n**Step ${i + 1}:** ${step}`);
    });
  }

  if (recipe.nutrition) {
    parts.push('\n## Nutrition');
    for (const [key, val] of Object.entries(recipe.nutrition)) {
      if (!key.startsWith('@')) parts.push(`${key}: ${val}`);
    }
  }

  parts.push(`\nSource: ${recipe.url}`);
  return parts.join('\n');
}

async function handleTool(name, args) {
  switch (name) {
    // ── Free tools ──────────────────────────────────────────────
    case 'recipe_search': {
      const data = await searchAll(args.query, { source: args.source, page: args.page || 1 });
      if (!data.recipes.length) return 'No recipes found. Try a different search term.';

      let recipes = data.recipes;
      if (args.diets?.length && hasPremiumFeatures()) {
        recipes = filterByDiet(recipes, args.diets);
      }

      const summary = recipes.map(r => {
        const parts = [`**${r.title}**`];
        if (r.author) parts.push(`by ${r.author}`);
        if (r.time) parts.push(`Time: ${r.time}`);
        parts.push(`Source: ${r.source}`);
        if (r._fullyCompatible) parts.push('✅ Diet-compatible');
        else if (r._adaptable) parts.push('🔄 Adaptable');
        parts.push(r.url);
        return parts.join('\n');
      }).join('\n\n');
      return `Found ${data.totalResults} results:\n\n${summary}`;
    }

    case 'recipe_get': {
      const recipe = await getRecipeFrom(args.id, args.source);
      return formatRecipeDetail(recipe);
    }

    case 'recipe_random': {
      const randomAdapters = getAdaptersWithCapability(Capabilities.RANDOM);
      if (args.source) {
        const adapter = getAdapter(args.source);
        if (!adapter) throw new Error(`Unknown source: ${args.source}`);
        const recipe = await adapter.getRandom();
        return formatRecipeDetail(recipe);
      }
      if (!randomAdapters.length) throw new Error('No sources support random recipes.');
      const adapter = randomAdapters[Math.floor(Math.random() * randomAdapters.length)];
      const recipe = await adapter.getRandom();
      return formatRecipeDetail(recipe);
    }

    case 'recipe_sources': {
      const all = getAllAdapters();
      const tier = getCurrentTier();
      const lines = all.map(a => {
        const allowed = isSourceAllowed(a.key);
        const status = !allowed ? '🔒 Pro only'
          : a.isReady() ? '✅ Ready'
          : a.requiresAuth ? '🔑 Needs credentials'
          : '✅ Ready';
        const caps = [...a.capabilities].join(', ');
        return `**${a.name}** (${a.key})\n  Status: ${status}\n  Capabilities: ${caps}`;
      });
      lines.unshift(`Current tier: **${tier === 'pro' ? 'Pro' : tier === 'plus' ? 'Plus' : 'Free'}**\n`);
      return `Available recipe sources (${all.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'recipe_collections': {
      const source = args.source || 'nyt';
      const adapter = getAdapter(source);
      if (!adapter) throw new Error(`Unknown source: ${source}`);
      if (!adapter.capabilities.has(Capabilities.COLLECTIONS)) {
        throw new Error(`${adapter.name} does not support collections.`);
      }
      const cols = await adapter.getCollections();
      if (!cols.length) return 'No collections found.';
      return `Collections (${cols.length}):\n\n` +
        cols.map(c => `**${c.name}** (${c.recipeCount} recipes)\n  ${c.url}`).join('\n\n');
    }

    case 'recipe_configure': {
      const adapter = getAdapter(args.source);
      if (!adapter) throw new Error(`Unknown source: ${args.source}. Available: ${getAllAdapters().map(a => a.key).join(', ')}`);

      if (args.source === 'nyt') {
        adapter.setToken(args.credential);
        return 'NYT Cooking cookie saved! You are now authenticated.';
      }
      if (args.source === 'spoonacular') {
        adapter.setApiKey(args.credential);
        return 'Spoonacular API key saved!';
      }
      if (args.source === 'edamam') {
        const parts = args.credential.split(':');
        if (parts.length !== 2) throw new Error('Edamam requires credentials in format: APP_ID:APP_KEY');
        adapter.setCredentials(parts[0].trim(), parts[1].trim());
        return 'Edamam credentials saved!';
      }
      if (args.source === 'tasty') {
        adapter.setApiKey(args.credential);
        return 'Tasty (RapidAPI) key saved!';
      }
      if (!adapter.requiresAuth) {
        return `${adapter.name} does not require configuration — it works out of the box!`;
      }
      throw new Error(`${adapter.name} configuration not yet supported.`);
    }

    case 'recipe_license': {
      if (args.key) {
        const result = await activateLicense(args.key);
        return result.message;
      }
      const status = getLicenseStatus();
      const tiers = getAllTiers();
      const lines = [
        `**License Status**`,
        `Current tier: **${status.tierName}** (${status.tierPrice})`,
        status.key ? `Key: ${status.key.slice(0, 9)}****` : 'No license key activated',
        status.activatedAt ? `Activated: ${status.activatedAt}` : '',
        '',
        '**Available Tiers:**',
        ...tiers.map(t => {
          const current = t.key === status.tier ? ' ← current' : '';
          return `- **${t.name}** (${t.price})${current}: ${t.description}`;
        }),
      ].filter(Boolean);
      return lines.join('\n');
    }

    case 'list_diets': {
      const diets = getAvailableDiets();
      const lines = ['# Available Dietary Profiles\n'];
      for (const d of diets) {
        lines.push(`**${d.name}** (\`${d.key}\`)`);
        lines.push(`${d.description}\n`);
      }
      lines.push('Use these with `recipe_adapt` to adapt any recipe, or with `recipe_search` to filter results.');
      return lines.join('\n');
    }

    // ── Plus tools ──────────────────────────────────────────────
    case 'recipe_save': {
      requirePlus('Favorites');
      const recipe = await getRecipeFrom(args.id, args.source);
      const result = saveFavorite({
        id: recipe.id || args.id,
        source: recipe.source || args.source || 'unknown',
        title: args.title || recipe.title,
        url: args.url || recipe.url || `${args.id}`,
      });
      return result.message;
    }

    case 'recipe_favorites': {
      requirePlus('Favorites');
      const favorites = getFavorites();
      return formatFavorites(favorites, args.page || 1, args.tag || null);
    }

    case 'recipe_unsave': {
      requirePlus('Favorites');
      if (typeof args.index === 'number') {
        const result = removeFavorite({ index: args.index - 1 });
        return result.message;
      }
      if (args.id) {
        const result = removeFavorite({ id: args.id, source: args.source });
        return result.message;
      }
      throw new Error('Provide either a recipe ID or an index number to remove.');
    }

    case 'recipe_note': {
      requirePlus('Notes');
      const noteOpts = { note: args.note };
      if (typeof args.index === 'number') noteOpts.index = args.index - 1;
      else if (args.id) { noteOpts.id = args.id; noteOpts.source = args.source; }
      else throw new Error('Provide a favorite number or recipe ID.');
      const result = addNote(noteOpts);
      return result.message;
    }

    case 'recipe_tag': {
      requirePlus('Tags');
      const tagOpts = { tags: args.tags };
      if (typeof args.index === 'number') tagOpts.index = args.index - 1;
      else if (args.id) { tagOpts.id = args.id; tagOpts.source = args.source; }
      else throw new Error('Provide a favorite number or recipe ID.');
      const result = addTags(tagOpts);
      return result.message;
    }

    case 'recipe_log': {
      requirePlus('Cook History');
      const recipe = await getRecipeFrom(args.id, args.source);
      const result = logCooked({
        id: recipe.id || args.id,
        source: recipe.source || args.source || 'unknown',
        title: recipe.title,
        url: recipe.url,
        rating: args.rating,
        notes: args.notes,
      });
      return result.message;
    }

    case 'recipe_history': {
      requirePlus('Cook History');
      const view = args.view || 'recent';
      const limit = args.limit || 10;
      if (view === 'most_cooked') {
        const most = getMostCooked(limit);
        return formatHistory(most, 'Most Cooked Recipes');
      }
      const recent = getRecent(limit);
      return formatHistory(recent, 'Recently Cooked');
    }

    // ── Pro tools ───────────────────────────────────────────────
    case 'recipe_adapt': {
      requirePro('Dietary Adaptation');
      const recipe = await getRecipeFrom(args.id, args.source);
      const adapted = adaptRecipe(recipe, args.diets);
      return formatAdaptedRecipe(adapted);
    }

    case 'recipe_analyze_diet': {
      requirePro('Dietary Analysis');
      const recipe = await getRecipeFrom(args.id, args.source);
      const analysis = analyzeDietary(recipe);
      return formatDietaryAnalysis(recipe, analysis);
    }

    case 'recipe_scale': {
      requirePro('Recipe Scaling');
      const recipe = await getRecipeFrom(args.id, args.source);
      let result = recipe;
      if (args.scale) result = scaleRecipe(result, args.scale);
      if (args.convert) result = convertUnits(result, args.convert);
      if (!args.scale && !args.convert) result = scaleRecipe(result, 2);
      return formatScaledRecipe(result);
    }

    case 'ingredient_search': {
      requirePro('Ingredient Search');
      let ingredients = args.ingredients;
      if (args.from_pantry) {
        const pantryItems = getPantryIngredients();
        if (!pantryItems.length) throw new Error('Your pantry is empty. Add items with `pantry_add` first.');
        ingredients = pantryItems;
      }
      if (!ingredients?.length) throw new Error('Provide ingredients or set from_pantry=true.');
      const results = await searchByIngredients(ingredients, { source: args.source });
      return formatIngredientSearch(results);
    }

    case 'cooking_timeline': {
      requirePro('Cooking Timeline');
      const recipe = await getRecipeFrom(args.id, args.source);
      const timeline = createTimeline(recipe);
      lastTimeline = timeline;
      return formatTimeline(timeline);
    }

    case 'meal_plan': {
      requirePro('Meal Planning');
      const plan = await generateMealPlan({
        days: args.days,
        meals: args.meals,
        preferences: args.preferences,
      });
      lastMealPlan = plan;
      return formatMealPlan(plan);
    }

    case 'grocery_list': {
      requirePro('Grocery Lists');
      let list;
      if (args.from_meal_plan && lastMealPlan) {
        list = await groceryListFromMealPlan(lastMealPlan);
      } else if (args.recipes?.length) {
        list = await generateGroceryList(args.recipes);
      } else {
        throw new Error('Provide either a list of recipes or set from_meal_plan=true after generating a meal plan.');
      }
      lastGroceryList = list;
      return formatGroceryList(list);
    }

    case 'recipe_substitute': {
      requirePro('Smart Substitutions');
      const results = args.ingredients.map(ing => findSubstitutions(ing));
      return formatSubstitutions(results);
    }

    case 'recipe_cook': {
      requirePro('Cook Mode');
      const action = args.action || 'start';

      if (action === 'start') {
        if (!args.id) throw new Error('Provide a recipe ID or URL to start cooking.');
        const recipe = await getRecipeFrom(args.id, args.source);
        const session = startCookMode(recipe);
        return formatCookStart(session);
      }
      if (action === 'next') {
        const step = nextStep();
        return formatCookStep(step, getCookSession());
      }
      if (action === 'prev') {
        const step = prevStep();
        return formatCookStep(step, getCookSession());
      }
      if (action === 'goto') {
        if (!args.step) throw new Error('Provide a step number to jump to.');
        const step = goToStep(args.step);
        return formatCookStep(step, getCookSession());
      }
      if (action === 'status') {
        const step = getCurrentStep();
        return formatCookStep(step, getCookSession());
      }
      if (action === 'done') {
        const session = endCookMode();
        if (!session) return 'No active cooking session.';
        return `Done cooking "${session.title}"! 🎉\n\nTip: Use \`recipe_log\` to log this in your cook history.`;
      }
      throw new Error(`Unknown cook mode action: ${action}`);
    }

    case 'recipe_seasonal': {
      requirePro('Seasonal Suggestions');
      const seasonal = getSeasonalProduce(args.month);
      // Search for a few seasonal recipes
      const searchTerms = getSeasonalSearchTerms(args.month);
      let recipes = [];
      try {
        const searchResults = await searchAll(searchTerms.slice(0, 2).join(' '), { page: 1 });
        recipes = searchResults.recipes.slice(0, 5);
      } catch { /* search is optional */ }
      return formatSeasonal(seasonal, recipes);
    }

    case 'pantry_add': {
      requirePro('Pantry');
      const result = addToPantry(args.items);
      return result.message;
    }

    case 'pantry_remove': {
      requirePro('Pantry');
      const result = removeFromPantry(args.items);
      return result.message;
    }

    case 'pantry_list': {
      requirePro('Pantry');
      const pantry = getPantry();
      return formatPantry(pantry);
    }

    case 'recipe_export': {
      requirePro('Export');
      const format = args.format || 'markdown';
      const type = args.type || 'recipe';

      if (type === 'grocery' && lastGroceryList) {
        return exportGroceryMd(lastGroceryList);
      }
      if (type === 'mealplan' && lastMealPlan) {
        return exportMealMd(lastMealPlan);
      }
      if (args.id) {
        const recipe = await getRecipeFrom(args.id, args.source);
        const exported = exportRecipe(recipe, format);
        return `**Exported as ${exported.format}:**\n\n${exported.content}`;
      }
      throw new Error('Provide a recipe ID/URL, or export a grocery list/meal plan after generating one.');
    }

    case 'recipe_share': {
      requirePro('Sharing');
      const recipe = await getRecipeFrom(args.id, args.source);
      const card = formatShareCard(recipe, args.format || 'text');
      return `**Share Card (${args.format || 'text'}):**\n\n${card}`;
    }

    case 'recipe_compare': {
      requirePro('Nutrition Comparison');
      if (!args.recipes?.length || args.recipes.length < 2) {
        throw new Error('Provide at least 2 recipes to compare.');
      }
      const recipes = await Promise.all(
        args.recipes.map(r => getRecipeFrom(r.id, r.source))
      );
      const comparison = compareNutrition(recipes);
      return formatNutritionComparison(comparison);
    }

    case 'recipe_instagram': {
      requirePro('Instagram Recipes');
      const adapter = getAdapter('instagram');
      if (!adapter) throw new Error('Instagram adapter not available.');
      const recipe = await adapter.getRecipe(args.url);
      return formatRecipeDetail(recipe);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Mutable state for cross-tool flows
let lastMealPlan = null;
let lastTimeline = null;
let lastGroceryList = null;

// ── MCP JSON-RPC protocol ────────────────────────────────────────────

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'recipe-mcp', version: '1.1.0' },
        },
      });
      break;

    case 'notifications/initialized':
      break;

    case 'tools/list':
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      break;

    case 'tools/call':
      handleTool(params.name, params.arguments || {})
        .then(text => {
          send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text }] },
          });
        })
        .catch(err => {
          send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: `Error: ${err.message}` }],
              isError: true,
            },
          });
        });
      break;

    default:
      if (id) {
        send({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }
  }
}

// ── Start server (stdio transport) ───────────────────────────────────

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  try {
    handleMessage(JSON.parse(line));
  } catch {
    // Ignore parse errors
  }
});

process.stderr.write('recipe-mcp server started\n');
