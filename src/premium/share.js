/**
 * Recipe sharing — format recipes for sharing on Slack, Discord, text, etc.
 *
 * Generates clean, compact recipe cards in different formats.
 */

/**
 * Format a recipe as a compact shareable card.
 */
export function formatShareCard(recipe, format = 'text') {
  switch (format) {
    case 'slack':
      return formatForSlack(recipe);
    case 'discord':
      return formatForDiscord(recipe);
    case 'text':
    case 'sms':
      return formatForText(recipe);
    case 'markdown':
    case 'md':
      return formatForMarkdown(recipe);
    default:
      return formatForText(recipe);
  }
}

function formatForSlack(recipe) {
  const lines = [];
  lines.push(`*${recipe.title}*`);
  if (recipe.author) lines.push(`_by ${recipe.author}_`);
  if (recipe.time) lines.push(`⏱️ ${recipe.time}`);
  if (recipe.yieldText) lines.push(`🍽️ ${recipe.yieldText}`);
  lines.push('');

  if (recipe.ingredients?.length) {
    lines.push('*Ingredients:*');
    lines.push(recipe.ingredients.map(i => `• ${i}`).join('\n'));
    lines.push('');
  }

  if (recipe.steps?.length) {
    lines.push('*Instructions:*');
    recipe.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }

  if (recipe.url) lines.push(`\n<${recipe.url}|View original recipe>`);
  return lines.join('\n');
}

function formatForDiscord(recipe) {
  const lines = [];
  lines.push(`**${recipe.title}**`);
  if (recipe.author) lines.push(`*by ${recipe.author}*`);
  if (recipe.time) lines.push(`⏱️ ${recipe.time}`);
  lines.push('');

  if (recipe.ingredients?.length) {
    lines.push('**Ingredients:**');
    lines.push('```');
    lines.push(recipe.ingredients.join('\n'));
    lines.push('```');
  }

  if (recipe.steps?.length) {
    lines.push('**Instructions:**');
    recipe.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }

  if (recipe.url) lines.push(`\n${recipe.url}`);
  return lines.join('\n');
}

function formatForText(recipe) {
  const lines = [];
  lines.push(`🍳 ${recipe.title}`);
  if (recipe.author) lines.push(`By ${recipe.author}`);
  if (recipe.time) lines.push(`Time: ${recipe.time}`);
  lines.push('');

  if (recipe.ingredients?.length) {
    lines.push('Ingredients:');
    for (const ing of recipe.ingredients) lines.push(`- ${ing}`);
    lines.push('');
  }

  if (recipe.steps?.length) {
    lines.push('Steps:');
    recipe.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }

  if (recipe.url) lines.push(`\nFull recipe: ${recipe.url}`);
  return lines.join('\n');
}

function formatForMarkdown(recipe) {
  const lines = [];
  lines.push(`## ${recipe.title}`);
  if (recipe.author) lines.push(`*By ${recipe.author}*`);

  const meta = [];
  if (recipe.time) meta.push(`⏱️ ${recipe.time}`);
  if (recipe.yieldText) meta.push(`🍽️ ${recipe.yieldText}`);
  if (meta.length) lines.push(meta.join(' | '));
  lines.push('');

  if (recipe.ingredients?.length) {
    lines.push('### Ingredients');
    for (const ing of recipe.ingredients) lines.push(`- ${ing}`);
    lines.push('');
  }

  if (recipe.steps?.length) {
    lines.push('### Instructions');
    recipe.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }

  if (recipe.url) lines.push(`\n[Original recipe](${recipe.url})`);
  return lines.join('\n');
}
