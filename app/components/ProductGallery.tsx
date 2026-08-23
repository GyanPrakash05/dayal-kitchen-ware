"use client";

import { useState } from "react";

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
  const productImages =
    Array.isArray(images) && images.length > 0
      ? images.filter(
          (img): img is string =>
            typeof img === "string" && img.trim().length > 0
        )
      : image
      ? [image]
      : [];

  const [selectedImage, setSelectedImage] = useState(
    productImages[0] ?? null
  );

  if (productImages.length === 0 || !selectedImage) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-[2rem] bg-[#eee8dc] sm:h-[500px]">
        <span className="text-8xl">🍳</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* MAIN IMAGE */}

      <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[#eee8dc] sm:h-[500px]">
        <img
          src={selectedImage}
          alt={name}
          className="h-full w-full object-contain p-8 sm:p-12"
        />
      </div>

      {/* THUMBNAILS */}

      {productImages.length > 1 && (
        <div className="mt-4 flex w-full gap-3 overflow-x-auto pb-3">
          {productImages.map((img, index) => {
            const active = selectedImage === img;

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#eee8dc] transition sm:h-24 sm:w-24 ${
                  active
                    ? "border-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <img
                  src={img}
                  alt={`${name} image ${index + 1}`}
                  className="h-full w-full object-contain p-2"
                />

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

      {/* IMAGE COUNT */}

      {productImages.length > 1 && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          {productImages.length} images
        </p>
      )}
    </div>
  );
}