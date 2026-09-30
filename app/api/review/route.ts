import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const MAX_REVIEW_LENGTH = 1000;
const MAX_NAME_LENGTH = 80;

const RATE_LIMIT_10_MINUTES = 3;
const RATE_LIMIT_24_HOURS = 10;

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

type ReviewStatus = (typeof VALID_STATUSES)[number];

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function isValidUUID(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

async function authenticateUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

function cleanReview(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function cleanName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function hasSuspiciousContent(review: string) {
  // Control characters
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(review)) {
    return true;
  }

  // More than one URL
  const urls = review.match(/https?:\/\/|www\./gi) ?? [];

  if (urls.length > 1) {
    return true;
  }

  // Excessive repeated character spam
  if (/(.)\1{14,}/u.test(review)) {
    return true;
  }

  // Repeated consecutive words
  const words = review.toLowerCase().split(/\s+/);

  let repeatedWords = 0;

  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1] && words[i].length >= 2) {
      repeatedWords++;

      if (repeatedWords >= 5) {
        return true;
      }
    } else {
      repeatedWords = 0;
    }
  }

  return false;
}

function itemBelongsToProduct(item: unknown, productId: string) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const record = item as Record<string, unknown>;

  return (
    record.id === productId ||
    record.product_id === productId ||
    record.productId === productId
  );
}

function orderContainsProduct(items: unknown, productId: string) {
  if (!Array.isArray(items)) {
    return false;
  }

  return items.some((item) => itemBelongsToProduct(item, productId));
}

function getDisplayName(
  suppliedName: unknown,
  user: {
    user_metadata?: Record<string, unknown>;
    email?: string;
  }
) {
  const provided = cleanName(suppliedName);

  if (provided) {
    return provided.slice(0, MAX_NAME_LENGTH);
  }

  const metadata = user.user_metadata ?? {};

  const metadataName =
    cleanName(metadata.full_name) ||
    cleanName(metadata.name) ||
    cleanName(metadata.display_name);

  if (metadataName) {
    return metadataName.slice(0, MAX_NAME_LENGTH);
  }

  if (user.email) {
    return user.email.split("@")[0].slice(0, MAX_NAME_LENGTH);
  }

  return "Customer";
}

async function isAdminUser(user: { email?: string | null }) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail || !user.email) {
    return false;
  }

  return user.email.toLowerCase() === adminEmail;
}

/**
 * GET
 *
 * Public:
 *   /api/review?product_id=<uuid>
 *
 * Returns only approved reviews.
 *
 * Authenticated:
 *   Also returns:
 *   - can_review
 *   - has_review
 *   - verified_purchase
 */
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("product_id");

    if (!isValidUUID(productId)) {
      return jsonError("Valid product_id is required.");
    }

    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from("product_reviews")
      .select(
        "id, product_id, customer_name, rating, review, created_at"
      )
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Review GET error:", reviewsError);

      return jsonError("Unable to load reviews.", 500);
    }

    let canReview = false;
    let hasReview = false;
    let verifiedPurchase = false;

    const user = await authenticateUser(request);

    if (user) {
      const { data: existingReview, error: existingReviewError } =
        await supabaseAdmin
          .from("product_reviews")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .maybeSingle();

      if (existingReviewError) {
        console.error(
          "Existing review check error:",
          existingReviewError
        );
      }

      hasReview = Boolean(existingReview);

      const { data: deliveredOrders, error: ordersError } =
        await supabaseAdmin
          .from("orders")
          .select("id, items, order_status")
          .eq("user_id", user.id)
          .eq("order_status", "delivered")
          .order("created_at", { ascending: false })
          .limit(50);

      if (ordersError) {
        console.error(
          "Review purchase verification error:",
          ordersError
        );
      } else {
        verifiedPurchase =
          deliveredOrders?.some((order) =>
            orderContainsProduct(order.items, productId)
          ) ?? false;
      }

      canReview = verifiedPurchase && !hasReview;
    }

    return NextResponse.json({
      success: true,
      reviews: reviews ?? [],
      count: reviews?.length ?? 0,
      average_rating:
        reviews && reviews.length > 0
          ? Number(
              (
                reviews.reduce(
                  (sum, item) => sum + Number(item.rating),
                  0
                ) / reviews.length
              ).toFixed(1)
            )
          : 0,
      can_review: canReview,
      has_review: hasReview,
      verified_purchase: verifiedPurchase,
    });
  } catch (error) {
    console.error("Review GET unexpected error:", error);

    return jsonError("Something went wrong.", 500);
  }
}

