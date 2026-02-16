/**
 * Smart Dietary Adaptation — Premium Feature
 *
 * Instead of just filtering out recipes, this module ADAPTS them.
 * If a recipe has dairy but the user is dairy-free, it suggests
 * substitutions. If a recipe has pork but the user is kosher,
 * it suggests alternatives. The idea: never throw away a good
 * recipe — make it work for the user.
 */

// ── Substitution database ───────────────────────────────────────────

const SUBSTITUTIONS = {
  // Dairy substitutions
  milk: ['oat milk', 'almond milk', 'coconut milk', 'soy milk'],
  cheese: ['nutritional yeast', 'vegan cheese', 'cashew cheese'],
  butter: ['olive oil', 'coconut oil', 'vegan butter', 'avocado oil'],
  cream: ['coconut cream', 'cashew cream', 'oat cream'],
  'sour cream': ['coconut yogurt', 'cashew cream', 'vegan sour cream'],
  'cream cheese': ['vegan cream cheese', 'cashew cream cheese', 'silken tofu blended'],
  yogurt: ['coconut yogurt', 'soy yogurt', 'oat yogurt'],
  ricotta: ['tofu ricotta', 'cashew ricotta', 'almond ricotta'],
  mozzarella: ['vegan mozzarella', 'cashew mozzarella'],
  parmesan: ['nutritional yeast', 'vegan parmesan', 'cashew parmesan'],
  cheddar: ['vegan cheddar', 'nutritional yeast blend'],
  feta: ['tofu feta', 'vegan feta'],
  ghee: ['coconut oil', 'vegan butter'],
  whey: ['pea protein', 'plant protein'],

  // Egg substitutions
  egg: ['flax egg (1 tbsp ground flax + 3 tbsp water)', 'chia egg', 'mashed banana (¼ cup)', 'silken tofu (¼ cup)', 'aquafaba (3 tbsp)'],
  eggs: ['flax eggs', 'chia eggs', 'mashed banana', 'silken tofu', 'aquafaba'],
  'egg white': ['aquafaba (3 tbsp per white)'],
  'egg yolk': ['1 tbsp cornstarch + 1 tbsp water'],
  mayonnaise: ['vegan mayo', 'mashed avocado'],

  // Meat substitutions
  chicken: ['tofu', 'tempeh', 'seitan', 'jackfruit', 'cauliflower'],
  beef: ['beyond meat', 'impossible burger', 'portobello mushroom', 'lentils', 'seitan'],
  pork: ['jackfruit', 'seitan', 'smoked tofu', 'mushrooms'],
  bacon: ['tempeh bacon', 'coconut bacon', 'mushroom bacon', 'smoked tofu strips'],
  sausage: ['plant-based sausage', 'seasoned tempeh', 'seasoned mushrooms'],
  ham: ['smoked tofu', 'smoked tempeh', 'seitan ham'],
  lamb: ['seasoned jackfruit', 'seitan', 'eggplant', 'mushrooms'],
  turkey: ['seasoned tofu', 'tempeh', 'seitan'],
  steak: ['portobello mushroom steak', 'cauliflower steak', 'seitan steak'],
  'ground meat': ['lentils', 'crumbled tofu', 'textured vegetable protein (TVP)', 'plant-based ground'],
  mince: ['lentils', 'TVP', 'crumbled tempeh', 'plant-based ground'],
  prosciutto: ['smoked tofu slices', 'coconut bacon'],
  pancetta: ['smoked tempeh cubes', 'coconut bacon'],
  duck: ['seitan', 'king oyster mushroom'],
  veal: ['seitan', 'tofu'],

  // Fish/Seafood substitutions
  fish: ['hearts of palm', 'banana blossom', 'seasoned tofu', 'chickpea "tuna"'],
  salmon: ['seasoned carrot "lox"', 'marinated tofu', 'beet-cured tofu'],
  tuna: ['chickpea "tuna"', 'jackfruit', 'hearts of palm'],
  shrimp: ['king oyster mushroom', 'hearts of palm', 'konjac shrimp'],
  prawn: ['king oyster mushroom', 'hearts of palm'],
  lobster: ['hearts of palm', 'king oyster mushroom'],
  crab: ['hearts of palm', 'jackfruit', 'artichoke hearts'],
  scallop: ['king oyster mushroom rounds', 'large shiitake caps'],
  anchovy: ['capers', 'nori seaweed', 'miso paste'],

  // Gluten substitutions
  flour: ['almond flour', 'rice flour', 'oat flour (certified GF)', 'coconut flour'],
  bread: ['gluten-free bread', 'lettuce wraps', 'rice paper wraps'],
  pasta: ['rice noodles', 'zucchini noodles', 'chickpea pasta', 'sweet potato noodles'],
  noodle: ['rice noodles', 'glass noodles', 'zucchini noodles'],
  breadcrumb: ['almond meal', 'crushed rice crackers', 'gluten-free panko'],
  panko: ['gluten-free panko', 'crushed rice cereal', 'almond meal'],
  tortilla: ['corn tortilla', 'lettuce wraps', 'rice paper'],
  'soy sauce': ['tamari (gluten-free)', 'coconut aminos', 'liquid aminos'],
  couscous: ['quinoa', 'cauliflower rice', 'millet'],
  pita: ['gluten-free pita', 'lettuce cups', 'corn tortilla'],

  // Nut substitutions
  almond: ['sunflower seeds', 'pumpkin seeds', 'hemp seeds'],
  walnut: ['sunflower seeds', 'pumpkin seeds', 'hemp seeds'],
  cashew: ['sunflower seeds', 'hemp seeds', 'tahini'],
  peanut: ['sunflower seed butter', 'soy nut butter', 'tahini'],
  'pine nut': ['sunflower seeds', 'hemp seeds', 'pepitas'],
  pecan: ['sunflower seeds', 'pumpkin seeds', 'toasted coconut'],
  pistachio: ['pumpkin seeds', 'sunflower seeds', 'hemp seeds'],
  'nut butter': ['sunflower seed butter', 'tahini', 'soy nut butter'],
  'nut milk': ['oat milk', 'rice milk', 'hemp milk', 'coconut milk'],

  // Soy substitutions
  tofu: ['chickpeas', 'white beans', 'seitan (if no gluten issue)', 'cauliflower'],
  tempeh: ['chickpeas', 'lentils', 'mushrooms'],
  'soy milk': ['oat milk', 'rice milk', 'coconut milk'],
  miso: ['tahini + salt', 'vegetable bouillon'],
  edamame: ['lima beans', 'fava beans', 'green peas'],

  // High-carb substitutions (for keto/low-carb)
  rice: ['cauliflower rice', 'broccoli rice', 'hemp hearts'],
  potato: ['cauliflower', 'turnips', 'celery root', 'jicama'],
  sugar: ['erythritol', 'stevia', 'monk fruit sweetener', 'allulose'],
  honey: ['sugar-free maple syrup', 'monk fruit syrup'],
  'maple syrup': ['sugar-free maple syrup', 'monk fruit syrup'],
  corn: ['jicama', 'diced zucchini'],
  oat: ['hemp hearts', 'flax meal', 'coconut flakes'],

  // Kosher-specific: meat + dairy separation
  // (handled by the kosher profile logic, not direct substitution)

  // Shellfish alternatives (for allergies & kosher)
  crawfish: ['hearts of palm', 'artichoke hearts'],
  crayfish: ['hearts of palm', 'artichoke hearts'],
};

