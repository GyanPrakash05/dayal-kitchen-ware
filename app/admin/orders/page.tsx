"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/app/lib/supabase";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled";

type OrderItem = {
  id?: string | number | null;
  name?: string;
  slug?: string;
  price?: number | string;
  quantity?: number | string;
  image?: string | null;
};

type Order = {
  id: string;
  user_id?: string | null;

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
  cancellation_reason?: string | null;
  total_amount?: number | string | null;

  payment_status?: string | null;
  order_status?: OrderStatus | string | null;

  created_at?: string | null;
  updated_at?: string | null;
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

function formatPrice(value: unknown) {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status?: string | null) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    )?.label || "Unknown"
  );
}

function getStatusClasses(status?: string | null) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "confirmed":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "out_for_delivery":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "delivered":
      return "border-green-200 bg-green-50 text-green-700";

    case "canceled":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-600";
  }
}

function cleanPhone(phone?: string | null) {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");

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
  const currentStatus =
    status || order.order_status || "pending";

  const statusText =
    getStatusLabel(currentStatus);

  const orderId = order.id
    ? order.id.slice(0, 8).toUpperCase()
    : "ORDER";

  let message =
    `Hello ${order.customer_name || "Customer"},\n\n` +
    `Your RetailMind order #${orderId} has been updated.\n\n` +
    `Order Status: ${statusText}\n` +
    `Order Total: ${formatPrice(
      order.total_amount
    )}\n\n`;

  if (currentStatus === "confirmed") {
    message +=
      "Your order has been confirmed and is being prepared.\n\n";
  }

  if (currentStatus === "out_for_delivery") {
    message +=
      "Your order is out for delivery and will reach you soon.\n\n";
  }

  if (currentStatus === "delivered") {
    message +=
      "Your order has been delivered successfully. Thank you for shopping with us!\n\n";
  }

  if (currentStatus === "canceled") {
    message +=
      `Cancellation Reason: ${
        order.cancellation_reason ||
        "Not specified"
      }\n` +
      `Cancellation Charge: ${formatPrice(
        order.cancellation_charge
      )}\n\n`;
  }

  message +=
    `Delivery Address:\n` +
    `${order.delivery_address || ""}\n` +
    `${order.city || ""} - ${
      order.pincode || ""
    }\n\n` +
    "Thank you for choosing RetailMind.";

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
    alert(
      "Customer mobile number is not available."
    );
    return;
  }

  const message =
    createWhatsAppMessage(order, status);

  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

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

  const [search, setSearch] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState<"all" | OrderStatus>("all");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [cancelOrder, setCancelOrder] =
    useState<Order | null>(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const [cancelCharge, setCancelCharge] =
    useState("0");

  const [toast, setToast] =
    useState("");

  const getOrders = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          setError(
            "Your session has expired. Please login again."
          );
          return;
        }

        const token =
          sessionData.session.access_token;

        const response = await fetch(
          "/api/orders",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        let result: any = null;

        try {
          result =
            await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          setError(
            result?.error ||
              "Failed to load orders."
          );
          return;
        }

        if (!result?.success) {
          setError(
            result?.error ||
              "Failed to load orders."
          );
          return;
        }

        setOrders(
          Array.isArray(result.orders)
            ? result.orders
            : []
        );
      } catch (error) {
        console.error(
          "ADMIN ORDERS ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load orders."
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

  const updateOrderStatus = async (
    order: Order,
    status: OrderStatus,
    reason?: string,
    charge?: number
  ) => {
    try {
      setUpdatingId(order.id);
      setError("");

      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const token =
        sessionData.session.access_token;

      const body: Record<string, unknown> = {
        id: order.id,
        order_status: status,
      };

      if (status === "canceled") {
        body.cancellation_reason =
          reason?.trim() || "";

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

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "Failed to update order."
        );
      }

      const updated =
        result.order as Order;

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? updated
            : item
        )
      );

      if (
        selectedOrder?.id === order.id
      ) {
        setSelectedOrder(updated);
      }

      setToast(
        "Order status updated successfully."
      );

      setTimeout(() => {
        setToast("");
      }, 3000);

      if (status === "canceled") {
        setCancelOrder(null);
        setCancelReason("");
        setCancelCharge("0");
      }

      /*
       * WhatsApp is intentionally opened
       * after successful status update.
       */
      openWhatsApp(updated, status);
    } catch (error) {
      console.error(
        "UPDATE ORDER ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        filterStatus === "all" ||
        order.order_status ===
          filterStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.city,
        order.pincode,
        order.delivery_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    orders,
    search,
    filterStatus,
  ]);

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter(
        (order) =>
          order.order_status ===
          "pending"
      ).length,

      confirmed: orders.filter(
        (order) =>
          order.order_status ===
          "confirmed"
      ).length,

      delivery: orders.filter(
        (order) =>
          order.order_status ===
          "out_for_delivery"
      ).length,

      delivered: orders.filter(
        (order) =>
          order.order_status ===
          "delivered"
      ).length,

      canceled: orders.filter(
        (order) =>
          order.order_status ===
          "canceled"
      ).length,
    };
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.order_status !==
          "canceled"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.total_amount || 0
          ),
        0
      );
  }, [orders]);

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              RetailMind Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#5c4033] sm:text-4xl">
              Orders
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage customer orders,
              delivery status and updates.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              getOrders(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Orders"}
          </button>
        </div>

        {/* TOAST */}

        {toast && (
          <div className="fixed right-4 top-4 z-[100] rounded-2xl border border-green-200 bg-white px-5 py-4 text-sm font-semibold text-green-700 shadow-xl">
            ✓ {toast}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total"
            value={stats.total}
            active={
              filterStatus === "all"
            }
            onClick={() =>
              setFilterStatus("all")
            }
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            active={
              filterStatus === "pending"
            }
            onClick={() =>
              setFilterStatus("pending")
            }
          />

          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            active={
              filterStatus === "confirmed"
            }
            onClick={() =>
              setFilterStatus("confirmed")
            }
          />

          <StatCard
            label="Out for Delivery"
            value={stats.delivery}
            active={
              filterStatus ===
              "out_for_delivery"
            }
            onClick={() =>
              setFilterStatus(
                "out_for_delivery"
              )
            }
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            active={
              filterStatus ===
              "delivered"
            }
            onClick={() =>
              setFilterStatus("delivered")
            }
          />

          <StatCard
            label="Canceled"
            value={stats.canceled}
            active={
              filterStatus ===
              "canceled"
            }
            onClick={() =>
              setFilterStatus("canceled")
            }
          />
        </div>

        {/* REVENUE */}

        <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Order Value
              </p>

              <p className="mt-1 text-2xl font-bold text-[#5c4033]">
                {formatPrice(
                  totalRevenue
                )}
              </p>
            </div>

            <p className="text-xs text-zinc-400">
              Excludes canceled orders
            </p>
          </div>
        </div>

        {/* SEARCH + FILTER */}

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by order ID, customer, phone, city..."
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as
                  | "all"
                  | OrderStatus
              )
            }
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none focus:border-[#5c4033]"
          >
            <option value="all">
              All Orders
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status.value}
                  value={
                    status.value
                  }
                >
                  {status.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* ORDERS */}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading orders...
              </p>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">
                📦
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#5c4033]">
                No orders found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Try changing the search
                or status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(
                (order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    updating={
                      updatingId ===
                      order.id
                    }
                    onView={() =>
                      setSelectedOrder(
                        order
                      )
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
                          "0"
                        );
                        return;
                      }

                      updateOrderStatus(
                        order,
                        status
                      );
                    }}
                    onWhatsApp={() =>
                      openWhatsApp(order)
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onWhatsApp={() =>
            openWhatsApp(
              selectedOrder
            )
          }
        />
      )}

      {/* CANCELLATION MODAL */}

      {cancelOrder && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Cancel Order
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#5c4033]">
                  Cancel #
                  {cancelOrder.id
                    .slice(0, 8)
                    .toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCancelOrder(null)
                }
                className="rounded-full px-3 py-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Cancellation Reason
              </label>

              <textarea
                value={cancelReason}
                onChange={(e) =>
                  setCancelReason(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Enter cancellation reason..."
                className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Cancellation Charge
              </label>

              <input
                type="number"
                min="0"
                value={cancelCharge}
                onChange={(e) =>
                  setCancelCharge(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />

              <p className="mt-2 text-xs text-zinc-400">
                Maximum:
                {" "}
                {formatPrice(
                  cancelOrder.total_amount
                )}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setCancelOrder(null)
                }
                className="flex-1 rounded-full border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={
                  updatingId ===
                  cancelOrder.id
                }
                onClick={() => {
                  if (
                    !cancelReason.trim()
                  ) {
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
                    cancelReason,
                    charge
                  );
                }}
                className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingId ===
                cancelOrder.id
                  ? "Canceling..."
                  : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#5c4033] bg-[#5c4033] text-white shadow-md"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          active
            ? "text-white/70"
            : "text-zinc-400"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </button>
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  updating,
  onView,
  onStatusChange,
  onWhatsApp,
}: {
  order: Order;
  updating: boolean;
  onView: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onWhatsApp: () => void;
}) {
  const items = Array.isArray(
    order.items
  )
    ? order.items
    : [];

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          {/* ORDER INFO */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#5c4033]">
                #
                {order.id
                  .slice(0, 8)
                  .toUpperCase()}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(
                  order.order_status
                )}`}
              >
                {getStatusLabel(
                  order.order_status
                )}
              </span>
            </div>

            <div className="mt-2 text-xs text-zinc-400">
              {formatDate(
                order.created_at
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Customer
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-zinc-800">
                  {order.customer_name ||
                    "—"}
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {order.customer_phone ||
                    "No phone"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Delivery
                </p>

                <p className="mt-1 line-clamp-2 text-sm text-zinc-700">
                  {order.delivery_address ||
                    "—"}
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  {order.city || "—"}
                  {" "}
                  {order.pincode || ""}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Items
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-800">
                  {items.length}{" "}
                  {items.length ===
                  1
                    ? "product"
                    : "products"}
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Payment:{" "}
                  {order.payment_status ||
                    "pending"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Total
                </p>

                <p className="mt-1 text-lg font-bold text-[#5c4033]">
                  {formatPrice(
                    order.total_amount
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col gap-2 xl:w-56">
            <button
              type="button"
              onClick={onView}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              View Details
            </button>

            <button
              type="button"
              onClick={onWhatsApp}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              WhatsApp Customer
            </button>

            <select
              value={
                (order.order_status ||
                  "pending") as string
              }
              disabled={updating}
              onChange={(e) =>
                onStatusChange(
                  e.target.value as OrderStatus
                )
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#5c4033] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={
                      status.value
                    }
                    value={
                      status.value
                    }
                  >
                    {status.label}
                  </option>
                )
              )}
            </select>

            {updating && (
              <p className="text-center text-xs text-zinc-400">
                Updating order...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function OrderDetailsModal({
  order,
  onClose,
  onWhatsApp,
}: {
  order: Order;
  onClose: () => void;
  onWhatsApp: () => void;
}) {
  const items = Array.isArray(
    order.items
  )
    ? order.items
    : [];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* MODAL HEADER */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Order Details
            </p>

            <h2 className="mt-1 font-mono text-xl font-bold text-[#5c4033]">
              #
              {order.id
                .slice(0, 8)
                .toUpperCase()}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">

          {/* STATUS */}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf9f6] p-4">
            <div>
              <p className="text-xs text-zinc-400">
                Current Status
              </p>

              <span
                className={`mt-1 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                  order.order_status
                )}`}
              >
                {getStatusLabel(
                  order.order_status
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={onWhatsApp}
              className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              WhatsApp Customer
            </button>
          </div>

          {/* CUSTOMER */}

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#5c4033]">
              Customer Information
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info
                label="Name"
                value={
                  order.customer_name
                }
              />

              <Info
                label="Phone"
                value={
                  order.customer_phone
                }
              />

              <Info
                label="Email"
                value={
                  order.customer_email
                }
              />

              <Info
                label="User ID"
                value={
                  order.user_id
                }
              />
            </div>
          </section>

          {/* DELIVERY */}

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#5c4033]">
              Delivery Address
            </h3>

            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-800">
                {order.delivery_address ||
                  "Address not available"}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {order.city || ""}
                {order.city &&
                order.pincode
                  ? " - "
                  : ""}
                {order.pincode || ""}
              </p>
            </div>
          </section>

          {/* ITEMS */}

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#5c4033]">
              Ordered Products
            </h3>

            <div className="mt-3 space-y-3">
              {items.length ===
              0 ? (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                  No product details
                  available.
                </div>
              ) : (
                items.map(
                  (item, index) => {
                    const price =
                      Number(
                        item.price ||
                          0
                      );

                    const quantity =
                      Number(
                        item.quantity ||
                          1
                      );

                    return (
                      <div
                        key={
                          item.id ||
                          item.slug ||
                          index
                        }
                        className="flex gap-3 rounded-2xl border border-zinc-100 bg-[#faf9f6] p-3"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#eee8dc]">
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Product"
                              }
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xl">
                              📦
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-zinc-800">
                            {item.name ||
                              "Product"}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Qty:{" "}
                            {quantity}
                            {" × "}
                            {formatPrice(
                              price
                            )}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#5c4033]">
                          {formatPrice(
                            price *
                              quantity
                          )}
                        </p>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>

          {/* PRICE */}

          <section className="rounded-2xl bg-[#faf9f6] p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {formatPrice(
                    order.subtotal
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Delivery Fee
                </span>

                <span className="font-semibold">
                  {Number(
                    order.delivery_charge ||
                      0
                  ) === 0
                    ? "FREE"
                    : formatPrice(
                        order.delivery_charge
                      )}
                </span>
              </div>

              {Number(
                order.cancellation_charge ||
                  0
              ) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>
                    Cancellation Charge
                  </span>

                  <span className="font-semibold">
                    {formatPrice(
                      order.cancellation_charge
                    )}
                  </span>
                </div>
              )}

              <div className="border-t border-zinc-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-[#5c4033]">
                    Total
                  </span>

                  <span className="text-xl font-bold text-[#5c4033]">
                    {formatPrice(
                      order.total_amount
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CANCELLATION */}

          {order.order_status ===
            "canceled" && (
            <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-sm font-bold text-red-700">
                Cancellation Details
              </h3>

              <p className="mt-2 text-sm text-red-600">
                <strong>
                  Reason:
                </strong>{" "}
                {order.cancellation_reason ||
                  "Not specified"}
              </p>

              <p className="mt-1 text-sm text-red-600">
                <strong>
                  Charge:
                </strong>{" "}
                {formatPrice(
                  order.cancellation_charge
                )}
              </p>
            </section>
          )}

          {/* DATE */}

          <section className="grid gap-3 sm:grid-cols-2">
            <Info
              label="Created At"
              value={formatDate(
                order.created_at
              )}
            />

            <Info
              label="Last Updated"
              value={formatDate(
                order.updated_at
              )}
            />
          </section>
        </div>
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
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-[#faf9f6] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-zinc-700">
        {value || "—"}
      </p>
    </div>
  );
}