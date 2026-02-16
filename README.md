# recipe-mcp

**Give your AI assistant the power to find, adapt, and plan recipes.**

Search 9 recipe sources at once. Adapt any recipe to your diet (dairy-free, kosher, vegan, keto...) with smart substitutions. Scale ingredients, plan meals, build grocery lists. All through a single tool that works with Claude, ChatGPT, Cursor, and any MCP-compatible AI.

Zero dependencies. Works out of the box in under 2 minutes.

---

## What It Does (in plain English)

recipe-mcp is a plugin for AI assistants. Once you install it, you can talk to Claude (or any AI that supports MCP) and say things like:

- *"Find me a quick weeknight pasta recipe"*
- *"I have chicken, rice, and garlic — what can I make?"*
- *"Make this recipe dairy-free"* (it suggests oat milk for milk, vegan cheese for cheese, etc.)
- *"This recipe serves 4 but I need it for 12"*
- *"Plan my meals for the week — I'm vegetarian"*
- *"Make me a grocery list from those recipes"*
- *"I'm kosher — adapt this recipe"* (separates meat and dairy, replaces pork)
- *"How long will this take to cook? Break it down step by step"*

Your AI searches across 9 recipe databases, finds what you need, and can modify any recipe to fit your dietary needs — instead of just rejecting recipes that don't match.

---

## Setup (No Programming Experience Needed)

### Step 1: Install Node.js

You need Node.js on your computer. If you don't have it:

1. Go to **https://nodejs.org**
2. Click the big green **"Download"** button
3. Open the downloaded file and follow the installer
4. When it's done, open your **Terminal** (Mac) or **Command Prompt** (Windows)
5. Type `node --version` and press Enter — you should see a version number like `v20.10.0`

### Step 2: Install recipe-mcp

Open your Terminal / Command Prompt and type:

```
npm install -g recipe-mcp
```

That's it. No API keys, no accounts, no config files needed.

### Step 3: Connect to your AI assistant

#### For Claude Desktop (recommended)

1. Open Claude Desktop
2. Go to **Settings** (gear icon) → **Developer** → **Edit Config**
3. This opens a file. Add this inside the `"mcpServers"` section:

```json
{
  "mcpServers": {
    "recipes": {
      "command": "recipe-mcp-server"
    }
  }
}
```

4. Save the file and **restart Claude Desktop**
5. You should see a hammer icon (🔨) — click it to see all the recipe tools

#### For Cursor

1. Open Cursor Settings → MCP
2. Click **"Add MCP Server"**
3. Name: `recipes`
4. Command: `recipe-mcp-server`
5. Save and restart

#### For other MCP clients

Use the command `recipe-mcp-server` — it speaks standard MCP protocol over stdio.

### Step 4: Start cooking!

Just ask your AI assistant about recipes. It will automatically use the recipe tools.

---

## Pricing

### Free — $0 (no account needed)

- Search recipes from 5 free databases (TheMealDB, TheCocktailDB, DummyJSON, RecipePuppy)
- Get full recipe details
- Random recipe inspiration
- Extract recipes from **any blog URL** (the secret weapon)
- List dietary profiles

### Plus — $8/year · [Buy Plus](https://recipe-mcp.lemonsqueezy.com/checkout/buy/3fe051d4-2f4a-44ed-98b7-a6d16903c4e6)

Everything in Free, plus:

- **All 9 recipe sources** unlocked (NYT Cooking, Spoonacular, Edamam, Tasty)
- **1M+ recipes** from premium databases
- Unlimited searches (Free tier: 50/day)

### Pro — $19/year · [Buy Pro](https://recipe-mcp.lemonsqueezy.com/checkout/buy/773b1bb9-3c62-4a94-b0f0-a621eda524ca)

Everything in Plus, plus:

