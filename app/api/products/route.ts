import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter(
      (file): file is File =>
        file instanceof File && file.size > 0
    );
}

async function uploadImages(
  files: File[],
  slug: string
) {
  const uploadedUrls: string[] = [];
  const uploadedFileNames: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `"${file.name}" is larger than 5MB.`
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `"${file.name}" is not JPG, PNG or WEBP.`
      );
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const fileName =
      `${slug}-${Date.now()}-${i}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(
        `Image upload failed: ${error.message}`
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(fileName);

    uploadedUrls.push(publicUrl);
    uploadedFileNames.push(fileName);
  }

  return {
    uploadedUrls,
    uploadedFileNames,
  };
}

async function deleteStorageFiles(
  urls: string[]
) {
  const fileNames = urls
    .map(getFileNameFromUrl)
    .filter(
      (file): file is string => Boolean(file)
    );

  if (!fileNames.length) return;

  const { error } = await supabaseAdmin.storage
    .from("products")
    .remove(fileNames);

  if (error) {
    console.warn(
      "STORAGE DELETE WARNING:",
      error.message
    );
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "SUPABASE GET ERROR:",
        error
      );

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
   POST - ADD PRODUCT
========================================================= */

export async function POST(
  request: Request
) {
  let uploadedFileNames: string[] = [];

  try {
    const formData =
      await request.formData();

    const name =
      String(formData.get("name") || "")
        .trim();

    const category =
      String(formData.get("category") || "")
        .trim();

    const priceValue =
      String(formData.get("price") || "")
        .trim();

    const price = Number(priceValue);

    const oldPriceValue =
      String(
        formData.get("oldPrice") || ""
      ).trim();

    const oldPrice =
      oldPriceValue
        ? Number(oldPriceValue)
        : null;

    const badge =
      String(formData.get("badge") || "")
        .trim() || null;

    const description =
      String(
        formData.get("description") || ""
      ).trim();

    const images =
      getImageFiles(formData);

    /* VALIDATION */

    if (
      !name ||
      !category ||
      !priceValue ||
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid price.",
        },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) ||
        oldPrice <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid old price.",
        },
        { status: 400 }
      );
    }

    if (!images.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select at least one image.",
        },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can upload maximum 5 images.",
        },
        { status: 400 }
      );
    }

    /* SLUG */

    let slug = createSlug(name);

    const {
      data: existingProduct,
    } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    /* UPLOAD */

    const uploaded =
      await uploadImages(
        images,
        slug
      );

    uploadedFileNames =
      uploaded.uploadedFileNames;

    const imageUrls =
      uploaded.uploadedUrls;

    const mainImage =
      imageUrls[0];

    /* INSERT */

    const { data, error } =
      await supabaseAdmin
        .from("products")
        .insert({
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
        .select()
        .single();

    if (error) {
      await deleteStorageFiles(
        imageUrls
      );

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
      message:
        "Product added successfully.",
    });
  } catch (error) {
    console.error(
      "POST API ERROR:",
      error
    );

    if (uploadedFileNames.length) {
      await supabaseAdmin.storage
        .from("products")
        .remove(
          uploadedFileNames
        );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH - UPDATE PRODUCT
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const id =
      String(formData.get("id") || "")
        .trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: existingProduct,
      error: existingError,
    } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (
      existingError ||
      !existingProduct
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const name =
      String(formData.get("name") || "")
        .trim();

    const category =
      String(formData.get("category") || "")
        .trim();

    const priceValue =
      String(formData.get("price") || "")
        .trim();

    const price = Number(priceValue);

    const oldPriceValue =
      String(
        formData.get("oldPrice") || ""
      ).trim();

    const oldPrice =
      oldPriceValue
        ? Number(oldPriceValue)
        : null;

    const badge =
      String(formData.get("badge") || "")
        .trim() || null;

    const description =
      String(
        formData.get("description") || ""
      ).trim();

    const newImages =
      getImageFiles(formData);

    /* VALIDATION */

    if (
      !name ||
      !category ||
      !priceValue ||
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid price.",
        },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) ||
        oldPrice <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid old price.",
        },
        { status: 400 }
      );
    }

    if (
      newImages.length >
      MAX_IMAGES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can upload maximum 5 images.",
        },
        { status: 400 }
      );
    }

    /* SLUG */

    let slug = createSlug(name);

    const {
      data: slugProduct,
    } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (slugProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    /* EXISTING IMAGES */

    let imageUrls: string[] =
      Array.isArray(
        existingProduct.images
      )
        ? existingProduct.images
        : existingProduct.image
        ? [existingProduct.image]
        : [];

    /* NEW IMAGES */

    if (newImages.length > 0) {
      const uploaded =
        await uploadImages(
          newImages,
          slug
        );

      imageUrls =
        uploaded.uploadedUrls;

      await deleteStorageFiles(
        Array.isArray(
          existingProduct.images
        )
          ? existingProduct.images
          : existingProduct.image
          ? [existingProduct.image]
          : []
      );
    }

    const mainImage =
      imageUrls[0] ||
      existingProduct.image ||
      null;

    /* UPDATE */

    const { data, error } =
      await supabaseAdmin
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
      message:
        "Product updated successfully.",
    });
  } catch (error) {
    console.error(
      "PATCH API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE - DELETE PRODUCT
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const body =
      await request.json();

    const id =
      String(body.id || "")
        .trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: product,
      error: fetchError,
    } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (
      fetchError ||
      !product
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    const { error: deleteError } =
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    const imageUrls: string[] =
      Array.isArray(
        product.images
      )
        ? product.images
        : product.image
        ? [product.image]
        : [];

    await deleteStorageFiles(
      imageUrls
    );

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}