// ── Ingredient detection patterns ───────────────────────────────────

const MEAT_PATTERNS = /\b(chicken|beef|pork|lamb|turkey|bacon|sausage|ham|steak|veal|duck|venison|bison|ground meat|mince|prosciutto|pancetta|chorizo|salami|pepperoni)\b/i;
const FISH_PATTERNS = /\b(fish|salmon|tuna|cod|shrimp|prawn|lobster|crab|scallop|mussel|clam|oyster|squid|calamari|anchov|sardine|tilapia|halibut|trout|bass|mahi|swordfish)\b/i;
const DAIRY_PATTERNS = /\b(milk|cheese|butter|cream|yogurt|whey|casein|ghee|sour cream|cream cheese|ricotta|mozzarella|parmesan|cheddar|brie|gouda|feta)\b/i;
const EGG_PATTERNS = /\b(egg|eggs|egg white|egg yolk|mayonnaise|meringue)\b/i;
const GLUTEN_PATTERNS = /\b(flour|bread|pasta|noodle|wheat|barley|rye|couscous|tortilla|pita|cracker|breadcrumb|panko|soy sauce|beer|malt)\b/i;
const NUT_PATTERNS = /\b(almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|peanut|pine nut|brazil nut|nut butter|nut milk)\b/i;
const SHELLFISH_PATTERNS = /\b(shrimp|prawn|lobster|crab|scallop|mussel|clam|oyster|crawfish|crayfish)\b/i;
const SOY_PATTERNS = /\b(soy|tofu|tempeh|edamame|miso|soy sauce|soy milk|soybean)\b/i;
const HIGH_CARB_PATTERNS = /\b(sugar|flour|bread|pasta|rice|potato|corn|honey|maple syrup|agave|noodle|tortilla|oat|cereal|cracker)\b/i;
const PORK_PATTERNS = /\b(pork|bacon|ham|prosciutto|pancetta|chorizo|salami|pepperoni|lard)\b/i;
const MEAT_WITH_DAIRY = /\b(milk|cheese|butter|cream|yogurt|sour cream|cream cheese|ricotta|mozzarella|parmesan|cheddar|brie|gouda|feta|ghee)\b/i;

