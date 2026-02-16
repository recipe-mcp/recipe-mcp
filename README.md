# recipe-mcp

**Give your AI assistant the power to find, adapt, and plan recipes.**

Search 12 recipe sources at once — including 25+ popular food blogs and Instagram. Adapt any recipe to your diet (dairy-free, kosher, vegan, keto...) with smart substitutions. Scale ingredients, plan meals, build grocery lists, track your pantry, and cook step-by-step. All through a single tool that works with Claude, ChatGPT, Cursor, and any MCP-compatible AI.

Zero dependencies. Works out of the box in under 2 minutes.

---

## What It Does (in plain English)

recipe-mcp is a plugin for AI assistants. Once you install it, you can talk to Claude (or any AI that supports MCP) and say things like:

- *"Find me a quick weeknight pasta recipe"* — searches 25+ popular food blogs plus recipe databases
- *"I have chicken, rice, and garlic — what can I make?"*
- *"Make this recipe dairy-free"* (it suggests oat milk for milk, vegan cheese for cheese, etc.)
- *"This recipe serves 4 but I need it for 12"*
- *"Plan my meals for the week — I'm vegetarian"*
- *"Make me a grocery list from those recipes"*
- *"I'm kosher — adapt this recipe"* (separates meat and dairy, replaces pork)
- *"How long will this take to cook? Walk me through it step by step"*
- *"What's in season right now? Suggest something fresh"*
- *"Get the recipe from this Instagram post"* — extracts recipes from Instagram captions
- *"What can I substitute for heavy cream?"* — smart substitution suggestions
- *"Export this recipe to Notion"*

Your AI searches across 12 sources including 25+ high-traffic food blogs, finds what you need, and can modify any recipe to fit your dietary needs — instead of just rejecting recipes that don't match.

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

## Pricing & Features

### Free — $0 (no account needed)

- Search recipes from 6 free sources (TheMealDB, TheCocktailDB, DummyJSON, RecipePuppy, Blog Search, Web Recipe)
- **Blog search** — searches 25+ high-traffic food blogs (Half Baked Harvest, Pinch of Yum, Skinnytaste, Budget Bytes, Smitten Kitchen, and more)
- **Extract recipes from any blog URL** — the secret weapon
- Get full recipe details, random inspiration
- List dietary profiles
- **No setup required** — works immediately after install

### Plus — $8/year · [Buy Plus](https://recipe-mcp.lemonsqueezy.com/checkout/buy/3fe051d4-2f4a-44ed-98b7-a6d16903c4e6)

Everything in Free, plus:

