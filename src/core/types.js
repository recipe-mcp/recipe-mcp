/**
 * Shared data model for recipe-mcp.
 *
 * Every adapter normalizes its source data into these shapes so that
 * the MCP server, CLI, and premium features all work against a single
 * consistent interface.
 */

/**
 * @typedef {Object} RecipeSummary
 * @property {string}  id          - Source-specific identifier
 * @property {string}  source      - Adapter key (e.g. "nyt", "themealdb")
 * @property {string}  title       - Recipe title
 * @property {string}  [author]    - Author / attribution
 * @property {string}  [time]      - Human-readable total time
 * @property {string}  [image]     - Image URL
 * @property {string}  url         - Canonical URL on the source site
 * @property {string}  [kicker]    - Sub-category label
 */

/**
 * @typedef {Object} RecipeDetail
 * @property {string}   id
 * @property {string}   source
 * @property {string}   title
 * @property {string}   [author]
 * @property {string}   [description]
 * @property {string}   [yieldText]
 * @property {string}   [time]        - ISO 8601 duration or human string
 * @property {string}   [prepTime]
 * @property {string}   [cookTime]
 * @property {string[]} ingredients
 * @property {string[]} steps
 * @property {string[]} [tags]
 * @property {string}   [image]
 * @property {number}   [rating]
 * @property {number}   [ratingCount]
 * @property {Object}   [nutrition]
 * @property {string}   [category]
 * @property {string}   [cuisine]
 * @property {string}   url
 */

/**
 * @typedef {Object} SearchResult
 * @property {number}          totalResults
 * @property {RecipeSummary[]} recipes
 */

/**
 * @typedef {Object} Collection
 * @property {string}  id
 * @property {string}  name
 * @property {string}  [description]
 * @property {number}  recipeCount
 * @property {string}  url
 */

// Adapter capability flags — what a given source supports
export const Capabilities = {
  SEARCH: 'search',
  GET_RECIPE: 'getRecipe',
  RECIPE_BOX: 'recipeBox',
  COLLECTIONS: 'collections',
  RANDOM: 'random',
};
