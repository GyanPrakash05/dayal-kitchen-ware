"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/app/lib/supabase";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type OrderItem = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
};

type Order = {
  id: string;
  user_id: string;

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

  cancellation_reason?: string | null;

  total_amount: number;

  payment_status: PaymentStatus;
  order_status: OrderStatus;

  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "canceled",
    label: "Canceled",
  },
];

const PAYMENT_OPTIONS: {
  value: PaymentStatus;
  label: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
  value: number | null | undefined
) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status: OrderStatus) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    )?.label || status
  );
}

function getPaymentLabel(
  status: PaymentStatus
) {
  return (
    PAYMENT_OPTIONS.find(
      (item) => item.value === status
    )?.label || status
  );
}

function getStatusClasses(
  status: OrderStatus
) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";

    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";

    case "out_for_delivery":
      return "bg-purple-100 text-purple-800 border-purple-200";

    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";

    case "canceled":
      return "bg-red-100 text-red-800 border-red-200";

    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getPaymentClasses(
  status: PaymentStatus
) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";

    case "failed":
      return "bg-red-100 text-red-800 border-red-200";

    case "refunded":
      return "bg-purple-100 text-purple-800 border-purple-200";

    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

function cleanPhone(phone: string) {
  const digits = String(phone || "").replace(
    /\D/g,
    ""
  );

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits;
  }

  return digits;
}

function createWhatsAppMessage(
  order: Order,
  status?: OrderStatus
) {
  const orderId = String(order.id)
    .slice(0, 8)
    .toUpperCase();

  const currentStatus =
    status || order.order_status;

  let message =
    `Hello ${order.customer_name || "Customer"},\n\n` +
    `Your Dayal Kitchen Ware order #${orderId} has been updated.\n\n` +
    `Order Status: ${getStatusLabel(currentStatus)}\n` +
    `Payment Status: ${getPaymentLabel(
      order.payment_status || "pending"
    )}\n` +
    `Order Total: ${formatPrice(
      order.total_amount
    )}\n\n`;

  if (currentStatus === "canceled") {
    message +=
      `Cancellation Reason: ${
        order.cancellation_reason ||
        "Not provided"
      }\n` +
      `Cancellation Charge: ${formatPrice(
        order.cancellation_charge
      )}\n\n`;
  }

  message +=
    `Delivery Address: ${
      order.delivery_address || ""
    }, ${order.city || ""} - ${
      order.pincode || ""
    }\n\n` +
    `Thank you for choosing Dayal Kitchen Ware.`;

  return message;
}

function openWhatsApp(
  order: Order,
  status?: OrderStatus
) {
  const phone = cleanPhone(
    order.customer_phone
  );

  if (!phone) {
    return;
  }

  const message =
    createWhatsAppMessage(order, status);

  const url =
    `https://wa.me/${phone}?text=` +
    encodeURIComponent(message);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================================================
   NEW ORDER NOTIFICATION SOUND
========================================================= */

function playNewOrderSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext =
      new AudioContextClass();

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
      660,
      audioContext.currentTime + 0.15
    );

    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime + 0.3
    );

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.18,
      audioContext.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.5
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 0.55
    );

    oscillator.onended = () => {
      audioContext.close().catch(() => {});
    };
  } catch (error) {
    console.warn(
      "Notification sound could not be played:",
      error
    );
  }
}

/* =========================================================
   BROWSER NOTIFICATION
========================================================= */

