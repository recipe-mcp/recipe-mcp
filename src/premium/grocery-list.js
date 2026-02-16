/**
 * Grocery List Generator — Premium Feature
 *
 * Takes a set of recipes (or a meal plan) and produces a consolidated,
 * categorized grocery list with deduplication.
 */

import { getRecipeFrom } from '../core/registry.js';

// Rough ingredient category mapping
const CATEGORY_PATTERNS = [
  { category: 'Produce', patterns: [/lettuce|tomato|onion|garlic|pepper|carrot|celery|potato|spinach|kale|herb|basil|cilantro|parsley|lemon|lime|avocado|cucumber|zucchini|broccoli|mushroom|ginger|scallion|shallot|cabbage|corn|pea|bean sprout|apple|banana|berry|fruit|vegetable/i] },
  { category: 'Meat & Seafood', patterns: [/chicken|beef|pork|lamb|fish|salmon|shrimp|turkey|bacon|sausage|steak|ground|meat|prawn|tuna|cod|mince/i] },
  { category: 'Dairy & Eggs', patterns: [/milk|cheese|butter|cream|yogurt|egg|sour cream|mozzarella|parmesan|cheddar|ricotta|ghee/i] },
  { category: 'Pantry', patterns: [/oil|vinegar|sauce|soy|salt|pepper|sugar|flour|rice|pasta|noodle|bread|can|stock|broth|honey|mustard|ketchup|mayonnaise|spice|cumin|paprika|cinnamon|nutmeg|oregano|thyme|bay leaf|curry|turmeric|chili|powder|dried/i] },
  { category: 'Grains & Bakery', patterns: [/bread|tortilla|pita|naan|roll|bun|cracker|oat|cereal|quinoa|couscous|barley/i] },
  { category: 'Canned & Jarred', patterns: [/canned|can of|tin of|jar|tomato paste|coconut milk|beans|chickpea|lentil/i] },
  { category: 'Frozen', patterns: [/frozen/i] },
  { category: 'Beverages', patterns: [/wine|beer|juice|water|broth|stock/i] },
];

function categorize(ingredient) {
  const lower = ingredient.toLowerCase();
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some(p => p.test(lower))) return category;
  }
  return 'Other';
}

/**
 * Generate a grocery list from a set of recipe IDs/URLs.
 * @param {Array<{id: string, source?: string}>} recipes
 * @returns {Promise<Object>}
 */
export async function generateGroceryList(recipes) {
  const allIngredients = [];

  for (const { id, source } of recipes) {
    try {
      const recipe = await getRecipeFrom(id, source);
      for (const ing of recipe.ingredients) {
        allIngredients.push({ text: ing, recipe: recipe.title });
      }
    } catch {
      // Skip recipes that fail to fetch
    }
  }

  // Categorize and group
  const byCategory = {};
  for (const item of allIngredients) {
    const cat = categorize(item.text);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  // Deduplicate within categories (simple text similarity)
  for (const cat of Object.keys(byCategory)) {
    const seen = new Map();
    for (const item of byCategory[cat]) {
      // Normalize: strip quantities loosely, compare core ingredient
      const normalized = item.text.toLowerCase().replace(/^[\d\s\/½¼¾⅓⅔⅛]+/, '').replace(/\(.*?\)/g, '').trim();
      const key = normalized.split(/\s+/).slice(0, 3).join(' ');
      if (seen.has(key)) {
        seen.get(key).recipes.push(item.recipe);
      } else {
        seen.set(key, { text: item.text, recipes: [item.recipe] });
      }
    }
    byCategory[cat] = [...seen.values()];
  }

  return {
    categories: byCategory,
    totalItems: Object.values(byCategory).reduce((sum, items) => sum + items.length, 0),
    recipeCount: recipes.length,
  };
}

/**
 * Generate grocery list from a meal plan.
 */
export async function groceryListFromMealPlan(mealPlan) {
  const recipes = [];
  for (const day of mealPlan.days) {
    for (const recipe of Object.values(day.meals)) {
      if (recipe) {
        recipes.push({ id: recipe.id, source: recipe.source });
      }
    }
  }
  return generateGroceryList(recipes);
}

/**
 * Format a grocery list for display.
 */
export function formatGroceryList(list) {
  const lines = [`# Grocery List (${list.totalItems} items from ${list.recipeCount} recipes)\n`];

  const categoryOrder = [
    'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Grains & Bakery',
    'Pantry', 'Canned & Jarred', 'Frozen', 'Beverages', 'Other',
  ];

  for (const cat of categoryOrder) {
    const items = list.categories[cat];
    if (!items?.length) continue;
    lines.push(`## ${cat}`);
    for (const item of items) {
      const usedIn = item.recipes.length > 1 ? ` (used in ${item.recipes.length} recipes)` : '';
      lines.push(`- [ ] ${item.text}${usedIn}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
