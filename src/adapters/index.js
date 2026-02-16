/**
 * Adapter auto-registration.
 * Import this module to register all built-in adapters.
 *
 * 10 sources total:
 *   Free (no auth):  TheMealDB, TheCocktailDB, DummyJSON, RecipePuppy, Web Recipe
 *   Free (API key):  Spoonacular, Edamam, Tasty
 *   Subscription:    NYT Cooking
 */

import { registerAdapter } from '../core/registry.js';

// Free, no auth required
import { TheMealDbAdapter } from './themealdb.js';
import { TheCocktailDbAdapter } from './thecocktaildb.js';
import { DummyJsonAdapter } from './dummyjson.js';
import { RecipePuppyAdapter } from './recipepuppy.js';
import { WebRecipeAdapter } from './webrecipe.js';

// Free tier with API key
import { SpoonacularAdapter } from './spoonacular.js';
import { EdamamAdapter } from './edamam.js';
import { TastyAdapter } from './tasty.js';

// Subscription (bring your own credentials)
import { NytAdapter } from './nyt.js';

// Register in order: free first, then freemium, then paid
registerAdapter(new TheMealDbAdapter());
registerAdapter(new TheCocktailDbAdapter());
registerAdapter(new DummyJsonAdapter());
registerAdapter(new RecipePuppyAdapter());
registerAdapter(new WebRecipeAdapter());
registerAdapter(new SpoonacularAdapter());
registerAdapter(new EdamamAdapter());
registerAdapter(new TastyAdapter());
registerAdapter(new NytAdapter());
