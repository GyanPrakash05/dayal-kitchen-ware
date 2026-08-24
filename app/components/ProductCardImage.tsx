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
  const productImages =
    Array.isArray(images) && images.length > 0
      ? images.filter(
          (img): img is string =>
            typeof img === "string" && img.trim() !== ""
        )
      : image
      ? [image]
      : [];

  const mainImage = productImages[0] ?? null;
  const hoverImage = productImages[1] ?? mainImage;

  const [currentImage, setCurrentImage] =
    useState(mainImage);

  function handleMouseEnter() {
    if (hoverImage) {
      setCurrentImage(hoverImage);
    }
  }

  function handleMouseLeave() {
    setCurrentImage(mainImage);
  }

  return (
    <div
      className="
        relative
        flex
        h-[260px]
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-[#eee8dc]

        sm:h-64
        lg:h-72
      "
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* BADGE */}

      {badge && (
        <span
          className="
            absolute
            left-4
            top-4
            z-10
            rounded-full
            bg-white
            px-3
            py-1.5
            text-[9px]
            font-bold
            tracking-wider
            text-zinc-800
            shadow-sm
          "
        >
          {badge}
        </span>
      )}

      {/* IMAGE */}

      {currentImage ? (
        <img
          src={currentImage}
          alt={name}
          loading="lazy"
          className="
            block
            h-full
            w-full
            object-contain
            p-5
            transition-all
            duration-500
            ease-out
            group-hover:scale-105
          "
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-6xl sm:text-7xl">
            🍳
          </span>
        </div>
      )}

      {/* IMAGE INDICATOR */}

      {productImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {productImages.slice(0, 5).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                currentImage === productImages[index]
                  ? "w-5 bg-zinc-900"
                  : "w-1.5 bg-zinc-400/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}