// ── Diet profiles ───────────────────────────────────────────────────

const DIET_PROFILES = {
  vegetarian: {
    name: 'Vegetarian',
    description: 'No meat or fish — suggests plant-based alternatives',
    exclude: [MEAT_PATTERNS, FISH_PATTERNS],
    tagMatch: /vegetarian/i,
  },
  vegan: {
    name: 'Vegan',
    description: 'No animal products — suggests plant-based alternatives for everything',
    exclude: [MEAT_PATTERNS, FISH_PATTERNS, DAIRY_PATTERNS, EGG_PATTERNS],
    tagMatch: /vegan/i,
  },
  'gluten-free': {
    name: 'Gluten-Free',
    description: 'No gluten-containing grains — suggests GF alternatives',
    exclude: [GLUTEN_PATTERNS],
    tagMatch: /gluten.?free/i,
  },
  'dairy-free': {
    name: 'Dairy-Free',
    description: 'No dairy products — suggests plant-based dairy alternatives',
    exclude: [DAIRY_PATTERNS],
    tagMatch: /dairy.?free/i,
  },
  'nut-free': {
    name: 'Nut-Free',
    description: 'No tree nuts or peanuts — suggests seed-based alternatives',
    exclude: [NUT_PATTERNS],
    tagMatch: /nut.?free/i,
  },
  pescatarian: {
    name: 'Pescatarian',
    description: 'No meat (fish is okay) — suggests plant or fish alternatives for meat',
    exclude: [MEAT_PATTERNS],
    tagMatch: /pescatarian/i,
  },
  keto: {
    name: 'Keto',
    description: 'Low carb, high fat — suggests low-carb alternatives',
    exclude: [HIGH_CARB_PATTERNS],
    tagMatch: /keto|low.?carb/i,
  },
  'low-carb': {
    name: 'Low Carb',
    description: 'Reduced carbohydrates — suggests lower-carb alternatives',
    exclude: [HIGH_CARB_PATTERNS],
    tagMatch: /low.?carb/i,
  },
  paleo: {
    name: 'Paleo',
    description: 'No grains, dairy, or processed foods — suggests paleo-friendly alternatives',
    exclude: [GLUTEN_PATTERNS, DAIRY_PATTERNS, SOY_PATTERNS],
    tagMatch: /paleo/i,
  },
  'shellfish-free': {
    name: 'Shellfish-Free',
    description: 'No shellfish — suggests non-shellfish alternatives',
    exclude: [SHELLFISH_PATTERNS],
    tagMatch: /shellfish.?free/i,
  },
  kosher: {
    name: 'Kosher',
    description: 'No pork, no shellfish, no mixing meat and dairy — suggests kosher alternatives',
    exclude: [PORK_PATTERNS, SHELLFISH_PATTERNS],
    tagMatch: /kosher/i,
    // Special rule: if recipe has meat, flag dairy ingredients for removal/substitution
    meatDairySeparation: true,
  },
  halal: {
    name: 'Halal',
    description: 'No pork, no alcohol in cooking — suggests halal alternatives',
    exclude: [PORK_PATTERNS],
    tagMatch: /halal/i,
  },
};