/**
 * POST
 *
 * Authenticated customers can submit one review per product.
 * Review always starts as pending.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (!user) {
      return jsonError("Please log in to submit a review.", 401);
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.");
    }

    const productId = body.product_id;

    if (!isValidUUID(productId)) {
      return jsonError("Valid product_id is required.");
    }

    const rating = Number(body.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonError("Rating must be between 1 and 5.");
    }

    const review = cleanReview(body.review);

    if (review.length < 10) {
      return jsonError("Review must contain at least 10 characters.");
    }

    if (review.length > MAX_REVIEW_LENGTH) {
      return jsonError(
        `Review cannot exceed ${MAX_REVIEW_LENGTH} characters.`
      );
    }

    if (hasSuspiciousContent(review)) {
      return jsonError(
        "This review contains suspicious or spam-like content."
      );
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      console.error("Product review lookup error:", productError);
      return jsonError("Unable to verify product.", 500);
    }

    if (!product) {
      return jsonError("Product not found.", 404);
    }

    // One review per user per product.
    const { data: existingReview, error: existingReviewError } =
      await supabaseAdmin
        .from("product_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

    if (existingReviewError) {
      console.error(
        "Duplicate review check error:",
        existingReviewError
      );
    }

    if (existingReview) {
      return jsonError(
        "You have already submitted a review for this product.",
        409
      );
    }

    // Rate limit: last 10 minutes.
    const tenMinutesAgo = new Date(
      Date.now() - 10 * 60 * 1000
    ).toISOString();

    const { count: recentCount, error: recentError } =
      await supabaseAdmin
        .from("product_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", tenMinutesAgo);

    if (recentError) {
      console.error("10-minute rate-limit error:", recentError);
    }

    if ((recentCount ?? 0) >= RATE_LIMIT_10_MINUTES) {
      return jsonError(
        "Too many review submissions. Please try again later.",
        429
      );
    }

    // Rate limit: last 24 hours.
    const oneDayAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { count: dailyCount, error: dailyError } =
      await supabaseAdmin
        .from("product_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneDayAgo);

    if (dailyError) {
      console.error("Daily rate-limit error:", dailyError);
    }

    if ((dailyCount ?? 0) >= RATE_LIMIT_24_HOURS) {
      return jsonError(
        "Daily review limit reached. Please try again tomorrow.",
        429
      );
    }

    // Only customers with a delivered order can review.
    const { data: deliveredOrders, error: ordersError } =
      await supabaseAdmin
        .from("orders")
        .select("id, items, order_status")
        .eq("user_id", user.id)
        .eq("order_status", "delivered")
        .order("created_at", { ascending: false })
        .limit(50);

    if (ordersError) {
      console.error("Delivered order lookup error:", ordersError);

      return jsonError(
        "Unable to verify your purchase.",
        500
      );
    }

    const matchingOrder = deliveredOrders?.find((order) =>
      orderContainsProduct(order.items, productId)
    );

    if (!matchingOrder) {
      return jsonError(
        "You can review this product only after purchasing and receiving it.",
        403
      );
    }

    const customerName = getDisplayName(body.customer_name, user);

    const { data: insertedReview, error: insertError } =
      await supabaseAdmin
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          order_id: matchingOrder.id,
          customer_name: customerName,
          rating,
          review,
          status: "pending",
        })
        .select(
          "id, product_id, customer_name, rating, review, status, created_at"
        )
        .single();

    if (insertError) {
      console.error("Review insert error:", insertError);

      // PostgreSQL unique violation.
      if (insertError.code === "23505") {
        return jsonError(
          "You have already submitted a review for this product.",
          409
        );
      }

      return jsonError(
        "Unable to submit your review.",
        500
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Review submitted successfully. It will appear after moderation.",
        review: insertedReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review POST unexpected error:", error);

    return jsonError("Something went wrong.", 500);
  }
}

/**
 * PATCH
 *
 * Admin moderation.
 *
 * Body:
 * {
 *   review_id: string,
 *   status: "approved" | "rejected" | "pending",
 *   rejection_reason?: string
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (!user) {
      return jsonError("Authentication required.", 401);
    }

    const admin = await isAdminUser(user);

    if (!admin) {
      return jsonError("Admin access required.", 403);
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.");
    }

    const reviewId = body.review_id;
    const status = body.status;

    if (!isValidUUID(reviewId)) {
      return jsonError("Valid review_id is required.");
    }

    if (
      typeof status !== "string" ||
      !VALID_STATUSES.includes(status as ReviewStatus)
    ) {
      return jsonError(
        "Status must be pending, approved, or rejected."
      );
    }

    const rejectionReason = cleanReview(body.rejection_reason);

    if (status === "rejected" && rejectionReason.length > 500) {
      return jsonError(
        "Rejection reason cannot exceed 500 characters."
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
    };

    if (status === "rejected") {
      updateData.rejection_reason =
        rejectionReason || "Review rejected by admin.";
    } else {
      updateData.rejection_reason = null;
    }

    const { data: updatedReview, error: updateError } =
      await supabaseAdmin
        .from("product_reviews")
        .update(updateData)
        .eq("id", reviewId)
        .select(
          "id, product_id, customer_name, rating, review, status, rejection_reason, created_at, moderated_at"
        )
        .single();

    if (updateError) {
      console.error("Review moderation error:", updateError);

      return jsonError(
        "Unable to update review.",
        500
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${status}.`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Review PATCH unexpected error:", error);

    return jsonError("Something went wrong.", 500);
  }
}

/**
 * DELETE
 *
 * Admin can permanently remove a review.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (!user) {
      return jsonError("Authentication required.", 401);
    }

    const admin = await isAdminUser(user);

    if (!admin) {
      return jsonError("Admin access required.", 403);
    }

    const reviewId =
      request.nextUrl.searchParams.get("review_id");

    if (!isValidUUID(reviewId)) {
      return jsonError("Valid review_id is required.");
    }

    const { error: deleteError } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("Review delete error:", deleteError);

      return jsonError(
        "Unable to delete review.",
        500
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Review DELETE unexpected error:", error);

    return jsonError("Something went wrong.", 500);
  }
}