import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileNameFromUrl(imageUrl: string | null) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const pathname = decodeURIComponent(url.pathname);

    const marker = "/products/";
    const index = pathname.indexOf(marker);

    if (index === -1) return null;

    return pathname.substring(index + marker.length);
  } catch {
    return null;
  }
}

function getExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE GET ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error("GET API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: Request) {
  const uploadedFiles: string[] = [];

  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();

    const priceValue = String(formData.get("price") || "").trim();
    const price = Number(priceValue);

    const oldPriceValue = String(
      formData.get("oldPrice") || ""
    ).trim();

    const oldPrice = oldPriceValue
      ? Number(oldPriceValue)
      : null;

    const badge =
      String(formData.get("badge") || "").trim() || null;

    const description = String(
      formData.get("description") || ""
    ).trim();

    /* ---------------- IMAGES ---------------- */

    const imageEntries = formData.getAll("images");

    const images = imageEntries.filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    /* ---------------- VALIDATION ---------------- */

    if (!name || !category || !priceValue || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid price.",
        },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid old price.",
        },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one product image.",
        },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error: `You can upload maximum ${MAX_IMAGES} images.`,
        },
        { status: 400 }
      );
    }

    /* ---------------- IMAGE VALIDATION ---------------- */

    for (const image of images) {
      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Image "${image.name}" must be smaller than 5MB.`,
          },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Image "${image.name}" must be JPG, PNG or WEBP.`,
          },
          { status: 400 }
        );
      }
    }

    /* ---------------- SLUG ---------------- */

    let slug = createSlug(name);

    const { data: existingProduct } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    /* ---------------- UPLOAD IMAGES ---------------- */

    const imageUrls: string[] = [];

    for (let index = 0; index < images.length; index++) {
      const image = images[index];

      const extension = getExtension(image.type);

      const fileName =
        `${slug}-${index + 1}-${Date.now()}.${extension}`;

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("products")
          .upload(fileName, buffer, {
            contentType: image.type,
            upsert: false,
          });

      if (uploadError) {
        console.error(
          "SUPABASE IMAGE UPLOAD ERROR:",
          uploadError
        );

        /* Cleanup already uploaded files */

        if (uploadedFiles.length > 0) {
          await supabaseAdmin.storage
            .from("products")
            .remove(uploadedFiles);
        }

        return NextResponse.json(
          {
            success: false,
            error: `Image upload failed: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      uploadedFiles.push(fileName);

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from("products")
        .getPublicUrl(fileName);

      imageUrls.push(publicUrl);
    }

    /* ---------------- INSERT ---------------- */

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        slug,
        category,
        price,
        old_price: oldPrice,
        badge,
        image: imageUrls[0],
        images: imageUrls,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);

      await supabaseAdmin.storage
        .from("products")
        .remove(uploadedFiles);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: "Product added successfully.",
    });
  } catch (error) {
    console.error("POST API ERROR:", error);

    if (uploadedFiles.length > 0) {
      await supabaseAdmin.storage
        .from("products")
        .remove(uploadedFiles);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(request: Request) {
  const uploadedFiles: string[] = [];

  try {
    const formData = await request.formData();

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();

    const priceValue = String(formData.get("price") || "").trim();
    const price = Number(priceValue);

    const oldPriceValue = String(
      formData.get("oldPrice") || ""
    ).trim();

    const oldPrice = oldPriceValue
      ? Number(oldPriceValue)
      : null;

    const badge =
      String(formData.get("badge") || "").trim() || null;

    const description = String(
      formData.get("description") || ""
    ).trim();

    /* ---------------- VALIDATION ---------------- */

    if (!name || !category || !priceValue || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid price.",
        },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid old price.",
        },
        { status: 400 }
      );
    }

    /* ---------------- GET PRODUCT ---------------- */

    const { data: existingProduct, error: existingError } =
      await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (existingError || !existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    /* ---------------- SLUG ---------------- */

    let slug = createSlug(name);

    const { data: slugProduct } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (slugProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    /* ---------------- EXISTING IMAGES ---------------- */

    const existingImages: string[] =
      Array.isArray(existingProduct.images)
        ? existingProduct.images
        : existingProduct.image
        ? [existingProduct.image]
        : [];

    let imageUrls = existingImages;

    /* ---------------- NEW IMAGES ---------------- */

    const imageEntries = formData.getAll("images");

    const newImages = imageEntries.filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    if (newImages.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error: `You can upload maximum ${MAX_IMAGES} images.`,
        },
        { status: 400 }
      );
    }

    /* ---------------- UPLOAD NEW IMAGES ---------------- */

    if (newImages.length > 0) {
      for (const image of newImages) {
        if (image.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              error: `Image "${image.name}" must be smaller than 5MB.`,
            },
            { status: 400 }
          );
        }

        if (!ALLOWED_TYPES.includes(image.type)) {
          return NextResponse.json(
            {
              success: false,
              error: `Image "${image.name}" must be JPG, PNG or WEBP.`,
            },
            { status: 400 }
          );
        }
      }

      const newImageUrls: string[] = [];

      for (
        let index = 0;
        index < newImages.length;
        index++
      ) {
        const image = newImages[index];

        const extension = getExtension(image.type);

        const fileName =
          `${slug}-${index + 1}-${Date.now()}.${extension}`;

        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } =
          await supabaseAdmin.storage
            .from("products")
            .upload(fileName, buffer, {
              contentType: image.type,
              upsert: false,
            });

        if (uploadError) {
          console.error(
            "IMAGE UPDATE UPLOAD ERROR:",
            uploadError
          );

          if (uploadedFiles.length > 0) {
            await supabaseAdmin.storage
              .from("products")
              .remove(uploadedFiles);
          }

          return NextResponse.json(
            {
              success: false,
              error: `Image upload failed: ${uploadError.message}`,
            },
            { status: 500 }
          );
        }

        uploadedFiles.push(fileName);

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from("products")
          .getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
      }

      /*
       * Replace complete gallery
       */

      imageUrls = newImageUrls;

      /* ---------------- DELETE OLD IMAGES ---------------- */

      const oldFiles = existingImages
        .map(getFileNameFromUrl)
        .filter(
          (file): file is string =>
            Boolean(file)
        );

      if (oldFiles.length > 0) {
        const { error: removeError } =
          await supabaseAdmin.storage
            .from("products")
            .remove(oldFiles);

        if (removeError) {
          console.warn(
            "OLD IMAGES DELETE WARNING:",
            removeError.message
          );
        }
      }
    }

    /* ---------------- UPDATE DATABASE ---------------- */

    const mainImage =
      imageUrls.length > 0
        ? imageUrls[0]
        : existingProduct.image;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({
        name,
        slug,
        category,
        price,
        old_price: oldPrice,
        badge,
        image: mainImage,
        images: imageUrls,
        description,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("SUPABASE UPDATE ERROR:", error);

      /* Cleanup newly uploaded files */

      if (uploadedFiles.length > 0) {
        await supabaseAdmin.storage
          .from("products")
          .remove(uploadedFiles);
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("PATCH API ERROR:", error);

    if (uploadedFiles.length > 0) {
      await supabaseAdmin.storage
        .from("products")
        .remove(uploadedFiles);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    /* ---------------- GET PRODUCT ---------------- */

    const { data: product, error: fetchError } =
      await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    /* ---------------- DELETE DATABASE ---------------- */

    const { error: deleteError } =
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "SUPABASE DELETE ERROR:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    /* ---------------- DELETE ALL IMAGES ---------------- */

    const productImages: string[] =
      Array.isArray(product.images)
        ? product.images
        : product.image
        ? [product.image]
        : [];

    const fileNames = productImages
      .map(getFileNameFromUrl)
      .filter(
        (file): file is string =>
          Boolean(file)
      );

    if (fileNames.length > 0) {
      const { error: removeError } =
        await supabaseAdmin.storage
          .from("products")
          .remove(fileNames);

      if (removeError) {
        console.warn(
          "IMAGE DELETE WARNING:",
          removeError.message
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}