/**
 * Smart ingredient substitutions.
 *
 * "I don't have heavy cream" → suggests alternatives with adjusted quantities.
 * Goes beyond dietary adaptation into practical cooking substitutions.
 */

// Comprehensive substitution database
// Each entry: ingredient → array of { sub, ratio, notes }
const SUBSTITUTIONS = {
  // Dairy
  'heavy cream': [
    { sub: 'coconut cream', ratio: '1:1', notes: 'Works great in curries and soups. Adds slight coconut flavor.' },
    { sub: 'milk + butter', ratio: '3/4 cup milk + 1/3 cup melted butter per cup', notes: 'Good for sauces, not for whipping.' },
    { sub: 'evaporated milk', ratio: '1:1', notes: 'Similar richness. Works in most cooked dishes.' },
    { sub: 'cashew cream', ratio: '1:1', notes: 'Blend soaked cashews with water. Great vegan option.' },
    { sub: 'silken tofu', ratio: '1:1 (blended smooth)', notes: 'Works in creamy soups and sauces. High protein.' },
  ],
  'butter': [
    { sub: 'coconut oil', ratio: '1:1', notes: 'Solid at room temperature like butter. Slight coconut taste.' },
    { sub: 'olive oil', ratio: '3/4 the amount', notes: 'Works for sautéing. Not ideal for baking.' },
    { sub: 'applesauce', ratio: '1/2 the amount', notes: 'For baking only. Reduces calories and adds moisture.' },
    { sub: 'avocado', ratio: '1:1', notes: 'For baking. Creates moist texture.' },
    { sub: 'ghee', ratio: '1:1', notes: 'Clarified butter. Higher smoke point. Lactose-free.' },
  ],
  'milk': [
    { sub: 'oat milk', ratio: '1:1', notes: 'Creamy texture, neutral flavor. Best all-purpose dairy-free milk.' },
    { sub: 'almond milk', ratio: '1:1', notes: 'Lighter. Works in most recipes. Nutty flavor.' },
    { sub: 'coconut milk', ratio: '1:1', notes: 'Richer. Great in curries and desserts.' },
    { sub: 'soy milk', ratio: '1:1', notes: 'Most similar protein content to cow\'s milk.' },
  ],
  'sour cream': [
    { sub: 'Greek yogurt', ratio: '1:1', notes: 'Nearly identical. Slightly tangier.' },
    { sub: 'cottage cheese (blended)', ratio: '1:1', notes: 'Blend until smooth. Higher protein.' },
    { sub: 'cashew cream + lemon juice', ratio: '1:1', notes: 'Vegan option. Blend soaked cashews with lemon.' },
  ],
  'cream cheese': [
    { sub: 'Greek yogurt (strained)', ratio: '1:1', notes: 'Strain through cheesecloth. Lower calorie.' },
    { sub: 'ricotta', ratio: '1:1', notes: 'Slightly grainier texture.' },
    { sub: 'silken tofu + lemon juice', ratio: '1:1', notes: 'Blend smooth. Vegan option.' },
  ],
  'cheese': [
    { sub: 'nutritional yeast', ratio: '2 tbsp per 1/4 cup cheese', notes: 'Adds cheesy flavor. Great on pasta.' },
    { sub: 'cashew cheese', ratio: '1:1', notes: 'Blend soaked cashews with nutritional yeast and lemon.' },
  ],
  'egg': [
    { sub: 'flax egg', ratio: '1 tbsp ground flax + 3 tbsp water per egg', notes: 'Let sit 5 min. Good for baking.' },
    { sub: 'chia egg', ratio: '1 tbsp chia seeds + 3 tbsp water per egg', notes: 'Let sit 5 min. Works like flax.' },
    { sub: 'mashed banana', ratio: '1/4 cup per egg', notes: 'For baking. Adds sweetness and moisture.' },
    { sub: 'applesauce', ratio: '1/4 cup per egg', notes: 'For baking. Adds moisture.' },
    { sub: 'silken tofu', ratio: '1/4 cup blended per egg', notes: 'For baking. Neutral flavor.' },
    { sub: 'aquafaba', ratio: '3 tbsp per egg', notes: 'Chickpea liquid. Can even whip to stiff peaks!' },
  ],
  'eggs': [
    { sub: 'flax eggs', ratio: '1 tbsp ground flax + 3 tbsp water per egg', notes: 'Let sit 5 min. Good for baking.' },
    { sub: 'chia eggs', ratio: '1 tbsp chia seeds + 3 tbsp water per egg', notes: 'Let sit 5 min.' },
    { sub: 'aquafaba', ratio: '3 tbsp per egg', notes: 'Chickpea liquid. Whips like egg whites!' },
  ],

  // Baking
  'all-purpose flour': [
    { sub: 'whole wheat flour', ratio: '1:1 (use 3/4 for lighter result)', notes: 'Denser texture. More nutritious.' },
    { sub: 'almond flour', ratio: '1:1', notes: 'Gluten-free. Higher fat. Great for cookies.' },
    { sub: 'oat flour', ratio: '1:1', notes: 'Blend oats into powder. Slightly sweet.' },
    { sub: '1:1 gluten-free flour blend', ratio: '1:1', notes: 'Bob\'s Red Mill or King Arthur work well.' },
  ],
  'sugar': [
    { sub: 'honey', ratio: '3/4 cup per 1 cup sugar', notes: 'Reduce liquid by 2 tbsp. Lower oven temp by 25°F.' },
    { sub: 'maple syrup', ratio: '3/4 cup per 1 cup sugar', notes: 'Reduce liquid by 3 tbsp.' },
    { sub: 'coconut sugar', ratio: '1:1', notes: 'Lower glycemic index. Slight caramel flavor.' },
    { sub: 'date paste', ratio: '2/3 cup per 1 cup sugar', notes: 'Blend pitted dates with water. Adds fiber.' },
  ],
  'brown sugar': [
    { sub: 'white sugar + molasses', ratio: '1 cup sugar + 1 tbsp molasses', notes: 'Mix well. Exact replacement.' },
    { sub: 'coconut sugar', ratio: '1:1', notes: 'Similar flavor profile.' },
    { sub: 'maple syrup', ratio: '3/4 cup per cup', notes: 'Reduce other liquids slightly.' },
  ],
  'baking powder': [
    { sub: 'baking soda + cream of tartar', ratio: '1/4 tsp soda + 1/2 tsp cream of tartar per 1 tsp powder', notes: 'Mix fresh for best results.' },
    { sub: 'self-rising flour', ratio: 'Replace regular flour with self-rising and omit powder', notes: 'Adjust recipe accordingly.' },
  ],
  'cornstarch': [
    { sub: 'arrowroot powder', ratio: '1:1', notes: 'Freezes well. Clear finish.' },
    { sub: 'tapioca starch', ratio: '2 tbsp per 1 tbsp cornstarch', notes: 'Good for fruit pies.' },
    { sub: 'all-purpose flour', ratio: '2 tbsp per 1 tbsp cornstarch', notes: 'Cook longer to remove raw flour taste.' },
  ],
  'vanilla extract': [
    { sub: 'maple syrup', ratio: '1:1', notes: 'Different flavor but adds similar warmth and sweetness.' },
    { sub: 'almond extract', ratio: '1/2 the amount', notes: 'Stronger flavor. Use less.' },
    { sub: 'vanilla bean paste', ratio: '1:1', notes: 'Adds visible vanilla specks.' },
  ],

  // Proteins
  'chicken': [
    { sub: 'tofu (extra firm, pressed)', ratio: '1:1 by weight', notes: 'Press well, cube, and bake or pan-fry until crispy.' },
    { sub: 'chickpeas', ratio: '1 can per 1 lb chicken', notes: 'Great in curries, salads, and bowls.' },
    { sub: 'cauliflower', ratio: '1 head per 1 lb chicken', notes: 'Roast with same seasonings. Surprisingly satisfying.' },
    { sub: 'turkey', ratio: '1:1', notes: 'Very similar. Slightly leaner.' },
    { sub: 'jackfruit (canned, young)', ratio: '1 can per 1 lb', notes: 'Shreds like pulled chicken. Great in tacos.' },
  ],
  'ground beef': [
    { sub: 'ground turkey', ratio: '1:1', notes: 'Leaner. Add a bit more fat/oil for moisture.' },
    { sub: 'ground chicken', ratio: '1:1', notes: 'Very lean. Works in most recipes.' },
    { sub: 'lentils (cooked)', ratio: '1:1 by volume', notes: 'Great in tacos, pasta sauce, chili.' },
    { sub: 'mushrooms (finely chopped)', ratio: '1:1', notes: 'Sautée until dark. Rich umami flavor.' },
    { sub: 'Beyond/Impossible meat', ratio: '1:1', notes: 'Plant-based. Cooks similarly.' },
  ],

  // Common cooking ingredients
  'soy sauce': [
    { sub: 'coconut aminos', ratio: '1:1', notes: 'Soy-free, lower sodium. Slightly sweeter.' },
    { sub: 'tamari', ratio: '1:1', notes: 'Gluten-free soy sauce. Same flavor.' },
    { sub: 'Worcestershire sauce', ratio: '1:1', notes: 'Different flavor profile but similar umami.' },
  ],
  'rice vinegar': [
    { sub: 'apple cider vinegar', ratio: '1:1 (add pinch of sugar)', notes: 'A bit stronger. Sugar balances it.' },
    { sub: 'white wine vinegar', ratio: '1:1', notes: 'Similar acidity level.' },
    { sub: 'lemon juice', ratio: '1:1', notes: 'Different flavor but same acidity.' },
  ],
  'wine': [
    { sub: 'broth + splash of vinegar', ratio: '1:1', notes: 'Use chicken/veggie broth + 1 tsp vinegar per cup.' },
    { sub: 'grape juice + vinegar', ratio: '1:1', notes: 'For red wine. Add 1 tbsp vinegar per cup.' },
  ],
  'lemon juice': [
    { sub: 'lime juice', ratio: '1:1', notes: 'Nearly identical acidity.' },
    { sub: 'white vinegar', ratio: '1/2 the amount', notes: 'More acidic. Use less.' },
    { sub: 'orange juice', ratio: '1:1', notes: 'Sweeter. Works in some recipes.' },
  ],
  'honey': [
    { sub: 'maple syrup', ratio: '1:1', notes: 'Different flavor. Works in most recipes.' },
    { sub: 'agave nectar', ratio: '1:1', notes: 'Vegan. Thinner consistency.' },
    { sub: 'brown sugar', ratio: '3/4 cup per 1 cup honey', notes: 'Add 1/4 cup more liquid to recipe.' },
  ],
  'breadcrumbs': [
    { sub: 'crushed crackers', ratio: '1:1', notes: 'Saltines or Ritz work great.' },
    { sub: 'panko', ratio: '1:1', notes: 'Lighter, crispier texture.' },
    { sub: 'crushed cornflakes', ratio: '1:1', notes: 'Extra crispy coating.' },
    { sub: 'almond flour', ratio: '1:1', notes: 'Gluten-free option.' },
    { sub: 'crushed pork rinds', ratio: '1:1', notes: 'Keto/low-carb option.' },
  ],
};

