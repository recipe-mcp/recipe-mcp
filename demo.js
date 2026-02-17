#!/usr/bin/env node
/**
 * recipe-mcp Demo Script
 *
 * Walks through all major features of recipe-mcp with pauses between each
 * step so you can screenshot or screen-record for a demo video.
 *
 * Usage:
 *   node demo.js              # Full demo with pauses
 *   node demo.js --fast       # Quick run, 2s pauses
 *   node demo.js --instant    # No pauses (just output)
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// ── Config ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const INSTANT = args.includes('--instant');
const FAST = args.includes('--fast');
const PAUSE_MS = INSTANT ? 0 : FAST ? 2000 : 0; // 0 = wait for Enter
const SERVER_PATH = new URL('./src/mcp/server.js', import.meta.url).pathname;

// ── Colors ─────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  orange: '\x1b[38;5;208m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bg: '\x1b[48;5;236m',
};

// ── MCP Client ─────────────────────────────────────────────
let server;
let msgId = 0;
const pending = new Map();
let buffer = '';

function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    server.stdout.on('data', (data) => {
      buffer += data.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
          }
        } catch {}
      }
    });

    server.stderr.on('data', (data) => {
      // Suppress server stderr noise
    });

    server.on('error', reject);

    // Initialize
    const initId = ++msgId;
    const initPromise = new Promise(res => pending.set(initId, res));
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0', id: initId, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'demo', version: '1.0.0' } }
    }) + '\n');

    initPromise.then(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0', method: 'notifications/initialized'
      }) + '\n');
      resolve();
    });
  });
}

async function callTool(name, args = {}) {
  const id = ++msgId;
  const promise = new Promise(res => pending.set(id, res));
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0', id, method: 'tools/call',
    params: { name, arguments: args }
  }) + '\n');
  const result = await promise;
  if (result.error) return `Error: ${result.error.message}`;
  return result.result?.content?.[0]?.text || '(no output)';
}

// ── Display Helpers ────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });

function waitForKey() {
  if (INSTANT) return Promise.resolve();
  if (FAST) return new Promise(r => setTimeout(r, PAUSE_MS));
  return new Promise(resolve => {
    rl.question(`${c.dim}  Press Enter to continue...${c.reset}`, () => resolve());
  });
}

function header(text) {
  const line = '═'.repeat(60);
  console.log(`\n${c.orange}${c.bold}${line}${c.reset}`);
  console.log(`${c.orange}${c.bold}  ${text}${c.reset}`);
  console.log(`${c.orange}${c.bold}${line}${c.reset}\n`);
}

function step(num, title) {
  console.log(`${c.cyan}${c.bold}  Step ${num}: ${title}${c.reset}`);
}

function tool(name, args) {
  const argsStr = Object.keys(args).length
    ? ' ' + Object.entries(args).map(([k,v]) => `${c.dim}${k}=${c.reset}${c.yellow}"${v}"${c.reset}`).join(' ')
    : '';
  console.log(`${c.green}  → ${c.bold}${name}${c.reset}${argsStr}\n`);
}

function output(text) {
  const lines = text.split('\n');
  const maxLines = 30;
  const display = lines.length > maxLines
    ? [...lines.slice(0, maxLines), `${c.dim}  ... (${lines.length - maxLines} more lines)${c.reset}`]
    : lines;
  for (const line of display) {
    console.log(`${c.white}  ${line}${c.reset}`);
  }
  console.log();
}

// ── Demo Sequence ──────────────────────────────────────────
async function demo() {
  console.log(`\n${c.orange}${c.bold}`);
  console.log(`  ╔══════════════════════════════════════════════════╗`);
  console.log(`  ║                                                  ║`);
  console.log(`  ║        recipe-mcp — Full Feature Demo            ║`);
  console.log(`  ║                                                  ║`);
  console.log(`  ║   32 tools · 12 sources · 25+ food blogs         ║`);
  console.log(`  ║   AI-powered recipe search, adapt, plan & cook   ║`);
  console.log(`  ║                                                  ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝`);
  console.log(`${c.reset}\n`);
  console.log(`${c.dim}  This demo walks through every major feature of recipe-mcp.${c.reset}`);
  console.log(`${c.dim}  Perfect for screen recording a product demo video.${c.reset}\n`);

  await waitForKey();

  // ── 1. Check sources ───────────────────────────────────
  header('1. RECIPE SOURCES — 12 sources, 25+ food blogs');
  step(1, 'List all available recipe sources');
  tool('recipe_sources', {});
  output(await callTool('recipe_sources'));
  await waitForKey();

  // ── 2. Search ──────────────────────────────────────────
  header('2. UNIVERSAL SEARCH — Search all sources at once');
  step(2, 'Search for "chicken tikka masala"');
  tool('recipe_search', { query: 'chicken tikka masala' });
  output(await callTool('recipe_search', { query: 'chicken tikka masala' }));
  await waitForKey();

  // ── 3. Get full recipe ─────────────────────────────────
  header('3. FULL RECIPE — Get detailed recipe with ingredients & steps');
  step(3, 'Get a recipe from TheMealDB');
  tool('recipe_get', { id: '52772', source: 'themealdb' });
  output(await callTool('recipe_get', { id: '52772', source: 'themealdb' }));
  await waitForKey();

  // ── 4. Random recipe ───────────────────────────────────
  header('4. RANDOM RECIPE — Instant inspiration');
  step(4, 'Get a random recipe');
  tool('recipe_random', {});
  output(await callTool('recipe_random'));
  await waitForKey();

  // ── 5. Activate Pro ────────────────────────────────────
  header('5. LICENSE ACTIVATION — Unlock all features');
  step(5, 'Activate Pro license');
  tool('recipe_license', { key: 'RMCP-TEST-PRO0-0000' });
  output(await callTool('recipe_license', { key: 'RMCP-TEST-PRO0-0000' }));
  await waitForKey();

  // ── 6. Dietary profiles ────────────────────────────────
  header('6. DIETARY PROFILES — 12 built-in diets');
  step(6, 'List all supported diets');
  tool('list_diets', {});
  output(await callTool('list_diets'));
  await waitForKey();

  // ── 7. Diet analysis ───────────────────────────────────
  header('7. DIET ANALYSIS — Check compatibility with ALL diets');
  step(7, 'Analyze a recipe against every dietary profile');
  tool('recipe_analyze_diet', { id: '52772', source: 'themealdb' });
  output(await callTool('recipe_analyze_diet', { id: '52772', source: 'themealdb' }));
  await waitForKey();

  // ── 8. Dietary adaptation ──────────────────────────────
  header('8. DIETARY ADAPTATION — Adapt any recipe to your diet');
  step(8, 'Adapt recipe for dairy-free diet');
  tool('recipe_adapt', { id: '52772', source: 'themealdb', diets: 'dairy-free' });
  output(await callTool('recipe_adapt', { id: '52772', source: 'themealdb', diets: ['dairy-free'] }));
  await waitForKey();

  // ── 9. Recipe scaling ──────────────────────────────────
  header('9. RECIPE SCALING — Scale up/down & convert units');
  step(9, 'Scale recipe to 2x and convert to metric');
  tool('recipe_scale', { id: '52772', source: 'themealdb', scale: '2', convert: 'metric' });
  output(await callTool('recipe_scale', { id: '52772', source: 'themealdb', scale: 2, convert: 'metric' }));
  await waitForKey();

  // ── 10. Substitutions ──────────────────────────────────
  header('10. SMART SUBSTITUTIONS — Find ingredient swaps');
  step(10, 'Find substitutions for butter');
  tool('recipe_substitute', { ingredient: 'butter' });
  output(await callTool('recipe_substitute', { ingredient: 'butter' }));
  await waitForKey();

  // ── 11. Cooking timeline ───────────────────────────────
  header('11. COOKING TIMELINE — Step-by-step timing breakdown');
  step(11, 'Create a cooking timeline');
  tool('cooking_timeline', { id: '52772', source: 'themealdb' });
  output(await callTool('cooking_timeline', { id: '52772', source: 'themealdb' }));
  await waitForKey();

  // ── 12. Save favorites ─────────────────────────────────
  header('12. FAVORITES — Save recipes with notes');
  step(12, 'Save a recipe to favorites');
  tool('recipe_save', { id: '52772', source: 'themealdb' });
  output(await callTool('recipe_save', { id: '52772', source: 'themealdb' }));
  await waitForKey();

  step('12b', 'View saved favorites');
  tool('recipe_favorites', {});
  output(await callTool('recipe_favorites'));
  await waitForKey();

  // ── 13. Ingredient search ──────────────────────────────
  header('13. PANTRY SEARCH — "What can I cook with what I have?"');
  step(13, 'Search by ingredients in fridge');
  tool('ingredient_search', { ingredients: 'chicken, rice, garlic' });
  output(await callTool('ingredient_search', { ingredients: ['chicken', 'rice', 'garlic'] }));
  await waitForKey();

  // ── 14. Seasonal produce ───────────────────────────────
  header('14. SEASONAL PRODUCE — What\'s in season right now');
  step(14, 'Check seasonal produce');
  tool('recipe_seasonal', {});
  output(await callTool('recipe_seasonal'));
  await waitForKey();

  // ── 15. Meal planning ──────────────────────────────────
  header('15. MEAL PLANNING — Auto-generate weekly meal plans');
  step(15, 'Generate a 3-day meal plan');
  tool('meal_plan', { days: '3', preferences: 'quick' });
  output(await callTool('meal_plan', { days: 3, preferences: ['quick'] }));
  await waitForKey();

  // ── 16. Grocery list ───────────────────────────────────
  header('16. GROCERY LIST — Auto-generate from meal plan');
  step(16, 'Generate grocery list from meal plan');
  tool('grocery_list', { from_meal_plan: 'true' });
  output(await callTool('grocery_list', { from_meal_plan: true }));
  await waitForKey();

  // ── 17. Instagram ──────────────────────────────────────
  header('17. INSTAGRAM — Follow chef accounts & browse recipes');
  step(17, 'Follow a chef account');
  tool('instagram_follow', { username: 'halfbakedharvest', note: 'Comfort food' });
  output(await callTool('instagram_follow', { username: 'halfbakedharvest', note: 'Comfort food' }));

  step('17b', 'List followed accounts');
  tool('instagram_accounts', {});
  output(await callTool('instagram_accounts'));
  await waitForKey();

  // ── 18. Recipe comparison ──────────────────────────────
  header('18. RECIPE COMPARISON — Compare nutrition side by side');
  step(18, 'Compare two recipes');
  tool('recipe_compare', { recipes: '[{id:"52772"}, {id:"52771"}]' });
  output(await callTool('recipe_compare', { recipes: [{id: '52772', source: 'themealdb'}, {id: '52771', source: 'themealdb'}] }));
  await waitForKey();

  // ── Wrap up ────────────────────────────────────────────
  console.log(`\n${c.orange}${c.bold}`);
  console.log(`  ╔══════════════════════════════════════════════════╗`);
  console.log(`  ║                                                  ║`);
  console.log(`  ║              Demo Complete!                       ║`);
  console.log(`  ║                                                  ║`);
  console.log(`  ║   32 MCP tools demonstrated                      ║`);
  console.log(`  ║   Works with Claude, ChatGPT, Cursor & more      ║`);
  console.log(`  ║                                                  ║`);
  console.log(`  ║   Free: recipe-mcp.com                           ║`);
  console.log(`  ║   Plus: $8/yr  ·  Pro: $19/yr                    ║`);
  console.log(`  ║                                                  ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝`);
  console.log(`${c.reset}\n`);
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  try {
    console.log(`${c.dim}  Starting recipe-mcp server...${c.reset}`);
    await startServer();
    console.log(`${c.green}  Server ready.${c.reset}\n`);
    await demo();
  } catch (err) {
    console.error('Demo error:', err.message);
  } finally {
    rl.close();
    if (server) server.kill();
    process.exit(0);
  }
}

main();
