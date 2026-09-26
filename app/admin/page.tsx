"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/app/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image: string | null;
  images?: string[] | null;
  description: string;
  created_at?: string;
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled";

type Order = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
  items: unknown;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  payment_status: string;
  order_status: OrderStatus;
  cancellation_reason: string | null;
  cancellation_charge: number | null;
  created_at: string;
  updated_at: string;
};

const MAX_IMAGES = 5;

const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  icon: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    icon: "🟡",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    icon: "🟢",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    icon: "🚚",
  },
  {
    value: "delivered",
    label: "Delivered",
    icon: "✅",
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: "🔴",
  },
];

function formatStatus(status: OrderStatus) {
  const found = ORDER_STATUSES.find(
    (item) => item.value === status
  );

  return found
    ? `${found.icon} ${found.label}`
    : status;
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function parseOrderItems(items: unknown): any[] {
  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getItemName(item: any) {
  return (
    item?.name ||
    item?.product_name ||
    item?.title ||
    "Product"
  );
}

function getItemQuantity(item: any) {
  return Number(
    item?.quantity ??
      item?.qty ??
      1
  );
}

function getItemPrice(item: any) {
  return Number(
    item?.price ??
      item?.unit_price ??
      0
  );
}

function getProductImages(product: Product) {
  if (
    product.images &&
    product.images.length > 0
  ) {
    return product.images;
  }

  if (product.image) {
    return [product.image];
  }

  return [];
}

export default function AdminPage() {
  /* =========================================================
     PRODUCTS
  ========================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================================================
     ORDERS
  ========================================================= */

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [ordersError, setOrdersError] =
    useState("");

  const [orderFilter, setOrderFilter] =
    useState<"all" | OrderStatus>("all");

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  /* =========================================================
     FETCH PRODUCTS
  ========================================================= */

  async function fetchProducts() {
    try {
      setLoadingProducts(true);

      const response = await fetch(
        "/api/products",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch products."
        );
      }

      setProducts(
        data.products || []
      );
    } catch (error) {
      console.error(
        "FETCH PRODUCTS ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  /* =========================================================
     GET AUTH TOKEN
  ========================================================= */

  async function getAccessToken() {
    try {
      const {
        data: {
          session,
        },
        error,
      } =
        await supabase.auth.getSession();

      if (
        error ||
        !session?.access_token
      ) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      return session.access_token;
    } catch (error) {
      console.error(
        "GET SESSION ERROR:",
        error
      );

      throw new Error(
        "Admin session expired. Please login again."
      );
    }
  }

  /* =========================================================
     FETCH ORDERS
  ========================================================= */

  async function fetchOrders() {
    try {
      setLoadingOrders(true);
      setOrdersError("");

      const token =
        await getAccessToken();

      const response =
        await fetch(
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

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          "You are not authorized as admin."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch orders."
        );
      }

      setOrders(
        data.orders || []
      );
    } catch (error) {
      console.error(
        "FETCH ORDERS ERROR:",
        error
      );

      setOrdersError(
        error instanceof Error
          ? error.message
          : "Failed to load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  /* =========================================================
     AUTH INITIALIZATION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function initializeAdmin() {
      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (!session?.access_token) {
          setOrdersError(
            "Admin session expired. Please login again."
          );

          setAuthReady(true);
          setLoadingOrders(false);

          return;
        }

        setAuthReady(true);

        await Promise.all([
          fetchProducts(),
          fetchOrders(),
        ]);
      } catch (error) {
        console.error(
          "ADMIN INITIALIZATION ERROR:",
          error
        );

        if (!mounted) {
          return;
        }

        setAuthReady(true);

        setOrdersError(
          error instanceof Error
            ? error.message
            : "Unable to initialize admin dashboard."
        );

        setLoadingOrders(false);

        await fetchProducts();
      }
    }

    initializeAdmin();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          if (
            event === "SIGNED_OUT" ||
            !session
          ) {
            setOrders([]);
            setOrdersError(
              "Admin session expired. Please login again."
            );

            return;
          }

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
          ) {
            setOrdersError("");

            if (authReady) {
              await fetchOrders();
            }
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     UPDATE ORDER
  ========================================================= */

  async function updateOrderStatus(
    order: Order,
    newStatus: OrderStatus
  ) {
    setOrdersError("");

    if (
      newStatus ===
      order.order_status
    ) {
      return;
    }

    let cancellationReason = "";
    let cancellationCharge = 0;

    if (
      newStatus === "canceled"
    ) {
      const reason =
        window.prompt(
          "Enter cancellation reason:"
        );

      if (
        reason === null
      ) {
        return;
      }

      cancellationReason =
        reason.trim();

      if (
        !cancellationReason
      ) {
        setOrdersError(
          "Cancellation reason is required."
        );
        return;
      }

      const chargeInput =
        window.prompt(
          `Enter cancellation charge (maximum ${formatCurrency(
            order.total_amount
          )}):`,
          String(
            order.cancellation_charge ??
              0
          )
        );

      if (
        chargeInput === null
      ) {
        return;
      }

      cancellationCharge =
        Number(chargeInput);

      if (
        !Number.isFinite(
          cancellationCharge
        ) ||
        cancellationCharge < 0
      ) {
        setOrdersError(
          "Please enter a valid cancellation charge."
        );
        return;
      }

      if (
        cancellationCharge >
        Number(
          order.total_amount
        )
      ) {
        setOrdersError(
          "Cancellation charge cannot be greater than the order total."
        );
        return;
      }
    }

    if (
      newStatus !==
      "canceled"
    ) {
      const confirmed =
        window.confirm(
          `Change order status to "${formatStatus(
            newStatus
          )}"?`
        );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingOrderId(
      order.id
    );

    try {
      const token =
        await getAccessToken();

      const response =
        await fetch(
          "/api/orders",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id: order.id,

              order_status:
                newStatus,

              cancellation_reason:
                cancellationReason,

              cancellation_charge:
                cancellationCharge,
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          "You are not authorized as admin."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update order."
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              order.id
                ? data.order
                : currentOrder
          )
      );

      setMessage(
        `Order ${order.id
          .slice(0, 8)
          .toUpperCase()} updated successfully.`
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "UPDATE ORDER ERROR:",
        error
      );

      setOrdersError(
        error instanceof Error
          ? error.message
          : "Failed to update order."
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  /* =========================================================
     PRODUCT SUBMIT
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      const imageInput =
        document.getElementById(
          "images"
        ) as HTMLInputElement | null;

      const files =
        imageInput?.files;

      if (
        !editingProduct &&
        (!files ||
          files.length === 0)
      ) {
        throw new Error(
          "Please select at least one product image."
        );
      }

      if (
        files &&
        files.length > MAX_IMAGES
      ) {
        throw new Error(
          "You can upload maximum 5 images."
        );
      }

      let response: Response;

      if (editingProduct) {
        formData.append(
          "id",
          editingProduct.id
        );

        response =
          await fetch(
            "/api/products",
            {
              method: "PATCH",
              body: formData,
            }
          );
      } else {
        response =
          await fetch(
            "/api/products",
            {
              method: "POST",
              body: formData,
            }
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong."
        );
      }

      setMessage(
        editingProduct
          ? "Product updated successfully! ✅"
          : "Product added successfully! ✅"
      );

      form.reset();

      setEditingProduct(
        null
      );

      await fetchProducts();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     EDIT PRODUCT
  ========================================================= */

  function handleEdit(
    product: Product
  ) {
    setEditingProduct(
      product
    );

    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  function handleCancelEdit() {
    setEditingProduct(
      null
    );

    setMessage("");
    setErrorMessage("");

    const form =
      document.getElementById(
        "product-form"
      ) as HTMLFormElement | null;

    form?.reset();
  }

  /* =========================================================
     DELETE PRODUCT
  ========================================================= */

  async function handleDelete(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?\n\nThis will permanently delete the product and all its images.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      product.id
    );

    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          "/api/products",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: product.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete product."
        );
      }

      setMessage(
        "Product deleted successfully! 🗑️"
      );

      if (
        editingProduct?.id ===
        product.id
      ) {
        setEditingProduct(
          null
        );
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =========================================================
     FILTER ORDERS
  ========================================================= */

  const filteredOrders =
    orderFilter === "all"
      ? orders
      : orders.filter(
          (order) =>
            order.order_status ===
            orderFilter
        );

  /* =========================================================
     ORDER COUNTS
  ========================================================= */

  const orderCounts = {
    all: orders.length,

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

    out_for_delivery:
      orders.filter(
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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">

      {/* HEADER */}

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Dayal Kitchen Ware
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-zinc-500">
            Manage orders, products and
            your store.
          </p>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* MESSAGES */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            ORDERS
        ================================================= */}

        <section className="mb-20">

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Order Management
            </p>

            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Customer Orders
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage orders and update
                  delivery status.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchOrders}
                disabled={
                  loadingOrders
                }
                className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                {loadingOrders
                  ? "Refreshing..."
                  : "↻ Refresh Orders"}
              </button>

            </div>
          </div>

          {/* ORDER FILTERS */}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

            <button
              type="button"
              onClick={() =>
                setOrderFilter(
                  "all"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                orderFilter ===
                "all"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                All
              </p>

              <p className="mt-1 text-2xl font-bold">
                {orderCounts.all}
              </p>
            </button>

            {ORDER_STATUSES.map(
              (status) => (
                <button
                  key={
                    status.value
                  }
                  type="button"
                  onClick={() =>
                    setOrderFilter(
                      status.value
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    orderFilter ===
                    status.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {status.icon}{" "}
                    {status.label}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {
                      orderCounts[
                        status.value
                      ]
                    }
                  </p>
                </button>
              )
            )}

          </div>

          {/* ORDER ERROR */}

          {ordersError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <span>
                  {ordersError}
                </span>

                {ordersError.includes(
                  "session"
                ) && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();

                      window.location.href =
                        "/admin/login";
                    }}
                    className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Login Again
                  </button>
                )}

              </div>
            </div>
          )}

          {/* LOADING */}

          {!authReady ||
          loadingOrders ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                {!authReady
                  ? "Checking admin session..."
                  : "Loading orders..."}
              </p>

            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">

              <div className="text-5xl">
                📦
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No orders found
              </h3>

              <p className="mt-2 text-zinc-500">
                There are no orders in this
                category yet.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {filteredOrders.map(
                (order) => {

                  const items =
                    parseOrderItems(
                      order.items
                    );

                  const expanded =
                    expandedOrderId ===
                    order.id;

                  return (
                    <div
                      key={order.id}
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                    >

                      {/* ORDER HEADER */}

                      <div className="border-b border-zinc-100 p-5 sm:p-6">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                                ORDER #
                                {order.id
                                  .slice(
                                    0,
                                    8
                                  )
                                  .toUpperCase()}
                              </span>

                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {formatStatus(
                                  order.order_status
                                )}
                              </span>

                            </div>

                            <p className="mt-3 text-sm text-zinc-500">
                              {formatDate(
                                order.created_at
                              )}
                            </p>

                          </div>

                          <div className="text-left lg:text-right">

                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Order Total
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                              {formatCurrency(
                                order.total_amount
                              )}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              Payment:{" "}
                              <span className="font-semibold">
                                {
                                  order.payment_status
                                }
                              </span>
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* CUSTOMER + DELIVERY */}

                      <div className="grid gap-4 border-b border-zinc-100 p-5 sm:grid-cols-2 sm:p-6">

                        <div className="rounded-2xl bg-[#faf9f6] p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Customer
                          </p>

                          <p className="mt-2 font-bold">
                            {
                              order.customer_name
                            }
                          </p>

                          <p className="mt-1 break-all text-sm text-zinc-500">
                            {
                              order.customer_email
                            }
                          </p>

                          <a
                            href={`tel:${order.customer_phone}`}
                            className="mt-2 inline-block text-sm font-semibold text-amber-700 hover:underline"
                          >
                            📞{" "}
                            {
                              order.customer_phone
                            }
                          </a>

                        </div>

                        <div className="rounded-2xl bg-[#faf9f6] p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Delivery Address
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6">
                            {
                              order.delivery_address
                            }
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {
                              order.city
                            }{" "}
                            -{" "}
                            {
                              order.pincode
                            }
                          </p>

                        </div>

                      </div>

                      {/* STATUS CONTROL */}

                      <div className="border-b border-zinc-100 p-5 sm:p-6">

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                          <div>

                            <p className="text-sm font-bold">
                              Update Order Status
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              Change the current delivery
                              stage.
                            </p>

                          </div>

                          <select
                            value={
                              order.order_status
                            }
                            disabled={
                              updatingOrderId ===
                                order.id ||
                              order.order_status ===
                                "delivered" ||
                              order.order_status ===
                                "canceled"
                            }
                            onChange={(
                              event
                            ) =>
                              updateOrderStatus(
                                order,
                                event
                                  .target
                                  .value as OrderStatus
                              )
                            }
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60 lg:w-64"
                          >

                            {ORDER_STATUSES.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status.value
                                  }
                                  value={
                                    status.value
                                  }
                                >
                                  {
                                    status.icon
                                  }{" "}
                                  {
                                    status.label
                                  }
                                </option>
                              )
                            )}

                          </select>

                        </div>

                        {updatingOrderId ===
                          order.id && (
                          <p className="mt-3 text-xs font-medium text-amber-700">
                            Updating order...
                          </p>
                        )}

                        {(order.order_status ===
                          "delivered" ||
                          order.order_status ===
                            "canceled") && (
                          <p className="mt-3 text-xs font-medium text-zinc-400">
                            This order is completed and
                            can no longer be changed.
                          </p>
                        )}

                      </div>

                      {/* CANCEL INFORMATION */}

                      {order.order_status ===
                        "canceled" && (
                        <div className="border-b border-red-100 bg-red-50 p-5 sm:p-6">

                          <div className="grid gap-4 sm:grid-cols-2">

                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                                Cancellation Reason
                              </p>

                              <p className="mt-2 text-sm font-semibold text-red-800">
                                {
                                  order.cancellation_reason ||
                                  "No reason provided"
                                }
                              </p>

                            </div>

                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                                Cancellation Charge
                              </p>

                              <p className="mt-2 text-lg font-bold text-red-800">
                                {formatCurrency(
                                  order.cancellation_charge ??
                                    0
                                )}
                              </p>

                            </div>

                          </div>

                        </div>
                      )}

                      {/* EXPAND BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId(
                            expanded
                              ? null
                              : order.id
                          )
                        }
                        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold transition hover:bg-zinc-50 sm:px-6"
                      >

                        <span>
                          🛒{" "}
                          {items.length}{" "}
                          {items.length ===
                          1
                            ? "Item"
                            : "Items"}{" "}
                          • View Order Details
                        </span>

                        <span className="text-zinc-400">
                          {expanded
                            ? "▲"
                            : "▼"}
                        </span>

                      </button>

                      {/* EXPANDED DETAILS */}

                      {expanded && (
                        <div className="border-t border-zinc-100 bg-[#faf9f6] p-5 sm:p-6">

                          {/* ITEMS */}

                          <div>

                            <h4 className="text-sm font-bold">
                              Ordered Products
                            </h4>

                            <div className="mt-3 space-y-3">

                              {items.length ===
                              0 ? (
                                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-500">
                                  No item details
                                  available.
                                </div>
                              ) : (
                                items.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      key={`${order.id}-${index}`}
                                      className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4"
                                    >

                                      <div className="min-w-0">

                                        <p className="truncate text-sm font-semibold">
                                          {
                                            getItemName(
                                              item
                                            )
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-500">
                                          Qty:{" "}
                                          {
                                            getItemQuantity(
                                              item
                                            )
                                          }
                                        </p>

                                      </div>

                                      <p className="shrink-0 text-sm font-bold">
                                        {formatCurrency(
                                          getItemPrice(
                                            item
                                          ) *
                                            getItemQuantity(
                                              item
                                            )
                                        )}
                                      </p>

                                    </div>
                                  )
                                )
                              )}

                            </div>

                          </div>

                          {/* BILL */}

                          <div className="mt-6 rounded-2xl bg-white p-5">

                            <h4 className="text-sm font-bold">
                              Payment Summary
                            </h4>

                            <div className="mt-4 space-y-3 text-sm">

                              <div className="flex justify-between gap-4">
                                <span className="text-zinc-500">
                                  Subtotal
                                </span>

                                <span className="font-semibold">
                                  {formatCurrency(
                                    order.subtotal
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between gap-4">
                                <span className="text-zinc-500">
                                  Delivery Charge
                                </span>

                                <span className="font-semibold">
                                  {formatCurrency(
                                    order.delivery_charge
                                  )}
                                </span>
                              </div>

                              {order.order_status ===
                                "canceled" && (
                                <div className="flex justify-between gap-4 text-red-600">
                                  <span>
                                    Cancellation Charge
                                  </span>

                                  <span className="font-semibold">
                                    {formatCurrency(
                                      order.cancellation_charge ??
                                        0
                                    )}
                                  </span>
                                </div>
                              )}

                              <div className="border-t border-zinc-100 pt-3">

                                <div className="flex justify-between gap-4">

                                  <span className="font-bold">
                                    Total
                                  </span>

                                  <span className="text-lg font-bold">
                                    {formatCurrency(
                                      order.total_amount
                                    )}
                                  </span>

                                </div>

                              </div>

                            </div>

                          </div>

                          {/* WHATSAPP */}

                          {order.customer_phone && (
                            <a
                              href={`https://wa.me/91${String(
                                order.customer_phone
                              ).replace(
                                /\D/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-5 inline-flex rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              💬 Contact Customer
                            </a>
                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            ADD / EDIT PRODUCT
        ================================================= */}

        <section>

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {editingProduct
                ? "Update product details"
                : "Add a new product to your store."}
            </h2>

          </div>

          <form
            id="product-form"
            onSubmit={
              handleSubmit
            }
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >

            <div className="grid gap-6 sm:grid-cols-2">

              {/* NAME */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={
                    editingProduct?.name ||
                    ""
                  }
                  placeholder="Premium Non-Stick Kadai"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              {/* CATEGORY */}

              <div>

                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  required
                  defaultValue={
                    editingProduct?.category ||
                    ""
                  }
                  placeholder="Cookware"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              {/* PRICE */}

              <div>

                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  required
                  type="number"
                  min="1"
                  defaultValue={
                    editingProduct?.price ??
                    ""
                  }
                  placeholder="1499"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              {/* OLD PRICE */}

              <div>

                <label
                  htmlFor="oldPrice"
                  className="mb-2 block text-sm font-semibold"
                >
                  Old Price
                </label>

                <input
                  id="oldPrice"
                  name="oldPrice"
                  type="number"
                  min="1"
                  defaultValue={
                    editingProduct?.old_price ??
                    ""
                  }
                  placeholder="1999"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              {/* BADGE */}

              <div>

                <label
                  htmlFor="badge"
                  className="mb-2 block text-sm font-semibold"
                >
                  Badge
                </label>

                <select
                  id="badge"
                  name="badge"
                  defaultValue={
                    editingProduct?.badge ||
                    ""
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">
                    No Badge
                  </option>

                  <option value="NEW">
                    NEW
                  </option>

                  <option value="POPULAR">
                    POPULAR
                  </option>

                  <option value="BEST SELLER">
                    BEST SELLER
                  </option>

                  <option value="SALE">
                    SALE
                  </option>
                </select>

              </div>

              {/* CURRENT IMAGES */}

              {editingProduct && (
                <div className="sm:col-span-2">

                  <label className="mb-3 block text-sm font-semibold">
                    Current Product Images
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

                    {getProductImages(
                      editingProduct
                    ).map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={`${image}-${index}`}
                          className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-[#eee8dc]"
                        >

                          <img
                            src={image}
                            alt={`${editingProduct.name} ${
                              index + 1
                            }`}
                            className="aspect-square h-full w-full object-contain p-3"
                          />

                          {index ===
                            0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-zinc-900 px-2 py-1 text-[9px] font-bold text-white">
                              MAIN
                            </span>
                          )}

                        </div>
                      )
                    )}

                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    Upload new images below
                    to replace the current
                    gallery.
                  </p>

                </div>
              )}

              {/* IMAGES */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="images"
                  className="mb-2 block text-sm font-semibold"
                >
                  {editingProduct
                    ? "Replace Product Images"
                    : "Product Images"}
                </label>

                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  required={
                    !editingProduct
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Select up to 5 images •
                  JPG, PNG or WEBP • Maximum
                  5MB each
                </p>

                <p className="mt-1 text-xs font-medium text-amber-700">
                  First image will be used as
                  the main product image.
                </p>

              </div>

              {/* DESCRIPTION */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  defaultValue={
                    editingProduct?.description ||
                    ""
                  }
                  placeholder="Describe your product..."
                  className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? editingProduct
                    ? "Updating Product..."
                    : "Adding Product..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={loading}
                  className="rounded-full border border-zinc-300 bg-white px-6 py-4 font-semibold hover:bg-zinc-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>

        {/* =================================================
            INVENTORY
        ================================================= */}

        <section className="mt-16">

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Store Inventory
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">

              <h2 className="text-2xl font-bold">
                All Products
              </h2>

              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">
                {products.length}{" "}
                {products.length ===
                1
                  ? "Product"
                  : "Products"}
              </span>

            </div>

          </div>

          {loadingProducts ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading products...
              </p>

            </div>
          ) : products.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">

              <div className="text-5xl">
                🍳
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No products yet
              </h3>

              <p className="mt-2 text-zinc-500">
                Add your first product above.
              </p>

            </div>
          ) : (
            <div className="grid gap-5">

              {products.map(
                (product) => {

                  const images =
                    getProductImages(
                      product
                    );

                  return (
                    <div
                      key={
                        product.id
                      }
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                    >

                      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">

                        {/* IMAGE */}

                        <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eee8dc] sm:w-32">

                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-contain p-3"
                            />
                          ) : (
                            <span className="text-5xl">
                              🍳
                            </span>
                          )}

                          {images.length >
                            1 && (
                            <span className="absolute bottom-2 right-2 rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white">
                              +
                              {images.length -
                                1}{" "}
                              photos
                            </span>
                          )}

                        </div>

                        {/* DETAILS */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              {
                                product.category
                              }
                            </span>

                            {product.badge && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                                {
                                  product.badge
                                }
                              </span>
                            )}

                          </div>

                          <h3 className="mt-2 text-xl font-bold">
                            {
                              product.name
                            }
                          </h3>

                          <div className="mt-2 flex items-center gap-3">

                            <span className="font-bold">
                              ₹
                              {
                                product.price
                              }
                            </span>

                            {product.old_price !==
                              null &&
                              product.old_price !==
                                undefined && (
                                <span className="text-sm text-zinc-400 line-through">
                                  ₹
                                  {
                                    product.old_price
                                  }
                                </span>
                              )}

                          </div>

                          {product.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                              {
                                product.description
                              }
                            </p>
                          )}

                          <p className="mt-2 text-xs font-medium text-zinc-400">
                            {images.length}{" "}
                            {images.length ===
                            1
                              ? "image"
                              : "images"}
                          </p>

                        </div>

                        {/* ACTIONS */}

                        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-36">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            className="w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            className="w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {deletingId ===
                            product.id
                              ? "Deleting..."
                              : "🗑️ Delete"}
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}