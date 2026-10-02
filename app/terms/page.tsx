import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Dayal Kitchen Ware",
  description: "Terms and Conditions for Dayal Kitchen Ware.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/account/settings"
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
        >
          ← Back to Settings
        </Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-zinc-950">
          Terms & Conditions
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Last updated: October 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-700">
          <section>
            <h2 className="text-xl font-black text-zinc-950">
              1. Orders
            </h2>

            <p className="mt-3">
              Orders placed through the website are subject to product
              availability, applicable delivery conditions and confirmation
              by Dayal Kitchen Ware.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              2. Product Information
            </h2>

            <p className="mt-3">
              We aim to provide accurate product names, descriptions, prices
              and images. Product appearance, packaging or availability may
              vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              3. Pricing
            </h2>

            <p className="mt-3">
              Prices and delivery charges may change. The applicable amount
              shown during checkout will apply to the order unless an
              adjustment is communicated before confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              4. Cancellation
            </h2>

            <p className="mt-3">
              Cancellation availability depends on the current order status.
              Certain orders may not be cancellable after preparation or
              dispatch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              5. Delivery
            </h2>

            <p className="mt-3">
              Delivery availability depends on serviceable locations,
              operating conditions and product availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              6. Account
            </h2>

            <p className="mt-3">
              Customers are responsible for keeping their account information
              accurate and for maintaining the security of their login
              credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              7. Contact
            </h2>

            <p className="mt-3">
              Questions regarding an order or these terms should be directed
              to Dayal Kitchen Ware through the official contact details
              provided on the website.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}