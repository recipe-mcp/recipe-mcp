/**
 * Recipe export formatter.
 *
 * Formats recipes, meal plans, and grocery lists for export to
 * external services like Notion, Google Docs, Google Keep, Apple
 * Reminders, Todoist, or plain markdown.
 *
 * The philosophy: rather than building integrations with each service,
 * format the data perfectly so that other MCP servers (Notion MCP,
 * Google MCP, etc.) can paste it directly. Users who have those
 * MCPs installed get seamless integration for free.
 */

/**
 * Export a recipe as formatted markdown (for Notion, Google Docs, etc.)
 */
export function exportRecipeMarkdown(recipe) {
  const lines = [`# ${recipe.title}`];
  if (recipe.author) lines.push(`*By ${recipe.author}*`);
  if (recipe.source) lines.push(`*Source: ${recipe.source}*`);
  if (recipe.description) lines.push(`\n${recipe.description}`);

  const meta = [];
  if (recipe.yieldText) meta.push(`**Yield:** ${recipe.yieldText}`);
  if (recipe.time) meta.push(`**Total Time:** ${recipe.time}`);
  if (recipe.prepTime) meta.push(`**Prep:** ${recipe.prepTime}`);
  if (recipe.cookTime) meta.push(`**Cook:** ${recipe.cookTime}`);
  if (meta.length) lines.push(`\n${meta.join(' | ')}`);

  if (recipe.ingredients?.length) {
    lines.push('\n## Ingredients');
    for (const ing of recipe.ingredients) lines.push(`- [ ] ${ing}`);
  }

  if (recipe.steps?.length) {
    lines.push('\n## Instructions');
    recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }

  if (recipe.nutrition) {
    lines.push('\n## Nutrition');
    for (const [k, v] of Object.entries(recipe.nutrition)) {
      if (!k.startsWith('@')) lines.push(`- ${k}: ${v}`);
    }
  }

  if (recipe.url) lines.push(`\n---\n*Original: ${recipe.url}*`);
  return lines.join('\n');
}

/**
 * Export a recipe as a checklist (for Google Keep, Apple Reminders, Todoist)
 */
export function exportRecipeChecklist(recipe) {
  const lines = [`${recipe.title}\n`];

  if (recipe.ingredients?.length) {
    lines.push('INGREDIENTS:');
    for (const ing of recipe.ingredients) lines.push(`☐ ${ing}`);
  }

  lines.push('\nSTEPS:');
  if (recipe.steps?.length) {
    recipe.steps.forEach((step, i) => lines.push(`☐ Step ${i + 1}: ${step}`));
  }

  return lines.join('\n');
}

/**
 * Export a grocery list as formatted text.
 */
export function exportGroceryList(groceryList) {
  if (!groceryList?.categories) return 'No grocery list to export.';

  const lines = ['# Grocery List\n'];

  for (const [category, items] of Object.entries(groceryList.categories)) {
    lines.push(`## ${category}`);
    for (const item of items) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export a grocery list as a simple checklist (for Keep/Reminders).
 */
export function exportGroceryChecklist(groceryList) {
  if (!groceryList?.categories) return 'No grocery list to export.';

  const lines = ['Grocery List\n'];

  for (const [category, items] of Object.entries(groceryList.categories)) {
    lines.push(`--- ${category} ---`);
    for (const item of items) lines.push(`☐ ${item}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export a meal plan as formatted markdown.
 */
export function exportMealPlan(mealPlan) {
  if (!mealPlan?.days) return 'No meal plan to export.';

  const lines = ['# Weekly Meal Plan\n'];

  for (const day of mealPlan.days) {
    lines.push(`## ${day.name}`);
    for (const meal of day.meals) {
      lines.push(`**${meal.type}:** ${meal.recipe?.title || 'TBD'}`);
      if (meal.recipe?.url) lines.push(`  ${meal.recipe.url}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export a meal plan as a simple list.
 */
export function exportMealPlanSimple(mealPlan) {
  if (!mealPlan?.days) return 'No meal plan to export.';

  const lines = ['Weekly Meal Plan\n'];

  for (const day of mealPlan.days) {
    const meals = day.meals.map(m => `${m.type}: ${m.recipe?.title || 'TBD'}`).join(' | ');
    lines.push(`${day.name}: ${meals}`);
  }

  return lines.join('\n');
}

/**
 * Export for Notion — structured as a Notion-friendly markdown page.
 */
export function exportForNotion(recipe) {
  const lines = [];
  lines.push(`# ${recipe.title}`);
  lines.push('');

  // Properties block (Notion databases love these)
  lines.push('| Property | Value |');
  lines.push('|----------|-------|');
  if (recipe.author) lines.push(`| Author | ${recipe.author} |`);
  if (recipe.source) lines.push(`| Source | ${recipe.source} |`);
  if (recipe.time) lines.push(`| Total Time | ${recipe.time} |`);
  if (recipe.yieldText) lines.push(`| Yield | ${recipe.yieldText} |`);
  if (recipe.rating) lines.push(`| Rating | ${recipe.rating}/5 |`);
  if (recipe.category) lines.push(`| Category | ${recipe.category} |`);
  if (recipe.cuisine) lines.push(`| Cuisine | ${recipe.cuisine} |`);
  lines.push('');

  if (recipe.description) {
    lines.push(`> ${recipe.description}`);
    lines.push('');
  }

  if (recipe.ingredients?.length) {
    lines.push('## Ingredients');
    for (const ing of recipe.ingredients) lines.push(`- [ ] ${ing}`);
    lines.push('');
  }

  if (recipe.steps?.length) {
    lines.push('## Instructions');
    recipe.steps.forEach((step, i) => {
      lines.push(`### Step ${i + 1}`);
      lines.push(step);
      lines.push('');
    });
  }

  if (recipe.tags?.length) {
    lines.push(`**Tags:** ${recipe.tags.map(t => `#${t}`).join(' ')}`);
  }

  if (recipe.url) lines.push(`\n[Original Recipe](${recipe.url})`);

  return lines.join('\n');
}

/**
 * Master export function — routes to the right formatter.
 */
export function exportRecipe(recipe, format = 'markdown') {
  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      return { format: 'Markdown', content: exportRecipeMarkdown(recipe) };
    case 'checklist':
    case 'keep':
    case 'reminders':
    case 'todoist':
      return { format: 'Checklist', content: exportRecipeChecklist(recipe) };
    case 'notion':
      return { format: 'Notion', content: exportForNotion(recipe) };
    default:
      return { format: 'Markdown', content: exportRecipeMarkdown(recipe) };
  }
}