- **Smart dietary adaptation** — doesn't just filter out recipes, it suggests substitutions (dairy-free? It swaps milk for oat milk, cheese for nutritional yeast)
- **12 diet profiles** — vegetarian, vegan, gluten-free, dairy-free, nut-free, pescatarian, keto, low-carb, paleo, shellfish-free, kosher, halal
- **Kosher intelligence** — detects meat+dairy mixing, suggests pareve alternatives, replaces pork
- **Recipe scaling** — double, halve, or scale by any amount
- **Unit conversion** — cups to ml, oz to grams, °F to °C and back
- **"What's in my fridge?"** — tell it your ingredients, get recipe matches
- **Cooking timelines** — step-by-step timing breakdown with active vs passive time
- **Meal planning** — auto-generate weekly plans with dietary preferences
- **Grocery lists** — categorized by store aisle, deduplicated

### Activate your license

```
Ask Claude: "Activate my recipe-mcp license: RMCP-XXXX-XXXX-XXXX"
```

Or via CLI:
```
recipe-mcp license activate RMCP-XXXX-XXXX-XXXX
```

---

## All 16 MCP Tools

### Free Tools

| Tool | What it does |
|------|-------------|
| `recipe_search` | Search recipes across all your sources at once |
| `recipe_get` | Get full recipe by ID or URL (auto-detects source) |
| `recipe_random` | Random recipe for inspiration |
| `recipe_sources` | See which sources are configured and ready |
| `recipe_box` | Browse your saved recipes (NYT Cooking) |
| `recipe_collections` | Browse recipe collections (NYT Cooking) |
| `recipe_configure` | Set API keys and auth tokens for sources |
| `recipe_license` | Activate Pro or check license status |
| `list_diets` | See all available dietary profiles |

### Pro Tools

| Tool | What it does |
|------|-------------|
| `recipe_adapt` | Adapt a recipe for dietary needs with smart substitutions |
| `recipe_analyze_diet` | Check a recipe against ALL 12 diets at once |
| `recipe_scale` | Scale ingredients up/down + unit conversion |
| `ingredient_search` | Find recipes from ingredients you have |
| `cooking_timeline` | Step-by-step timing breakdown |
| `meal_plan` | Generate weekly meal plans |
| `grocery_list` | Categorized grocery list from recipes or meal plan |

---

## Recipe Sources (9 built-in)

### Works instantly (no setup)

| Source | What's in it | Size |
|--------|-------------|------|
| **TheMealDB** | International meals | 280+ recipes |
| **TheCocktailDB** | Cocktails and drinks | 500+ recipes |
| **DummyJSON** | Sample recipes (great for testing) | 50 recipes |
| **RecipePuppy** | Huge recipe index | 1M+ recipes |
| **Web Recipe** | Extracts recipes from any blog URL | Unlimited |

### Needs a free API key

| Source | What's in it | Free tier |
|--------|-------------|-----------|
| **Spoonacular** | Massive recipe database + nutrition | 150 requests/day |
| **Edamam** | Recipes + detailed nutrition data | Free trial |
| **Tasty** (Buzzfeed) | Trendy, popular recipes | RapidAPI free tier |

### Bring your own subscription

| Source | What's in it |
|--------|-------------|
| **NYT Cooking** | Premium recipes, saved recipe box, collections |

### The Web Recipe Adapter (the secret weapon)

Paste **any recipe URL** from any food blog, and recipe-mcp extracts the full structured recipe automatically. It works with thousands of sites including AllRecipes, Serious Eats, Simply Recipes, Bon Appetit, Epicurious, Food Network, King Arthur Baking, Budget Bytes, Smitten Kitchen, Cookie and Kate, Half Baked Harvest, Minimalist Baker, and more.

---

## How Dietary Adaptation Works

Most recipe tools just throw away recipes that don't match your diet. **recipe-mcp is smarter.** It adapts recipes with intelligent substitutions:

**Example: Making a recipe dairy-free**

| Found in recipe | Replaced with |
|----------------|---------------|
| milk | oat milk |
| butter | coconut oil |
| parmesan | nutritional yeast |
| cream | coconut cream |
| cream cheese | vegan cream cheese |

**Example: Making a recipe kosher**

If a recipe has meat AND dairy (like chicken parmesan with cheese):
- The meat stays
- Cheese → vegan cheese or nutritional yeast
- Butter → olive oil
- Cream sauce → coconut cream sauce
- Pork → suggested alternatives (jackfruit, seitan)
- Shellfish → hearts of palm, king oyster mushroom

