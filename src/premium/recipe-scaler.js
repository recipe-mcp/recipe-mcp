/**
 * Recipe Scaler — Premium Feature
 *
 * Scales recipe ingredients up or down and converts between
 * measurement units (metric ↔ imperial).
 */

// ── Unit conversion tables ───────────────────────────────────────────

const VOLUME_TO_ML = {
  'ml': 1, 'milliliter': 1, 'millilitre': 1,
  'l': 1000, 'liter': 1000, 'litre': 1000,
  'tsp': 4.929, 'teaspoon': 4.929,
  'tbsp': 14.787, 'tablespoon': 14.787,
  'fl oz': 29.574, 'fluid ounce': 29.574,
  'cup': 236.588, 'cups': 236.588,
  'pint': 473.176, 'pt': 473.176,
  'quart': 946.353, 'qt': 946.353,
  'gallon': 3785.41, 'gal': 3785.41,
};

const WEIGHT_TO_G = {
  'g': 1, 'gram': 1, 'grams': 1,
  'kg': 1000, 'kilogram': 1000,
  'oz': 28.3495, 'ounce': 28.3495, 'ounces': 28.3495,
  'lb': 453.592, 'lbs': 453.592, 'pound': 453.592, 'pounds': 453.592,
};

const TEMP_PATTERNS = {
  fahrenheit: /(\d+)\s*°?\s*[fF](?:ahrenheit)?/,
  celsius: /(\d+)\s*°?\s*[cC](?:elsius)?/,
};

// ── Parsing ──────────────────────────────────────────────────────────

// Match quantities like "1", "1/2", "1 1/2", "½", "1½"
const FRACTION_MAP = { '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };

function parseQuantity(str) {
  if (!str) return null;
  let s = str.trim();

  // Replace unicode fractions
  for (const [frac, val] of Object.entries(FRACTION_MAP)) {
    if (s.includes(frac)) {
      const numBefore = s.match(/^(\d+)/)?.[1];
      return numBefore ? parseFloat(numBefore) + val : val;
    }
  }

  // Handle "1/2" style fractions
  const fracMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (fracMatch) return parseFloat(fracMatch[1]) + parseFloat(fracMatch[2]) / parseFloat(fracMatch[3]);

  const simpleFrac = s.match(/^(\d+)\/(\d+)/);
  if (simpleFrac) return parseFloat(simpleFrac[1]) / parseFloat(simpleFrac[2]);

  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

const UNIT_PATTERN = new RegExp(
  `^([\\d\\s\\/½¼¾⅓⅔⅛⅜⅝⅞.]+)\\s*(${[
    ...Object.keys(VOLUME_TO_ML),
    ...Object.keys(WEIGHT_TO_G),
    'pinch', 'dash', 'bunch', 'sprig', 'clove', 'cloves',
    'can', 'cans', 'package', 'packages', 'pkg',
    'piece', 'pieces', 'slice', 'slices',
    'small', 'medium', 'large',
  ].join('|')})\\.?\\s+(.+)`,
  'i'
);

function parseIngredient(text) {
  const match = text.match(UNIT_PATTERN);
  if (match) {
    return {
      quantity: parseQuantity(match[1]),
      unit: match[2].toLowerCase().replace(/\.$/, ''),
      ingredient: match[3].trim(),
      original: text,
    };
  }

  // Try just a number + ingredient (e.g., "3 eggs")
  const simpleMatch = text.match(/^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞.]+)\s+(.+)/);
  if (simpleMatch) {
    return {
      quantity: parseQuantity(simpleMatch[1]),
      unit: '',
      ingredient: simpleMatch[2].trim(),
      original: text,
    };
  }

  return { quantity: null, unit: '', ingredient: text, original: text };
}

// ── Formatting ───────────────────────────────────────────────────────