- **All 12 recipe sources** unlocked (NYT Cooking, Spoonacular, Edamam, Tasty, Instagram)
- **1M+ recipes** from premium databases
- **Save favorites** with notes and tags — build your personal recipe collection locally
- **Cook history** — track what you've cooked, when, and your personal ratings
- Unlimited searches (Free tier: 50/day)
- **Requires setup** — each additional source needs a free API key (see [Source Setup Guide](#source-setup-guide) below)

### Pro — $19/year · [Buy Pro](https://recipe-mcp.lemonsqueezy.com/checkout/buy/773b1bb9-3c62-4a94-b0f0-a621eda524ca)

Everything in Plus, plus:

- **Instagram recipes** — paste an Instagram post URL and get a structured, cookable recipe
- **Cook mode** — step-by-step recipe walker (next step, previous step, jump to step, progress bar)
- **Smart substitutions** — "What can I substitute for heavy cream?" with ratios and cooking notes
- **Smart dietary adaptation** — doesn't just filter out recipes, it suggests substitutions (dairy-free? It swaps milk for oat milk, cheese for nutritional yeast)
- **12 diet profiles** — vegetarian, vegan, gluten-free, dairy-free, nut-free, pescatarian, keto, low-carb, paleo, shellfish-free, kosher, halal
- **Kosher intelligence** — detects meat+dairy mixing, suggests pareve alternatives, replaces pork
- **Recipe scaling** — double, halve, or scale by any amount + unit conversion (cups↔ml, oz↔g, °F↔°C)
- **Pantry tracking** — add ingredients you have, auto-categorized by aisle
- **"What's in my fridge?"** — tell it your ingredients, get recipe matches
- **Seasonal suggestions** — what's in season right now + recipe ideas
- **Nutrition comparison** — compare two recipes side by side
- **Cooking timelines** — step-by-step timing breakdown with active vs passive time
- **Meal planning** — auto-generate weekly plans with dietary preferences
- **Grocery lists** — categorized by store aisle, deduplicated
- **Recipe export** — formatted for Notion, Google Docs, or plain markdown
- **Recipe sharing** — formatted for Slack, Discord, or text message
- **No extra setup** — Pro features work on any recipe from any source. Just set up your sources and go.

### Activate your license

After purchasing, you'll receive a license key by email. Activate it:

```
Ask Claude: "Activate my recipe-mcp license: RMCP-XXXX-XXXX-XXXX"
```

Or via CLI:
```
recipe-mcp license activate RMCP-XXXX-XXXX-XXXX
```

To check your current tier: ask Claude *"What's my recipe-mcp license status?"* or run `recipe-mcp license status`.

---

## Source Setup Guide

recipe-mcp connects to 12 recipe sources. The free ones work instantly. The others need a free API key or your own subscription — here's exactly how to set up each one.

You can configure sources either **through Claude** (just ask in the chat) or **via the CLI**.

### Free sources (work instantly, no setup)

These 6 sources are ready to go the moment you install recipe-mcp:

| Source | What's in it | Size |
|--------|-------------|------|
| **Blog Search** | Searches 25+ popular food blogs (WordPress REST API) | Thousands of recipes |
| **Web Recipe** | Extracts recipes from any blog URL (JSON-LD) | Unlimited |
| **TheMealDB** | International meals | 280+ recipes |
| **TheCocktailDB** | Cocktails and drinks | 500+ recipes |
| **DummyJSON** | Sample recipes (great for testing) | 50 recipes |
| **RecipePuppy** | Huge recipe index | 1M+ recipes |

No keys, no accounts, no config. They just work.

**Blogs searched:** Skinnytaste, Pinch of Yum, Half Baked Harvest, Sally's Baking Addiction, Damn Delicious, Spend with Pennies, RecipeTin Eats, Natasha's Kitchen, Budget Bytes, Cafe Delites, Gimme Some Oven, Minimalist Baker, Cookie and Kate, Love and Lemons, Two Peas and Their Pod, Well Plated, Smitten Kitchen, Downshiftology, The Pioneer Woman, Ambitious Kitchen, Oh She Glows, Dinner at the Zoo, The Recipe Critic, Cooking Classy, and more. Plus JSON-LD extraction from Delish, Taste of Home, Simply Recipes, Serious Eats, Bon Appetit, Food Network, Epicurious, and King Arthur Baking.

### Spoonacular — 1M+ recipes, 150 free requests/day

**Tier required:** Plus or Pro

1. Sign up at **https://spoonacular.com/food-api** (free, no credit card needed)
2. Go to your profile → API Key and copy it
3. Configure:
   - **In Claude:** *"Configure Spoonacular with key `your-api-key`"*
   - **CLI:** `recipe-mcp configure spoonacular` (then paste key when prompted)

### Edamam — 2M+ recipes with nutrition data

**Tier required:** Plus or Pro

1. Sign up at **https://developer.edamam.com** (free tier available, no credit card needed)
2. Create an application → choose **"Recipe Search API"**
3. Copy your **Application ID** and **Application Key** (two separate values)
4. Configure:
   - **In Claude:** *"Configure Edamam with `YOUR_APP_ID:YOUR_APP_KEY`"* (colon-separated)
   - **CLI:** `recipe-mcp configure edamam` (then paste `APP_ID:APP_KEY` when prompted)

### Tasty (Buzzfeed) — popular trendy recipes

**Tier required:** Plus or Pro

1. Sign up at **https://rapidapi.com/apidojo/api/tasty** (free tier available)
2. Subscribe to the Basic (free) plan
3. Your API key is shown in the **X-RapidAPI-Key** field on any endpoint page — click into any endpoint to see it
4. Configure:
   - **In Claude:** *"Configure Tasty with key `your-rapidapi-key`"*
   - **CLI:** `recipe-mcp configure tasty` (then paste key when prompted)

### NYT Cooking — premium recipes and collections

**Tier required:** Plus or Pro
**Also requires:** An active NYT Cooking subscription ($5/month or $40/year from NYT)

1. Log into **https://cooking.nytimes.com** in your browser
2. Open DevTools:
   - **Mac:** Cmd + Option + I
   - **Windows:** F12
3. Click the **Application** tab at the top of DevTools
4. In the left sidebar, expand **Cookies** → click **https://cooking.nytimes.com**
5. Find the row named **`NYT-S`** and double-click the **Value** column to select it
6. Copy the value (it's a long string)
7. Configure:
   - **In Claude:** *"Configure NYT with cookie `your-NYT-S-value`"*
   - **CLI:** `recipe-mcp configure nyt` (then paste cookie when prompted)

**Note:** Your NYT-S cookie may expire periodically (typically every few weeks). If you get authentication errors, grab a fresh cookie from your browser using the same steps above.

### The Blog Search + Web Recipe Adapters (the secret weapon)

**Tier required:** Free (works on all tiers)

No setup needed. **Blog Search** automatically searches 25+ of the highest-traffic food blogs on the internet using their WordPress REST APIs. Just search normally and results from Skinnytaste, Pinch of Yum, Half Baked Harvest, Budget Bytes, and 20+ more blogs show up alongside your other sources.

The **Web Recipe** adapter lets you paste **any recipe URL** from any food blog, and recipe-mcp extracts the full structured recipe automatically. Works with thousands of sites including AllRecipes, Serious Eats, Simply Recipes, Bon Appetit, Epicurious, Food Network, King Arthur Baking, and more.

Example: *"Get the recipe from https://www.budgetbytes.com/slow-cooker-chili/"*

### Instagram Recipes (Pro)

**Tier required:** Pro

Paste any Instagram post URL that contains a recipe, and recipe-mcp extracts a structured, cookable recipe from the caption — ingredients list, step-by-step instructions, and metadata. No more trying to read tiny captions or watch 10-minute videos for a recipe.

Example: *"Get the recipe from https://www.instagram.com/p/ABC123/"*

### Check your sources

To see which sources are configured and ready:
- **In Claude:** *"Show my recipe sources"*
- **CLI:** `recipe-mcp sources`

---

## All 32 MCP Tools

### Free Tools (8 tools — available on all tiers)

| Tool | What it does |
|------|-------------|
| `recipe_search` | Search recipes across all configured sources + 25 popular food blogs |
| `recipe_get` | Get full recipe by ID or URL (auto-detects source) |
| `recipe_random` | Random recipe for inspiration |
| `recipe_sources` | See which sources are configured and ready |
| `recipe_collections` | Browse recipe collections (NYT Cooking) |
| `recipe_configure` | Set API keys and auth tokens for sources |
| `recipe_license` | Activate a license or check current tier |
| `list_diets` | See all 12 available dietary profiles |

### Plus Tools (7 tools — require Plus or Pro license)

| Tool | What it does |
|------|-------------|
| `recipe_save` | Save any recipe to your local favorites (works across all sources) |
| `recipe_favorites` | List your saved favorite recipes (filter by tag) |
| `recipe_unsave` | Remove a recipe from favorites by ID or list number |
| `recipe_note` | Add a personal note to a saved recipe |
| `recipe_tag` | Add or remove tags on saved recipes |
| `recipe_log` | Log that you cooked a recipe (with optional rating and notes) |
| `recipe_history` | View your cooking history — recent, most cooked, or by date |

### Pro Tools (17 tools — require Pro license)

| Tool | What it does |
|------|-------------|
| `recipe_adapt` | Adapt a recipe for dietary needs with smart substitutions |
| `recipe_analyze_diet` | Check a recipe against ALL 12 diets at once |
| `recipe_scale` | Scale ingredients up/down + unit conversion |
| `recipe_substitute` | Get smart substitutions for any ingredient (with ratios and notes) |
| `recipe_cook` | Cook mode — step-by-step recipe walker (start/next/prev/goto/done) |
| `recipe_instagram` | Extract a structured recipe from an Instagram post URL |
| `recipe_seasonal` | What's in season right now + recipe search suggestions |
| `recipe_export` | Export a recipe formatted for Notion, Google Docs, or markdown |
| `recipe_share` | Format a recipe for Slack, Discord, or text message |
| `recipe_compare` | Compare nutrition of two recipes side by side |
| `ingredient_search` | Find recipes from ingredients you have ("what's in my fridge?") |
| `cooking_timeline` | Step-by-step timing breakdown with active vs passive time |
| `meal_plan` | Generate weekly meal plans with dietary preferences |
| `grocery_list` | Categorized grocery list from recipes or a meal plan |
| `pantry_add` | Add ingredients to your pantry (auto-categorized by aisle) |
| `pantry_remove` | Remove ingredients from your pantry |
| `pantry_list` | View your pantry inventory, organized by category |

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

# Favorites (requires Plus+)
recipe-mcp favorites
recipe-mcp save <recipe-id> --source themealdb

# NYT Cooking (requires Plus+ and NYT subscription)
recipe-mcp collections

# Configure API keys
recipe-mcp configure spoonacular
recipe-mcp configure edamam
recipe-mcp configure tasty
recipe-mcp configure nyt

# License management
recipe-mcp license status
recipe-mcp license activate RMCP-XXXX-XXXX-XXXX
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
  core/           # Adapter interface, registry, config, license, favorites, history, pantry, types
  adapters/       # 12 source adapters (TheMealDB, NYT, Spoonacular, blogs, Instagram, etc.)
  mcp/            # MCP server (JSON-RPC 2.0 over stdio) — 33 tools
  cli/            # Command-line interface
  premium/        # Dietary adaptation, scaling, cook mode, substitutions, export, sharing, seasonal, nutrition
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
