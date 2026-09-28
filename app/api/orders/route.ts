import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

const allowedStatuses = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "canceled",
] as const;

type OrderStatus = (typeof allowedStatuses)[number];

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

const allowedPaymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

/* =========================================================
   HELPERS
========================================================= */

function isValidStatus(status: string): status is OrderStatus {
  return allowedStatuses.includes(status as OrderStatus);
}

function isValidPaymentStatus(
  status: string
): status is PaymentStatus {
  return allowedPaymentStatuses.includes(
    status as PaymentStatus
  );
}

function shortOrderId(id: string) {
  return String(id).slice(0, 8).toUpperCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    canceled: "Canceled",
  };

  return labels[status] || status;
}

function formatPaymentStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };

  return labels[status] || status;
}

/* =========================================================
   STATUS TRANSITIONS
========================================================= */

function isValidStatusTransition(
  currentStatus: string | null,
  nextStatus: OrderStatus
) {
  if (!currentStatus) {
    return nextStatus === "pending";
  }

  if (
    currentStatus === "delivered" ||
    currentStatus === "canceled"
  ) {
    return false;
  }

  const allowedTransitions: Record<string, OrderStatus[]> = {
    pending: ["confirmed", "canceled"],
    confirmed: ["out_for_delivery", "canceled"],
    out_for_delivery: ["delivered", "canceled"],
  };

  return (
    allowedTransitions[currentStatus]?.includes(nextStatus) ??
    false
  );
}

/* =========================================================
   AUTHENTICATE USER
========================================================= */

async function authenticateUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return {
      user: null,
      error: "Authentication token missing.",
    };
  }

  const supabaseAuth = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    console.error("AUTH ERROR:", error);

    return {
      user: null,
      error: "Invalid or expired session.",
    };
  }

  return {
    user,
    error: null,
  };
}

/* =========================================================
   ADMIN CHECK
========================================================= */

function isAdmin(user: {
  email?: string | null;
}) {
  if (!adminEmail) {
    return false;
  }

  return user.email?.trim().toLowerCase() === adminEmail;
}

/* =========================================================
   PHONE
========================================================= */

function normalizeIndianPhone(phone: string) {
  const cleanPhone = String(phone || "").replace(/\D/g, "");

  if (!cleanPhone) {
    return "";
  }

  if (
    cleanPhone.length === 12 &&
    cleanPhone.startsWith("91")
  ) {
    return cleanPhone;
  }

  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  }

  return cleanPhone;
}

/* =========================================================
   WHATSAPP ORDER UPDATE
========================================================= */

async function sendWhatsAppUpdate({
  phone,
  customerName,
  orderId,
  status,
}: {
  phone: string;
  customerName: string;
  orderId: string;
  status: OrderStatus;
}) {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const templateName =
    process.env.WHATSAPP_ORDER_TEMPLATE_NAME;

  if (
    !accessToken ||
    !phoneNumberId ||
    !templateName
  ) {
    console.log(
      "WhatsApp order update skipped: credentials/template not configured."
    );

    return;
  }

  const cleanPhone = normalizeIndianPhone(phone);

  if (!cleanPhone) {
    console.log(
      "WhatsApp order update skipped: invalid phone."
    );

    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: customerName || "Customer",
                  },
                  {
                    type: "text",
                    text: shortOrderId(orderId),
                  },
                  {
                    type: "text",
                    text: formatStatus(status),
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "WHATSAPP ORDER API ERROR:",
        JSON.stringify(result)
      );

      return;
    }

    console.log(
      "WHATSAPP ORDER UPDATE SENT:",
      JSON.stringify(result)
    );
  } catch (error) {
    console.error(
      "WHATSAPP ORDER SEND ERROR:",
      error
    );
  }
}

/* =========================================================
   WHATSAPP PAYMENT UPDATE
========================================================= */

async function sendWhatsAppPaymentUpdate({
  phone,
  customerName,
  orderId,
  paymentStatus,
}: {
  phone: string;
  customerName: string;
  orderId: string;
  paymentStatus: PaymentStatus;
}) {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const templateName =
    process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME;

  if (
    !accessToken ||
    !phoneNumberId ||
    !templateName
  ) {
    console.log(
      "WhatsApp payment update skipped: credentials/payment template not configured."
    );

    return;
  }

  const cleanPhone = normalizeIndianPhone(phone);

  if (!cleanPhone) {
    console.log(
      "WhatsApp payment update skipped: invalid phone."
    );

    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: customerName || "Customer",
                  },
                  {
                    type: "text",
                    text: shortOrderId(orderId),
                  },
                  {
                    type: "text",
                    text: formatPaymentStatus(paymentStatus),
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "WHATSAPP PAYMENT API ERROR:",
        JSON.stringify(result)
      );

      return;
    }

    console.log(
      "WHATSAPP PAYMENT UPDATE SENT:",
      JSON.stringify(result)
    );
  } catch (error) {
    console.error(
      "WHATSAPP PAYMENT SEND ERROR:",
      error
    );
  }
}

