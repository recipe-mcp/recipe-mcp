/**
 * License key system — 3-tier pricing.
 *
 * Simple key validation that works offline. Keys are validated against
 * a remote server on first use, then cached locally. The free tier
 * works without any key.
 *
 * Tiers:
 *   - free:    TheMealDB + free sources, basic search/get/random
 *   - plus:    All 9 sources (NYT, Spoonacular, Edamam, Tasty, etc.)
 *   - pro:     All sources + all premium features (dietary, scaling, meals, etc.)
 *
 * Integration: LemonSqueezy or Gumroad for payment, which generates
 * license keys that this module validates.
 */

import { configGet, configSet } from './config.js';

// Sources that work without any API key
const FREE_SOURCES = ['themealdb', 'thecocktaildb', 'dummyjson', 'recipepuppy', 'webrecipe'];

const TIERS = {
  free: {
    name: 'Free',
    price: '$0',
    allowedSources: FREE_SOURCES,
    premiumFeatures: false,
    searchLimit: 50,              // per day
    description: 'Basic search from free recipe databases',
  },
  plus: {
    name: 'Plus',
    price: '$8/year',
    allowedSources: null,         // all sources
    premiumFeatures: false,
    searchLimit: Infinity,
    description: 'All 9 recipe sources including NYT Cooking, Spoonacular, Edamam, Tasty',
  },
  pro: {
    name: 'Pro',
    price: '$19/year',
    allowedSources: null,         // all sources
    premiumFeatures: true,
    searchLimit: Infinity,
    description: 'Everything in Plus + dietary adaptation, recipe scaling, meal planning, grocery lists, cooking timelines, ingredient search',
  },
};

/**
 * Get the current license tier.
 */
export function getCurrentTier() {
  const license = configGet('license');
  if (!license?.key) return 'free';
  if (license.tier === 'pro') return 'pro';
  if (license.tier === 'plus') return 'plus';
  return 'free';
}

/**
 * Get the tier configuration.
 */
export function getTierConfig(tier) {
  return TIERS[tier] || TIERS.free;
}

/**
 * Get the current tier configuration.
 */
export function getCurrentTierConfig() {
  return getTierConfig(getCurrentTier());
}

/**
 * Check if a source is allowed under the current license.
 */
export function isSourceAllowed(sourceKey) {
  const config = getCurrentTierConfig();
  if (config.allowedSources === null) return true;
  return config.allowedSources.includes(sourceKey);
}

/**
 * Check if premium features are available.
 */
export function hasPremiumFeatures() {
  return getCurrentTierConfig().premiumFeatures;
}

/**
 * Check if the user has at least Plus tier (unlocks all sources).
 */
export function hasAllSources() {
  const tier = getCurrentTier();
  return tier === 'plus' || tier === 'pro';
}

/**
 * Activate a license key.
 * In production, this would validate against a remote server (e.g., LemonSqueezy API).
 * For now, it does a simple format check and stores locally.
 *
 * Key format:
 *   RMCP-PLUS-XXXX-XXXX  → Plus tier
 *   RMCP-PRO0-XXXX-XXXX  → Pro tier
 *   RMCP-XXXX-XXXX-XXXX  → Pro tier (legacy format)
 *
 * @param {string} key - License key
 * @returns {{ success: boolean, message: string }}
 */
export async function activateLicense(key) {
  if (!key || typeof key !== 'string') {
    return { success: false, message: 'No license key provided.' };
  }

  const trimmed = key.trim().toUpperCase();

  // Basic format validation
  if (!/^RMCP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed)) {
    return { success: false, message: 'Invalid key format. Expected: RMCP-XXXX-XXXX-XXXX' };
  }

  // TODO: In production, validate against LemonSqueezy/Gumroad API:
  //
  // const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ license_key: trimmed }),
  // });
  // const data = await res.json();
  // if (!data.valid) return { success: false, message: data.error };
  // const tier = data.meta.tier; // 'plus' or 'pro'

  // Determine tier from key prefix (in production, this comes from the payment provider)
  let tier = 'pro'; // default
  if (trimmed.startsWith('RMCP-PLUS')) {
    tier = 'plus';
  } else if (trimmed.startsWith('RMCP-PRO')) {
    tier = 'pro';
  }

  const tierConfig = TIERS[tier];

  configSet('license', {
    key: trimmed,
    tier,
    activatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: `License activated! You now have ${tierConfig.name} access (${tierConfig.price}).\n${tierConfig.description}`,
  };
}

/**
 * Deactivate the current license.
 */
export function deactivateLicense() {
  configSet('license', null);
}

/**
 * Get license status info.
 */
export function getLicenseStatus() {
  const license = configGet('license');
  const tier = getCurrentTier();
  const config = getTierConfig(tier);

  return {
    tier,
    tierName: config.name,
    tierPrice: config.price,
    key: license?.key || null,
    activatedAt: license?.activatedAt || null,
    premiumFeatures: config.premiumFeatures,
    allowedSources: config.allowedSources,
    description: config.description,
  };
}

/**
 * Get all tier info for display.
 */
export function getAllTiers() {
  return Object.entries(TIERS).map(([key, config]) => ({
    key,
    ...config,
  }));
}
