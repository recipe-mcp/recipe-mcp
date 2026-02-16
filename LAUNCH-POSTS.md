# Launch Posts — Copy-Paste Ready

## Hacker News (Show HN)

**Title:** Show HN: Recipe MCP – 16 tools that turn Claude into a personal chef

**Text:**
I built an MCP server that gives AI assistants access to 9 recipe databases through a single interface. You can search across TheMealDB, NYT Cooking, Spoonacular, and 6 other sources at once, or paste any recipe blog URL and it extracts the structured data automatically via JSON-LD.

The part I'm most excited about is the dietary adaptation. Instead of just filtering out recipes that don't match your diet, it suggests substitutions — if you're dairy-free, it swaps milk for oat milk, parmesan for nutritional yeast, butter for coconut oil. It handles kosher rules too (detects meat+dairy mixing and suggests pareve alternatives).

Other tools: recipe scaling with unit conversion (cups↔ml, °F↔°C), "what's in my fridge?" ingredient search, cooking timelines, meal planning, and grocery lists organized by store aisle.

Zero npm dependencies — just Node.js built-ins. Free tier works out of the box with no API keys.

GitHub: https://github.com/recipe-mcp/recipe-mcp

---

## Reddit: r/ClaudeAI

**Title:** I built an MCP server that gives Claude access to 9 recipe databases — it can adapt any recipe to your diet, plan meals, and build grocery lists

**Text:**
Hey everyone — I built recipe-mcp, an MCP server that connects Claude to 9 recipe sources through 16 tools.

**What it does:**
- Search recipes across TheMealDB, NYT Cooking, Spoonacular, Edamam, and 5 other sources simultaneously
- Paste any recipe blog URL and it extracts the full recipe automatically
- Adapt recipes for 12 dietary profiles (vegan, kosher, keto, gluten-free, etc.) with smart substitutions instead of just rejecting recipes
- Scale recipes up/down with automatic unit conversion
- "What's in my fridge?" — give it your ingredients, get recipes ranked by match
- Generate weekly meal plans and categorized grocery lists
- Cooking timelines that break down active vs passive time

**Setup takes 2 minutes:**
```
npm install -g recipe-mcp
```
Then add to your Claude Desktop config and you're done. Free tier works with no API keys.

The dietary adaptation is the killer feature — if a recipe has dairy and you're dairy-free, it doesn't throw out the recipe. It suggests oat milk for milk, nutritional yeast for parmesan, coconut oil for butter. For kosher, it detects meat+dairy mixing and suggests pareve alternatives.

GitHub: https://github.com/recipe-mcp/recipe-mcp

Happy to answer questions!

---

## Reddit: r/ChatGPT

**Title:** Built a plugin that gives AI access to 9 recipe databases — adapts recipes to your diet, plans meals, makes grocery lists

**Text:**
I made recipe-mcp, a tool that connects AI assistants to 9 recipe databases at once. Works with any AI that supports MCP (Claude Desktop, Cursor, etc.).

Instead of just searching one recipe site, you can ask your AI "find me a quick weeknight pasta" and it searches across TheMealDB, Spoonacular, NYT Cooking, and more simultaneously.

The standout feature: dietary adaptation with substitutions. Say you find a great recipe but you're dairy-free — instead of just saying "sorry, this recipe has dairy," it rewrites the recipe with oat milk instead of milk, vegan cheese instead of parmesan, coconut oil instead of butter. Works for 12 diets including kosher (handles meat+dairy separation) and halal.

Also does meal planning, grocery lists organized by store aisle, recipe scaling with unit conversion, and "what's in my fridge?" ingredient matching.

Free and open source: https://github.com/recipe-mcp/recipe-mcp

---

## Reddit: r/mealprep and r/cooking

**Title:** I built a free tool that lets you ask your AI assistant to plan meals, adapt recipes to your diet, and make grocery lists

**Text:**
If you use Claude or similar AI assistants, I built a plugin called recipe-mcp that turns it into a cooking assistant. You can say things like:

- "Plan my meals for the week — I'm vegetarian and want quick dinners"
- "I have chicken, rice, garlic, and soy sauce — what can I make?"
- "Make this recipe dairy-free" (it suggests specific substitutions, not just "remove the cheese")
- "This recipe serves 4 but I need it for 12" (scales all ingredients)
- "Make me a grocery list from those recipes" (organized by store aisle)

It searches 9 recipe databases at once and you can paste any recipe blog URL. The dietary adaptation handles 12 profiles including kosher (separates meat and dairy, replaces pork), halal, keto, vegan, and gluten-free.

Free to use, no account needed: https://github.com/recipe-mcp/recipe-mcp

Setup is just `npm install -g recipe-mcp` and a quick config edit.

---

## Product Hunt

**Tagline:** Turn your AI assistant into a personal chef

**Description:**
recipe-mcp gives AI assistants access to 9 recipe databases through 16 tools. Search across TheMealDB, NYT Cooking, Spoonacular, and more simultaneously. Paste any recipe blog URL and it just works.

The killer feature: smart dietary adaptation. Instead of rejecting recipes that don't match your diet, it suggests substitutions — oat milk for milk, nutritional yeast for parmesan, cauliflower rice for rice. Handles 12 dietary profiles including kosher (detects meat+dairy mixing), halal, vegan, keto, and more.

Also includes recipe scaling with unit conversion, "what's in my fridge?" ingredient search, weekly meal planning, categorized grocery lists, and cooking timelines.

Zero dependencies. Free tier works out of the box in 2 minutes. No API keys needed.

**Topics:** Artificial Intelligence, Developer Tools, Food & Drink, Productivity
**Link:** https://github.com/recipe-mcp/recipe-mcp

---

## Reddit: r/LocalLLaMA

**Title:** Recipe MCP server — 16 tools for cooking with AI, works with any MCP client

**Text:**
Built an MCP server for recipe search and meal planning. 16 tools, 9 sources, zero npm dependencies.

Tools include multi-source search, dietary adaptation (rewrites recipes with substitutions instead of rejecting them), recipe scaling, unit conversion, ingredient-based search, meal planning, grocery lists, and cooking timelines.

Speaks standard MCP protocol over stdio so it works with Claude Desktop, Cursor, or any MCP client.

Free tier has 5 sources that work with no API keys. Pro tier ($19/year) unlocks all sources and premium features.

GitHub: https://github.com/recipe-mcp/recipe-mcp

The web recipe adapter is cool — it parses Schema.org JSON-LD from any recipe blog URL, so it works with AllRecipes, Serious Eats, Bon Appetit, and thousands of food blogs out of the box.

---

## Twitter/X

**Thread:**

1/ I built an MCP server that turns Claude into a personal chef.

16 tools. 9 recipe databases. Smart dietary adaptation that suggests substitutions instead of just rejecting recipes.

Free and open source: https://github.com/recipe-mcp/recipe-mcp

2/ The killer feature: dietary adaptation.

If you're dairy-free, it doesn't throw out recipes with dairy. It swaps:
- milk → oat milk
- parmesan → nutritional yeast
- butter → coconut oil
- cream → coconut cream

Works for 12 diets including kosher, halal, vegan, keto.

3/ Other tools:
- Search 9 recipe databases at once
- Paste any recipe blog URL → extracts structured data
- "What's in my fridge?" ingredient matching
- Recipe scaling + unit conversion (cups↔ml, °F↔°C)
- Weekly meal plans
- Grocery lists by store aisle
- Cooking timelines

4/ Setup in 2 minutes:

npm install -g recipe-mcp

Add one line to your Claude config. Done.

Free tier works with no API keys. Pro ($19/yr) unlocks all sources + premium features.

5/ Zero npm dependencies. Just Node.js built-ins.

Built with the adapter pattern — each recipe source is a ~100-line module. Easy to add new sources.

If you build a recipe adapter, PRs welcome!

https://github.com/recipe-mcp/recipe-mcp
