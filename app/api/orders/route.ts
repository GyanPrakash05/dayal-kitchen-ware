import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const adminEmail =
  process.env.ADMIN_EMAIL?.trim().toLowerCase();

const allowedStatuses = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "canceled",
] as const;

type OrderStatus =
  (typeof allowedStatuses)[number];

/* =========================================================
   VALIDATE STATUS
========================================================= */

function isValidStatus(
  status: string
): status is OrderStatus {
  return allowedStatuses.includes(
    status as OrderStatus
  );
}

/* =========================================================
   VALIDATE STATUS TRANSITION

   pending
      ↓
   confirmed
      ↓
   out_for_delivery
      ↓
   delivered

   pending / confirmed / out_for_delivery
      ↓
   canceled

   delivered / canceled
      ↓
   NO FURTHER CHANGE
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

  const allowedTransitions: Record<
    string,
    OrderStatus[]
  > = {
    pending: [
      "confirmed",
      "canceled",
    ],

    confirmed: [
      "out_for_delivery",
      "canceled",
    ],

    out_for_delivery: [
      "delivered",
      "canceled",
    ],
  };

  return (
    allowedTransitions[
      currentStatus
    ]?.includes(nextStatus) ?? false
  );
}

/* =========================================================
   AUTHENTICATE USER
========================================================= */

async function authenticateUser(
  request: Request
) {
  const authHeader =
    request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const token =
    authHeader.substring(7).trim();

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
  } =
    await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    console.error(
      "AUTH ERROR:",
      error
    );

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

  return (
    user.email?.trim().toLowerCase() ===
    adminEmail
  );
}

/* =========================================================
   WHATSAPP UPDATE

   Optional:
   Works only when Meta WhatsApp credentials
   and template are configured.
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
      "WhatsApp update skipped: credentials/template not configured."
    );

    return;
  }

  const cleanPhone =
    phone.replace(/\D/g, "");

  if (!cleanPhone) {
    console.log(
      "WhatsApp update skipped: invalid phone number."
    );

    return;
  }

  const statusText: Record<
    OrderStatus,
    string
  > = {
    pending: "Pending",
    confirmed: "Confirmed",
    out_for_delivery:
      "Out for Delivery",
    delivered: "Delivered",
    canceled: "Canceled",
  };

  try {
    const response =
      await fetch(
        `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            messaging_product:
              "whatsapp",

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

                      text:
                        customerName ||
                        "Customer",
                    },

                    {
                      type: "text",

                      text:
                        orderId,
                    },

                    {
                      type: "text",

                      text:
                        statusText[
                          status
                        ],
                    },
                  ],
                },
              ],
            },
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "WHATSAPP API ERROR:",
        result
      );

      return;
    }

    console.log(
      "WHATSAPP UPDATE SENT:",
      result
    );
  } catch (error) {
    console.error(
      "WHATSAPP SEND ERROR:",
      error
    );
  }
}

/* =========================================================
   POST ORDER

   CUSTOMER CREATES ORDER
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       AUTHENTICATE CUSTOMER
    ===================================================== */

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

    /* =====================================================
       CUSTOMER DATA
    ===================================================== */

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
      String(
        body.city || ""
      ).trim();

    const pincode =
      String(
        body.pincode || ""
      ).trim();

    /* =====================================================
       ITEMS
    ===================================================== */

    const items =
      Array.isArray(body.items)
        ? body.items
        : [];

    /* =====================================================
       VALIDATION
    ===================================================== */

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
          error:
            "City is required.",
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

    /* =====================================================
       SANITIZE ITEMS
    ===================================================== */

    const requestedItems = items.map((item: any) => ({
  id: String(item?.id || "").trim(),
  quantity: Math.max(
    1,
    Number(item?.quantity || 1)
  ),
}));

const productIds = [
  ...new Set(
    requestedItems
  .map((item: { id: string; quantity: number }) => item.id)
  .filter(Boolean)
  ),
];
if (productIds.length === 0) {
  return NextResponse.json(
    {
      success: false,
      error: "Invalid products in cart.",
    },
    { status: 400 }
  );
}

const {
  data: products,
  error: productsError,
} = await supabaseAdmin
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
      error: "Unable to verify products.",
    },
    { status: 500 }
  );
}

if (!products || products.length !== productIds.length) {
  return NextResponse.json(
    {
      success: false,
      error:
        "One or more products are no longer available.",
    },
    { status: 400 }
  );
}

const productMap = new Map(
  products.map((product) => [
    String(product.id),
    product,
  ])
);

