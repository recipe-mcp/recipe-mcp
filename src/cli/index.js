#!/usr/bin/env node

/**
 * recipe-mcp CLI
 *
 * Multi-source recipe tool for the command line.
 * Search, browse, and manage recipes from NYT Cooking, TheMealDB,
 * Spoonacular, and more — all from your terminal.
 */

import { createInterface } from 'readline';

// Register all adapters
import '../adapters/index.js';

import {
  getAllAdapters,
  getAdapter,
  searchAll,
  getRecipeFrom,
  getAdaptersWithCapability,
} from '../core/registry.js';
import { Capabilities } from '../core/types.js';

// ── ANSI colors ──────────────────────────────────────────────────────

const c = {
  bold: s => `\x1b[1m${s}\x1b[22m`,
  dim: s => `\x1b[2m${s}\x1b[22m`,
  yellow: s => `\x1b[33m${s}\x1b[39m`,
  green: s => `\x1b[32m${s}\x1b[39m`,
  cyan: s => `\x1b[36m${s}\x1b[39m`,
  blue: s => `\x1b[34m${s}\x1b[39m`,
  magenta: s => `\x1b[35m${s}\x1b[39m`,
  red: s => `\x1b[31m${s}\x1b[39m`,
};

function ask(q) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(q, ans => { rl.close(); resolve(ans); }));
}

function spinner(msg) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${c.cyan(frames[i++ % frames.length])} ${msg}`);
  }, 80);
  return {
    succeed: t => { clearInterval(id); process.stderr.write(`\r${c.green('✔')} ${t}\n`); },
    fail: t => { clearInterval(id); process.stderr.write(`\r${c.red('✖')} ${t}\n`); },
    stop: () => { clearInterval(id); process.stderr.write('\r\x1b[K'); },
  };
}

function formatDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  return [m[1] && `${m[1]}h`, m[2] && `${m[2]}m`].filter(Boolean).join(' ') || iso;
}

function stars(r) {
  if (!r) return '';
  const n = Math.round(parseFloat(r));
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
}

function wrap(text, indent = 2, width = 78) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = ' '.repeat(indent);
  for (const w of words) {
    if (line.length + w.length > width) { lines.push(line); line = ' '.repeat(indent); }
    line += w + ' ';
  }
  if (line.trim()) lines.push(line);
  return lines.join('\n');
}

function printRecipe(r) {
  console.log();
  console.log(c.bold(c.yellow(`  ${r.title}`)));
  if (r.author) console.log(c.dim(`  by ${r.author}`));
  console.log(c.dim(`  source: ${r.source}`));
  console.log();

  if (r.description) { console.log(wrap(r.description)); console.log(); }

  const meta = [];
  if (r.yieldText) meta.push(`Yield: ${r.yieldText}`);
  if (r.time) meta.push(`Time: ${formatDuration(r.time)}`);
  if (r.prepTime) meta.push(`Prep: ${formatDuration(r.prepTime)}`);
  if (r.cookTime) meta.push(`Cook: ${formatDuration(r.cookTime)}`);
  if (r.rating) meta.push(`${stars(r.rating)} ${r.rating}/5 (${r.ratingCount || '?'} reviews)`);
  if (meta.length) { console.log(c.cyan(`  ${meta.join('  |  ')}`)); console.log(); }

  if (r.category || r.cuisine) console.log(c.dim(`  Category: ${[r.category, r.cuisine].filter(Boolean).join(', ')}`));
  if (r.tags?.length) console.log(c.dim(`  Tags: ${r.tags.join(', ')}`));

  if (r.ingredients?.length) {
    console.log();
    console.log(c.bold(c.green('  Ingredients')));
    console.log(c.green('  ' + '─'.repeat(40)));
    for (const ing of r.ingredients) console.log(`  • ${ing}`);
  }

  if (r.steps?.length) {
    console.log();
    console.log(c.bold(c.blue('  Instructions')));
    console.log(c.blue('  ' + '─'.repeat(40)));
    r.steps.forEach((s, i) => {
      console.log();
      console.log(c.bold(`  Step ${i + 1}`));
      console.log(wrap(s));
    });
  }

  if (r.nutrition) {
    console.log();
    console.log(c.bold(c.magenta('  Nutrition')));
    console.log(c.magenta('  ' + '─'.repeat(40)));
    for (const [k, v] of Object.entries(r.nutrition)) {
      if (!k.startsWith('@')) console.log(`  ${k}: ${v}`);
    }
  }

  console.log();
  if (r.url) console.log(c.dim(`  ${r.url}`));
  console.log();
}

function printHelp() {
  console.log(`
