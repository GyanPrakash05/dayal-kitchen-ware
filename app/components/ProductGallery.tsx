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
  /* =========================================================
     PRODUCT IMAGES
  ========================================================= */

  const productImages = useMemo(() => {
    const validImages = Array.isArray(images)
      ? images.filter(
          (img): img is string =>
            typeof img === "string" && img.trim().length > 0
        )
      : [];

    if (validImages.length > 0) {
      return validImages;
    }

    return image ? [image] : [];
  }, [images, image]);

  /* =========================================================
     SELECTED IMAGE
  ========================================================= */

  const [selectedImage, setSelectedImage] = useState<string | null>(
    productImages[0] ?? null
  );

  useEffect(() => {
    setSelectedImage(productImages[0] ?? null);
  }, [productImages]);

  /* =========================================================
     NO IMAGE
  ========================================================= */

  if (productImages.length === 0 || !selectedImage) {
    return (
      <div className="flex min-h-[320px] w-full max-w-full min-w-0 items-center justify-center overflow-hidden rounded-[2rem] bg-[#eee8dc] sm:min-h-[500px]">
        <span className="text-7xl sm:text-8xl">
          🍳
        </span>
      </div>
    );
  }

  /* =========================================================
     GALLERY
  ========================================================= */

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">

      {/* =====================================================
          MAIN IMAGE
      ===================================================== */}

      <div
        className="
          relative
          flex
          h-[320px]
          w-full
          max-w-full
          min-w-0
          items-center
          justify-center
          overflow-hidden
          rounded-[2rem]
          bg-[#eee8dc]
          sm:h-[500px]
        "
      >

        <img
          src={selectedImage}
          alt={name}
          loading="eager"
          decoding="async"
          className="
            block
            h-full
            w-full
            max-w-full
            min-w-0
            object-contain
            p-4
            sm:p-10
          "
        />

      </div>

      {/* =====================================================
          THUMBNAILS
      ===================================================== */}

      {productImages.length > 1 && (
        <div className="mt-4 flex w-full max-w-full min-w-0 gap-3 overflow-x-auto overscroll-x-contain pb-3">

          {productImages.map((img, index) => {
            const active = selectedImage === img;

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setSelectedImage(img)}
                aria-label={`View ${name} image ${index + 1}`}
                className={`
                  relative
                  h-16
                  w-16
                  shrink-0
                  overflow-hidden
                  rounded-xl
                  border-2
                  bg-[#eee8dc]
                  transition
                  sm:h-24
                  sm:w-24
                  ${
                    active
                      ? "border-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400"
                  }
                `}
              >

                <img
                  src={img}
                  alt={`${name} image ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="block h-full w-full max-w-full object-contain p-2"
                />

                {/* MAIN LABEL */}

                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    MAIN
                  </span>
                )}

              </button>
            );
          })}

        </div>
      )}

      {/* =====================================================
          IMAGE COUNT
      ===================================================== */}

      {productImages.length > 1 && (
        <p className="mt-2 w-full max-w-full text-center text-xs text-zinc-400">
          {productImages.length} images
        </p>
      )}

    </div>
  );
}