// ── Core functions ──────────────────────────────────────────────────

/**
 * Find the best substitution for a flagged ingredient.
 */
function findSubstitution(ingredientText) {
  const lower = ingredientText.toLowerCase();

  // Try to match against our substitution database
  // Check longest keys first for better matching (e.g., "cream cheese" before "cream")
  const sortedKeys = Object.keys(SUBSTITUTIONS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      const subs = SUBSTITUTIONS[key];
      return {
        original: key,
        suggestions: subs.slice(0, 3), // Top 3 suggestions
        allOptions: subs,
      };
    }
  }

  return null;
}

/**
 * Check a recipe against a diet and return detailed adaptation info.
 * Instead of just pass/fail, returns what needs to change and how.
 *
 * @param {Object} recipe - RecipeDetail with ingredients array
 * @param {string} dietKey - Diet profile key
 * @returns {Object} Adaptation report
 */
export function checkDiet(recipe, dietKey) {
  const profile = DIET_PROFILES[dietKey];
  if (!profile) return { passes: true, flags: [], adaptations: [], adaptable: true };

  // First check tags — if explicitly tagged, trust it
  const allTags = [
    ...(recipe.tags || []),
    recipe.category || '',
    recipe.cuisine || '',
  ].join(' ');

  if (profile.tagMatch.test(allTags)) {
    return { passes: true, flags: [], adaptations: [], adaptable: true };
  }

  const flags = [];
  const adaptations = [];
  const ingredients = recipe.ingredients || [];

  // Check each ingredient individually
  for (const ing of ingredients) {
    for (const pattern of profile.exclude) {
      const match = ing.match(pattern);
      if (match) {
        const flaggedItem = match[0].toLowerCase();
        const sub = findSubstitution(flaggedItem);

        flags.push({
          ingredient: ing,
          flaggedItem,
          reason: `not ${profile.name}-compatible`,
        });

        adaptations.push({
          original: ing,
          flaggedItem,
          substitution: sub ? sub.suggestions : null,
          allOptions: sub ? sub.allOptions : null,
          action: sub ? 'substitute' : 'remove',
        });
      }
    }
  }

  // Special kosher handling: check for meat + dairy mixing
  if (profile.meatDairySeparation) {
    const allIngs = ingredients.join(' ');
    const hasMeat = MEAT_PATTERNS.test(allIngs) || FISH_PATTERNS.test(allIngs);

    if (hasMeat) {
      // Flag any dairy ingredients for substitution
      for (const ing of ingredients) {
        const dairyMatch = ing.match(MEAT_WITH_DAIRY);
        if (dairyMatch) {
          const flaggedItem = dairyMatch[0].toLowerCase();
          // Check if we already flagged this (from pork/shellfish check)
          const alreadyFlagged = flags.some(f => f.ingredient === ing);
          if (!alreadyFlagged) {
            const sub = findSubstitution(flaggedItem);
            flags.push({
              ingredient: ing,
              flaggedItem,
              reason: 'meat and dairy cannot be mixed (kosher)',
            });
            adaptations.push({
              original: ing,
              flaggedItem,
              substitution: sub ? sub.suggestions : ['use pareve/non-dairy alternative'],
              allOptions: sub ? sub.allOptions : null,
              action: 'substitute',
              reason: 'Kosher: separate meat and dairy',
            });
          }
        }
      }
    }
  }

  return {
    passes: flags.length === 0,
    flags,
    adaptations,
    adaptable: adaptations.every(a => a.substitution !== null),
    adaptationCount: adaptations.length,
  };
}