function showBrowserNotification(
  order: Order
) {
  try {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission !== "granted"
    ) {
      return;
    }

    const orderId = String(order.id)
      .slice(0, 8)
      .toUpperCase();

    new Notification(
      "New Order Received",
      {
        body:
          `Order #${orderId}\n` +
          `${order.customer_name || "Customer"} • ` +
          `${formatPrice(
            order.total_amount
          )}`,
        icon: "/favicon.ico",
      }
    );
  } catch (error) {
    console.warn(
      "Browser notification failed:",
      error
    );
  }
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | OrderStatus>("all");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState<
    "all" | PaymentStatus
  >("all");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [cancelOrder, setCancelOrder] =
    useState<Order | null>(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const [cancelCharge, setCancelCharge] =
    useState("");

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

    const [realtimeStatus, setRealtimeStatus] =
  useState<
    "CONNECTING" | "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED"
  >("CONNECTING");

  const toastTimerRef =
    useRef<number | null>(null);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback(
    (message: string) => {
      setToast(message);

      if (toastTimerRef.current) {
        window.clearTimeout(
          toastTimerRef.current
        );
      }

      toastTimerRef.current =
        window.setTimeout(() => {
          setToast("");
        }, 5000);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, []);

  /* =======================================================
     ENABLE BROWSER NOTIFICATIONS
  ======================================================= */

  const enableBrowserNotifications =
    async () => {
      try {
        if (
          typeof window === "undefined" ||
          !("Notification" in window)
        ) {
          showToast(
            "Browser notifications are not supported."
          );
          return;
        }

        const permission =
          await Notification.requestPermission();

        if (permission === "granted") {
          showToast(
            "Browser notifications enabled."
          );
        } else {
          showToast(
            "Browser notifications are disabled."
          );
        }
      } catch (error) {
        console.error(error);

        showToast(
          "Unable to enable browser notifications."
        );
      }
    };

  /* =======================================================
     GET ORDERS
  ======================================================= */

  const getOrders = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError(
            "Admin session expired. Please login again."
          );
          return;
        }

        const response = await fetch(
          "/api/orders",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Failed to fetch orders."
          );
        }

        setOrders(
          Array.isArray(result.orders)
            ? result.orders
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    getOrders();
  }, [getOrders]);

   /* =======================================================
     SUPABASE REALTIME - NEW ORDERS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          if (!isMounted) {
            return;
          }

          console.log(
            "🔔 New order received from Supabase Realtime:",
            payload
          );

          const newOrder =
            payload.new as Partial<Order>;

          const orderId = String(
            newOrder.id || ""
          )
            .slice(0, 8)
            .toUpperCase();

          /*
           * Show instant admin notification
           */
          showToast(
            `🔔 New Order Received #${orderId}`
          );

          /*
           * Play notification sound
           */
          playNewOrderSound();

          /*
           * Browser notification
           */
          if (
            newOrder.id &&
            newOrder.customer_name &&
            newOrder.total_amount !== undefined
          ) {
            showBrowserNotification(
              newOrder as Order
            );
          }

          /*
           * Fetch complete order data from
           * authenticated API.
           *
           * This keeps the existing API/RLS/security
           * flow intact instead of trusting the realtime
           * payload for the complete admin order object.
           */
          await getOrders(true);
        }
      )
      .subscribe((status) => {
        if (!isMounted) {
          return;
        }

        console.log(
          "Orders realtime status:",
          status
        );

        setRealtimeStatus(
          status as
            | "CONNECTING"
            | "SUBSCRIBED"
            | "CHANNEL_ERROR"
            | "TIMED_OUT"
            | "CLOSED"
        );
      });

    return () => {
      isMounted = false;

      supabase.removeChannel(channel);
    };
  }, [getOrders, showToast]);
  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  const updateOrderStatus = async (
    order: Order,
    status: OrderStatus,
    reason?: string,
    charge?: number
  ) => {
    try {
      setUpdatingOrderId(order.id);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const body: Record<
        string,
        unknown
      > = {
        id: order.id,
        order_status: status,
      };

      if (status === "canceled") {
        body.cancellation_reason =
          reason || "";

        body.cancellation_charge =
          Number(charge || 0);
      }

      const response = await fetch(
        "/api/orders",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Failed to update order."
        );
      }

      const updatedOrder =
        result.order as Order;

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? updatedOrder
            : item
        )
      );

      setSelectedOrder((current) =>
        current?.id === order.id
          ? updatedOrder
          : current
      );

      if (status === "canceled") {
        setCancelOrder(null);
        setCancelReason("");
        setCancelCharge("");
      }

      showToast(
        status === "canceled"
          ? "Order canceled successfully."
          : `Order status changed to ${getStatusLabel(
              status
            )}.`
      );

      openWhatsApp(
        updatedOrder,
        status
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const updatePaymentStatus =
    async (
      order: Order,
      paymentStatus: PaymentStatus
    ) => {
      try {
        setUpdatingOrderId(order.id);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Admin session expired. Please login again."
          );
        }

        const response = await fetch(
          "/api/orders",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              id: order.id,
              payment_status:
                paymentStatus,
            }),
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Failed to update payment status."
          );
        }

        const updatedOrder =
          result.order as Order;

        setOrders((current) =>
          current.map((item) =>
            item.id === order.id
              ? updatedOrder
              : item
          )
        );

        setSelectedOrder((current) =>
          current?.id === order.id
            ? updatedOrder
            : current
        );

        showToast(
          `Payment status changed to ${getPaymentLabel(
            paymentStatus
          )}.`
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to update payment status."
        );
      } finally {
        setUpdatingOrderId(null);
      }
    };

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        [
          order.id,
          order.customer_name,
          order.customer_email,
          order.customer_phone,
          order.city,
          order.pincode,
          order.delivery_address,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesStatus =
        statusFilter === "all" ||
        order.order_status ===
          statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        order.payment_status ===
          paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter(
      (order) =>
        order.order_status === "pending"
    ).length;

    const confirmed = orders.filter(
      (order) =>
        order.order_status === "confirmed"
    ).length;

    const outForDelivery =
      orders.filter(
        (order) =>
          order.order_status ===
          "out_for_delivery"
      ).length;

    const delivered = orders.filter(
      (order) =>
        order.order_status === "delivered"
    ).length;

    const canceled = orders.filter(
      (order) =>
        order.order_status === "canceled"
    ).length;

    const paid = orders.filter(
      (order) =>
        order.payment_status === "paid"
    ).length;

    const paymentPending =
      orders.filter(
        (order) =>
          order.payment_status ===
          "pending"
      ).length;

    const totalRevenue = orders
      .filter(
        (order) =>
          order.order_status !==
          "canceled"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.total_amount || 0),
        0
      );

    return {
      total,
      pending,
      confirmed,
      outForDelivery,
      delivered,
      canceled,
      paid,
      paymentPending,
      totalRevenue,
    };
  }, [orders]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-80 rounded bg-gray-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-gray-200"
                />
              ))}
            </div>

            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Dayal Kitchen Ware Admin
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage customer orders,
              delivery status and payment
              updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                enableBrowserNotifications
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              🔔 Notifications
            </button>

            <button
              type="button"
              onClick={() =>
                getOrders(true)
              }
              disabled={refreshing}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Orders"}
            </button>
          </div>
        </header>

        {/* =================================================
            REALTIME STATUS
        ================================================= */}

        <div
  className={`flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
    realtimeStatus === "SUBSCRIBED"
      ? "border-green-200 bg-green-50 text-green-800"
      : realtimeStatus === "CONNECTING"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : "border-red-200 bg-red-50 text-red-800"
  }`}
