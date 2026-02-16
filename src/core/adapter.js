/**
 * Base adapter class.
 *
 * Every recipe source (NYT, TheMealDB, Spoonacular, etc.) extends this
 * and implements the methods it supports.  Unsupported methods throw so
 * the caller can gracefully skip that source.
 */

export class RecipeAdapter {
  /** Unique key for this adapter (e.g. "nyt", "themealdb") */
  get key() { throw new Error('Adapter must implement .key'); }

  /** Human-readable name */
  get name() { throw new Error('Adapter must implement .name'); }

  /** Set of Capabilities strings this adapter supports */
  get capabilities() { return new Set(); }

  /** Whether this adapter requires user-supplied credentials */
  get requiresAuth() { return false; }

  /** Whether the adapter is currently configured / authenticated */
  isReady() { return true; }

  /**
   * Search for recipes.
   * @param {string} query
   * @param {{ page?: number }} [opts]
   * @returns {Promise<import('./types.js').SearchResult>}
   */
  async search(/* query, opts */) {
    throw new Error(`${this.name} does not support search`);
  }

  /**
   * Get full recipe details.
   * @param {string} id - recipe ID or URL
   * @returns {Promise<import('./types.js').RecipeDetail>}
   */
  async getRecipe(/* id */) {
    throw new Error(`${this.name} does not support getRecipe`);
  }

  /**
   * Get the user's saved recipe box.
   * @param {{ page?: number }} [opts]
   * @returns {Promise<import('./types.js').RecipeSummary[]>}
   */
  async getRecipeBox(/* opts */) {
    throw new Error(`${this.name} does not support recipeBox`);
  }

  /**
   * Get the user's collections/folders.
   * @returns {Promise<import('./types.js').Collection[]>}
   */
  async getCollections() {
    throw new Error(`${this.name} does not support collections`);
  }

  /**
   * Get a random recipe (for sources that support it).
   * @returns {Promise<import('./types.js').RecipeDetail>}
   */
  async getRandom() {
    throw new Error(`${this.name} does not support random`);
  }
}
