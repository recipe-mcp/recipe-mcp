/**
 * Pantry tracking — know what's in your kitchen.
 *
 * Maintains a list of ingredients you have on hand.
 * Works with ingredient_search to find recipes you can make
 * without going to the store.
 *
 * Stored in: ~/.config/recipe-mcp/config.json under the "pantry" key.
 */

import { configGet, configSet } from './config.js';

const PANTRY_KEY = 'pantry';

/**
 * Get all pantry items.
 */
export function getPantry() {
  return configGet(PANTRY_KEY) || [];
}

/**
 * Add items to the pantry.
 */
export function addToPantry(items) {
  const pantry = getPantry();
  const added = [];

  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    if (!normalized) continue;
    if (pantry.some(p => p.name === normalized)) continue;

    pantry.push({
      name: normalized,
      addedAt: new Date().toISOString(),
      category: categorizeIngredient(normalized),
    });
    added.push(normalized);
  }

  configSet(PANTRY_KEY, pantry);

  if (!added.length) return { success: true, message: 'All items already in your pantry.' };
  return { success: true, message: `Added to pantry: ${added.join(', ')} (${pantry.length} items total)` };
}

/**
 * Remove items from the pantry.
 */
export function removeFromPantry(items) {
  const pantry = getPantry();
  const removed = [];

  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    const idx = pantry.findIndex(p => p.name === normalized || p.name.includes(normalized));
    if (idx !== -1) {
      removed.push(pantry[idx].name);
      pantry.splice(idx, 1);
    }
  }

  configSet(PANTRY_KEY, pantry);

  if (!removed.length) return { success: true, message: 'None of those items were in your pantry.' };
  return { success: true, message: `Removed: ${removed.join(', ')} (${pantry.length} items remaining)` };
}

/**
 * Clear the entire pantry.
 */
export function clearPantry() {
  configSet(PANTRY_KEY, []);
  return { success: true, message: 'Pantry cleared.' };
}

/**
 * Get pantry items as a simple list of ingredient names.
 * Used by ingredient_search integration.
 */
export function getPantryIngredients() {
  return getPantry().map(p => p.name);
}

/**
 * Auto-categorize an ingredient by name.
 */
function categorizeIngredient(name) {
  const categories = {
    'Produce': /\b(apple|banana|berry|blueberr|strawberr|raspberr|lemon|lime|orange|grape|tomato|potato|onion|garlic|ginger|pepper|carrot|celery|broccoli|spinach|lettuce|kale|avocado|cucumber|zucchini|squash|mushroom|corn|pea|bean|herb|basil|cilantro|parsley|thyme|rosemary|mint|dill|scallion|shallot|jalapen|chili|cabbage|cauliflower|eggplant|beet|radish|turnip|sweet potato|mango|pineapple|peach|pear|plum|cherry|coconut|fig|pomegranate|watermelon|melon|arugula)\b/i,
    'Meat & Seafood': /\b(chicken|beef|pork|steak|ground|lamb|turkey|bacon|sausage|ham|salmon|shrimp|tuna|cod|fish|tilapia|crab|lobster|scallop|mussel|clam|anchov|prosciutto|pancetta|chorizo|brisket)\b/i,
    'Dairy & Eggs': /\b(milk|cream|butter|cheese|yogurt|egg|sour cream|cream cheese|mozzarella|parmesan|cheddar|ricotta|feta|gouda|brie|mascarpone|whipping cream|half.and.half|ghee|cottage cheese)\b/i,
    'Pantry Staples': /\b(flour|sugar|salt|pepper|oil|olive oil|vegetable oil|vinegar|soy sauce|honey|maple syrup|vanilla|baking soda|baking powder|yeast|cornstarch|rice|pasta|noodle|bread|tortilla|broth|stock|can|canned|tomato paste|tomato sauce|coconut milk|peanut butter|almond butter|jam|jelly|mustard|ketchup|mayo|hot sauce|worcestershire|fish sauce|sesame oil|sriracha)\b/i,
    'Spices': /\b(cumin|paprika|cinnamon|nutmeg|oregano|turmeric|cayenne|chili powder|curry|coriander|cardamom|clove|allspice|bay leaf|saffron|za.atar|sumac|garam masala|five.spice|red pepper flake|black pepper|white pepper|onion powder|garlic powder|smoked paprika)\b/i,
    'Grains & Legumes': /\b(quinoa|oat|barley|farro|couscous|bulgur|lentil|chickpea|black bean|kidney bean|white bean|navy bean|pinto bean|split pea|rice|brown rice|wild rice|basmati|jasmine|arborio|polenta|grits|cornmeal)\b/i,
    'Nuts & Seeds': /\b(almond|walnut|pecan|cashew|pistachio|peanut|hazelnut|macadamia|pine nut|sesame|sunflower|pumpkin seed|chia|flax|hemp|tahini)\b/i,
    'Frozen': /\b(frozen|ice cream|popsicle|frozen pizza|frozen vegetable|frozen fruit|frozen dinner)\b/i,
    'Beverages': /\b(coffee|tea|juice|wine|beer|vodka|rum|whiskey|bourbon|tequila|gin|champagne|sparkling|soda|water|kombucha)\b/i,
  };

  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(name)) return category;
  }
  return 'Other';
}

/**
 * Format pantry for display, grouped by category.
 */
export function formatPantry(pantry) {
  if (!pantry.length) {
    return 'Your pantry is empty. Use `pantry_add` to add ingredients you have on hand!';
  }

  const grouped = {};
  for (const item of pantry) {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item.name);
  }

  const lines = [`**Your Pantry** (${pantry.length} items)\n`];

  // Sort categories with a preferred order
  const order = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry Staples', 'Spices', 'Grains & Legumes', 'Nuts & Seeds', 'Frozen', 'Beverages', 'Other'];
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const cat of sortedCats) {
    lines.push(`**${cat}:** ${grouped[cat].join(', ')}`);
  }

  lines.push(`\nTip: Use \`ingredient_search\` with \`from_pantry: true\` to find recipes you can make right now!`);
  return lines.join('\n');
}
