import './globals.css';

export const metadata = {
  title: 'recipe-mcp — AI-Powered Recipe Search',
  description: 'Search 12 recipe sources at once. Adapt recipes to your diet, scale ingredients, plan meals, and build grocery lists. Powered by the same engine behind the recipe-mcp AI tool.',
  keywords: ['recipe search', 'meal planning', 'dietary adaptation', 'grocery list', 'AI recipes', 'recipe-mcp'],
  openGraph: {
    title: 'recipe-mcp — AI-Powered Recipe Search',
    description: 'Search 25+ food blogs and 12 recipe sources. Adapt any recipe to your diet.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        <nav className="border-b border-stone-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold text-orange-600 hover:text-orange-700">
              recipe-mcp
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/" className="text-stone-600 hover:text-stone-900">Search</a>
              <a href="/meal-plan" className="text-stone-600 hover:text-stone-900">Meal Plan</a>
              <a href="/pantry" className="text-stone-600 hover:text-stone-900">My Fridge</a>
              <a href="/seasonal" className="text-stone-600 hover:text-stone-900">In Season</a>
              <a href="/instagram" className="text-stone-600 hover:text-stone-900">Instagram</a>
              <a href="/substitutions" className="text-stone-600 hover:text-stone-900">Subs</a>
              <a href="/pricing" className="text-stone-600 hover:text-stone-900">Pricing</a>
              <a href="/license" className="text-orange-600 hover:text-orange-700 font-medium">Activate Key</a>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-stone-200 mt-16 py-8 text-center text-sm text-stone-400">
          <p>recipe-mcp — Search 12 sources, 25+ food blogs, 32 tools.</p>
          <p className="mt-1">
            <a href="https://github.com/recipe-mcp/recipe-mcp" className="hover:text-stone-600">GitHub</a>
            {' · '}
            <a href="https://www.npmjs.com/package/recipe-mcp" className="hover:text-stone-600">npm</a>
            {' · '}
            <a href="/pricing" className="hover:text-stone-600">Pricing</a>
            {' · '}
            <a href="/terms" className="hover:text-stone-600">Terms of Service</a>
            {' · '}
            <a href="/refund" className="hover:text-stone-600">Refund Policy</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
