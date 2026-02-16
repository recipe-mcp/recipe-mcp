/**
 * recipe-mcp — Public API
 *
 * Import this module for programmatic access to the multi-source recipe system.
 */

// Register all built-in adapters
import './adapters/index.js';

// Re-export the core API
export {
  registerAdapter,
  getAdapter,
  getAllAdapters,
  getReadyAdapters,
  getAdaptersWithCapability,
  searchAll,
  getRecipeFrom,
} from './core/registry.js';

export { RecipeAdapter } from './core/adapter.js';
export { Capabilities } from './core/types.js';
export { configGet, configSet, configGetAdapter, configSetAdapter } from './core/config.js';

// License system
export { getCurrentTier, getTierConfig, hasPremiumFeatures, activateLicense, getLicenseStatus } from './core/license.js';

// Premium features — dietary adaptation
export { checkDiet, adaptRecipe, filterByDiet, analyzeDietary, getAvailableDiets, formatAdaptedRecipe, formatDietaryAnalysis } from './premium/dietary-filter.js';

// Premium features — recipe scaling & conversion
export { scaleRecipe, convertUnits, formatScaledRecipe } from './premium/recipe-scaler.js';

// Premium features — ingredient search
export { searchByIngredients, formatIngredientSearch } from './premium/ingredient-search.js';

// Premium features — cooking timeline
export { createTimeline, getStep, formatTimeline } from './premium/cooking-timer.js';

// Premium features — meal planning & grocery
export { generateMealPlan, saveMealPlan, loadMealPlan, formatMealPlan } from './premium/meal-planner.js';
export { generateGroceryList, groceryListFromMealPlan, formatGroceryList } from './premium/grocery-list.js';

// Export individual adapters for direct use
export { TheMealDbAdapter } from './adapters/themealdb.js';
export { TheCocktailDbAdapter } from './adapters/thecocktaildb.js';
export { DummyJsonAdapter } from './adapters/dummyjson.js';
export { RecipePuppyAdapter } from './adapters/recipepuppy.js';
export { WebRecipeAdapter } from './adapters/webrecipe.js';
export { SpoonacularAdapter } from './adapters/spoonacular.js';
export { EdamamAdapter } from './adapters/edamam.js';
export { TastyAdapter } from './adapters/tasty.js';
export { NytAdapter } from './adapters/nyt.js';