Every substitution includes alternative options, so you can pick what works for you.

---

## CLI Reference

```bash
# Search
recipe-mcp search "chicken tikka"
recipe-mcp search "tacos" --source themealdb

# Get a recipe
recipe-mcp recipe <url-or-id>
recipe-mcp recipe "https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe"

# Random inspiration
recipe-mcp random
recipe-mcp random --source thecocktaildb

# See your sources
recipe-mcp sources

# NYT Cooking (requires subscription)
recipe-mcp box
recipe-mcp collections

# Configure API keys
recipe-mcp configure spoonacular
recipe-mcp configure edamam
recipe-mcp configure tasty
recipe-mcp configure nyt
```

---

## Add More Sources (Optional)

All of these have free tiers:

```bash
# Spoonacular — 1M+ recipes, 150 free requests/day
# Sign up: https://spoonacular.com/food-api
recipe-mcp configure spoonacular

# Edamam — 2M+ recipes with nutrition data
# Sign up: https://developer.edamam.com
recipe-mcp configure edamam

# Tasty (Buzzfeed) — popular trendy recipes
# Sign up: https://rapidapi.com/apidojo/api/tasty
recipe-mcp configure tasty

# NYT Cooking — requires NYT subscription
# Get your cookie from browser DevTools
recipe-mcp configure nyt
```

---

## For Developers

### Programmatic API

```js
import {
  searchAll,
  getRecipeFrom,
  getAllAdapters,
  adaptRecipe,
  scaleRecipe,
  convertUnits,
  createTimeline,
  searchByIngredients,
  generateMealPlan,
  generateGroceryList,
} from 'recipe-mcp';

// Search across all sources
const results = await searchAll('pasta carbonara');

// Get a recipe from any URL
const recipe = await getRecipeFrom('https://www.budgetbytes.com/slow-cooker-chili/');

// Adapt for dietary needs
const veganVersion = adaptRecipe(recipe, ['vegan', 'gluten-free']);

// Scale for a bigger group
const doubled = scaleRecipe(recipe, 2);

// Convert to metric
const metric = convertUnits(recipe, 'metric');
```

### Build Your Own Adapter

```js
import { RecipeAdapter, Capabilities, registerAdapter } from 'recipe-mcp';

class MyAdapter extends RecipeAdapter {
  get key() { return 'mysite'; }
  get name() { return 'My Recipe Site'; }
  get capabilities() {
    return new Set([Capabilities.SEARCH, Capabilities.GET_RECIPE]);
  }

  async search(query, opts) { /* your search logic */ }
  async getRecipe(id) { /* your fetch logic */ }
}

registerAdapter(new MyAdapter());
```

---

## Architecture

```
src/
  core/           # Adapter interface, registry, config, license, types
  adapters/       # 9 source adapters (each ~50-100 lines)
  mcp/            # MCP server (JSON-RPC 2.0 over stdio)
  cli/            # Command-line interface
  premium/        # Dietary adaptation, scaling, meal planning, timelines
```

**Zero dependencies.** Only Node.js built-ins. Fast installs, no supply chain risk.

---

## Troubleshooting

**"command not found: recipe-mcp"**
- Make sure you ran `npm install -g recipe-mcp`
- Try closing and reopening your terminal

**Claude doesn't show the recipe tools**
- Make sure you restarted Claude Desktop after editing the config
- Check that the config JSON is valid (no trailing commas)

**"No recipes found"**
- Try a simpler search query
- Check `recipe-mcp sources` to see which sources are available

**Spoonacular/Edamam not working**
- Run `recipe-mcp configure <source>` and enter your API key
- Check that your free tier hasn't run out of requests for the day

---

## Bug Reports & Feature Requests

Found a bug or have an idea?

- **Bug?** → [Open a bug report](https://github.com/recipe-mcp/recipe-mcp/issues/new?template=bug_report.yml)
- **Feature idea?** → [Request a feature](https://github.com/recipe-mcp/recipe-mcp/issues/new?template=feature_request.yml)
- **Question?** → [Start a discussion](https://github.com/recipe-mcp/recipe-mcp/discussions)

---

## License

MIT
