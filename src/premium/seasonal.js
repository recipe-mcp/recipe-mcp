/**
 * Seasonal produce suggestions.
 *
 * "What's in season?" → suggests recipes using seasonal ingredients.
 * Data covers all 12 months for common produce items in North America.
 */

const SEASONAL_PRODUCE = {
  1: { // January
    name: 'January',
    produce: ['citrus (oranges, lemons, grapefruit)', 'kale', 'leeks', 'sweet potatoes', 'turnips', 'beets', 'Brussels sprouts', 'cabbage', 'carrots', 'celery root', 'parsnips', 'winter squash', 'pomegranates', 'pears', 'tangerines', 'collard greens'],
    highlights: 'Peak citrus season! Great for winter soups and roasted root vegetables.',
  },
  2: { // February
    name: 'February',
    produce: ['citrus (blood oranges, Meyer lemons)', 'kale', 'leeks', 'sweet potatoes', 'turnips', 'beets', 'Brussels sprouts', 'cabbage', 'carrots', 'celery root', 'parsnips', 'grapefruit', 'broccoli rabe', 'radicchio'],
    highlights: 'Last call for winter citrus. Root vegetables still at their best.',
  },
  3: { // March
    name: 'March',
    produce: ['artichokes', 'asparagus', 'broccoli', 'lettuce', 'mushrooms', 'peas (snap, snow)', 'radishes', 'spinach', 'strawberries (late March)', 'turnips', 'leeks', 'blood oranges', 'fennel'],
    highlights: 'Spring is arriving! First asparagus and peas. Great transition month.',
  },
  4: { // April
    name: 'April',
    produce: ['artichokes', 'asparagus', 'fava beans', 'green garlic', 'morels', 'peas', 'radishes', 'rhubarb', 'spinach', 'strawberries', 'spring onions', 'watercress', 'arugula', 'chives'],
    highlights: 'Peak spring produce! Asparagus, morels, and the first strawberries.',
  },
  5: { // May
    name: 'May',
    produce: ['artichokes', 'asparagus', 'cherries', 'fava beans', 'green beans', 'lettuce', 'peas', 'radishes', 'rhubarb', 'strawberries', 'apricots', 'new potatoes', 'zucchini', 'herbs (basil, mint, cilantro)'],
    highlights: 'Cherry season begins! Farmers markets are exploding with variety.',
  },
  6: { // June
    name: 'June',
    produce: ['apricots', 'blackberries', 'blueberries', 'cherries', 'corn', 'cucumbers', 'green beans', 'peaches', 'plums', 'strawberries', 'tomatoes (start)', 'zucchini', 'summer squash', 'basil', 'peppers'],
    highlights: 'Stone fruit season! Berries galore. First tomatoes appearing.',
  },
  7: { // July
    name: 'July',
    produce: ['blackberries', 'blueberries', 'corn', 'cucumbers', 'eggplant', 'figs', 'green beans', 'melons', 'nectarines', 'peaches', 'peppers', 'plums', 'raspberries', 'tomatoes', 'watermelon', 'zucchini', 'okra'],
    highlights: 'Peak summer! Tomatoes, corn, and stone fruit at their absolute best.',
  },
  8: { // August
    name: 'August',
    produce: ['corn', 'cucumbers', 'eggplant', 'figs', 'grapes', 'melons', 'nectarines', 'peaches', 'peppers', 'plums', 'tomatoes', 'watermelon', 'zucchini', 'basil', 'tomatillos', 'shell beans'],
    highlights: 'Tomato heaven! Perfect for canning and making sauce. Figs are incredible.',
  },
  9: { // September
    name: 'September',
    produce: ['apples', 'beets', 'broccoli', 'Brussels sprouts', 'cauliflower', 'eggplant', 'figs', 'grapes', 'pears', 'peppers', 'plums', 'sweet potatoes', 'tomatoes', 'winter squash (start)', 'pomegranates'],
    highlights: 'Apple season! The fall transition. Last great tomatoes of the year.',
  },
  10: { // October
    name: 'October',
    produce: ['apples', 'beets', 'broccoli', 'Brussels sprouts', 'cabbage', 'cauliflower', 'cranberries', 'pears', 'pumpkin', 'sweet potatoes', 'turnips', 'winter squash', 'persimmons', 'pomegranates', 'quinces'],
    highlights: 'Pumpkin and squash season! Perfect for soups, pies, and roasting.',
  },
  11: { // November
    name: 'November',
    produce: ['apples', 'beets', 'Brussels sprouts', 'cabbage', 'carrots', 'cranberries', 'kale', 'pears', 'persimmons', 'pomegranates', 'pumpkin', 'sweet potatoes', 'turnips', 'winter squash', 'parsnips', 'celery root'],
    highlights: 'Thanksgiving produce! Cranberries, squash, and all the root vegetables.',
  },
  12: { // December
    name: 'December',
    produce: ['citrus (oranges, tangerines, grapefruit)', 'cranberries', 'kale', 'leeks', 'pears', 'persimmons', 'pomegranates', 'sweet potatoes', 'turnips', 'winter squash', 'Brussels sprouts', 'parsnips', 'chestnuts'],
    highlights: 'Citrus season returns! Winter greens and holiday baking ingredients.',
  },
};

/**
 * Get seasonal produce for the current month (or specified month).
 */
export function getSeasonalProduce(month) {
  const m = month || new Date().getMonth() + 1;
  return SEASONAL_PRODUCE[m] || SEASONAL_PRODUCE[1];
}

/**
 * Get search terms based on seasonal ingredients.
 * Returns a few focused search queries.
 */
export function getSeasonalSearchTerms(month) {
  const seasonal = getSeasonalProduce(month);
  // Pick 3-5 interesting seasonal items for search suggestions
  const items = seasonal.produce.slice(0, 5).map(p => p.replace(/\s*\([^)]*\)/g, '').trim());
  return items;
}

/**
 * Format seasonal produce for display.
 */
export function formatSeasonal(seasonal, recipes = []) {
  const lines = [`# 🌿 What's in Season: ${seasonal.name}\n`];
  lines.push(`*${seasonal.highlights}*\n`);

  lines.push('**In Season Now:**');
  for (const item of seasonal.produce) {
    lines.push(`- ${item}`);
  }

  if (recipes.length) {
    lines.push('\n**Seasonal Recipe Ideas:**');
    for (const r of recipes) {
      lines.push(`- **${r.title}** — ${r.source} · ${r.url}`);
    }
  }

  lines.push('\n_Tip: Search for any of these ingredients to find seasonal recipes!_');
  return lines.join('\n');
}