/* =========================================================
   GMAIL SMTP
========================================================= */

function getEmailTransporter() {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword =
    process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    console.log(
      "Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD missing."
    );

    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword.replace(/\s/g, ""),
    },
  });
}

/* =========================================================
   EMAIL
========================================================= */

async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const gmailUser =
    process.env.GMAIL_USER?.trim();

  const emailFrom =
    process.env.EMAIL_FROM?.trim() ||
    "Dayal Kitchen Ware";

  if (!gmailUser) {
    console.log(
      "Email skipped: GMAIL_USER missing."
    );

    return;
  }

  if (!to || !to.includes("@")) {
    console.log(
      "Email skipped: invalid recipient."
    );

    return;
  }

  const transporter = getEmailTransporter();

  if (!transporter) {
    return;
  }

  /*
    EMAIL_FROM can be:

    Dayal Kitchen Ware

    OR

    Dayal Kitchen Ware <your@gmail.com>

    If only a name is provided, Gmail account is used
    as the sender email.
  */

  const from =
    emailFrom.includes("<") &&
    emailFrom.includes(">")
      ? emailFrom
      : `"${emailFrom}" <${gmailUser}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(
      "EMAIL SENT:",
      JSON.stringify({
        messageId: info.messageId,
        to,
        subject,
      })
    );
  } catch (error) {
    console.error(
      "EMAIL SEND ERROR:",
      error
    );
  }
}

/* =========================================================
   ORDER EMAIL HTML
========================================================= */

function orderEmailHtml(
  order: any,
  title: string,
  extraHtml = ""
) {
  const orderId =
    escapeHtml(order?.id);

  const customerName =
    escapeHtml(
      order?.customer_name || "Customer"
    );

  const customerEmail =
    escapeHtml(
      order?.customer_email || ""
    );

  const customerPhone =
    escapeHtml(
      order?.customer_phone || ""
    );

  const address =
    escapeHtml(
      order?.delivery_address || ""
    );

  const city =
    escapeHtml(order?.city || "");

  const pincode =
    escapeHtml(order?.pincode || "");

  const totalAmount =
    Number(order?.total_amount || 0);

  const paymentStatus =
    formatPaymentStatus(
      String(
        order?.payment_status || "pending"
      )
    );

  const orderStatus =
    formatStatus(
      String(
        order?.order_status || "pending"
      )
    );

  return `
    <div style="
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
      color: #222;
    ">

      <h2>
        ${escapeHtml(title)}
      </h2>

      <p>
        Hello <strong>${customerName}</strong>,
      </p>

      <p>
        This is an order update from
        <strong>Dayal Kitchen Ware</strong>.
      </p>

      <hr />

      <p>
        <strong>Order ID:</strong>
        ${orderId}
      </p>

      <p>
        <strong>Customer:</strong>
        ${customerName}
      </p>

      <p>
        <strong>Email:</strong>
        ${customerEmail}
      </p>

      <p>
        <strong>Phone:</strong>
        ${customerPhone}
      </p>

      <p>
        <strong>Delivery Address:</strong>
        ${address}, ${city} - ${pincode}
      </p>

      <p>
        <strong>Order Total:</strong>
        ₹${totalAmount.toLocaleString("en-IN")}
      </p>

      <p>
        <strong>Order Status:</strong>
        ${escapeHtml(orderStatus)}
      </p>

      <p>
        <strong>Payment Status:</strong>
        ${escapeHtml(paymentStatus)}
      </p>

      ${extraHtml}

      <hr />

      <p>
        Thank you for choosing
        <strong>Dayal Kitchen Ware</strong>.
      </p>

    </div>
  `;
}

/* =========================================================
   POST
   CUSTOMER CREATES ORDER
========================================================= */

export async function POST(request: Request) {
  try {
    const auth =
      await authenticateUser(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error ||
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const customerName =
      String(
        body.customer_name || ""
      ).trim();

    const customerEmail =
      String(
        body.customer_email ||
          auth.user.email ||
          ""
      )
        .trim()
        .toLowerCase();

    const customerPhone =
      String(
        body.customer_phone || ""
      ).trim();

    const deliveryAddress =
      String(
        body.delivery_address || ""
      ).trim();

    const city =
      String(body.city || "").trim();

    const pincode =
      String(
        body.pincode || ""
      ).trim();

    const items =
      Array.isArray(body.items)
        ? body.items
        : [];

    /* ---------------- VALIDATION ---------------- */

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !customerEmail ||
      !customerEmail.includes("@")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid customer email is required.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[6-9]\d{9}$/.test(
        customerPhone
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Delivery address is required.",
        },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          error: "City is required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid 6-digit pincode.",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your order must contain at least one product.",
        },
        { status: 400 }
      );
    }

    /* ---------------- SANITIZE ITEMS ---------------- */

    const requestedItems =
      items.map((item: any) => {
        const quantity =
          Number(
            item?.quantity || 1
          );

        return {
          id: String(
            item?.id || ""
          ).trim(),

          quantity:
            Number.isFinite(quantity) &&
            quantity > 0
              ? Math.floor(quantity)
              : 1,
        };
      });

    const productIds = [
      ...new Set(
        requestedItems
          .map(
            (item: {
              id: string;
              quantity: number;
            }) => item.id
          )
          .filter(Boolean)
      ),
    ];

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid products in cart.",
        },
        { status: 400 }
      );
    }

    /* ---------------- FETCH PRODUCTS ---------------- */

    const {
      data: products,
      error: productsError,
    } =
      await supabaseAdmin
        .from("products")
        .select(
          "id, name, slug, price, image"
        )
        .in("id", productIds);

    if (productsError) {
      console.error(
        "PRODUCT FETCH ERROR:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify products.",
        },
        { status: 500 }
      );
    }

    if (
      !products ||
      products.length !==
        productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more products are no longer available.",
        },
        { status: 400 }
      );
    }

    const productMap =
      new Map(
        products.map(
          (product) => [
            String(product.id),
            product,
          ]
        )
      );

    /* ---------------- BUILD ORDER ITEMS ---------------- */

    const sanitizedItems =
      requestedItems.map(
        (item: {
          id: string;
          quantity: number;
        }) => {
          const product =
            productMap.get(
              item.id
            );

          if (!product) {
            throw new Error(
              `Product not found: ${item.id}`
            );
          }

          const price =
            Number(product.price);

          if (
            !Number.isFinite(price) ||
            price <= 0
          ) {
            throw new Error(
              `Invalid price for product: ${product.name}`
            );
          }

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price,
            quantity:
              item.quantity,
            image: product.image,
          };
        }
      );

    /* ---------------- SUBTOTAL ---------------- */

    const subtotal =
      sanitizedItems.reduce(
        (
          sum: number,
          item: {
            price: number;
            quantity: number;
          }
        ) =>
          sum +
          Number(item.price) *
            Number(item.quantity),
        0
      );

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid order subtotal.",
        },
        { status: 400 }
      );
    }

    /* ---------------- DELIVERY ---------------- */

    let deliveryCharge = 45;

    if (subtotal >= 800) {
      deliveryCharge = 0;
    } else if (subtotal >= 350) {
      deliveryCharge = 30;
    }

    const totalAmount =
      subtotal + deliveryCharge;

    /* ---------------- CREATE ORDER ---------------- */

    const {
      data: order,
      error: orderError,
    } =
      await supabaseAdmin
        .from("orders")
        .insert({
          user_id:
            auth.user.id,

          customer_name:
            customerName,

          customer_email:
            customerEmail,

          customer_phone:
            customerPhone,

          delivery_address:
            deliveryAddress,

          city,

          pincode,

          items:
            sanitizedItems,

          subtotal,

          delivery_charge:
            deliveryCharge,

          cancellation_charge:
            0,

          total_amount:
            totalAmount,

          payment_status:
            "pending",

          order_status:
            "pending",
        })
        .select()
        .single();

    if (orderError) {
      console.error(
        "SUPABASE CREATE ORDER ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            orderError.message ||
            "Failed to create order.",
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order was not created.",
        },
        { status: 500 }
      );
    }

    console.log(
      "DAYAL KITCHEN WARE ORDER CREATED:",
      order.id
    );

    /* ---------------- ADMIN EMAIL ---------------- */

    if (adminEmail) {
      await sendEmailNotification({
        to: adminEmail,

        subject:
          `🛒 New Order #${shortOrderId(
            String(order.id)
          )}`,

        html:
          orderEmailHtml(
            order,
            "New Order Received",
            `
              <p>
                A new order has been placed on
                <strong>Dayal Kitchen Ware</strong>.
              </p>
            `
          ),
      });
    }

    /* ---------------- CUSTOMER EMAIL ---------------- */

    await sendEmailNotification({
      to: customerEmail,

      subject:
        `Order #${shortOrderId(
          String(order.id)
        )} - Order Received`,

      html:
        orderEmailHtml(
          order,
          "Order Received",
          `
            <p>
              Your order has been successfully received.
            </p>

            <p>
              <strong>Current Status:</strong>
              Pending
            </p>
          `
        ),
    });

    /* ---------------- CUSTOMER WHATSAPP ---------------- */

    await sendWhatsAppUpdate({
      phone: customerPhone,
      customerName,
      orderId: String(order.id),
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        order,
        message:
          "Order placed successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST ORDERS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET
   ADMIN → ALL ORDERS
   CUSTOMER → OWN ORDERS
========================================================= */

export async function GET(
  request: Request
) {
  try {
    const auth =
      await authenticateUser(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error ||
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    let query =
      supabaseAdmin
        .from("orders")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (isAdmin(auth.user)) {
      console.log(
        "DAYAL KITCHEN WARE ADMIN ORDERS REQUEST"
      );
    } else {
      query =
        query.eq(
          "user_id",
          auth.user.id
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "ORDERS GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            "Failed to fetch orders.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: data ?? [],
    });
  } catch (error) {
    console.error(
      "ORDERS GET API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch orders.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   ADMIN:
   - Order status
   - Payment status
   - Cancellation

   CUSTOMER:
   - Cancel own pending/confirmed order
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    const auth =
      await authenticateUser(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error ||
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const id =
      String(body.id || "").trim();

    const requestedStatusRaw =
      String(
        body.order_status || ""
      )
        .trim()
        .toLowerCase();

    const requestedPaymentStatusRaw =
      body.payment_status ===
        undefined ||
      body.payment_status === null
        ? null
        : String(
            body.payment_status
          )
            .trim()
            .toLowerCase();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    /* ---------------- PAYMENT VALIDATION ---------------- */

    let paymentStatus:
      | PaymentStatus
      | null = null;

    if (
      requestedPaymentStatusRaw !==
      null
    ) {
      if (
        !isValidPaymentStatus(
          requestedPaymentStatusRaw
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid payment status.",
          },
          { status: 400 }
        );
      }

      paymentStatus =
        requestedPaymentStatusRaw;
    }

    /* ---------------- ORDER STATUS ---------------- */

    let requestedStatus:
      | OrderStatus
      | null = null;

    if (requestedStatusRaw) {
      if (
        !isValidStatus(
          requestedStatusRaw
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid order status.",
          },
          { status: 400 }
        );
      }

      requestedStatus =
        requestedStatusRaw;
    }

    if (
      !requestedStatus &&
      paymentStatus === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order status or payment status is required.",
        },
        { status: 400 }
      );
    }

    /* ---------------- FETCH ORDER ---------------- */

    const {
      data: existingOrder,
      error: fetchError,
    } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    if (
      fetchError ||
      !existingOrder
    ) {
      console.error(
        "ORDER FETCH ERROR:",
        fetchError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    const admin =
      isAdmin(auth.user);

    /* =====================================================
       CUSTOMER
    ===================================================== */

    if (!admin) {
      if (
        paymentStatus !== null
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Customers cannot update payment status.",
          },
          { status: 403 }
        );
      }

      if (
        requestedStatus !==
        "canceled"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Customers can only cancel their own order.",
          },
          { status: 403 }
        );
      }

      if (
        existingOrder.user_id !==
        auth.user.id
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You can only cancel your own order.",
          },
          { status: 403 }
        );
      }

      if (
        ![
          "pending",
          "confirmed",
        ].includes(
          String(
            existingOrder.order_status
          )
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This order can no longer be canceled by the customer.",
          },
          { status: 400 }
        );
      }

      const reason =
        String(
          body.cancellation_reason ||
            ""
        ).trim();

      if (
        reason.length < 3
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please provide a valid cancellation reason.",
          },
          { status: 400 }
        );
      }

      const {
        data: updatedOrder,
        error: updateError,
      } =
        await supabaseAdmin
          .from("orders")
          .update({
            order_status:
              "canceled",

            cancellation_reason:
              reason,

            cancellation_charge:
              0,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

      if (
        updateError ||
        !updatedOrder
      ) {
        console.error(
          "CUSTOMER CANCELLATION ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              updateError?.message ||
              "Failed to cancel order.",
          },
          { status: 500 }
        );
      }

      console.log(
        "CUSTOMER CANCELED ORDER:",
        id
      );

      /* ---------------- ADMIN EMAIL ---------------- */

      if (adminEmail) {
        await sendEmailNotification({
          to: adminEmail,

          subject:
            `Order #${shortOrderId(
              id
            )} - Customer Canceled`,

          html:
            orderEmailHtml(
              updatedOrder,
              "Customer Canceled an Order",
              `
                <p>
                  The customer has canceled this order.
                </p>

                <p>
                  <strong>Cancellation Reason:</strong>
                  ${escapeHtml(reason)}
                </p>

                <p>
                  <strong>Cancellation Charge:</strong>
                  ₹0
                </p>
              `
            ),
        });
      }

      /* ---------------- CUSTOMER EMAIL ---------------- */

      await sendEmailNotification({
        to:
          String(
            existingOrder.customer_email ||
              auth.user.email ||
              ""
          )
            .trim()
            .toLowerCase(),

        subject:
          `Order #${shortOrderId(
            id
          )} - Order Canceled`,

        html:
          orderEmailHtml(
            updatedOrder,
            "Order Canceled",
            `
              <p>
                Your order has been canceled successfully.
              </p>

              <p>
                <strong>Cancellation Reason:</strong>
                ${escapeHtml(reason)}
              </p>

              <p>
                <strong>Cancellation Charge:</strong>
                ₹0
              </p>
            `
          ),
      });

      /* ---------------- CUSTOMER WHATSAPP ---------------- */

      await sendWhatsAppUpdate({
        phone:
          String(
            existingOrder.customer_phone ||
              ""
          ),

        customerName:
          String(
            existingOrder.customer_name ||
              "Customer"
          ),

        orderId:
          String(
            existingOrder.id
          ),

        status:
          "canceled",
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message:
          "Order canceled successfully.",
      });
    }

    /* =====================================================
       ADMIN PAYMENT-ONLY UPDATE
    ===================================================== */

    if (
      !requestedStatus &&
      paymentStatus !== null
    ) {
      const {
        data: updatedOrder,
        error: updateError,
      } =
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status:
              paymentStatus,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

      if (
        updateError ||
        !updatedOrder
      ) {
        console.error(
          "PAYMENT STATUS UPDATE ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              updateError?.message ||
              "Failed to update payment status.",
          },
          { status: 500 }
        );
      }

      const customerEmail =
        String(
          existingOrder.customer_email ||
            ""
        )
          .trim()
          .toLowerCase();

      const customerName =
        String(
          existingOrder.customer_name ||
            "Customer"
        );

      /* ---------------- CUSTOMER EMAIL ---------------- */

      if (customerEmail) {
        await sendEmailNotification({
          to: customerEmail,

          subject:
            `Order #${shortOrderId(
              id
            )} - Payment Status Updated`,

          html:
            orderEmailHtml(
              updatedOrder,
              "Payment Status Updated",
              `
                <p>
                  Your payment status has been updated by
                  <strong>Dayal Kitchen Ware</strong>.
                </p>

                <p>
                  <strong>Payment Status:</strong>
                  ${escapeHtml(
                    formatPaymentStatus(
                      paymentStatus
                    )
                  )}
                </p>
              `
            ),
        });
      }

      /* ---------------- CUSTOMER WHATSAPP ---------------- */

      await sendWhatsAppPaymentUpdate({
        phone:
          String(
            existingOrder.customer_phone ||
              ""
          ),

        customerName,

        orderId:
          String(
            existingOrder.id
          ),

        paymentStatus,
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message:
          "Payment status updated successfully.",
      });
    }

    /* =====================================================
       ADMIN ORDER STATUS UPDATE
    ===================================================== */

    if (!requestedStatus) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order status is required.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidStatusTransition(
        String(
          existingOrder.order_status
        ),
        requestedStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Cannot change order status from "${existingOrder.order_status}" to "${requestedStatus}".`,
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      order_status:
        requestedStatus,

      updated_at:
        new Date().toISOString(),
    };

    if (
      paymentStatus !== null
    ) {
      updateData.payment_status =
        paymentStatus;
    }

    /* ---------------- CANCELLATION ---------------- */

    if (
      requestedStatus ===
      "canceled"
    ) {
      const reason =
        String(
          body.cancellation_reason ||
            ""
        ).trim();

      if (
        reason.length < 3
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cancellation reason is required.",
          },
          { status: 400 }
        );
      }

      const cancellationCharge =
        Number(
          body.cancellation_charge ??
            0
        );

      if (
        !Number.isFinite(
          cancellationCharge
        ) ||
        cancellationCharge < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid cancellation charge.",
          },
          { status: 400 }
        );
      }

      const orderTotal =
        Number(
          existingOrder.total_amount ||
            0
        );

      if (
        cancellationCharge >
        orderTotal
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cancellation charge cannot be greater than the order total.",
          },
          { status: 400 }
        );
      }

      updateData.cancellation_reason =
        reason;

      updateData.cancellation_charge =
        cancellationCharge;
    } else {
      updateData.cancellation_reason =
        null;

      updateData.cancellation_charge =
        0;
    }

    /* ---------------- UPDATE DATABASE ---------------- */

    const {
      data: updatedOrder,
      error: updateError,
    } =
      await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (
      updateError ||
      !updatedOrder
    ) {
      console.error(
        "ORDER UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            updateError?.message ||
            "Failed to update order.",
        },
        { status: 500 }
      );
    }

    console.log(
      "ADMIN UPDATED ORDER:",
      id,
      {
        orderStatus:
          requestedStatus,
        paymentStatus,
      }
    );

    const customerEmail =
      String(
        existingOrder.customer_email ||
          ""
      )
        .trim()
        .toLowerCase();

    const customerName =
      String(
        existingOrder.customer_name ||
          "Customer"
      );

    /* =====================================================
       CUSTOMER EMAIL
    ===================================================== */

    if (customerEmail) {
      let extraHtml = "";

      if (
        requestedStatus ===
        "canceled"
      ) {
        extraHtml = `
          <p>
            <strong>Cancellation Reason:</strong>
            ${escapeHtml(
              updatedOrder.cancellation_reason ||
                "No reason provided"
            )}
          </p>

          <p>
            <strong>Cancellation Charge:</strong>
            ₹${Number(
              updatedOrder.cancellation_charge ||
                0
            ).toLocaleString("en-IN")}
          </p>
        `;
      } else {
        extraHtml = `
          <p>
            Your order status has been updated by
            <strong>Dayal Kitchen Ware</strong>.
          </p>

          <p>
            <strong>New Order Status:</strong>
            ${escapeHtml(
              formatStatus(
                requestedStatus
              )
            )}
          </p>
        `;
      }

      await sendEmailNotification({
        to: customerEmail,

        subject:
          `Order #${shortOrderId(
            id
          )} - ${
            requestedStatus ===
            "canceled"
              ? "Order Canceled"
              : "Status Updated"
          }`,

        html:
          orderEmailHtml(
            updatedOrder,

            requestedStatus ===
              "canceled"
              ? "Order Canceled"
              : "Order Status Updated",

            extraHtml
          ),
      });
    }

    /* =====================================================
       WHATSAPP ORDER STATUS UPDATE
    ===================================================== */

    await sendWhatsAppUpdate({
      phone:
        String(
          existingOrder.customer_phone ||
            ""
        ),

      customerName,

      orderId:
        String(
          existingOrder.id
        ),

      status:
        requestedStatus,
    });

    /* =====================================================
       PAYMENT STATUS UPDATE
    ===================================================== */

    if (
      paymentStatus !== null
    ) {
      await sendWhatsAppPaymentUpdate({
        phone:
          String(
            existingOrder.customer_phone ||
              ""
          ),

        customerName,

        orderId:
          String(
            existingOrder.id
          ),

        paymentStatus,
      });

      if (
        customerEmail
      ) {
        await sendEmailNotification({
          to: customerEmail,

          subject:
            `Order #${shortOrderId(
              id
            )} - Payment Status Updated`,

          html:
            orderEmailHtml(
              updatedOrder,
              "Payment Status Updated",
              `
                <p>
                  Your payment status has also been updated.
                </p>

                <p>
                  <strong>Payment Status:</strong>
                  ${escapeHtml(
                    formatPaymentStatus(
                      paymentStatus
                    )
                  )}
                </p>
              `
            ),
        });
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message:
        "Order updated successfully.",
    });
  } catch (error) {
    console.error(
      "ORDERS PATCH API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order.",
      },
      { status: 500 }
    );
  }
}