${c.bold('recipe-mcp')} v1.0.0 — Universal recipe tool

${c.bold('Usage:')}  recipe-mcp <command> [options]

${c.bold('Commands:')}
  search <query>        Search for recipes across all sources
  recipe <url|id>       Get full recipe details
  random                Get a random recipe for inspiration
  sources               List available recipe sources and status
  box                   View your saved recipe box
  collections           View your recipe collections
  configure <source>    Configure a recipe source (set API key / cookie)

${c.bold('Options:')}
  --source <key>   Filter by source (nyt, themealdb, spoonacular)
  --json           Output raw JSON
  --page <n>       Page number (default: 1)

${c.bold('Examples:')}
  recipe-mcp search "chicken tikka"
  recipe-mcp search "pasta" --source themealdb
  recipe-mcp recipe 52772 --source themealdb
  recipe-mcp random
  recipe-mcp configure nyt
  recipe-mcp configure spoonacular
`);
}

// ── Command dispatch ─────────────────────────────────────────────────

const [, , command, ...rest] = process.argv;
if (!command || command === '--help' || command === '-h') { printHelp(); process.exit(0); }

const flags = {};
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--json') flags.json = true;
  else if (rest[i] === '--page' || rest[i] === '-p') flags.page = parseInt(rest[++i]) || 1;
  else if (rest[i] === '--source' || rest[i] === '-s') flags.source = rest[++i];
  else if (!rest[i].startsWith('-')) positional.push(rest[i]);
}

async function main() {
  try {
    switch (command) {
      case 'search': {
        const q = positional.join(' ');
        if (!q) { console.error(c.red('Provide a search query')); process.exit(1); }
        const s = spinner(`Searching "${q}"...`);
        const data = await searchAll(q, { source: flags.source, page: flags.page || 1 });
        s.stop();
        if (flags.json) { console.log(JSON.stringify(data, null, 2)); break; }
        console.log();
        console.log(c.bold(c.yellow(`  Search Results (${data.totalResults} total)`)));
        console.log();
        for (const r of data.recipes) {
          console.log(`  ${c.bold(r.title)}`);
          const meta = [r.author, r.time, r.source].filter(Boolean).join(' · ');
          if (meta) console.log(c.dim(`    ${meta}`));
          console.log(c.cyan(`    ${r.url}`));
          console.log();
        }
        if (!data.recipes.length) console.log(c.dim('  No results found.'));
        break;
      }

      case 'recipe': case 'get': {
        const id = positional[0];
        if (!id) { console.error(c.red('Provide a recipe URL or ID')); process.exit(1); }
        const s = spinner('Fetching recipe...');
        const r = await getRecipeFrom(id, flags.source);
        s.stop();
        flags.json ? console.log(JSON.stringify(r, null, 2)) : printRecipe(r);
        break;
      }

      case 'random': {
        const s = spinner('Getting random recipe...');
        const randomAdapters = getAdaptersWithCapability(Capabilities.RANDOM);
        if (flags.source) {
          const adapter = getAdapter(flags.source);
          if (!adapter) { s.fail(`Unknown source: ${flags.source}`); process.exit(1); }
          const r = await adapter.getRandom();
          s.stop();
          flags.json ? console.log(JSON.stringify(r, null, 2)) : printRecipe(r);
        } else {
          const adapter = randomAdapters[Math.floor(Math.random() * randomAdapters.length)];
          if (!adapter) { s.fail('No sources support random recipes'); process.exit(1); }
          const r = await adapter.getRandom();
          s.stop();
          flags.json ? console.log(JSON.stringify(r, null, 2)) : printRecipe(r);
        }
        break;
      }

      case 'sources': {
        console.log();
        console.log(c.bold(c.yellow('  Recipe Sources')));
        console.log();
        for (const a of getAllAdapters()) {
          const ready = a.isReady();
          const status = ready ? c.green('✔ Ready') : c.yellow('⚠ Needs credentials');
          console.log(`  ${c.bold(a.name)} ${c.dim(`(${a.key})`)}`);
          console.log(`    Status: ${status}`);
          console.log(`    Auth required: ${a.requiresAuth ? 'Yes' : 'No'}`);
          console.log(`    Capabilities: ${[...a.capabilities].join(', ')}`);
          console.log();
        }
        break;
      }

      case 'box': case 'saved': {
        const source = flags.source || 'nyt';
        const adapter = getAdapter(source);
        if (!adapter) { console.error(c.red(`Unknown source: ${source}`)); process.exit(1); }
        const s = spinner('Loading recipe box...');
        const recipes = await adapter.getRecipeBox({ page: flags.page || 1 });
        s.stop();
        if (flags.json) { console.log(JSON.stringify(recipes, null, 2)); break; }
        console.log();
        console.log(c.bold(c.yellow(`  Your Recipe Box (${recipes.length} recipes)`)));
        console.log();
        for (const r of recipes) {
          console.log(`  ${c.bold(r.title)}`);
          console.log(c.cyan(`    ${r.url}`));
          console.log();
        }
        break;
      }

      case 'collections': case 'folders': {
        const source = flags.source || 'nyt';
        const adapter = getAdapter(source);
        if (!adapter) { console.error(c.red(`Unknown source: ${source}`)); process.exit(1); }
        const s = spinner('Loading collections...');
        const cols = await adapter.getCollections();
        s.stop();
        if (flags.json) { console.log(JSON.stringify(cols, null, 2)); break; }
        console.log();
        console.log(c.bold(c.yellow(`  Your Collections (${cols.length})`)));
        console.log();
        for (const col of cols) {
          console.log(`  ${c.bold(col.name)} ${c.dim(`(${col.recipeCount} recipes)`)}`);
          if (col.description) console.log(c.dim(`    ${col.description.slice(0, 100)}`));
          console.log(c.cyan(`    ${col.url}`));
          console.log();
        }
        break;
      }

      case 'configure': case 'config': case 'login': {
        const source = positional[0];
        if (!source) {
          console.log(c.bold('\nConfigurable sources:'));
          for (const a of getAllAdapters().filter(a => a.requiresAuth)) {
            console.log(`  ${c.bold(a.key)} — ${a.name}`);
          }
          console.log(`\nUsage: recipe-mcp configure <source>`);
          break;
        }
        const adapter = getAdapter(source);
        if (!adapter) { console.error(c.red(`Unknown source: ${source}`)); process.exit(1); }

        if (source === 'nyt') {
          console.log(c.dim('Get your NYT-S cookie from: Chrome → DevTools → Application → Cookies → cooking.nytimes.com'));
          const token = await ask('\nPaste your NYT-S cookie value: ');
          if (!token.trim()) { console.error(c.red('No token provided.')); process.exit(1); }
          adapter.setToken(token.trim());
          console.log(c.green('✔ NYT Cooking cookie saved! You\'re authenticated.'));
        } else if (source === 'spoonacular') {
          console.log(c.dim('Get a free API key at: https://spoonacular.com/food-api'));
          const key = await ask('\nPaste your Spoonacular API key: ');
          if (!key.trim()) { console.error(c.red('No API key provided.')); process.exit(1); }
          adapter.setApiKey(key.trim());
          console.log(c.green('✔ Spoonacular API key saved!'));
        } else if (source === 'edamam') {
          console.log(c.dim('Get a free API key at: https://developer.edamam.com/'));
          const appId = await ask('\nPaste your Edamam App ID: ');
          const appKey = await ask('Paste your Edamam App Key: ');
          if (!appId.trim() || !appKey.trim()) { console.error(c.red('Both App ID and App Key are required.')); process.exit(1); }
          adapter.setCredentials(appId.trim(), appKey.trim());
          console.log(c.green('✔ Edamam credentials saved!'));
        } else if (source === 'tasty') {
          console.log(c.dim('Get a free RapidAPI key at: https://rapidapi.com/apidojo/api/tasty'));
          const key = await ask('\nPaste your RapidAPI key: ');
          if (!key.trim()) { console.error(c.red('No API key provided.')); process.exit(1); }
          adapter.setApiKey(key.trim());
          console.log(c.green('✔ Tasty (RapidAPI) key saved!'));
        } else if (!adapter.requiresAuth) {
          console.log(c.green(`${adapter.name} works out of the box — no configuration needed!`));
        } else {
          console.log(c.yellow(`${adapter.name} configuration not yet supported.`));
        }
        break;
      }

      default:
        console.error(c.red(`Unknown command: ${command}`));
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(c.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

main();
