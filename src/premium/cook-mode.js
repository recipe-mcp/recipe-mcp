/**
 * Cook mode — step-by-step recipe walker.
 *
 * Breaks a recipe into individual steps that can be navigated
 * one at a time. Perfect for hands-free cooking with a voice assistant.
 *
 * "Next step" / "What step am I on?" / "Read me step 3"
 */

import { configGet, configSet } from '../core/config.js';

const COOK_MODE_KEY = 'cook_mode';

/**
 * Start cook mode for a recipe.
 */
export function startCookMode(recipe) {
  const session = {
    recipeId: recipe.id,
    source: recipe.source,
    title: recipe.title,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    currentStep: 0,
    startedAt: new Date().toISOString(),
    timers: [],
  };

  configSet(COOK_MODE_KEY, session);
  return session;
}

/**
 * Get the current cook mode session.
 */
export function getCookSession() {
  return configGet(COOK_MODE_KEY) || null;
}

/**
 * Get the current step.
 */
export function getCurrentStep() {
  const session = getCookSession();
  if (!session) return null;
  return {
    stepNumber: session.currentStep + 1,
    totalSteps: session.steps.length,
    text: session.steps[session.currentStep] || 'No more steps!',
    isFirst: session.currentStep === 0,
    isLast: session.currentStep >= session.steps.length - 1,
  };
}

/**
 * Move to the next step.
 */
export function nextStep() {
  const session = getCookSession();
  if (!session) return null;

  if (session.currentStep < session.steps.length - 1) {
    session.currentStep++;
    configSet(COOK_MODE_KEY, session);
  }

  return getCurrentStep();
}

/**
 * Move to the previous step.
 */
export function prevStep() {
  const session = getCookSession();
  if (!session) return null;

  if (session.currentStep > 0) {
    session.currentStep--;
    configSet(COOK_MODE_KEY, session);
  }

  return getCurrentStep();
}

/**
 * Jump to a specific step.
 */
export function goToStep(stepNum) {
  const session = getCookSession();
  if (!session) return null;

  const idx = stepNum - 1;
  if (idx >= 0 && idx < session.steps.length) {
    session.currentStep = idx;
    configSet(COOK_MODE_KEY, session);
  }

  return getCurrentStep();
}

/**
 * End cook mode.
 */
export function endCookMode() {
  const session = getCookSession();
  configSet(COOK_MODE_KEY, null);
  return session;
}

/**
 * Format a cook mode step for display.
 */
export function formatCookStep(step, session) {
  if (!step) return 'No active cooking session. Use `recipe_cook` to start cook mode with a recipe!';

  const lines = [];

  // Show recipe title on first step
  if (step.isFirst && session) {
    lines.push(`# 🍳 Cook Mode: ${session.title}\n`);
    if (session.ingredients?.length) {
      lines.push('**Ingredients:**');
      for (const ing of session.ingredients) {
        lines.push(`- ${ing}`);
      }
      lines.push('');
    }
  }

  // Progress bar
  const progress = Math.round((step.stepNumber / step.totalSteps) * 100);
  const filled = Math.round(progress / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  lines.push(`**Step ${step.stepNumber} of ${step.totalSteps}** [${bar}] ${progress}%\n`);

  // The step text
  lines.push(step.text);
  lines.push('');

  // Navigation hints
  const nav = [];
  if (!step.isFirst) nav.push('⬅️ "previous step"');
  if (!step.isLast) nav.push('➡️ "next step"');
  else nav.push('✅ "done cooking" to finish');

  lines.push(`_${nav.join(' | ')}_`);

  return lines.join('\n');
}

/**
 * Format cook mode start summary.
 */
export function formatCookStart(session) {
  const step = {
    stepNumber: 1,
    totalSteps: session.steps.length,
    text: session.steps[0] || 'No steps found.',
    isFirst: true,
    isLast: session.steps.length <= 1,
  };

  return formatCookStep(step, session);
}