/**
 * Adapt a recipe for a specific diet — returns a modified recipe with substitutions applied.
 *
 * @param {Object} recipe - Full RecipeDetail object
 * @param {string|string[]} dietKeys - One or more diet profile keys
 * @returns {Object} Adapted recipe with modifications noted
 */
export function adaptRecipe(recipe, dietKeys) {
  const keys = Array.isArray(dietKeys) ? dietKeys : [dietKeys];
  const allAdaptations = [];
  const allFlags = [];

  // Collect all adaptations from all diets
  for (const key of keys) {
    const result = checkDiet(recipe, key);
    allFlags.push(...result.flags);
    allAdaptations.push(...result.adaptations);
  }

  if (allAdaptations.length === 0) {
    return {
      ...recipe,
      _dietaryAdapted: true,
      _diets: keys,
      _changes: [],
      _fullyCompatible: true,
    };
  }

  // Build a map of original ingredient → adapted ingredient
  const changes = [];
  const adaptedIngredients = recipe.ingredients.map(ing => {
    // Find all adaptations for this ingredient
    const applicable = allAdaptations.filter(a => a.original === ing);
    if (applicable.length === 0) return ing;

    // Use the first substitution suggestion
    const adaptation = applicable[0];
    if (adaptation.substitution && adaptation.substitution.length > 0) {
      const suggestion = adaptation.substitution[0];
      // Try to replace just the flagged part in the ingredient line
      const adapted = ing.replace(
        new RegExp(`\\b${escapeRegex(adaptation.flaggedItem)}\\b`, 'i'),
        suggestion
      );

      changes.push({
        original: ing,
        adapted,
        flaggedItem: adaptation.flaggedItem,
        replacedWith: suggestion,
        otherOptions: adaptation.substitution.slice(1),
        reason: adaptation.reason || `${adaptation.flaggedItem} replaced for dietary needs`,
      });

      return adapted;
    }

    // No substitution available — flag for removal
    changes.push({
      original: ing,
      adapted: null,
      flaggedItem: adaptation.flaggedItem,
      replacedWith: null,
      otherOptions: [],
      reason: `${adaptation.flaggedItem}: no suitable substitution found — consider removing`,
    });

    return `⚠️ ${ing} [needs manual substitution]`;
  });

  // Also adapt steps text to mention substitutions
  const adaptedSteps = recipe.steps ? recipe.steps.map(step => {
    let adapted = step;
    for (const change of changes) {
      if (change.replacedWith && adapted.toLowerCase().includes(change.flaggedItem)) {
        adapted = adapted.replace(
          new RegExp(`\\b${escapeRegex(change.flaggedItem)}\\b`, 'gi'),
          change.replacedWith
        );
      }
    }
    return adapted;
  }) : recipe.steps;

  return {
    ...recipe,
    ingredients: adaptedIngredients,
    steps: adaptedSteps,
    _dietaryAdapted: true,
    _diets: keys,
    _changes: changes,
    _fullyCompatible: changes.every(c => c.replacedWith !== null),
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Filter a list of recipes by diets, but don't throw any out.
 * Returns recipes sorted by compatibility (fully compatible first,
 * then easily adaptable, then harder to adapt).
 */
export function filterByDiet(recipes, dietKeys) {
  if (!dietKeys?.length) return recipes;

  const scored = recipes.map(recipe => {
    let totalFlags = 0;
    let totalAdaptable = 0;

    for (const key of dietKeys) {
      const result = checkDiet(recipe, key);
      totalFlags += result.flags.length;
      if (result.adaptable) totalAdaptable++;
    }

    return {
      recipe,
      flags: totalFlags,
      fullyCompatible: totalFlags === 0,
      adaptable: totalAdaptable === dietKeys.length,
    };
  });

  // Sort: fully compatible first, then adaptable, then the rest
  scored.sort((a, b) => {
    if (a.fullyCompatible !== b.fullyCompatible) return a.fullyCompatible ? -1 : 1;
    if (a.adaptable !== b.adaptable) return a.adaptable ? -1 : 1;
    return a.flags - b.flags;
  });

  return scored.map(s => ({
    ...s.recipe,
    _dietaryFlags: s.flags,
    _fullyCompatible: s.fullyCompatible,
    _adaptable: s.adaptable,
  }));
}

/**
 * Analyze a recipe for dietary compatibility across all profiles.
 */
export function analyzeDietary(recipe) {
  const results = {};
  for (const [key, profile] of Object.entries(DIET_PROFILES)) {
    const check = checkDiet(recipe, key);
    results[key] = {
      name: profile.name,
      compatible: check.passes,
      adaptable: check.adaptable,
      flaggedIngredients: check.flags.map(f => f.flaggedItem),
      adaptationCount: check.adaptations.length,
      adaptations: check.adaptations.map(a => ({
        item: a.flaggedItem,
        action: a.action,
        suggestion: a.substitution?.[0] || null,
        alternatives: a.substitution?.slice(1) || [],
      })),
    };
  }
  return results;
}

/**
 * Get list of available diet profiles.
 */
export function getAvailableDiets() {
  return Object.entries(DIET_PROFILES).map(([key, profile]) => ({
    key,
    name: profile.name,
    description: profile.description,
  }));
}

/**
 * Format adapted recipe for display.
 */
export function formatAdaptedRecipe(adaptedRecipe) {
  const lines = [`# ${adaptedRecipe.title}`];

  if (adaptedRecipe._diets?.length) {
    lines.push(`*Adapted for: ${adaptedRecipe._diets.join(', ')}*`);
  }

  if (adaptedRecipe._fullyCompatible) {
    lines.push('✅ No changes needed — this recipe is already compatible!\n');
  } else if (adaptedRecipe._changes?.length) {
    lines.push(`\n## Substitutions Made (${adaptedRecipe._changes.length}):\n`);
    for (const change of adaptedRecipe._changes) {
      if (change.replacedWith) {
        lines.push(`- **${change.flaggedItem}** → **${change.replacedWith}**`);
        if (change.otherOptions?.length) {
          lines.push(`  Other options: ${change.otherOptions.join(', ')}`);
        }
        if (change.reason) lines.push(`  _${change.reason}_`);
      } else {
        lines.push(`- ⚠️ **${change.flaggedItem}** — needs manual substitution`);
      }
    }
  }

  if (adaptedRecipe.ingredients?.length) {
    lines.push('\n## Ingredients');
    for (const ing of adaptedRecipe.ingredients) lines.push(`- ${ing}`);
  }

  if (adaptedRecipe.steps?.length) {
    lines.push('\n## Instructions');
    adaptedRecipe.steps.forEach((step, i) => lines.push(`\n**Step ${i + 1}:** ${step}`));
  }

  return lines.join('\n');
}

/**
 * Format dietary analysis for display.
 */
export function formatDietaryAnalysis(recipe, analysis) {
  const lines = [`# Dietary Analysis: ${recipe.title}\n`];

  const compatible = [];
  const adaptable = [];
  const incompatible = [];

  for (const [key, result] of Object.entries(analysis)) {
    if (result.compatible) {
      compatible.push(result.name);
    } else if (result.adaptable) {
      const subs = result.adaptations
        .filter(a => a.suggestion)
        .map(a => `${a.item} → ${a.suggestion}`)
        .join(', ');
      adaptable.push(`${result.name} (swap: ${subs})`);
    } else {
      incompatible.push(`${result.name} (contains: ${result.flaggedIngredients.join(', ')})`);
    }
  }

  if (compatible.length) {
    lines.push(`## ✅ Fully Compatible`);
    for (const d of compatible) lines.push(`- ${d}`);
    lines.push('');
  }

  if (adaptable.length) {
    lines.push(`## 🔄 Adaptable With Substitutions`);
    for (const d of adaptable) lines.push(`- ${d}`);
    lines.push('');
  }

  if (incompatible.length) {
    lines.push(`## ❌ Harder to Adapt`);
    for (const d of incompatible) lines.push(`- ${d}`);
    lines.push('');
  }

  return lines.join('\n');
}
