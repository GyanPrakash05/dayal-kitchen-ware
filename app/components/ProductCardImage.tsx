"use client";

import { useState } from "react";

type ProductCardImageProps = {
  name: string;
  image: string | null;
  images: string[] | null;
  badge: string | null;
};

export default function ProductCardImage({
  name,
  image,
  images,
  badge,
}: ProductCardImageProps) {
  const productImages: string[] = [];

  // Main image
  if (image && typeof image === "string" && image.trim() !== "") {
    productImages.push(image);
  }

  // Additional images
  if (Array.isArray(images)) {
    for (const img of images) {
      if (
        typeof img === "string" &&
        img.trim() !== "" &&
        !productImages.includes(img)
      ) {
        productImages.push(img);
      }
    }
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const activeImage =
    productImages[activeIndex] ?? productImages[0] ?? null;

  /*
   * DESKTOP HOVER
   */
  const handleMouseEnter = () => {
    setHovered(true);

    if (productImages.length > 1) {
      setActiveIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);

    if (productImages.length > 1) {
      setActiveIndex(0);
    }
  };

  /*
   * MOBILE TAP
   */
  const handleTap = () => {
    if (productImages.length <= 1) return;

    setActiveIndex((current) => {
      if (current >= productImages.length - 1) {
        return 0;
      }

      return current + 1;
    });
  };

  /*
   * THUMBNAIL / DOT CLICK
   */
  const handleThumbnailClick = (
    index: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setActiveIndex(index);
  };

  return (
    <div
      className="
        relative
        w-full
        overflow-hidden
        bg-white
      "
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ===================================================== */}
      {/* IMAGE AREA */}
      {/* ===================================================== */}

      <div
        className="
          relative
          flex
          h-[185px]
          w-full
          items-center
          justify-center
          overflow-hidden
          sm:h-64
          lg:h-72
        "
      >
        {/* BADGE */}

        {badge && (
          <span
            className="
              absolute
              left-4
              top-4
              z-30
              rounded-full
              bg-white
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-wider
              text-zinc-800
              shadow-md
            "
          >
            {badge}
          </span>
        )}

        {/* IMAGE */}

        {activeImage ? (
          <button
            type="button"
            onClick={handleTap}
            className="
              absolute
              inset-0
              flex
              h-full
              w-full
              cursor-pointer
              items-center
              justify-center
              border-0
              bg-transparent
              p-0
              outline-none
            "
            aria-label={`View images of ${name}`}
          >
            <img
              key={activeImage}
              src={activeImage}
              alt={name}
              draggable={false}
              loading="lazy"
              className="
                h-full
                w-full
                object-contain
                p-4
                transition-all
                duration-500
                ease-out
                sm:p-5
              "
            />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl">
              🍳
            </span>
          </div>
        )}

        {/* =================================================== */}
        {/* LEFT / RIGHT ARROWS */}
        {/* =================================================== */}

        {productImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setActiveIndex((current) =>
                  current === 0
                    ? productImages.length - 1
                    : current - 1
                );
              }}
              className="
                absolute
                left-3
                top-1/2
                z-20
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-lg
                text-zinc-800
                shadow-md
                backdrop-blur
                transition
                hover:scale-105
                hover:bg-white
              "
              aria-label="Previous image"
            >
              ←
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setActiveIndex(
                  (current) =>
                    (current + 1) % productImages.length
                );
              }}
              className="
                absolute
                right-3
                top-1/2
                z-20
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-lg
                text-zinc-800
                shadow-md
                backdrop-blur
                transition
                hover:scale-105
                hover:bg-white
              "
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}

        {/* =================================================== */}
        {/* IMAGE COUNT */}
        {/* =================================================== */}

        {productImages.length > 1 && (
          <div
            className="
              absolute
              right-3
              top-3
              z-20
              rounded-full
              bg-black/65
              px-2.5
              py-1
              text-[9px]
              font-semibold
              text-white
              backdrop-blur
            "
          >
            {activeIndex + 1}/{productImages.length}
          </div>
        )}

        {/* =================================================== */}
        {/* MOBILE TAP HINT */}
        {/* =================================================== */}

        {productImages.length > 1 && (
          <div
            className="
              pointer-events-none
              absolute
              bottom-3
              left-1/2
              z-20
              -translate-x-1/2
              rounded-full
              bg-black/60
              px-3
              py-1.5
              text-[9px]
              font-medium
              text-white
              backdrop-blur
              sm:hidden
            "
          >
            Tap image to change
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* THUMBNAILS */}
      {/* ===================================================== */}

      {productImages.length > 1 && (
        <div
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            border-t
            border-zinc-100
            bg-white
            px-3
            py-3
          "
        >
          {productImages.slice(0, 6).map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={(event) =>
                handleThumbnailClick(index, event)
              }
              className={`
                relative
                h-12
                w-12
                shrink-0
                overflow-hidden
                rounded-xl
                border
                bg-white
                transition-all
                duration-200
                ${
                  activeIndex === index
                    ? "border-zinc-900 ring-2 ring-zinc-900/10"
                    : "border-zinc-200 opacity-60 hover:opacity-100"
                }
              `}
              aria-label={`View product image ${index + 1}`}
            >
              <img
                src={img}
                alt={`${name} ${index + 1}`}
                className="h-full w-full object-contain p-1"
                draggable={false}
              />

              {activeIndex === index && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-900" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}