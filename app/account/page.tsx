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
  id?: string | number | null;
  name?: string;
  price?: number | string;
  quantity?: number | string;
  image?: string | null;
};

type Order = {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  city?: string | null;
  pincode?: string | null;
  items?: OrderItem[] | null;
  subtotal?: number | string | null;
  delivery_charge?: number | string | null;
  cancellation_charge?: number | string | null;
  total_amount?: number | string | null;
  payment_status?: string | null;
  order_status?: string | null;
  cancellation_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function getStatusClasses(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "out_for_delivery":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "delivered":
      return "border-green-200 bg-green-50 text-green-700";

    case "canceled":
      return "border-red-200 bg-red-50 text-red-700";

    case "pending":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusIcon(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "✓";

    case "out_for_delivery":
      return "🚚";

    case "delivered":
      return "✓";

    case "canceled":
      return "✕";

    case "pending":
    default:
      return "⏳";
  }
}

function formatStatus(status?: string | null) {
  if (!status) {
    return "Pending";
  }

  return (
    statusLabels[status] ||
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatPaymentStatus(status?: string | null) {
  if (!status) {
    return "Payment Pending";
  }

  return (
    paymentLabels[status] ||
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatDate(date?: string | null) {
  if (!date) {
    return "";
  }

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "";
  }

  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatPrice(value?: number | string | null) {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN");
}

function AccountContent() {
  const searchParams = useSearchParams();

  const highlightedOrderId = searchParams.get("order");

  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const [addressEditing, setAddressEditing] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(highlightedOrderId);

  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  /*
   * =========================================================
   * LOAD ORDERS
   * =========================================================
   */

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("SESSION ERROR:", sessionError);
        setLoadingOrders(false);
        return;
      }

      const response = await fetch("/api/orders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (response.ok && result?.success) {
        const fetchedOrders = Array.isArray(result.orders)
          ? result.orders
          : [];

        setOrders(fetchedOrders);

        if (
          highlightedOrderId &&
          fetchedOrders.some(
            (order: Order) =>
              String(order.id) === String(highlightedOrderId)
          )
        ) {
          setExpandedOrderId(highlightedOrderId);
        }
      } else {
        console.error("ORDERS FETCH ERROR:", result);

        setError(
          result?.error ||
            result?.message ||
            "Unable to load your orders."
        );
      }
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error);

      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, [highlightedOrderId]);

  /*
   * =========================================================
   * LOAD USER + SETTINGS
   * =========================================================
   */

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        setWhatsappLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/login?redirect=/account";
          return;
        }

        const metadata = user.user_metadata || {};

        const fullName =
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Customer";

        const savedPhone = metadata.phone || user.phone || "";

        const provider = user.app_metadata?.provider || "email";

        const savedAddress = metadata.address || "";
        const savedCity = metadata.city || "";
        const savedPincode = metadata.pincode || "";

        const cleanPhone = String(savedPhone).replace(/\D/g, "");

        const accountUser: UserData = {
          id: user.id,
          email: user.email || "",
          full_name: fullName,
          phone: cleanPhone,
          provider,
          address: String(savedAddress),
          city: String(savedCity),
          pincode: String(savedPincode),
        };

        setUser(accountUser);
        setPhone(cleanPhone);
        setAddress(String(savedAddress));
        setCity(String(savedCity));
        setPincode(String(savedPincode));

        /*
         * =====================================================
         * WHATSAPP PHONE SYNC
         * =====================================================
         */

        const { error: whatsappSyncError } = await supabase
          .from("customer_whatsapp_settings")
          .upsert(
            {
              id: user.id,
              phone: cleanPhone,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "id",
            }
          );

        if (whatsappSyncError) {
          console.error(
            "WHATSAPP PHONE SYNC ERROR:",
            whatsappSyncError
          );
        }

        /*
         * =====================================================
         * LOAD WHATSAPP SETTINGS
         * =====================================================
         */

        const {
          data: whatsappSettings,
          error: whatsappSettingsError,
        } = await supabase
          .from("customer_whatsapp_settings")
          .select("phone, enabled, verified")
          .eq("id", user.id)
          .maybeSingle();

        if (whatsappSettingsError) {
          console.error(
            "WHATSAPP SETTINGS LOAD ERROR:",
            whatsappSettingsError
          );

          setWhatsappEnabled(false);
        } else if (whatsappSettings) {
          setWhatsappEnabled(Boolean(whatsappSettings.enabled));
        } else {
          setWhatsappEnabled(false);
        }

        setWhatsappLoading(false);

        await loadOrders();

        setLoading(false);
      } catch (error) {
        console.error("ACCOUNT LOAD ERROR:", error);

        setWhatsappLoading(false);
        setLoadingOrders(false);
        setLoading(false);
      }
    }

    loadAccount();
  }, [loadOrders]);

  /*
   * =========================================================
   * SAVE PHONE
   * =========================================================
   */

  async function handleSavePhone() {
    setError("");
    setMessage("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setSavingPhone(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          phone: cleanPhone,
        },
      });

      if (error) {
        console.error("PHONE UPDATE ERROR:", error);

        setError(
          error.message ||
            "Unable to save your mobile number. Please try again."
        );

        return;
      }

      if (data.user) {
        setUser((current) =>
          current
            ? {
                ...current,
                phone: cleanPhone,
              }
            : current
        );
      }

      setPhone(cleanPhone);

      if (user) {
        const { error: whatsappSyncError } = await supabase
          .from("customer_whatsapp_settings")
          .upsert(
            {
              id: user.id,
              phone: cleanPhone,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "id",
            }
          );

        if (whatsappSyncError) {
          console.error(
            "WHATSAPP PHONE UPDATE ERROR:",
            whatsappSyncError
          );
        }
      }

      setMessage("Mobile number saved successfully.");
    } catch (error) {
      console.error("PHONE SAVE ERROR:", error);

      setError(
        "Unable to save your mobile number. Please try again."
      );
    } finally {
      setSavingPhone(false);
    }
  }

  /*
   * =========================================================
   * SAVE ADDRESS
   * =========================================================
   */

  async function handleSaveAddress() {
    setError("");
    setMessage("");

    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanPincode = pincode.trim();

    if (!cleanAddress) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!cleanCity) {
      setError("Please enter your city.");
      return;
    }

    if (!/^\d{6}$/.test(cleanPincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    setSavingAddress(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          address: cleanAddress,
          city: cleanCity,
          pincode: cleanPincode,
        },
      });

      if (error) {
        console.error("ADDRESS UPDATE ERROR:", error);

        setError(
          error.message ||
            "Unable to save your address. Please try again."
        );

        return;
      }

      if (data.user) {
        setUser((current) =>
          current
            ? {
                ...current,
                address: cleanAddress,
                city: cleanCity,
                pincode: cleanPincode,
              }
            : current
        );
      }

      setAddress(cleanAddress);
      setCity(cleanCity);
      setPincode(cleanPincode);

      setAddressEditing(false);

      setMessage("Delivery address saved successfully.");
    } catch (error) {
      console.error("ADDRESS SAVE ERROR:", error);

      setError(
        "Unable to save your address. Please try again."
      );
    } finally {
      setSavingAddress(false);
    }
  }

  /*
   * =========================================================
   * WHATSAPP TOGGLE
   * =========================================================
   */

  async function handleWhatsappToggle() {
    if (!user) {
      return;
    }

    setError("");
    setMessage("");
    setWhatsappSaving(true);

    try {
      if (!user.phone) {
        setError("Please add your mobile number first.");
        return;
      }

      const newStatus = !whatsappEnabled;

      const { error: whatsappError } = await supabase
        .from("customer_whatsapp_settings")
        .upsert(
          {
            id: user.id,
            phone: user.phone,
            enabled: newStatus,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (whatsappError) {
        console.error(
          "WHATSAPP UPDATE ERROR:",
          whatsappError
        );

        setError(
          "Unable to update WhatsApp settings. Please try again."
        );

        return;
      }

      setWhatsappEnabled(newStatus);

      setMessage(
        newStatus
          ? "WhatsApp updates enabled successfully."
          : "WhatsApp updates disabled successfully."
      );
    } catch (error) {
      console.error("WHATSAPP TOGGLE ERROR:", error);

      setError(
        "Unable to update WhatsApp settings. Please try again."
      );
    } finally {
      setWhatsappSaving(false);
    }
  }

  /*
   * =========================================================
   * CUSTOMER CANCEL ORDER
   * =========================================================
   *
   * Customer can cancel only:
   *
   * pending
   * confirmed
   *
   * Customer cancellation charge = ₹0
   *
   * Admin can separately apply a cancellation charge.
   */

  function openCancelModal(order: Order) {
    if (
      order.order_status !== "pending" &&
      order.order_status !== "confirmed"
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
  }

  function closeCancelModal() {
    if (cancelLoading) {
      return;
    }

    setCancelOrder(null);
    setCancelReason("");
  }

  async function handleCustomerCancelOrder() {
    if (!cancelOrder) {
      return;
    }

    const reason = cancelReason.trim();

    if (!reason) {
      setError("Please enter a cancellation reason.");
      return;
    }

    if (reason.length < 3) {
      setError(
        "Please enter a valid cancellation reason."
      );
      return;
    }

    setError("");
    setMessage("");
    setCancelLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: cancelOrder.id,
          order_status: "canceled",
          cancellation_reason: reason,
          cancellation_charge: 0,
        }),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        console.error(
          "CUSTOMER CANCEL ERROR:",
          result
        );

        setError(
          result?.error ||
            result?.message ||
            "Unable to cancel this order."
        );

        return;
      }

      const updatedOrder: Order =
        result.order || {
          ...cancelOrder,
          order_status: "canceled",
          cancellation_reason: reason,
          cancellation_charge: 0,
        };

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order.id) === String(cancelOrder.id)
            ? {
                ...order,
                ...updatedOrder,
              }
            : order
        )
      );

      setCancelOrder(null);
      setCancelReason("");

      setExpandedOrderId(String(cancelOrder.id));

      setMessage(
        "Your order has been canceled successfully."
      );
    } catch (error) {
      console.error(
        "CUSTOMER CANCEL REQUEST ERROR:",
        error
      );

      setError(
        "Unable to cancel the order. Please try again."
      );
    } finally {
      setCancelLoading(false);
    }
  }

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.href = "/";
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading account...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const phoneMissing = !user.phone;

  const addressMissing =
    !user.address ||
    !user.city ||
    !user.pincode;

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-10 text-zinc-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-zinc-500 transition hover:text-[#5c4033]"
            >
              ← Back to Store
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#5c4033] sm:text-4xl">
              My Account
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your account, orders and delivery details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-fit rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Logout
          </button>
        </div>

        {/* GLOBAL MESSAGE */}

        {message && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && !phoneMissing && !addressEditing && !cancelOrder && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* PROFILE */}

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold text-white">
              {user.full_name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  {user.full_name}
                </h2>

                {user.provider === "google" && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Google Account
                  </span>
                )}
              </div>

              <p className="mt-1 break-all text-sm text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Email
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-zinc-900">
                {user.email}
              </p>
            </div>

            <div className="rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Mobile Number
              </p>

              {user.phone ? (
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  +91 {user.phone}
                </p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-amber-700">
                  Not added
                </p>
              )}
            </div>
          </div>
        </section>

        {/* PHONE */}

        {phoneMissing && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                📱
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Complete Your Profile
                </h2>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Add your mobile number so we can contact you about your orders and delivery.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Mobile Number
              </label>

              <div className="flex">
                <div className="flex items-center rounded-l-xl border border-r-0 border-zinc-300 bg-zinc-50 px-4 text-sm font-medium text-zinc-700">
                  +91
                </div>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full rounded-r-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#5c4033] focus:ring-2 focus:ring-[#eee8dc]"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="mt-5 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPhone
                ? "Saving..."
                : "Save Mobile Number"}
            </button>
          </section>
        )}

        {/* ORDERS */}

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
                  📦
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#5c4033]">
                    My Orders
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Track your recent orders and delivery status.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-full bg-[#faf9f6] px-4 py-2 text-xs font-bold text-zinc-600">
              {orders.length}{" "}
              {orders.length === 1 ? "Order" : "Orders"}
            </div>
          </div>

          {loadingOrders ? (
            <div className="mt-7 rounded-2xl bg-[#faf9f6] px-5 py-8 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />

              <p className="mt-3 text-sm text-zinc-500">
                Loading your orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-zinc-200 bg-[#faf9f6] px-5 py-10 text-center">
              <div className="text-4xl">🛍️</div>

              <h3 className="mt-4 text-base font-bold text-zinc-800">
                No orders yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Your orders will appear here after you place your first order.
              </p>

              <Link
                href="/#products"
                className="mt-5 inline-block rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-7 space-y-4">
              {orders.map((order) => {
                const isExpanded =
                  expandedOrderId === String(order.id);

                const isHighlighted =
                  highlightedOrderId === String(order.id);

                const items = Array.isArray(order.items)
                  ? order.items
                  : [];

                const canCustomerCancel =
                  order.order_status === "pending" ||
                  order.order_status === "confirmed";

                return (
                  <div
                    key={order.id}
                    className={`overflow-hidden rounded-2xl border transition ${
                      isHighlighted
                        ? "border-amber-300 bg-amber-50/30 shadow-md"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId(
                          isExpanded
                            ? null
                            : String(order.id)
                        )
                      }
                      className="w-full p-5 text-left"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900">
                              Order #
                              {String(order.id).slice(0, 8)}
                            </span>

                            {isHighlighted && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                Just Placed
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                              order.order_status
                            )}`}
                          >
                            <span>
                              {getStatusIcon(
                                order.order_status
                              )}
                            </span>

                            {formatStatus(
                              order.order_status
                            )}
                          </span>

                          <span className="text-lg font-bold text-[#5c4033]">
                            ₹
                            {formatPrice(
                              order.total_amount
                            )}
                          </span>

                          <span className="text-zinc-400">
                            {isExpanded ? "⌃" : "⌄"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 px-5 pb-5 pt-5">

                        {/* ACTIONS */}

                        <div className="mb-5 flex flex-wrap gap-3">
                          {canCustomerCancel && (
                            <button
                              type="button"
                              onClick={() =>
                                openCancelModal(order)
                              }
                              className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                            >
                              Cancel Order
                            </button>
                          )}

                          {order.order_status === "canceled" && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700">
                              Order Canceled
                            </span>
                          )}

                          {order.order_status === "delivered" && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-5 py-2.5 text-xs font-bold text-green-700">
                              Order Delivered
                            </span>
                          )}
                        </div>

                        {/* STATUS TIMELINE */}

                        <div className="rounded-2xl bg-[#faf9f6] p-5">
                          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                            Order Status
                          </p>

                          <div className="mt-5 grid grid-cols-5 gap-1">
                            {[
                              "pending",
                              "confirmed",
                              "out_for_delivery",
                              "delivered",
                            ].map((status, index) => {
                              const orderStatus =
                                order.order_status;

                              const statusOrder = [
                                "pending",
                                "confirmed",
                                "out_for_delivery",
                                "delivered",
                              ];

                              const currentIndex =
                                statusOrder.indexOf(
                                  orderStatus ||
                                    "pending"
                                );

                              const active =
                                orderStatus !== "canceled" &&
                                currentIndex >= index;

                              return (
                                <div
                                  key={status}
                                  className="relative text-center"
                                >
                                  <div
                                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                      active
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-200 text-zinc-400"
                                    }`}
                                  >
                                    {active
                                      ? "✓"
                                      : index + 1}
                                  </div>

                                  <p className="mt-2 hidden text-[10px] font-semibold text-zinc-500 sm:block">
                                    {statusLabels[status]}
                                  </p>

                                  {index < 3 && (
                                    <div
                                      className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-px ${
                                        active &&
                                        currentIndex >
                                          index
                                          ? "bg-zinc-900"
                                          : "bg-zinc-200"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {order.order_status ===
                            "canceled" && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                              <p className="text-sm font-bold text-red-700">
                                Order Canceled
                              </p>

                              {order.cancellation_reason && (
                                <p className="mt-1 text-xs leading-5 text-red-600">
                                  Reason:{" "}
                                  {
                                    order.cancellation_reason
                                  }
                                </p>
                              )}

                              {Number(
                                order.cancellation_charge ||
                                  0
                              ) > 0 && (
                                <p className="mt-1 text-xs text-red-600">
                                  Cancellation charge: ₹
                                  {formatPrice(
                                    order.cancellation_charge
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* PRODUCTS */}

                        <div className="mt-5">
                          <h3 className="text-sm font-bold text-zinc-800">
                            Products
                          </h3>

                          <div className="mt-3 space-y-3">
                            {items.map((item, index) => {
                              const quantity = Number(
                                item.quantity || 1
                              );

                              const price = Number(
                                item.price || 0
                              );

                              return (
                                <div
                                  key={`${order.id}-${item.id || item.name || index}`}
                                  className="flex gap-3 rounded-2xl bg-[#faf9f6] p-3"
                                >
                                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#eee8dc]">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={
                                          item.name ||
                                          "Product"
                                        }
                                        className="h-full w-full object-contain p-2"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xl">
                                        🍳
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-semibold text-zinc-800">
                                      {item.name ||
                                        "Product"}
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                      Qty: {quantity}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-sm font-bold text-[#5c4033]">
                                      ₹
                                      {formatPrice(
                                        price * quantity
                                      )}
                                    </p>

                                    <p className="mt-1 text-[11px] text-zinc-400">
                                      ₹
                                      {formatPrice(price)}{" "}
                                      each
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* DELIVERY ADDRESS */}

                        <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-lg">📍</div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                                Delivery Address
                              </p>

                              <p className="mt-2 text-sm font-semibold text-zinc-800">
                                {order.delivery_address}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                {order.city}
                                {order.pincode
                                  ? ` - ${order.pincode}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PRICE DETAILS */}

                        <div className="mt-5 rounded-2xl bg-[#faf9f6] p-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-500">
                                Subtotal
                              </span>

                              <span className="text-sm font-semibold text-zinc-800">
                                ₹
                                {formatPrice(
                                  order.subtotal
                                )}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-500">
                                Delivery Fee
                              </span>

                              <span className="text-sm font-semibold text-zinc-800">
                                {Number(
                                  order.delivery_charge ||
                                    0
                                ) === 0
                                  ? "FREE"
                                  : `₹${formatPrice(
                                      order.delivery_charge
                                    )}`}
                              </span>
                            </div>

                            {Number(
                              order.cancellation_charge ||
                                0
                            ) > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-red-500">
                                  Cancellation Charge
                                </span>

                                <span className="text-sm font-semibold text-red-600">
                                  ₹
                                  {formatPrice(
                                    order.cancellation_charge
                                  )}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-zinc-200 pt-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#5c4033]">
                                  Total
                                </span>

                                <span className="text-xl font-bold text-[#5c4033]">
                                  ₹
                                  {formatPrice(
                                    order.total_amount
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* PAYMENT */}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                              Payment
                            </p>

                            <p
                              className={`mt-1 text-sm font-semibold ${
                                order.payment_status ===
                                "paid"
                                  ? "text-green-700"
                                  : order.payment_status ===
                                    "failed"
                                  ? "text-red-700"
                                  : order.payment_status ===
                                    "refunded"
                                  ? "text-blue-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {formatPaymentStatus(
                                order.payment_status
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-zinc-400">
                              Order placed
                            </p>

                            <p className="mt-1 text-xs font-semibold text-zinc-600">
                              {formatDateTime(
                                order.created_at
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ACCOUNT OPTIONS */}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">

          {/* DELIVERY ADDRESS */}

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              📍
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Delivery Address
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Save your delivery address for faster checkout.
            </p>

            {!addressEditing && !addressMissing ? (
              <div className="mt-5 rounded-2xl bg-[#faf9f6] p-4">
                <p className="text-sm font-semibold leading-6 text-zinc-900">
                  {user.address}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {user.city} - {user.pincode}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMessage("");

                    setAddress(user.address);
                    setCity(user.city);
                    setPincode(user.pincode);

                    setAddressEditing(true);
                  }}
                  className="mt-4 rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  Edit Address
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold text-zinc-700">
                  Full Delivery Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  rows={3}
                  placeholder="House no., street, area..."
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#eee8dc]"
                />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-zinc-700">
                      City
                    </label>

                    <input
                      type="text"
                      value={city}
                      onChange={(e) =>
                        setCity(e.target.value)
                      }
                      placeholder="City"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#eee8dc]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-zinc-700">
                      Pincode
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={pincode}
                      onChange={(e) =>
                        setPincode(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#eee8dc]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={savingAddress}
                    className="rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAddress
                      ? "Saving..."
                      : "Save Address"}
                  </button>

                  {!addressMissing && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddress(user.address);
                        setCity(user.city);
                        setPincode(user.pincode);
                        setAddressEditing(false);
                        setError("");
                      }}
                      className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* WHATSAPP */}

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                  whatsappEnabled
                    ? "bg-green-50"
                    : "bg-zinc-100"
                }`}
              >
                💬
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-900">
                    WhatsApp Updates
                  </h2>

                  {!whatsappLoading && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        whatsappEnabled
                          ? "bg-green-50 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {whatsappEnabled ? "ON" : "OFF"}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Get important updates about your orders and delivery directly on WhatsApp.
                </p>
              </div>
            </div>

            <div
              className={`mt-6 rounded-2xl p-5 ${
                whatsappEnabled
                  ? "bg-green-50"
                  : "bg-[#faf9f6]"
              }`}
            >
              {whatsappLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />

                  <p className="text-sm text-zinc-500">
                    Loading WhatsApp settings...
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm ${
                      whatsappEnabled
                        ? "bg-green-600 text-white"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {whatsappEnabled ? "✓" : "○"}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        whatsappEnabled
                          ? "text-green-800"
                          : "text-zinc-700"
                      }`}
                    >
                      {whatsappEnabled
                        ? "WhatsApp updates are ON"
                        : "WhatsApp updates are OFF"}
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        whatsappEnabled
                          ? "text-green-700"
                          : "text-zinc-500"
                      }`}
                    >
                      {whatsappEnabled
                        ? "You'll receive order and delivery updates on WhatsApp."
                        : "Turn on WhatsApp updates to receive order and delivery notifications."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                WhatsApp Number
              </p>

              {user.phone ? (
                <p className="mt-2 text-sm font-semibold text-zinc-800">
                  +91 {user.phone}
                </p>
              ) : (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Please add your mobile number first.
                </p>
              )}
            </div>

            {user.phone && !whatsappLoading && (
              <button
                type="button"
                onClick={handleWhatsappToggle}
                disabled={whatsappSaving}
                className={`mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  whatsappEnabled
                    ? "bg-zinc-900 hover:bg-red-600"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {whatsappSaving
                  ? "Updating..."
                  : whatsappEnabled
                  ? "Turn Off WhatsApp Updates"
                  : "Turn On WhatsApp Updates"}
              </button>
            )}
          </section>

          {/* CUSTOMER SUPPORT */}

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              🛟
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Customer Support
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Need help with a product or order? Contact us directly.
            </p>

            <a
              href="https://wa.me/917011872380"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              💬 Chat on WhatsApp
            </a>
          </section>

          {/* SHOPPING */}

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              🛍️
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Continue Shopping
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Explore our latest kitchenware and electronics products.
            </p>

            <Link
              href="/#products"
              className="mt-5 inline-block rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Browse Products →
            </Link>
          </section>
        </div>

        {/* FOOTER */}

        <Link
          href="/"
          className="mt-8 block text-center text-xs text-zinc-500 transition hover:text-zinc-900 hover:underline"
        >
          ← Back to store
        </Link>
      </div>

      {/* =====================================================
          CUSTOMER CANCEL MODAL
      ===================================================== */}

      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Cancel Order
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Order #
                  {String(cancelOrder.id).slice(0, 8)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">
                Before you cancel
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Customer cancellation is available while the
                order is Pending or Confirmed.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-[#faf9f6] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Order Total
                </span>

                <span className="text-lg font-bold text-[#5c4033]">
                  ₹
                  {formatPrice(
                    cancelOrder.total_amount
                  )}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Customer Cancellation Charge
                </span>

                <span className="text-sm font-bold text-green-700">
                  ₹0
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="cancelReason"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Cancellation Reason
              </label>

              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) =>
                  setCancelReason(e.target.value)
                }
                rows={4}
                maxLength={500}
                placeholder="Please tell us why you want to cancel this order..."
                disabled={cancelLoading}
                className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#5c4033] focus:ring-2 focus:ring-[#eee8dc] disabled:bg-zinc-50"
              />

              <p className="mt-1 text-right text-[11px] text-zinc-400">
                {cancelReason.length}/500
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelLoading}
                className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleCustomerCancelOrder}
                disabled={cancelLoading}
                className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />

            <p className="mt-4 text-sm text-[#6b5a4d]">
              Loading account...
            </p>
          </div>
        </main>
      }
    >
      <AccountContent />
    </Suspense>
  );
}