>
  <span
    className={`h-2.5 w-2.5 rounded-full ${
      realtimeStatus === "SUBSCRIBED"
        ? "bg-green-500"
        : realtimeStatus === "CONNECTING"
        ? "bg-yellow-500"
        : "bg-red-500"
    }`}
  />

  <span className="font-medium">
    {realtimeStatus === "SUBSCRIBED"
      ? "Live order notifications active"
      : realtimeStatus === "CONNECTING"
      ? "Connecting to live order notifications..."
      : "Live order notifications disconnected"}
  </span>

  <span
    className={
      realtimeStatus === "SUBSCRIBED"
        ? "text-green-700"
        : realtimeStatus === "CONNECTING"
        ? "text-yellow-700"
        : "text-red-700"
    }
  >
    {realtimeStatus === "SUBSCRIBED"
      ? "— new orders will appear automatically."
      : realtimeStatus === "CONNECTING"
      ? "— please wait."
      : "— check your Supabase Realtime configuration."}
  </span>
</div>

        {/* =================================================
            TOAST
        ================================================= */}

        {toast && (
          <div className="fixed right-4 top-4 z-[100] max-w-sm rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl">
            {toast}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={stats.total}
          />

          <StatCard
            title="Pending"
            value={stats.pending}
          />

          <StatCard
            title="Confirmed"
            value={stats.confirmed}
          />

          <StatCard
            title="Out for Delivery"
            value={
              stats.outForDelivery
            }
          />

          <StatCard
            title="Delivered"
            value={stats.delivered}
          />

          <StatCard
            title="Canceled"
            value={stats.canceled}
          />

          <StatCard
            title="Paid Orders"
            value={stats.paid}
          />

          <StatCard
            title="Payment Pending"
            value={
              stats.paymentPending
            }
          />
        </section>

        {/* =================================================
            REVENUE
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Order Value
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatPrice(
              stats.totalRevenue
            )}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Canceled orders are excluded.
          </p>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, customer, phone, city..."
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | OrderStatus
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="all">
                All Order Statuses
              </option>

              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value as
                    | "all"
                    | PaymentStatus
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="all">
                All Payment Statuses
              </option>

              {PAYMENT_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            Showing{" "}
            <strong>
              {filteredOrders.length}
            </strong>{" "}
            of{" "}
            <strong>
              {orders.length}
            </strong>{" "}
            orders
          </div>
        </section>

        {/* =================================================
            ORDERS
        ================================================= */}

        {filteredOrders.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">
              📦
            </div>

            <h2 className="mt-3 text-lg font-semibold text-gray-900">
              No orders found
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or
              filters.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {filteredOrders.map(
              (order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updatingOrderId={
                    updatingOrderId
                  }
                  onView={() =>
                    setSelectedOrder(
                      order
                    )
                  }
                  onWhatsApp={() =>
                    openWhatsApp(order)
                  }
                  onStatusChange={(
                    status
                  ) => {
                    if (
                      status ===
                      "canceled"
                    ) {
                      setCancelOrder(
                        order
                      );
                      setCancelReason(
                        ""
                      );
                      setCancelCharge(
                        ""
                      );
                      return;
                    }

                    updateOrderStatus(
                      order,
                      status
                    );
                  }}
                  onPaymentChange={(
                    paymentStatus
                  ) =>
                    updatePaymentStatus(
                      order,
                      paymentStatus
                    )
                  }
                />
              )
            )}
          </section>
        )}
      </div>

      {/* ===================================================
          ORDER DETAILS MODAL
      =================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          updating={
            updatingOrderId ===
            selectedOrder.id
          }
          onClose={() =>
            setSelectedOrder(null)
          }
          onWhatsApp={() =>
            openWhatsApp(
              selectedOrder
            )
          }
          onStatusChange={(
            status
          ) => {
            if (
              status === "canceled"
            ) {
              setCancelOrder(
                selectedOrder
              );
              setCancelReason("");
              setCancelCharge("");
              return;
            }

            updateOrderStatus(
              selectedOrder,
              status
            );
          }}
          onPaymentChange={(
            paymentStatus
          ) =>
            updatePaymentStatus(
              selectedOrder,
              paymentStatus
            )
          }
        />
      )}

      {/* ===================================================
          CANCELLATION MODAL
      =================================================== */}

      {cancelOrder && (
        <CancellationModal
          order={cancelOrder}
          reason={cancelReason}
          charge={cancelCharge}
          updating={
            updatingOrderId ===
            cancelOrder.id
          }
          onReasonChange={
            setCancelReason
          }
          onChargeChange={
            setCancelCharge
          }
          onClose={() => {
            setCancelOrder(null);
            setCancelReason("");
            setCancelCharge("");
          }}
          onConfirm={() => {
            const reason =
              cancelReason.trim();

            if (!reason) {
              setError(
                "Cancellation reason is required."
              );
              return;
            }

            const charge =
              Number(
                cancelCharge || 0
              );

            if (
              !Number.isFinite(
                charge
              ) ||
              charge < 0
            ) {
              setError(
                "Please enter a valid cancellation charge."
              );
              return;
            }

            if (
              charge >
              Number(
                cancelOrder.total_amount ||
                  0
              )
            ) {
              setError(
                "Cancellation charge cannot be greater than the order total."
              );
              return;
            }

            updateOrderStatus(
              cancelOrder,
              "canceled",
              reason,
              charge
            );
          }}
        />
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  updatingOrderId,
  onView,
  onWhatsApp,
  onStatusChange,
  onPaymentChange,
}: {
  order: Order;
  updatingOrderId: string | null;
  onView: () => void;
  onWhatsApp: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onPaymentChange: (
    status: PaymentStatus
  ) => void;
}) {
  const isUpdating =
    updatingOrderId === order.id;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-gray-900">
              #{String(order.id)
                .slice(0, 8)
                .toUpperCase()}
            </h2>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                order.order_status
              )}`}
            >
              {getStatusLabel(
                order.order_status
              )}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                order.payment_status
              )}`}
            >
              Payment:{" "}
              {getPaymentLabel(
                order.payment_status
              )}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {formatDate(
              order.created_at
            )}
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-xs text-gray-500">
            Order Total
          </p>

          <p className="text-xl font-bold text-gray-900">
            {formatPrice(
              order.total_amount
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-3">
        <Info
          label="Customer"
          value={
            order.customer_name ||
            "—"
          }
          secondary={
            order.customer_email
          }
        />

        <Info
          label="Phone"
          value={
            order.customer_phone ||
            "—"
          }
        />

        <Info
          label="Delivery"
          value={`${order.city || ""} ${
            order.pincode || ""
          }`}
          secondary={
            order.delivery_address
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {Array.isArray(
                order.items
              )
                ? order.items.length
                : 0}{" "}
              product
              {Array.isArray(
                order.items
              ) &&
              order.items.length !== 1
                ? "s"
                : ""}
            </p>

            <p className="text-xs text-gray-500">
              Subtotal{" "}
              {formatPrice(
                order.subtotal
              )}{" "}
              • Delivery{" "}
              {formatPrice(
                order.delivery_charge
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onView}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Details
            </button>

            <button
              type="button"
              onClick={onWhatsApp}
              disabled={
                !order.customer_phone
              }
              className="rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              WhatsApp
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Order Status
            </label>

            <select
              value={
                order.order_status
              }
              disabled={isUpdating}
              onChange={(event) =>
                onStatusChange(
                  event.target
                    .value as OrderStatus
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Payment Status
            </label>

            <select
              value={
                order.payment_status ||
                "pending"
              }
              disabled={isUpdating}
              onChange={(event) =>
                onPaymentChange(
                  event.target
                    .value as PaymentStatus
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
            >
              {PAYMENT_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {isUpdating && (
          <p className="text-xs font-medium text-gray-500">
            Updating order...
          </p>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   ORDER DETAILS MODAL
========================================================= */

function OrderDetailsModal({
  order,
  updating,
  onClose,
  onWhatsApp,
  onStatusChange,
  onPaymentChange,
}: {
  order: Order;
  updating: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onPaymentChange: (
    status: PaymentStatus
  ) => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Order
            </p>

            <h2 className="text-xl font-bold text-gray-900">
              #
              {String(order.id)
                .slice(0, 8)
                .toUpperCase()}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Created{" "}
              {formatDate(
                order.created_at
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                order.order_status
              )}`}
            >
              {getStatusLabel(
                order.order_status
              )}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                order.payment_status
              )}`}
            >
              Payment:{" "}
              {getPaymentLabel(
                order.payment_status
              )}
            </span>
          </div>
        </div>

        {/* Customer */}

        <section>
          <SectionTitle>
            Customer Information
          </SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Name"
              value={
                order.customer_name ||
                "—"
              }
            />

            <Info
              label="Email"
              value={
                order.customer_email ||
                "—"
              }
            />

            <Info
              label="Phone"
              value={
                order.customer_phone ||
                "—"
              }
            />

            <Info
              label="User ID"
              value={
                order.user_id || "—"
              }
            />
          </div>
        </section>

        {/* Address */}

        <section>
          <SectionTitle>
            Delivery Address
          </SectionTitle>

          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            {order.delivery_address ||
              "—"}
            <br />
            {order.city || "—"} -{" "}
            {order.pincode || "—"}
          </div>
        </section>

        {/* Products */}

        <section>
          <SectionTitle>
            Ordered Products
          </SectionTitle>

          <div className="space-y-3">
            {Array.isArray(
              order.items
            ) &&
              order.items.map(
                (item, index) => (
                  <div
                    key={
                      item.id ||
                      index
                    }
                    className="flex gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.image ? (
                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {item.name ||
                          "Product"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Qty:{" "}
                        {
                          item.quantity
                        }{" "}
                        ×{" "}
                        {formatPrice(
                          item.price
                        )}
                      </p>
                    </div>

                    <div className="font-semibold text-gray-900">
                      {formatPrice(
                        Number(
                          item.price
                        ) *
                          Number(
                            item.quantity
                          )
                      )}
                    </div>
                  </div>
                )
              )}
          </div>
        </section>

        {/* Amount */}

        <section>
          <SectionTitle>
            Payment & Amount
          </SectionTitle>

          <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
            <AmountRow
              label="Subtotal"
              value={formatPrice(
                order.subtotal
              )}
            />

            <AmountRow
              label="Delivery Charge"
              value={formatPrice(
                order.delivery_charge
              )}
            />

            {Number(
              order.cancellation_charge ||
                0
            ) > 0 && (
              <AmountRow
                label="Cancellation Charge"
                value={formatPrice(
                  order.cancellation_charge
                )}
              />
            )}

            <div className="border-t border-gray-200 pt-2">
              <AmountRow
                label="Total"
                value={formatPrice(
                  order.total_amount
                )}
                strong
              />
            </div>
          </div>
        </section>

        {/* Cancellation */}

        {order.order_status ===
          "canceled" && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Cancellation Details
            </p>

            <p className="mt-2 text-sm text-red-800">
              <strong>
                Reason:
              </strong>{" "}
              {order.cancellation_reason ||
                "No reason provided"}
            </p>

            <p className="mt-1 text-sm text-red-800">
              <strong>
                Charge:
              </strong>{" "}
              {formatPrice(
                order.cancellation_charge
              )}
            </p>
          </section>
        )}

        {/* Controls */}

        <section>
          <SectionTitle>
            Admin Controls
          </SectionTitle>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Order Status
              </label>

              <select
                value={
                  order.order_status
                }
                disabled={updating}
                onChange={(event) =>
                  onStatusChange(
                    event.target
                      .value as OrderStatus
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Payment Status
              </label>

              <select
                value={
                  order.payment_status ||
                  "pending"
                }
                disabled={updating}
                onChange={(event) =>
                  onPaymentChange(
                    event.target
                      .value as PaymentStatus
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
              >
                {PAYMENT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        {/* Footer */}

        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onWhatsApp}
            disabled={
              !order.customer_phone
            }
            className="rounded-xl border border-green-300 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            WhatsApp Customer
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================
   CANCELLATION MODAL
========================================================= */

function CancellationModal({
  order,
  reason,
  charge,
  updating,
  onReasonChange,
  onChargeChange,
  onClose,
  onConfirm,
}: {
  order: Order;
  reason: string;
  charge: string;
  updating: boolean;
  onReasonChange: (
    value: string
  ) => void;
  onChargeChange: (
    value: string
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Cancel Order
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            Cancel #
            {String(order.id)
              .slice(0, 8)
              .toUpperCase()}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the cancellation reason
            and applicable charge.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Order Total
            </span>

            <strong className="text-gray-900">
              {formatPrice(
                order.total_amount
              )}
            </strong>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            Cancellation Reason
          </label>

          <textarea
            value={reason}
            onChange={(event) =>
              onReasonChange(
                event.target.value
              )
            }
            rows={4}
            placeholder="Enter cancellation reason..."
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            Cancellation Charge
          </label>

          <input
            type="number"
            min="0"
            step="1"
            max={Number(
              order.total_amount || 0
            )}
            value={charge}
            onChange={(event) =>
              onChargeChange(
                event.target.value
              )
            }
            placeholder="0"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
          />

          <p className="mt-1 text-xs text-gray-500">
            Maximum:{" "}
            {formatPrice(
              order.total_amount
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Order
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={updating}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating
              ? "Canceling..."
              : "Cancel Order"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
      </p>

      {secondary && (
        <p className="mt-1 break-words text-xs text-gray-500">
          {secondary}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 text-sm font-bold text-gray-900">
      {children}
    </h3>
  );
}

/* =========================================================
   AMOUNT ROW
========================================================= */

function AmountRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-bold text-gray-900"
            : "text-gray-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-bold text-gray-900"
            : "font-medium text-gray-900"
        }
      >
        {value}
      </span>
    </div>
  );
}