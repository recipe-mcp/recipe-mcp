/**
 * Cooking Timer / Step Tracker — Premium Feature
 *
 * Parses recipe steps to extract timing information and creates
 * a structured cooking timeline. Useful for LLM assistants to
 * guide users through a recipe step by step.
 */

// ── Time extraction ──────────────────────────────────────────────────

const TIME_PATTERNS = [
  /(\d+)\s*(?:to|-)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i,
  /(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i,
  /(overnight|a few hours|several hours)/i,
];

function parseTimeToMinutes(text) {
  // Range pattern: "5 to 10 minutes"
  const range = text.match(TIME_PATTERNS[0]);
  if (range) {
    const unit = range[3].toLowerCase();
    const min = parseFloat(range[1]);
    const max = parseFloat(range[2]);
    const avg = (min + max) / 2;
    if (unit.startsWith('hour') || unit.startsWith('hr')) return avg * 60;
    if (unit.startsWith('sec')) return avg / 60;
    return avg;
  }

  // Simple pattern: "10 minutes"
  const simple = text.match(TIME_PATTERNS[1]);
  if (simple) {
    const val = parseFloat(simple[1]);
    const unit = simple[2].toLowerCase();
    if (unit.startsWith('hour') || unit.startsWith('hr')) return val * 60;
    if (unit.startsWith('sec')) return val / 60;
    return val;
  }

  // Descriptive patterns
  if (/overnight/i.test(text)) return 480;
  if (/a few hours/i.test(text)) return 180;
  if (/several hours/i.test(text)) return 300;

  return 0;
}

/**
 * Action keywords that indicate what's happening in a step.
 */
const ACTION_KEYWORDS = {
  prep: /\b(chop|dice|mince|slice|peel|wash|rinse|drain|pat dry|trim|debone|devein|grate|zest|juice|measure|whisk together)\b/i,
  cook: /\b(cook|sauté|fry|stir.?fry|brown|sear|boil|simmer|braise|roast|bake|grill|broil|steam|poach|blanch|caramelize|deglaze|reduce|deep.?fry)\b/i,
  wait: /\b(rest|cool|chill|refrigerate|marinate|rise|proof|set|thaw|freeze|let stand)\b/i,
  mix: /\b(mix|combine|stir|fold|toss|blend|whisk|beat|cream|knead|incorporate)\b/i,
  serve: /\b(serve|plate|garnish|top with|drizzle|sprinkle|arrange)\b/i,
};

function categorizeStep(text) {
  for (const [category, pattern] of Object.entries(ACTION_KEYWORDS)) {
    if (pattern.test(text)) return category;
  }
  return 'cook';
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Parse a recipe into a cooking timeline with timing info.
 *
 * @param {Object} recipe - RecipeDetail object
 * @returns {Object} Timeline with steps, times, and total
 */
export function createTimeline(recipe) {
  const timeline = recipe.steps.map((text, index) => {
    const minutes = parseTimeToMinutes(text);
    const category = categorizeStep(text);

    return {
      step: index + 1,
      text,
      category,
      minutes,
      formattedTime: minutes > 0
        ? minutes >= 60
          ? `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`
          : `${Math.round(minutes)}m`
        : null,
    };
  });

  const totalMinutes = timeline.reduce((sum, s) => sum + s.minutes, 0);
  const activeMinutes = timeline.filter(s => s.category !== 'wait').reduce((sum, s) => sum + s.minutes, 0);
  const waitMinutes = totalMinutes - activeMinutes;

  return {
    title: recipe.title,
    steps: timeline,
    totalSteps: timeline.length,
    estimatedTotal: totalMinutes,
    activeTime: activeMinutes,
    passiveTime: waitMinutes,
    formattedTotal: totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`
      : `${Math.round(totalMinutes)}m`,
  };
}

/**
 * Get the next step in a cooking session.
 * Stateless — the LLM tracks which step the user is on.
 */
export function getStep(timeline, stepNumber) {
  const step = timeline.steps.find(s => s.step === stepNumber);
  if (!step) return null;

  const remaining = timeline.steps
    .filter(s => s.step > stepNumber)
    .reduce((sum, s) => sum + s.minutes, 0);

  return {
    ...step,
    isFirst: stepNumber === 1,
    isLast: stepNumber === timeline.totalSteps,
    stepsRemaining: timeline.totalSteps - stepNumber,
    timeRemaining: remaining,
    formattedRemaining: remaining >= 60
      ? `${Math.floor(remaining / 60)}h ${Math.round(remaining % 60)}m`
      : `${Math.round(remaining)} min`,
  };
}

/**
 * Format a timeline for display.
 */
export function formatTimeline(timeline) {
  const lines = [
    `# Cooking Timeline: ${timeline.title}`,
    `Total: ${timeline.formattedTotal} (Active: ${Math.round(timeline.activeTime)}m | Passive: ${Math.round(timeline.passiveTime)}m)`,
    `Steps: ${timeline.totalSteps}\n`,
  ];

  const icons = { prep: '🔪', cook: '🍳', wait: '⏰', mix: '🥄', serve: '🍽️' };

  for (const step of timeline.steps) {
    const icon = icons[step.category] || '📋';
    const time = step.formattedTime ? ` [${step.formattedTime}]` : '';
    lines.push(`**${icon} Step ${step.step}**${time}`);
    lines.push(step.text);
    lines.push('');
  }

  return lines.join('\n');
}