/**
 * Find substitutions for an ingredient.
 */
export function findSubstitutions(ingredient) {
  const normalized = ingredient.toLowerCase().trim();

  // Direct match
  if (SUBSTITUTIONS[normalized]) {
    return { ingredient: normalized, substitutions: SUBSTITUTIONS[normalized] };
  }

  // Partial match — check if the ingredient contains a known key
  for (const [key, subs] of Object.entries(SUBSTITUTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { ingredient: key, substitutions: subs };
    }
  }

  return { ingredient: normalized, substitutions: [] };
}

/**
 * Find substitutions for multiple ingredients in a recipe.
 */
export function findRecipeSubstitutions(ingredients, missing) {
  const results = [];

  for (const item of missing) {
    const result = findSubstitutions(item);
    if (result.substitutions.length) {
      results.push(result);
    } else {
      results.push({ ingredient: item, substitutions: [{ sub: '(no substitution found)', ratio: '', notes: 'Try searching online for alternatives.' }] });
    }
  }

  return results;
}

/**
 * Format substitution results for display.
 */
export function formatSubstitutions(results) {
  if (!results.length) return 'No ingredients specified to substitute.';

  const lines = ['# Smart Substitutions\n'];

  for (const result of results) {
    lines.push(`## ${result.ingredient}`);
    for (const sub of result.substitutions) {
      lines.push(`- **${sub.sub}**${sub.ratio ? ` (${sub.ratio})` : ''}`);
      if (sub.notes) lines.push(`  ${sub.notes}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get all known substitutable ingredients.
 */
export function getKnownIngredients() {
  return Object.keys(SUBSTITUTIONS).sort();
}
