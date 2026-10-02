"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import LanguageSelector from "../../components/LanguageSelector";

type AccountData = {
  id: string;
  email: string;
  phone: string;
  full_name: string;
};

export default function AccountSettingsPage() {
  const [user, setUser] =
    useState<AccountData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [upiId, setUpiId] =
    useState("");

  const [savingPhone, setSavingPhone] =
    useState(false);

  const [savingEmail, setSavingEmail] =
    useState(false);

  const [savingUpi, setSavingUpi] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings =
    async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: {
            user: authUser,
          },
        } =
          await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          return;
        }

        const metadata =
          authUser.user_metadata || {};

        const accountUser: AccountData = {
          id: authUser.id,
          email:
            authUser.email || "",
          phone:
            metadata.phone || "",
          full_name:
            metadata.full_name ||
            metadata.name ||
            "",
        };

        setUser(accountUser);
        setPhone(accountUser.phone);
        setEmail(accountUser.email);

        const {
          data: paymentSettings,
          error: paymentError,
        } =
          await supabase
            .from(
              "customer_payment_settings"
            )
            .select("upi_id")
            .eq(
              "id",
              authUser.id
            )
            .maybeSingle();

        if (paymentError) {
          console.error(
            "PAYMENT SETTINGS ERROR:",
            paymentError
          );
        }

        setUpiId(
          paymentSettings?.upi_id || ""
        );
      } catch (err) {
        console.error(
          "LOAD SETTINGS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

  const cleanPhone =
    (value: string) =>
      String(value || "").replace(
        /\D/g,
        ""
      );

  const handleSavePhone =
    async () => {
      setError("");
      setMessage("");

      const clean =
        cleanPhone(phone);

      if (
        !/^[6-9]\d{9}$/.test(
          clean
        )
      ) {
        setError(
          "Please enter a valid 10-digit Indian mobile number."
        );
        return;
      }

      try {
        setSavingPhone(true);

        const {
          data: {
            user: authUser,
          },
        } =
          await supabase.auth.getUser();

        if (!authUser) {
          throw new Error(
            "Please login again."
          );
        }

        const {
          error: updateError,
        } =
          await supabase.auth.updateUser(
            {
              data: {
                ...authUser.user_metadata,
                phone: clean,
              },
            }
          );

        if (updateError) {
          throw updateError;
        }

        const {
          error: whatsappError,
        } =
          await supabase
            .from(
              "customer_whatsapp_settings"
            )
            .upsert(
              {
                id: authUser.id,
                phone: clean,
                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict: "id",
              }
            );

        if (whatsappError) {
          console.error(
            "WHATSAPP PHONE SYNC ERROR:",
            whatsappError
          );
        }

        setPhone(clean);

        setUser((current) =>
          current
            ? {
                ...current,
                phone: clean,
              }
            : current
        );

        setMessage(
          "Phone number updated successfully."
        );
      } catch (err) {
        console.error(
          "SAVE PHONE ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update phone number."
        );
      } finally {
        setSavingPhone(false);
      }
    };

  const handleSaveEmail =
    async () => {
      setError("");
      setMessage("");

      const newEmail =
        email.trim().toLowerCase();

      if (!newEmail) {
        setError(
          "Email address is required."
        );
        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          newEmail
        )
      ) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }

      if (
        user &&
        newEmail ===
          user.email.toLowerCase()
      ) {
        setError(
          "This is already your current email address."
        );
        return;
      }

      try {
        setSavingEmail(true);

        const {
          error: updateError,
        } =
          await supabase.auth.updateUser(
            {
              email: newEmail,
            }
          );

        if (updateError) {
          throw updateError;
        }

        setMessage(
          "Email change request sent. Please check your email and complete verification."
        );
      } catch (err) {
        console.error(
          "SAVE EMAIL ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update email."
        );
      } finally {
        setSavingEmail(false);
      }
    };

  const handleSaveUpi =
    async () => {
      setError("");
      setMessage("");

      const value =
        upiId.trim();

      if (
        value &&
        !/^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9._-]{2,}$/.test(
          value
        )
      ) {
        setError(
          "Please enter a valid UPI ID, for example name@upi."
        );
        return;
      }

      try {
        setSavingUpi(true);

        const {
          data: {
            user: authUser,
          },
        } =
          await supabase.auth.getUser();

        if (!authUser) {
          throw new Error(
            "Please login again."
          );
        }

        const {
          error: upiError,
        } =
          await supabase
            .from(
              "customer_payment_settings"
            )
            .upsert(
              {
                id: authUser.id,
                upi_id:
                  value || null,
                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict: "id",
              }
            );

        if (upiError) {
          throw upiError;
        }

        setUpiId(value);

        setMessage(
          value
            ? "UPI ID saved successfully."
            : "UPI ID removed successfully."
        );
      } catch (err) {
        console.error(
          "SAVE UPI ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to save UPI ID."
        );
      } finally {
        setSavingUpi(false);
      }
    };

  const handleLogout =
    async () => {
      try {
        setLoggingOut(true);
        setError("");

        const {
          error: logoutError,
        } =
          await supabase.auth.signOut();

        if (logoutError) {
          throw logoutError;
        }

        window.location.href = "/";
      } catch (err) {
        console.error(
          "LOGOUT ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to logout."
        );

        setLoggingOut(false);
      }
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="text-gray-600">
            Loading settings...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Please Login
          </h1>

          <p className="mt-2 text-gray-600">
            Login to manage your account settings.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/account"
              className="mb-3 inline-flex text-sm font-semibold text-gray-500 hover:text-black"
            >
              ← Back to My Account
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">
              Settings
            </h1>

            <p className="mt-1 text-gray-600">
              Manage your account and preferences.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ACCOUNT SETTINGS */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">

          {/* PROFILE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Account Information
            </h2>

            <div className="mt-5 space-y-5">

              {/* NAME */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </p>

                <p className="mt-1 text-gray-900">
                  {user.full_name ||
                    "Not provided"}
                </p>
              </div>

              {/* EMAIL */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </p>

                <div className="mt-2 flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Email address"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                  <button
                    type="button"
                    onClick={
                      handleSaveEmail
                    }
                    disabled={
                      savingEmail
                    }
                    className="w-fit rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingEmail
                      ? "Updating..."
                      : "Change Email"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Email change may require verification.
                </p>
              </div>

              {/* PHONE */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </p>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        cleanPhone(
                          event.target.value
                        )
                      )
                    }
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                  <button
                    type="button"
                    onClick={
                      handleSavePhone
                    }
                    disabled={
                      savingPhone
                    }
                    className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingPhone
                      ? "Saving..."
                      : "Save"}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* PAYMENT */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Payment Settings
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Manage your UPI ID for future payments.
            </p>

            <div className="mt-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                UPI ID
              </p>

              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(event) =>
                    setUpiId(
                      event.target.value
                    )
                  }
                  placeholder="example@upi"
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      handleSaveUpi
                    }
                    disabled={
                      savingUpi
                    }
                    className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingUpi
                      ? "Saving..."
                      : "Save UPI"}
                  </button>

                  {upiId && (
                    <button
                      type="button"
                      onClick={() =>
                        setUpiId("")
                      }
                      disabled={
                        savingUpi
                      }
                      className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                UPI ID is saved to your account. Actual UPI verification and payment processing will be connected later.
              </p>
            </div>
          </div>
        </section>

        {/* PREFERENCES */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Preferences
          </h2>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                Language
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Choose your preferred website language.
              </p>
            </div>

            <LanguageSelector />
          </div>
        </section>

        {/* ACCOUNT LINKS */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Account
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <Link
              href="/account#orders"
              className="rounded-xl border border-gray-300 bg-white p-4 transition hover:bg-gray-100"
            >
              <p className="font-semibold text-gray-900">
                📦 My Orders
              </p>

              <p className="mt-1 text-sm text-gray-600">
                View your orders and payment status.
              </p>
            </Link>

            <Link
              href="/privacy"
              className="rounded-xl border border-gray-300 bg-white p-4 transition hover:bg-gray-100"
            >
              <p className="font-semibold text-gray-900">
                🔒 Privacy Policy
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Learn how your information is handled.
              </p>
            </Link>

            <Link
              href="/terms"
              className="rounded-xl border border-gray-300 bg-white p-4 transition hover:bg-gray-100"
            >
              <p className="font-semibold text-gray-900">
                📄 Terms & Conditions
              </p>

              <p className="mt-1 text-sm text-gray-600">
                View website and order terms.
              </p>
            </Link>

            <Link
              href="/account"
              className="rounded-xl border border-gray-300 bg-white p-4 transition hover:bg-gray-100"
            >
              <p className="font-semibold text-gray-900">
                👤 My Account
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Return to your account dashboard.
              </p>
            </Link>

          </div>
        </section>

        {/* LOGOUT */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Sign Out
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Sign out of your Dayal Kitchen Ware account on this device.
          </p>

          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut
              ? "Signing Out..."
              : "Log Out"}
          </button>
        </section>

      </div>
    </main>
  );
} 