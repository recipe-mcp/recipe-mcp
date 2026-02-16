/**
 * Nutrition comparison — compare recipes side by side.
 *
 * "Which chicken recipe is lower calorie?"
 * Shows a table comparing nutrition data for 2+ recipes.
 */

/**
 * Compare nutrition data from multiple recipes.
 */
export function compareNutrition(recipes) {
  // Filter to recipes that have nutrition data
  const withNutrition = recipes.filter(r => r.nutrition && Object.keys(r.nutrition).length > 0);

  if (withNutrition.length === 0) {
    return {
      recipes: recipes.map(r => r.title),
      comparison: null,
      message: 'None of the selected recipes have nutrition data. Try recipes from Spoonacular or sites with detailed nutrition info.',
    };
  }

  // Collect all nutrition keys across recipes
  const allKeys = new Set();
  for (const r of withNutrition) {
    for (const key of Object.keys(r.nutrition)) {
      if (!key.startsWith('@')) allKeys.add(key);
    }
  }

  // Build comparison table
  const comparison = {};
  for (const key of allKeys) {
    comparison[key] = recipes.map(r => {
      const val = r.nutrition?.[key];
      return val || '—';
    });
  }

  return {
    recipes: recipes.map(r => ({ title: r.title, source: r.source })),
    comparison,
    hasData: withNutrition.length,
    totalRecipes: recipes.length,
  };
}

/**
 * Find the "winner" for each nutrition category.
 * Lower is "better" for calories, fat, sodium, sugar, cholesterol.
 * Higher is "better" for protein, fiber.
 */
export function findNutritionWinners(comparisonData) {
  const lowerIsBetter = ['calories', 'fat', 'saturated fat', 'sodium', 'sugar', 'cholesterol', 'carbohydrates', 'totalFat', 'saturatedFat'];
  const higherIsBetter = ['protein', 'fiber', 'dietaryFiber', 'iron', 'calcium', 'potassium', 'vitaminA', 'vitaminC'];

  const winners = {};

  for (const [key, values] of Object.entries(comparisonData.comparison)) {
    const numericValues = values.map(v => {
      if (v === '—') return null;
      const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    });

    const validValues = numericValues.filter(v => v !== null);
    if (validValues.length < 2) continue;

    const keyLower = key.toLowerCase();
    const isLower = lowerIsBetter.some(k => keyLower.includes(k.toLowerCase()));
    const isHigher = higherIsBetter.some(k => keyLower.includes(k.toLowerCase()));

    if (isLower) {
      const min = Math.min(...validValues);
      winners[key] = { winner: numericValues.indexOf(min), direction: 'lower' };
    } else if (isHigher) {
      const max = Math.max(...validValues);
      winners[key] = { winner: numericValues.indexOf(max), direction: 'higher' };
    }
  }

  return winners;
}

/**
 * Format nutrition comparison for display.
 */
export function formatNutritionComparison(data) {
  if (data.message) return data.message;

  const titles = data.recipes.map(r => r.title?.slice(0, 25) || 'Recipe');
  const lines = ['# Nutrition Comparison\n'];

  // Header
  lines.push(`| Nutrient | ${titles.join(' | ')} |`);
  lines.push(`|----------|${titles.map(() => '--------').join('|')}|`);

  const winners = findNutritionWinners(data);

  // Rows
  for (const [key, values] of Object.entries(data.comparison)) {
    const displayKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();

    const cells = values.map((v, i) => {
      const win = winners[key];
      if (win && win.winner === i) return `**${v}** ✓`;
      return String(v);
    });

    lines.push(`| ${displayKey} | ${cells.join(' | ')} |`);
  }

  if (data.hasData < data.totalRecipes) {
    lines.push(`\n_Note: ${data.totalRecipes - data.hasData} recipe(s) didn't have nutrition data._`);
  }

  lines.push('\n✓ = better value (lower calories/fat/sodium, higher protein/fiber)');
  return lines.join('\n');
}