function formatQuantity(n) {
  if (n === null) return '';
  if (n === Math.floor(n)) return String(n);

  // Try to express as a nice fraction
  const fractions = [
    [0.25, '¼'], [0.333, '⅓'], [0.5, '½'], [0.667, '⅔'], [0.75, '¾'],
    [0.125, '⅛'], [0.375, '⅜'], [0.625, '⅝'], [0.875, '⅞'],
  ];

  const whole = Math.floor(n);
  const frac = n - whole;

  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole} ${sym}` : sym;
    }
  }

  // Fall back to decimal rounded to 1 place
  return n.toFixed(1).replace(/\.0$/, '');
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Scale a recipe's ingredients by a multiplier.
 * @param {Object} recipe - RecipeDetail object
 * @param {number} multiplier - Scale factor (e.g., 2 = double, 0.5 = half)
 * @returns {Object} New recipe with scaled ingredients
 */
export function scaleRecipe(recipe, multiplier) {
  const scaledIngredients = recipe.ingredients.map(text => {
    const parsed = parseIngredient(text);
    if (parsed.quantity === null) return text;
    const newQty = parsed.quantity * multiplier;
    const parts = [formatQuantity(newQty)];
    if (parsed.unit) parts.push(parsed.unit);
    parts.push(parsed.ingredient);
    return parts.join(' ');
  });

  const scaledYield = recipe.yieldText
    ? recipe.yieldText.replace(/(\d+)/, (_, n) => String(Math.round(parseFloat(n) * multiplier)))
    : '';

  return {
    ...recipe,
    ingredients: scaledIngredients,
    yieldText: scaledYield,
    _scaledBy: multiplier,
  };
}

/**
 * Convert recipe between metric and imperial.
 * @param {Object} recipe
 * @param {'metric'|'imperial'} target
 */
export function convertUnits(recipe, target = 'metric') {
  const converted = recipe.ingredients.map(text => {
    const parsed = parseIngredient(text);
    if (!parsed.quantity || !parsed.unit) return text;

    const unit = parsed.unit;

    if (target === 'metric') {
      // Imperial → Metric
      if (VOLUME_TO_ML[unit] && !['ml', 'l', 'milliliter', 'liter'].includes(unit)) {
        const ml = parsed.quantity * VOLUME_TO_ML[unit];
        const display = ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml)} ml`;
        return `${display} ${parsed.ingredient}`;
      }
      if (WEIGHT_TO_G[unit] && !['g', 'kg', 'gram', 'kilogram'].includes(unit)) {
        const g = parsed.quantity * WEIGHT_TO_G[unit];
        const display = g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${Math.round(g)} g`;
        return `${display} ${parsed.ingredient}`;
      }
    } else {
      // Metric → Imperial
      if (unit === 'ml' || unit === 'milliliter') {
        const cups = parsed.quantity / 236.588;
        if (cups >= 1) return `${formatQuantity(cups)} cups ${parsed.ingredient}`;
        const tbsp = parsed.quantity / 14.787;
        if (tbsp >= 1) return `${formatQuantity(tbsp)} tbsp ${parsed.ingredient}`;
        return `${formatQuantity(parsed.quantity / 4.929)} tsp ${parsed.ingredient}`;
      }
      if (unit === 'l' || unit === 'liter') {
        const cups = (parsed.quantity * 1000) / 236.588;
        return `${formatQuantity(cups)} cups ${parsed.ingredient}`;
      }
      if (unit === 'g' || unit === 'gram') {
        const oz = parsed.quantity / 28.3495;
        return `${formatQuantity(oz)} oz ${parsed.ingredient}`;
      }
      if (unit === 'kg' || unit === 'kilogram') {
        const lbs = parsed.quantity / 0.453592;
        return `${formatQuantity(lbs)} lbs ${parsed.ingredient}`;
      }
    }

    return text;
  });

  // Convert temperatures in steps
  const convertedSteps = recipe.steps.map(step => {
    if (target === 'metric') {
      return step.replace(TEMP_PATTERNS.fahrenheit, (_, temp) => {
        const c = Math.round((parseFloat(temp) - 32) * 5 / 9);
        return `${c}°C`;
      });
    } else {
      return step.replace(TEMP_PATTERNS.celsius, (_, temp) => {
        const f = Math.round(parseFloat(temp) * 9 / 5 + 32);
        return `${f}°F`;
      });
    }
  });

  return { ...recipe, ingredients: converted, steps: convertedSteps, _convertedTo: target };
}

/**
 * Format scaling/conversion info.
 */
export function formatScaledRecipe(recipe) {
  const lines = [`# ${recipe.title}`];
  if (recipe._scaledBy) lines.push(`*Scaled ${recipe._scaledBy}x*`);
  if (recipe._convertedTo) lines.push(`*Converted to ${recipe._convertedTo}*`);
  if (recipe.yieldText) lines.push(`Yield: ${recipe.yieldText}`);
  lines.push('');
  lines.push('## Ingredients');
  for (const ing of recipe.ingredients) lines.push(`- ${ing}`);
  lines.push('');
  lines.push('## Instructions');
  recipe.steps.forEach((step, i) => lines.push(`**Step ${i + 1}:** ${step}`));
  return lines.join('\n');
}
