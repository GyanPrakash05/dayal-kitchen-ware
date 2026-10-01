"use client";

import { useEffect, useMemo, useState } from "react";

type ProductGalleryProps = {
  name: string;
  image: string | null;
  images: string[] | null;
};

export default function ProductGallery({
  name,
  image,
  images,
}: ProductGalleryProps) {
  const productImages = useMemo(() => {
    const validImages = Array.isArray(images)
      ? images.filter(
          (img): img is string =>
            typeof img === "string" && img.trim().length > 0
        )
      : [];

    if (validImages.length > 0) {
      return Array.from(new Set(validImages));
    }

    return image ? [image] : [];
  }, [images, image]);

  const [selectedImage, setSelectedImage] = useState<string | null>(
    productImages[0] ?? null
  );

  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setSelectedImage(productImages[0] ?? null);
  }, [productImages]);

  useEffect(() => {
    if (!isZoomOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isZoomOpen]);

  if (productImages.length === 0 || !selectedImage) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[#eee8dc] sm:min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl">📦</div>
          <p className="mt-3 text-sm font-medium text-zinc-500">
            Product image unavailable
          </p>
        </div>
      </div>
    );
  }

  const selectedIndex = Math.max(
    0,
    productImages.indexOf(selectedImage)
  );

  const showPrevious = () => {
    const previousIndex =
      selectedIndex === 0
        ? productImages.length - 1
        : selectedIndex - 1;

    setSelectedImage(productImages[previousIndex]);
  };

  const showNext = () => {
    const nextIndex =
      selectedIndex === productImages.length - 1
        ? 0
        : selectedIndex + 1;

    setSelectedImage(productImages[nextIndex]);
  };

  return (
    <>
      <div className="w-full min-w-0">
        {/* Main image */}
        <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#eee8dc] shadow-sm">
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="group block h-[320px] w-full cursor-zoom-in sm:h-[520px]"
            aria-label={`Zoom ${name}`}
          >
            <img
              src={selectedImage}
              alt={name}
              loading="eager"
              decoding="async"
              className="block h-full w-full object-contain p-5 transition duration-500 group-hover:scale-[1.03] sm:p-10"
            />

            <span className="absolute right-4 top-4 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur">
              🔍 Zoom
            </span>
          </button>

          {/* Previous / next */}
          {productImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-lg font-bold text-zinc-900 shadow-md transition hover:bg-white"
              >
                ←
              </button>

              <button
                type="button"
                onClick={showNext}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-lg font-bold text-zinc-900 shadow-md transition hover:bg-white"
              >
                →
              </button>
            </>
          )}

          {/* Image counter */}
          {productImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {selectedIndex + 1} / {productImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {productImages.length > 1 && (
          <div className="mt-4 flex w-full gap-3 overflow-x-auto overscroll-x-contain pb-2">
            {productImages.map((img, index) => {
              const active = selectedImage === img;

              return (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View ${name} image ${index + 1}`}
                  aria-current={active ? "true" : undefined}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-[#eee8dc] transition sm:h-24 sm:w-24 ${
                    active
                      ? "border-zinc-950 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${name} image ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain p-2"
                  />

                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      MAIN
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            {productImages.length > 1
              ? `${productImages.length} product images`
              : "Product image"}
          </p>

          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="text-xs font-semibold text-zinc-700 underline underline-offset-4 hover:text-zinc-950"
          >
            View larger
          </button>
        </div>
      </div>

      {/* Zoom modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} image viewer`}
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt={name}
              className="max-h-[88vh] max-w-full object-contain rounded-2xl"
            />

            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Close image viewer"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-zinc-900 shadow-lg sm:right-4 sm:top-4"
            >
              ×
            </button>

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous product image"
                  className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl font-bold text-zinc-900 shadow-lg sm:left-4"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next product image"
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl font-bold text-zinc-900 shadow-lg sm:right-4"
                >
                  →
                </button>
              </>
            )}

            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white">
                {selectedIndex + 1} / {productImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}