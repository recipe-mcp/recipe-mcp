'use client';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto prose prose-stone">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-stone-400 mb-8">Last updated: February 17, 2026</p>

      <p>
        These Terms of Service ("Terms") govern your use of recipe-mcp, including
        the MCP server plugin, web application, and any related services
        (collectively, the "Service") operated by recipe-mcp ("we", "us", "our").
      </p>
      <p>
        By using the Service, you agree to these Terms. If you do not agree, please
        do not use the Service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Description of Service</h2>
      <p>
        recipe-mcp is a recipe search and meal-planning tool that aggregates
        recipes from publicly available third-party sources. It is available as a
        free and open-source MCP server plugin for AI assistants (Claude, ChatGPT,
        Cursor, etc.) and as a companion web application.
      </p>
      <p>
        We offer three tiers: Free, Plus ($8/year), and Pro ($19/year). Paid tiers
        unlock additional recipe sources, dietary adaptation, meal planning, and
        other premium features.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Account and License Keys</h2>
      <p>
        Paid features are activated with a license key delivered after purchase. You
        are responsible for keeping your license key secure. Each key is for
        personal, individual use and may not be shared, resold, or redistributed.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Payments and Billing</h2>
      <p>
        Payments are processed by Lemon Squeezy (our merchant of record). By
        purchasing a license, you also agree to{' '}
        <a href="https://www.lemonsqueezy.com/terms" className="text-orange-600 hover:text-orange-700" target="_blank" rel="noopener noreferrer">
          Lemon Squeezy's Terms of Service
        </a>. Prices are listed in USD. Sales tax may be added depending on your
        location. Subscriptions renew annually unless canceled before the renewal
        date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 space-y-1 text-stone-700">
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to reverse-engineer, scrape, or redistribute the premium features</li>
        <li>Share, resell, or publicly post your license key</li>
        <li>Use automated tools to abuse or overload the Service</li>
        <li>Misrepresent the origin of recipes obtained through the Service</li>
      </ul>
      <p>
        We reserve the right to suspend or revoke access for violations of these
        Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Third-Party Content</h2>
      <p>
        recipe-mcp aggregates recipes from third-party websites and APIs (NYT
        Cooking, TheMealDB, Spoonacular, food blogs, etc.). We do not own or
        control this content. Recipes remain the intellectual property of their
        respective authors. We link back to original sources whenever possible.
      </p>
      <p>
        We are not responsible for the accuracy, completeness, or safety of any
        third-party recipe. Always use your own judgment when cooking, especially
        regarding food allergies and dietary restrictions.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Dietary and Nutritional Disclaimer</h2>
      <p>
        The dietary adaptation, nutritional information, and allergy-related
        features are provided as a convenience and are generated algorithmically.
        They are <strong>not medical advice</strong>. If you have food allergies,
        intolerances, or medical dietary requirements, always verify ingredients
        yourself and consult a qualified healthcare professional. We are not liable
        for any adverse reactions resulting from reliance on the Service's dietary
        features.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Intellectual Property</h2>
      <p>
        The recipe-mcp software is open-source and licensed under the MIT License.
        The premium features, license key system, and web application design are
        proprietary. "recipe-mcp" and associated branding are our trademarks.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
      <p>
        The Service is provided "as is" without warranties of any kind. To the
        maximum extent permitted by law, we shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of
        profits or data, arising from your use of the Service.
      </p>
      <p>
        Our total liability for any claim shall not exceed the amount you paid us
        in the twelve months preceding the claim.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Modifications</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service
        after changes are posted constitutes acceptance. We will make reasonable
        efforts to notify users of material changes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate
        your access if you violate these Terms. Upon termination, your license key
        will be deactivated and you will lose access to paid features.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the United States. Any disputes
        shall be resolved in the courts of the State of New York.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact</h2>
      <p>
        Questions about these Terms? Reach out at{' '}
        <a href="mailto:support@recipe-mcp.com" className="text-orange-600 hover:text-orange-700">
          support@recipe-mcp.com
        </a>.
      </p>
    </div>
  );
}