const sanitizedItems = requestedItems.map(
  (item: { id: string; quantity: number }) => {
    const product = productMap.get(item.id);

    if (!product) {
      throw new Error(
        `Product not found: ${item.id}`
      );
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      quantity: item.quantity,
      image: product.image,
    };
  }
);

    /* =====================================================
       CALCULATE SUBTOTAL
    ===================================================== */

    const subtotal =
      sanitizedItems.reduce(
        (
          sum: number,
          item: any
        ) => {
          return (
            sum +
            Number(item.price) *
              Number(
                item.quantity
              )
          );
        },
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

    /* =====================================================
       DELIVERY CHARGE
    ===================================================== */

    let deliveryCharge = 45;

    if (subtotal >= 800) {
      deliveryCharge = 0;
    } else if (subtotal >= 350) {
      deliveryCharge = 30;
    }

    /* =====================================================
       FINAL TOTAL
    ===================================================== */

    const totalAmount =
      subtotal + deliveryCharge;

    /* =====================================================
       CREATE ORDER

       Every new order starts as:
       pending
    ===================================================== */

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
      "ORDER CREATED:",
      order.id
    );

    /* =====================================================
       WHATSAPP - ORDER CREATED
    ===================================================== */

    await sendWhatsAppUpdate({
      phone: customerPhone,

      customerName,

      orderId:
        String(order.id),

      status: "pending",
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

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
   GET ORDERS

   ADMIN:
   ALL ORDERS

   CUSTOMER:
   ONLY THEIR ORDERS
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       AUTHENTICATE USER
    ===================================================== */

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

    /* =====================================================
       BASE QUERY
    ===================================================== */

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

    /* =====================================================
       ADMIN GETS ALL ORDERS

       CUSTOMER GETS ONLY THEIR ORDERS
    ===================================================== */

    if (isAdmin(auth.user)) {
      console.log(
        "ADMIN ORDERS REQUEST"
      );
    } else {
      query = query.eq(
        "user_id",
        auth.user.id
      );
    }

    /* =====================================================
       EXECUTE QUERY
    ===================================================== */

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

      orders:
        data ?? [],
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
   PATCH ORDER

   ADMIN ONLY

   ALLOWED FLOW:

   pending
      ↓
   confirmed
      ↓
   out_for_delivery
      ↓
   delivered

   OR

   pending → canceled
   confirmed → canceled
   out_for_delivery → canceled
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    /* =====================================================
       AUTHENTICATE USER
    ===================================================== */

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

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    if (!isAdmin(auth.user)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized as admin.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       READ REQUEST BODY
    ===================================================== */

    const body =
      await request.json();

    const id =
      String(
        body.id || ""
      ).trim();

    const status =
      String(
        body.order_status || ""
      )
        .trim()
        .toLowerCase();

    /* =====================================================
       VALIDATE ORDER ID
    ===================================================== */

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

    /* =====================================================
       VALIDATE NEW STATUS
    ===================================================== */

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid order status.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET CURRENT ORDER

       IMPORTANT:
       existingOrder MUST be fetched before
       checking the status transition.
    ===================================================== */

    const {
      data: existingOrder,
      error: fetchError,
    } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    /* =====================================================
       ORDER NOT FOUND
    ===================================================== */

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
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       STATUS TRANSITION VALIDATION

       Example:

       pending → confirmed       ✅
       confirmed → out_for_delivery ✅
       out_for_delivery → delivered ✅

       pending → delivered       ❌
       delivered → confirmed     ❌
       canceled → pending        ❌
       confirmed → pending       ❌
    ===================================================== */

    if (
      !isValidStatusTransition(
        existingOrder.order_status,
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            `Cannot change order status from "${existingOrder.order_status}" to "${status}".`,
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UPDATE DATA
    ===================================================== */

    const updateData: Record<
      string,
      unknown
    > = {
      order_status:
        status,

      updated_at:
        new Date().toISOString(),
    };

    /* =====================================================
       CANCELED ORDER

       Cancellation reason required.
       Cancellation charge must be valid.
    ===================================================== */

    if (
      status === "canceled"
    ) {
      const reason =
        String(
          body.cancellation_reason ||
            ""
        ).trim();

      const chargeValue =
        Number(
          body.cancellation_charge ??
            0
        );

      /* ===================================================
         VALIDATE CANCELLATION REASON
      =================================================== */

      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cancellation reason is required.",
          },
          { status: 400 }
        );
      }

      /* ===================================================
         VALIDATE CANCELLATION CHARGE
      =================================================== */

      if (
        !Number.isFinite(
          chargeValue
        ) ||
        chargeValue < 0
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

      /* ===================================================
         CHARGE CANNOT EXCEED ORDER TOTAL
      =================================================== */

      if (
        chargeValue >
        Number(
          existingOrder.total_amount ||
            0
        )
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
        chargeValue;
    }

    /* =====================================================
       NON-CANCELED ORDER

       Clear old cancellation information.
    ===================================================== */

    if (
      status !== "canceled"
    ) {
      updateData.cancellation_reason =
        null;

      updateData.cancellation_charge =
        0;
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

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

    if (updateError) {
      console.error(
        "ORDER UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            updateError.message ||
            "Failed to update order.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       WHATSAPP STATUS UPDATE
    ===================================================== */

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

      status,
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      order:
        updatedOrder,

      message:
        "Order status updated successfully.",
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