import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Dayal Kitchen Ware",
  description:
    "Privacy Policy for Dayal Kitchen Ware website and services.",
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Last updated: October 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-700">
          <section>
            <h2 className="text-xl font-black text-zinc-950">
              1. Information We Collect
            </h2>

            <p className="mt-3">
              When you create an account or place an order, we may collect
              information such as your name, email address, phone number,
              delivery address, pincode and order information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              2. How We Use Information
            </h2>

            <p className="mt-3">
              We use account and order information to provide our services,
              process orders, communicate order updates, provide customer
              support and improve the shopping experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              3. Payment Information
            </h2>

            <p className="mt-3">
              Payment processing may be handled by third-party payment
              providers when payment gateway services are enabled. We do not
              ask customers to share passwords, OTPs or card PINs through
              customer support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              4. Location Information
            </h2>

            <p className="mt-3">
              If you choose to use location-based features, the website may
              request location permission to help provide relevant delivery
              or nearby-store functionality. You can control location
              permissions through your browser or device settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              5. WhatsApp Notifications
            </h2>

            <p className="mt-3">
              If you enable WhatsApp order notifications, your phone number
              may be used for relevant order communication. You can manage
              notification preferences from your account where supported.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              6. Data Security
            </h2>

            <p className="mt-3">
              We take reasonable technical and organizational measures to
              protect account and order information. No online service can
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              7. Third-Party Services
            </h2>

            <p className="mt-3">
              Our website may use third-party services for authentication,
              hosting, payments, messaging, analytics or other functionality.
              Their handling of information may be governed by their own
              privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-950">
              8. Contact
            </h2>

            <p className="mt-3">
              For privacy-related questions or requests, please contact the
              official Dayal Kitchen Ware support email shown on the website.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}