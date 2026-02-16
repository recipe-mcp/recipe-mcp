/**
 * Adapter auto-registration.
 * Import this module to register all built-in adapters.
 *
 * 12 sources total:
 *   Free (no auth):  TheMealDB, TheCocktailDB, DummyJSON, RecipePuppy, Web Recipe, Blog Search
 *   Free (API key):  Spoonacular, Edamam, Tasty
 *   Subscription:    NYT Cooking
 *   Pro:             Instagram Recipes
 */

import { registerAdapter } from '../core/registry.js';

// Free, no auth required
import { TheMealDbAdapter } from './themealdb.js';
import { TheCocktailDbAdapter } from './thecocktaildb.js';
import { DummyJsonAdapter } from './dummyjson.js';
import { RecipePuppyAdapter } from './recipepuppy.js';
import { WebRecipeAdapter } from './webrecipe.js';
import { BlogSearchAdapter } from './blogs.js';

// Free tier with API key
import { SpoonacularAdapter } from './spoonacular.js';
import { EdamamAdapter } from './edamam.js';
import { TastyAdapter } from './tasty.js';

// Subscription (bring your own credentials)
import { NytAdapter } from './nyt.js';

// Pro tier
import { InstagramAdapter } from './instagram.js';

// Register in order: free first, then freemium, then paid
registerAdapter(new TheMealDbAdapter());
registerAdapter(new TheCocktailDbAdapter());
registerAdapter(new DummyJsonAdapter());
registerAdapter(new RecipePuppyAdapter());
registerAdapter(new WebRecipeAdapter());
registerAdapter(new BlogSearchAdapter());
registerAdapter(new SpoonacularAdapter());
registerAdapter(new EdamamAdapter());
registerAdapter(new TastyAdapter());
registerAdapter(new NytAdapter());
registerAdapter(new InstagramAdapter());
