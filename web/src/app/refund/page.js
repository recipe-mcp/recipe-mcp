'use client';

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto prose prose-stone">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-stone-400 mb-8">Last updated: February 17, 2026</p>

      <p>
        We want you to be happy with recipe-mcp. If it's not working out, here's
        how refunds work.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">14-Day Money-Back Guarantee</h2>
      <p>
        All paid plans (Plus and Pro) come with a <strong>14-day money-back
        guarantee</strong>. If you're not satisfied for any reason, request a
        refund within 14 days of purchase and we'll issue a full refund — no
        questions asked.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How to Request a Refund</h2>
      <p>To request a refund, you can either:</p>
      <ul className="list-disc pl-6 space-y-1 text-stone-700">
        <li>
          Email us at{' '}
          <a href="mailto:support@recipe-mcp.com" className="text-orange-600 hover:text-orange-700">
            support@recipe-mcp.com
          </a>{' '}
          with your order number or the email used at checkout
        </li>
        <li>
          Use the refund link in your Lemon Squeezy purchase confirmation email
        </li>
      </ul>
      <p>
        Refunds are typically processed within 3–5 business days back to your
        original payment method.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">After 14 Days</h2>
      <p>
        After the 14-day window, refunds are handled on a case-by-case basis. If
        you experience a technical issue that prevents you from using the Service,
        contact us and we'll do our best to resolve it or issue a prorated refund.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Subscription Cancellation</h2>
      <p>
        You can cancel your subscription at any time through your Lemon Squeezy
        customer portal. When you cancel:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-stone-700">
        <li>Your paid features remain active until the end of your current billing period</li>
        <li>You will not be charged again</li>
        <li>Your license key will stop working when the billing period ends</li>
        <li>You keep access to all Free tier features permanently</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Exceptions</h2>
      <p>
        Refunds are not available if your license key was suspended due to a
        violation of our{' '}
        <a href="/terms" className="text-orange-600 hover:text-orange-700">
          Terms of Service
        </a>{' '}
        (e.g., sharing or reselling keys).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p>
        Questions? Email{' '}
        <a href="mailto:support@recipe-mcp.com" className="text-orange-600 hover:text-orange-700">
          support@recipe-mcp.com
        </a>{' '}
        and we'll get back to you within 24 hours.
      </p>
    </div>
  );
}
