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

// License system
import { getCurrentTier, getCurrentTierConfig, isSourceAllowed, hasPremiumFeatures, activateLicense, getLicenseStatus, getAllTiers } from '../core/license.js';

import {
  getAllAdapters,
  getReadyAdapters,
  getAdapter,
  getAdaptersWithCapability,
  searchAll,
  getRecipeFrom,
} from '../core/registry.js';
import { Capabilities } from '../core/types.js';

// ── License gate helper ─────────────────────────────────────────────

function requirePro(featureName) {
  if (!hasPremiumFeatures()) {
    const tier = getCurrentTier();
    throw new Error(
      `"${featureName}" is a Pro feature. ` +
      `You're on the ${tier === 'plus' ? 'Plus' : 'Free'} tier.\n\n` +
      `Upgrade to Pro ($19/year) with the "recipe_license" tool to unlock:\n` +
      `- Smart dietary adaptation with substitutions\n` +
      `- Recipe scaling & unit conversion\n` +
      `- Ingredient-based search ("what's in my fridge?")\n` +
      `- Cooking timelines\n` +
      `- Meal planning\n` +
      `- Grocery lists`
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
          description: 'Optional: limit search to a specific source (e.g., "nyt", "themealdb", "spoonacular")',
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
      'Automatically detects the source from the URL, or specify source explicitly.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Recipe ID or full URL (e.g., "52772" for TheMealDB, or a full NYT Cooking URL)',
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
    name: 'recipe_box',
    description: "Browse the user's saved recipe box (for sources that support it, like NYT Cooking).",
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source adapter key (default: "nyt")', default: 'nyt' },
        page: { type: 'number', description: 'Page number (default: 1)', default: 1 },
      },
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
      'ingredient search, cooking timelines, meal planning, and grocery lists.',
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

  // ── Pro tier tools ───────────────────────────────────────────────
  {
    name: 'recipe_adapt',
    description:
      '🔒 Pro — Adapt a recipe for dietary restrictions. Instead of rejecting recipes, ' +
      'this intelligently suggests substitutions. Supports: vegetarian, vegan, gluten-free, ' +
      'dairy-free, nut-free, pescatarian, keto, low-carb, paleo, shellfish-free, kosher, halal. ' +
      'For kosher: detects meat+dairy mixing and suggests pareve alternatives. ' +
      'For dairy-free: suggests oat milk for milk, vegan cheese for cheese, etc.',
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
      'Shows which diets it works for, which it can be adapted for (with specific substitutions), ' +
      'and which would be difficult.',
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
      'Give a list of ingredients you have and find recipes that use them, ' +
      'ranked by how many ingredients match.',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ingredients you have (e.g., ["chicken", "rice", "garlic", "soy sauce"])',
        },
        source: { type: 'string', description: 'Optional: limit to a specific source' },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'cooking_timeline',
    description:
      '🔒 Pro — Create a cooking timeline from a recipe. Breaks down each step with timing, ' +
      'categorizes actions (prep, cook, wait, mix, serve), calculates active vs passive time. ' +
      'Great for planning when to start cooking for dinner.',
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
      'Searches across all configured recipe sources and creates a balanced plan. ' +
      'Supports dietary preferences like vegetarian, vegan, low-carb, quick.',
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
      'Deduplicates ingredients and groups by store aisle (Produce, Meat, Dairy, Pantry, etc.).',
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
    case 'recipe_search': {
      const data = await searchAll(args.query, { source: args.source, page: args.page || 1 });
      if (!data.recipes.length) return 'No recipes found. Try a different search term.';

      // If dietary filters are provided and user has Pro, sort by compatibility
      let recipes = data.recipes;
      if (args.diets?.length) {
        if (hasPremiumFeatures()) {
          // We need full recipe data for dietary checking, but for search results
          // we can at least sort by title/kicker keyword matching
          recipes = filterByDiet(recipes, args.diets);
        }
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
      lines.unshift(`Current tier: **${tier === 'pro' ? 'Pro' : 'Free'}**\n`);
      return `Available recipe sources (${all.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'recipe_box': {
      const source = args.source || 'nyt';
      const adapter = getAdapter(source);
      if (!adapter) throw new Error(`Unknown source: ${source}`);
      if (!adapter.capabilities.has(Capabilities.RECIPE_BOX)) {
        throw new Error(`${adapter.name} does not support recipe box.`);
      }
      const recipes = await adapter.getRecipeBox({ page: args.page || 1 });
      if (!recipes.length) return 'No saved recipes found.';
      return `Saved recipes (${recipes.length}):\n\n` +
        recipes.map(r => `- **${r.title}** — ${r.url}`).join('\n');
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

    // ── Pro tools ────────────────────────────────────────────────
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
      if (args.scale) {
        result = scaleRecipe(result, args.scale);
      }
      if (args.convert) {
        result = convertUnits(result, args.convert);
      }
      if (!args.scale && !args.convert) {
        // Default to doubling if no scale specified
        result = scaleRecipe(result, 2);
      }
      return formatScaledRecipe(result);
    }

    case 'ingredient_search': {
      requirePro('Ingredient Search');
      const results = await searchByIngredients(args.ingredients, { source: args.source });
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
      return formatGroceryList(list);
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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Mutable state for cross-tool flows
let lastMealPlan = null;
let lastTimeline = null;

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
          serverInfo: { name: 'recipe-mcp', version: '1.0.0' },
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
