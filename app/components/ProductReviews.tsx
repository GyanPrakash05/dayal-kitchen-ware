"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
};

type ProductReviewsProps = {
  productId: string;
};

type ReviewResponse = {
  success?: boolean;
  reviews?: Review[];
  count?: number;
  average_rating?: number;
  can_review?: boolean;
  has_review?: boolean;
  verified_purchase?: boolean;
  error?: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function Stars({
  rating,
  size = "text-base",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div
      className={`flex items-center gap-0.5 ${size}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= rating ? "text-amber-500" : "text-zinc-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingSelector({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-800">
        Your rating
      </p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Give ${star} star${star === 1 ? "" : "s"}`}
            className={`text-3xl leading-none transition-transform hover:scale-110 ${
              star <= rating ? "text-amber-500" : "text-zinc-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductReviews({
  productId,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [canReview, setCanReview] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [verifiedPurchase, setVerifiedPurchase] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [reviewText, setReviewText] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/review?product_id=${encodeURIComponent(productId)}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      const data: ReviewResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load reviews.");
      }

      setReviews(data.reviews ?? []);
      setAverageRating(data.average_rating ?? 0);
      setReviewCount(data.count ?? 0);
      setCanReview(data.can_review ?? false);
      setHasReview(data.has_review ?? false);
      setVerifiedPurchase(data.verified_purchase ?? false);
    } catch (err) {
      console.error("Review loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [productId]);

  const ratingPercentage = useMemo(() => {
    return Math.min(100, Math.max(0, (averageRating / 5) * 100));
  }, [averageRating]);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5.");
      return;
    }

    const cleanedReview = reviewText.trim();

    if (cleanedReview.length < 10) {
      setError("Your review must contain at least 10 characters.");
      return;
    }

    if (cleanedReview.length > 1000) {
      setError("Your review cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please log in to submit a review.");
        return;
      }

      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          review: cleanedReview,
          customer_name: customerName.trim(),
        }),
      });

      const data: ReviewResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit your review."
        );
      }

      setMessage(
        "Review submitted successfully. It will appear after moderation."
      );

      setRating(0);
      setCustomerName("");
      setReviewText("");

      await loadReviews();
    } catch (err) {
      console.error("Review submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-zinc-100 pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Customer feedback
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Reviews & Ratings
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Real reviews from customers who purchased and received
            this product.
          </p>
        </div>

        {reviewCount > 0 ? (
          <div className="flex items-center gap-4 rounded-2xl bg-[#faf9f6] px-5 py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-950">
                {averageRating.toFixed(1)}
              </div>

              <Stars rating={Math.round(averageRating)} />

              <p className="mt-1 text-xs text-zinc-500">
                {reviewCount}{" "}
                {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="hidden h-12 w-px bg-zinc-200 sm:block">
              <span className="sr-only">
                Rating divider
              </span>
            </div>

            <div className="hidden min-w-[100px] sm:block">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${ratingPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Overall customer rating
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#faf9f6] px-5 py-4">
            <p className="text-sm font-semibold text-zinc-800">
              No reviews yet
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Be the first verified customer to review this product.
            </p>
          </div>
        )}
      </div>

      {/* Review submission area */}
      <div className="mt-7">
        {loading ? (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-3 w-64 animate-pulse rounded bg-zinc-200" />
          </div>
        ) : canReview && verifiedPurchase && !hasReview ? (
          <form
            onSubmit={submitReview}
            className="rounded-2xl border border-zinc-200 bg-[#faf9f6] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  Share your experience
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Your purchase has been verified.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span>✓</span>
                Verified Purchase
              </span>
            </div>

            <div className="mt-5">
              <RatingSelector
                rating={rating}
                onChange={setRating}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor={`review-name-${productId}`}
                className="mb-2 block text-sm font-semibold text-zinc-800"
              >
                Name
              </label>

              <input
                id={`review-name-${productId}`}
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                maxLength={80}
                placeholder="Your name"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor={`review-text-${productId}`}
                className="mb-2 block text-sm font-semibold text-zinc-800"
              >
                Your review
              </label>

              <textarea
                id={`review-text-${productId}`}
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value)
                }
                minLength={10}
                maxLength={1000}
                rows={5}
                placeholder="Tell other customers about the product quality, usage and experience..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
              />

              <div className="mt-2 text-right text-xs text-zinc-400">
                {reviewText.length}/1000
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-zinc-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
              Reviews are checked before appearing publicly.
            </p>
          </form>
        ) : hasReview ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-bold text-emerald-800">
              Review already submitted
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              You can submit only one review for this product.
              Your review will appear after moderation if it is still
              pending.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="font-bold text-zinc-900">
              Want to review this product?
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Reviews are available to customers who have purchased
              and received this product. Please log in with the
              account used for your order.
            </p>
          </div>
        )}

        {error && !canReview && !hasReview && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Reviews list */}
      <div className="mt-8">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="text-lg font-bold text-zinc-950">
            Customer reviews
          </h3>

          <span className="text-sm text-zinc-400">
            {reviewCount}
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl">★</div>

            <p className="mt-3 font-semibold text-zinc-800">
              No approved reviews yet
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Verified customer reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reviews.map((item) => (
              <article
                key={item.id}
                className="py-6 first:pt-5 last:pb-2"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-zinc-900">
                        {item.customer_name}
                      </h4>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        ✓ Verified Purchase
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3">
                      <Stars rating={item.rating} />

                      <span className="text-xs text-zinc-400">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  {item.review}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}