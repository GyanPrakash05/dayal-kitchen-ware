"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type UserData = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  provider: string;
  address: string;
  city: string;
  pincode: string;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  cancellation_charge: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  canceled: "Canceled",
};

const paymentLabels: Record<string, string> = {
  pending: "Payment Pending",
  paid: "Paid",
  failed: "Payment Failed",
  refunded: "Refunded",
};

function getStatusClasses(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "out_for_delivery":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "delivered":
      return "bg-green-50 text-green-700 border-green-200";
    case "canceled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
}

function getPaymentClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700 border-green-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    case "refunded":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed":
      return "✓";
    case "out_for_delivery":
      return "🚚";
    case "delivered":
      return "✓";
    case "canceled":
      return "×";
    default:
      return "⏳";
  }
}

function formatStatus(status: string) {
  return (
    statusLabels[status] ||
    status.replaceAll("_", " ")
  );
}

function getOrderHeading(status: string) {
  switch (status) {
    case "pending":
      return "Order Placed";
    case "confirmed":
      return "Order Confirmed";
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Order Delivered";
    case "canceled":
      return "Order Canceled";
    default:
      return "Order Update";
  }
}

function formatPaymentStatus(status: string) {
  return (
    paymentLabels[status] ||
    status.replaceAll("_", " ")
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatPrice(value: number) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;
}

function cleanPhone(phone: string) {
  return String(phone || "").replace(
    /\D/g,
    ""
  );
}

function AccountContent() {
  const searchParams = useSearchParams();

  const highlightedOrderId =
    searchParams.get("order");

  const [user, setUser] =
    useState<UserData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [refreshingOrders, setRefreshingOrders] =
    useState(false);

  const [phone, setPhone] =
    useState("");

  const [savingPhone, setSavingPhone] =
    useState(false);

  const [addressEditing, setAddressEditing] =
    useState(false);

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [whatsappEnabled, setWhatsappEnabled] =
    useState(false);

  const [whatsappLoading, setWhatsappLoading] =
    useState(false);

  const [whatsappSaving, setWhatsappSaving] =
    useState(false);

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(
      highlightedOrderId
    );

  const [cancelOrder, setCancelOrder] =
    useState<Order | null>(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const [cancelLoading, setCancelLoading] =
    useState(false);

  const loadOrders = useCallback(
    async (
      showRefreshing = false
    ) => {
      try {
        if (showRefreshing) {
          setRefreshingOrders(true);
        } else {
          setLoadingOrders(true);
        }

        setError("");

        const {
          data: {
            session,
          },
        } = await supabase.auth.getSession();

        if (!session) {
          setOrders([]);
          return;
        }

        const response =
          await fetch("/api/orders", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Cache-Control":
                "no-cache",
            },
            cache: "no-store",
          });

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load orders."
          );
        }

        const fetchedOrders =
          Array.isArray(result.orders)
            ? result.orders
            : [];

        setOrders(fetchedOrders);

        if (
          highlightedOrderId &&
          fetchedOrders.some(
            (order: Order) =>
              order.id ===
              highlightedOrderId
          )
        ) {
          setExpandedOrderId(
            highlightedOrderId
          );
        }
      } catch (err) {
        console.error(
          "LOAD ORDERS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load orders."
        );
      } finally {
        setLoadingOrders(false);
        setRefreshingOrders(false);
      }
    },
    [highlightedOrderId]
  );

  const loadAccount =
    useCallback(async () => {
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

        const accountUser: UserData = {
          id: authUser.id,
          email:
            authUser.email || "",
          full_name:
            metadata.full_name ||
            metadata.name ||
            "",
          phone:
            metadata.phone || "",
          provider:
            authUser.app_metadata
              ?.provider || "email",
          address:
            metadata.address || "",
          city:
            metadata.city || "",
          pincode:
            metadata.pincode || "",
        };

        setUser(accountUser);
        setPhone(accountUser.phone);
        setAddress(accountUser.address);
        setCity(accountUser.city);
        setPincode(accountUser.pincode);

        /* ---------------- WHATSAPP SETTINGS ---------------- */

        setWhatsappLoading(true);

        try {
          const cleanUserPhone =
            cleanPhone(
              accountUser.phone
            );

          if (cleanUserPhone) {
            await supabase
              .from(
                "customer_whatsapp_settings"
              )
              .upsert(
                {
                  id: authUser.id,
                  phone:
                    cleanUserPhone,
                  updated_at:
                    new Date().toISOString(),
                },
                {
                  onConflict: "id",
                }
              );
          }

          const {
            data: whatsappSettings,
          } =
            await supabase
              .from(
                "customer_whatsapp_settings"
              )
              .select(
                "phone, enabled, verified"
              )
              .eq(
                "id",
                authUser.id
              )
              .maybeSingle();

          setWhatsappEnabled(
            Boolean(
              whatsappSettings?.enabled
            )
          );
        } catch (whatsappError) {
          console.error(
            "WHATSAPP SETTINGS ERROR:",
            whatsappError
          );
        } finally {
          setWhatsappLoading(false);
        }

        await loadOrders();
      } catch (err) {
        console.error(
          "LOAD ACCOUNT ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load account."
        );
      } finally {
        setLoading(false);
      }
    }, [loadOrders]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

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

        const { error: updateError } =
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

  const handleSaveAddress =
    async () => {
      setError("");
      setMessage("");

      if (!address.trim()) {
        setError(
          "Address is required."
        );
        return;
      }

      if (!city.trim()) {
        setError(
          "City is required."
        );
        return;
      }

      if (
        !/^\d{6}$/.test(
          pincode.trim()
        )
      ) {
        setError(
          "Please enter a valid 6-digit pincode."
        );
        return;
      }

      try {
        setSavingAddress(true);

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

        const { error: updateError } =
          await supabase.auth.updateUser(
            {
              data: {
                ...authUser.user_metadata,
                address:
                  address.trim(),
                city: city.trim(),
                pincode:
                  pincode.trim(),
              },
            }
          );

        if (updateError) {
          throw updateError;
        }

        setUser((current) =>
          current
            ? {
                ...current,
                address:
                  address.trim(),
                city: city.trim(),
                pincode:
                  pincode.trim(),
              }
            : current
        );

        setAddressEditing(false);

        setMessage(
          "Delivery address updated successfully."
        );
      } catch (err) {
        console.error(
          "SAVE ADDRESS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update address."
        );
      } finally {
        setSavingAddress(false);
      }
    };

  const handleWhatsappToggle =
    async () => {
      setError("");
      setMessage("");

      try {
        setWhatsappSaving(true);

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

        const nextValue =
          !whatsappEnabled;

        const clean =
          cleanPhone(phone);

        if (
          nextValue &&
          !/^[6-9]\d{9}$/.test(
            clean
          )
        ) {
          throw new Error(
            "Please save a valid phone number before enabling WhatsApp notifications."
          );
        }

        const {
          error: updateError,
        } =
          await supabase
            .from(
              "customer_whatsapp_settings"
            )
            .upsert(
              {
                id: authUser.id,
                phone: clean,
                enabled:
                  nextValue,
                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict: "id",
              }
            );

        if (updateError) {
          throw updateError;
        }

        setWhatsappEnabled(
          nextValue
        );

        setMessage(
          nextValue
            ? "WhatsApp notifications enabled."
            : "WhatsApp notifications disabled."
        );
      } catch (err) {
        console.error(
          "WHATSAPP TOGGLE ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update WhatsApp settings."
        );
      } finally {
        setWhatsappSaving(false);
      }
    };

  const openCancelModal = (
    order: Order
  ) => {
    const status =
      String(
        order.order_status
      ).toLowerCase();

    if (
      ![
        "pending",
        "confirmed",
      ].includes(status)
    ) {
      setError(
        "This order can no longer be canceled."
      );
      return;
    }

    setError("");
    setMessage("");
    setCancelReason("");
    setCancelOrder(order);
  };

  const closeCancelModal =
    () => {
      if (cancelLoading) {
        return;
      }

      setCancelOrder(null);
      setCancelReason("");
    };

  const handleCustomerCancelOrder =
    async () => {
      if (!cancelOrder) {
        return;
      }

      const reason =
        cancelReason.trim();

      if (reason.length < 3) {
        setError(
          "Please enter a valid cancellation reason."
        );
        return;
      }

      try {
        setCancelLoading(true);
        setError("");
        setMessage("");

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        const response =
          await fetch(
            "/api/orders",
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                id: cancelOrder.id,
                order_status:
                  "canceled",
                cancellation_reason:
                  reason,
                cancellation_charge:
                  0,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to cancel order."
          );
        }

        if (!result.success) {
          throw new Error(
            result.error ||
              "Failed to cancel order."
          );
        }

        const updatedOrder =
          result.order;

        setOrders((currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id ===
              cancelOrder.id
                ? {
                    ...order,
                    ...(updatedOrder ||
                      {}),
                    order_status:
                      "canceled",
                    cancellation_reason:
                      reason,
                    cancellation_charge:
                      0,
                  }
                : order
          )
        );

        setExpandedOrderId(
          cancelOrder.id
        );

        setCancelOrder(null);
        setCancelReason("");

        setMessage(
          "Order canceled successfully. You will receive the order update by email and WhatsApp if WhatsApp notifications are enabled."
        );

        /*
         * Refresh from database so the UI
         * always shows the latest order state.
         */
        await loadOrders(true);
      } catch (err) {
        console.error(
          "CUSTOMER CANCEL ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to cancel order."
        );
      } finally {
        setCancelLoading(false);
      }
    };

  const canCustomerCancel =
    (status: string) =>
      status === "pending" ||
      status === "confirmed";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-gray-600">
            Loading your account...
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
            Login to view your account and orders.
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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">
      My Account
    </h1>
    <p className="mt-1 text-gray-600">
      Welcome back,{" "}
      {user.full_name || "Customer"}
    </p>
  </div>

  <div className="flex flex-wrap gap-3">
    <Link
      href="/account/settings"
      className="inline-flex w-fit rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-100"
    >
      ⚙️ Settings
    </Link>

    <Link
      href="/"
      className="inline-flex w-fit rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-100"
    >
      Continue Shopping
    </Link>
  </div>
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

        {/* ACCOUNT DETAILS */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* PROFILE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Profile
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </p>
                <p className="mt-1 text-gray-900">
                  {user.full_name ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </p>
                <p className="mt-1 break-all text-gray-900">
                  {user.email}
                </p>
              </div>

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
                        event.target.value
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

          {/* ADDRESS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Address
              </h2>

              {!addressEditing && (
                <button
                  type="button"
                  onClick={() =>
                    setAddressEditing(
                      true
                    )
                  }
                  className="text-sm font-semibold text-black underline"
                >
                  Edit
                </button>
              )}
            </div>

            {addressEditing ? (
              <div className="mt-5 space-y-3">
                <textarea
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Full delivery address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <input
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target.value
                    )
                  }
                  placeholder="City"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <input
                  value={pincode}
                  onChange={(event) =>
                    setPincode(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      ).slice(0, 6)
                    )
                  }
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={
                      handleSaveAddress
                    }
                    disabled={
                      savingAddress
                    }
                    className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {savingAddress
                      ? "Saving..."
                      : "Save Address"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAddressEditing(
                        false
                      )
                    }
                    disabled={
                      savingAddress
                    }
                    className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                {user.address ? (
                  <>
                    <p className="text-gray-900">
                      {user.address}
                    </p>

                    <p className="mt-1 text-gray-600">
                      {user.city}
                      {user.pincode
                        ? ` - ${user.pincode}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">
                    No delivery address saved.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* WHATSAPP SETTINGS */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                WhatsApp Order Updates
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Receive order status and payment updates on WhatsApp.
              </p>

              {phone && (
                <p className="mt-2 text-sm font-medium text-gray-800">
                  Number: +91{" "}
                  {cleanPhone(phone)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                handleWhatsappToggle
              }
              disabled={
                whatsappLoading ||
                whatsappSaving
              }
              className={`relative h-8 w-14 rounded-full transition ${
                whatsappEnabled
                  ? "bg-green-600"
                  : "bg-gray-300"
              } ${
                whatsappLoading ||
                whatsappSaving
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              aria-label="Toggle WhatsApp notifications"
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                  whatsappEnabled
                    ? "left-7"
                    : "left-1"
                }`}
              />
            </button>
          </div>
        </section>

        {/* ORDERS */}

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                My Orders
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Track your orders and payment status.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              disabled={
                loadingOrders ||
                refreshingOrders
              }
              className="inline-flex w-fit items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshingOrders
                ? "Refreshing..."
                : "↻ Refresh Orders"}
            </button>
          </div>

          {loadingOrders &&
          orders.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
              <p className="text-gray-600">
                Loading orders...
              </p>
            </div>
          ) : orders.length ===
            0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">
                🛍️
              </div>

              <h3 className="mt-4 text-xl font-bold text-gray-900">
                No orders yet
              </h3>

              <p className="mt-2 text-gray-600">
                Your placed orders will appear here.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-semibold text-white"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(
                (order) => {
                  const status =
                    String(
                      order.order_status ||
                        "pending"
                    ).toLowerCase();

                  const paymentStatus =
                    String(
                      order.payment_status ||
                        "pending"
                    ).toLowerCase();

                  const isExpanded =
                    expandedOrderId ===
                    order.id;

                  const canCancel =
                    canCustomerCancel(
                      status
                    );

                  return (
                    <div
                      key={order.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        highlightedOrderId ===
                        order.id
                          ? "border-black ring-2 ring-black/10"
                          : "border-gray-200"
                      }`}
                    >
                      {/* ORDER HEADER */}

                      <div className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(
                                isExpanded
                                  ? null
                                  : order.id
                              )
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
  Order #
  {order.id
    .slice(
      0,
      8
    )
    .toUpperCase()}{" "}
  {getOrderHeading(status)}
</span>

                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                  status
                                )}`}
                              >
                                <span>
                                  {getStatusIcon(
                                    status
                                  )}
                                </span>

                                {formatStatus(
                                  status
                                )}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                                  paymentStatus
                                )}`}
                              >
                                {formatPaymentStatus(
                                  paymentStatus
                                )}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span>
                                {formatDateTime(
                                  order.created_at
                                )}
                              </span>

                              <span>
                                {order.items?.length ||
                                  0}{" "}
                                item
                                {(order.items
                                  ?.length ||
                                  0) !== 1
                                  ? "s"
                                  : ""}
                              </span>

                              <span className="font-semibold text-gray-900">
                                {formatPrice(
                                  order.total_amount
                                )}
                              </span>
                            </div>
                          </button>

                          {/* VISIBLE CANCEL BUTTON */}

                          <div className="flex shrink-0 items-center gap-2">
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() =>
                                  openCancelModal(
                                    order
                                  )
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                              >
                                Cancel Order
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(
                                  isExpanded
                                    ? null
                                    : order.id
                                )
                              }
                              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                            >
                              {isExpanded
                                ? "Hide"
                                : "View"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* EXPANDED ORDER */}

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 p-5">
                          {/* CANCELLED ALERT */}

                          {status ===
                            "canceled" && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                              <p className="font-bold text-red-800">
                                This order has been canceled.
                              </p>

                              {order.cancellation_reason && (
                                <p className="mt-2 text-sm text-red-700">
                                  <strong>
                                    Reason:
                                  </strong>{" "}
                                  {
                                    order.cancellation_reason
                                  }
                                </p>
                              )}

                              <p className="mt-1 text-sm text-red-700">
                                <strong>
                                  Cancellation Charge:
                                </strong>{" "}
                                {formatPrice(
                                  order.cancellation_charge ||
                                    0
                                )}
                              </p>
                            </div>
                          )}

                          {/* ORDER ITEMS */}

                          <div>
                            <h3 className="font-bold text-gray-900">
                              Items
                            </h3>

                            <div className="mt-3 space-y-3">
                              {Array.isArray(
                                order.items
                              ) &&
                                order.items.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      key={`${item.id}-${index}`}
                                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                                    >
                                      {item.image ? (
                                        <img
                                          src={
                                            item.image
                                          }
                                          alt={
                                            item.name
                                          }
                                          className="h-16 w-16 rounded-lg object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                                          📦
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900">
                                          {
                                            item.name
                                          }
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                          Qty:{" "}
                                          {
                                            item.quantity
                                          }
                                        </p>
                                      </div>

                                      <p className="font-bold text-gray-900">
                                        {formatPrice(
                                          Number(
                                            item.price
                                          ) *
                                            Number(
                                              item.quantity
                                            )
                                        )}
                                      </p>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>

                          {/* SUMMARY */}

                          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex justify-between py-1 text-sm">
                              <span className="text-gray-600">
                                Subtotal
                              </span>

                              <span className="font-medium">
                                {formatPrice(
                                  order.subtotal
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between py-1 text-sm">
                              <span className="text-gray-600">
                                Delivery
                              </span>

                              <span className="font-medium">
                                {order.delivery_charge ===
                                0
                                  ? "Free"
                                  : formatPrice(
                                      order.delivery_charge
                                    )}
                              </span>
                            </div>

                            {Number(
                              order.cancellation_charge ||
                                0
                            ) > 0 && (
                              <div className="flex justify-between py-1 text-sm text-red-600">
                                <span>
                                  Cancellation Charge
                                </span>

                                <span className="font-medium">
                                  {formatPrice(
                                    order.cancellation_charge
                                  )}
                                </span>
                              </div>
                            )}

                            <div className="mt-2 flex justify-between border-t border-gray-200 pt-3">
                              <span className="font-bold text-gray-900">
                                Total
                              </span>

                              <span className="font-bold text-gray-900">
                                {formatPrice(
                                  order.total_amount
                                )}
                              </span>
                            </div>
                          </div>

                          {/* PAYMENT */}

                          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="font-bold text-gray-900">
                                  Payment Status
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  Payment status is updated after verification.
                                </p>
                              </div>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${getPaymentClasses(
                                  paymentStatus
                                )}`}
                              >
                                {formatPaymentStatus(
                                  paymentStatus
                                )}
                              </span>
                            </div>
                          </div>

                          {/* STATUS TIMELINE */}

                          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="font-bold text-gray-900">
                              Order Timeline
                            </h3>

                            <div className="mt-5 space-y-4">
                              {[
                                "pending",
                                "confirmed",
                                "out_for_delivery",
                                "delivered",
                              ].map(
                                (
                                  step,
                                  index
                                ) => {
                                  const statusOrder =
                                    [
                                      "pending",
                                      "confirmed",
                                      "out_for_delivery",
                                      "delivered",
                                    ];

                                  const currentIndex =
                                    statusOrder.indexOf(
                                      status
                                    );

                                  const stepIndex =
                                    index;

                                  const completed =
                                    status !==
                                      "canceled" &&
                                    currentIndex >=
                                      stepIndex;

                                  return (
                                    <div
                                      key={
                                        step
                                      }
                                      className="flex items-start gap-3"
                                    >
                                      <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                          completed
                                            ? "bg-black text-white"
                                            : "bg-gray-200 text-gray-500"
                                        }`}
                                      >
                                        {completed
                                          ? "✓"
                                          : index +
                                            1}
                                      </div>

                                      <div>
                                        <p
                                          className={`font-semibold ${
                                            completed
                                              ? "text-gray-900"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          {formatStatus(
                                            step
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              )}

                              {status ===
                                "canceled" && (
                                <div className="flex items-start gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                                    ×
                                  </div>

                                  <div>
                                    <p className="font-semibold text-red-700">
                                      Order Canceled
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                      Updated{" "}
                                      {formatDate(
                                        order.updated_at
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* DELIVERY ADDRESS */}

                          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="font-bold text-gray-900">
                              Delivery Address
                            </h3>

                            <p className="mt-2 text-gray-700">
                              {
                                order.delivery_address
                              }
                            </p>

                            <p className="text-gray-500">
                              {
                                order.city
                              }{" "}
                              -{" "}
                              {
                                order.pincode
                              }
                            </p>
                          </div>

                          {/* BOTTOM ACTION */}

                          <div className="mt-5 flex flex-wrap gap-3">
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() =>
                                  openCancelModal(
                                    order
                                  )
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100"
                              >
                                Cancel Order
                              </button>
                            )}

                            {status ===
                              "canceled" && (
                              <span className="rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-600">
                                Order Canceled
                              </span>
                            )}

                            {status ===
                              "delivered" && (
                              <span className="rounded-xl bg-green-50 px-5 py-3 font-semibold text-green-700">
                                Order Delivered
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {/* CUSTOMER CANCEL MODAL */}

      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cancel Order
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Order #
                  {cancelOrder.id
                    .slice(
                      0,
                      8
                    )
                    .toUpperCase()}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCancelModal
                }
                disabled={
                  cancelLoading
                }
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                You can cancel this order while it is{" "}
                <strong>
                  Pending
                </strong>{" "}
                or{" "}
                <strong>
                  Confirmed
                </strong>
                .
              </p>

              <p className="mt-2 text-sm font-semibold text-yellow-800">
                Cancellation Charge: ₹0
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Why do you want to cancel?
              </label>

              <textarea
                value={cancelReason}
                onChange={(event) =>
                  setCancelReason(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Enter cancellation reason..."
                disabled={
                  cancelLoading
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black disabled:bg-gray-100"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  closeCancelModal
                }
                disabled={
                  cancelLoading
                }
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={
                  handleCustomerCancelOrder
                }
                disabled={
                  cancelLoading ||
                  cancelReason.trim()
                    .length < 3
                }
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLoading
                  ? "Canceling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            <p className="text-gray-600">
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <AccountContent />
    </Suspense>
  );
}