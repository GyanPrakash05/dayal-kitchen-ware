
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const STORAGE_BUCKET = "products";
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProductDetails = {
  brand: string | null;
  size: string | null;
  material: string | null;
  capacity: string | null;
  colour: string | null;
  warranty: string | null;
  model_number: string | null;
};

type ProductRecord = Record<string, unknown>;

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string): string | null {
  return textValue(formData, key) || null;
}

function readDetails(formData: FormData): ProductDetails {
  return {
    brand: nullableText(formData, "brand"),
    size: nullableText(formData, "size"),
    material: nullableText(formData, "material"),
    capacity: nullableText(formData, "capacity"),
    colour: nullableText(formData, "colour"),
    warranty: nullableText(formData, "warranty"),
    model_number:
      nullableText(formData, "model_number") ||
      nullableText(formData, "modelNumber") ||
      nullableText(formData, "sku"),
  };
}

/* Preserve existing details when an edit request omits those fields. */
function readUpdatedDetails(
  formData: FormData,
  existing: ProductRecord
): ProductDetails {
  const submitted = readDetails(formData);

  const modelNumberProvided =
    formData.has("model_number") ||
    formData.has("modelNumber") ||
    formData.has("sku");

  return {
    brand: formData.has("brand")
      ? submitted.brand
      : (existing.brand as string | null) ?? null,
    size: formData.has("size")
      ? submitted.size
      : (existing.size as string | null) ?? null,
    material: formData.has("material")
      ? submitted.material
      : (existing.material as string | null) ?? null,
    capacity: formData.has("capacity")
      ? submitted.capacity
      : (existing.capacity as string | null) ?? null,
    colour: formData.has("colour")
      ? submitted.colour
      : (existing.colour as string | null) ?? null,
    warranty: formData.has("warranty")
      ? submitted.warranty
      : (existing.warranty as string | null) ?? null,
    model_number: modelNumberProvided
      ? submitted.model_number
      : (existing.model_number as string | null) ?? null,
  };
}

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

async function authenticateAdmin(request: Request) {
  if (!ADMIN_EMAIL) {
    return {
      user: null,
      error: "ADMIN_EMAIL is not configured.",
    };
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return {
      user: null,
      error: "Authentication token is missing.",
    };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("ADMIN TOKEN VERIFICATION ERROR:", {
        message: error?.message,
        status: error?.status,
      });

      return {
        user: null,
        error: "Invalid or expired session. Please login again.",
      };
    }

    const email = user.email?.trim().toLowerCase();

    if (!email || email !== ADMIN_EMAIL) {
      console.error("ADMIN EMAIL MISMATCH:", {
        loggedInEmail: email,
        configuredAdminEmail: ADMIN_EMAIL,
      });

      return {
        user: null,
        error: "You are not authorized as admin.",
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error("ADMIN AUTH EXCEPTION:", error);

    return {
      user: null,
      error: "Authentication failed.",
    };
  }
}

/* =========================================================
   SLUG HELPERS
========================================================= */

function createSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `product-${Date.now()}`
  );
}

async function createUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = createSlug(name);

  let query = supabaseAdmin
    .from("products")
    .select("id")
    .eq("slug", baseSlug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Could not verify product slug: ${error.message}`);
  }

  return data ? `${baseSlug}-${Date.now()}` : baseSlug;
}

/* =========================================================
   IMAGE HELPERS
========================================================= */

function getExtension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function getImageFiles(formData: FormData): File[] {
  return formData.getAll("images").filter(
    (item): item is File =>
      typeof item !== "string" &&
      item instanceof File &&
      item.size > 0
  );
}

function validateImages(images: File[]): string | null {
  if (images.length > MAX_IMAGES) {
    return `You can upload a maximum of ${MAX_IMAGES} images.`;
  }

  for (const image of images) {
    if (image.size > MAX_IMAGE_SIZE) {
      return `Image "${image.name}" must be smaller than 5MB.`;
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return `Image "${image.name}" must be JPG, PNG or WEBP.`;
    }
  }

  return null;
}

function getFileNameFromUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;

  try {
    const pathname = decodeURIComponent(new URL(imageUrl).pathname);
    const marker = `/${STORAGE_BUCKET}/`;
    const index = pathname.indexOf(marker);

    if (index === -1) return null;

    return pathname.slice(index + marker.length) || null;
  } catch {
    return null;
  }
}

function getProductImages(product: ProductRecord): string[] {
  const gallery = Array.isArray(product.images)
    ? product.images.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  if (gallery.length > 0) return gallery;

  return typeof product.image === "string" && product.image
    ? [product.image]
    : [];
}

async function removeStorageFiles(files: string[]): Promise<void> {
  const uniqueFiles = [...new Set(files.filter(Boolean))];

  if (uniqueFiles.length === 0) return;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(uniqueFiles);

  if (error) {
    console.error("STORAGE CLEANUP ERROR:", error.message);
  }
}

async function uploadImages(
  images: File[],
  slug: string
): Promise<{ urls: string[]; files: string[] }> {
  const urls: string[] = [];
  const files: string[] = [];

  try {
    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      const extension = getExtension(image.type);
      const suffix = Math.random().toString(36).slice(2, 8);
      const fileName =
        `${slug}-${index + 1}-${Date.now()}-${suffix}.${extension}`;

      const buffer = Buffer.from(await image.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      files.push(fileName);

      const { data } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    return { urls, files };
  } catch (error) {
    await removeStorageFiles(files);
    throw error;
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/* =========================================================
   GET PRODUCTS — PUBLIC
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
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error("GET PRODUCTS API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST PRODUCT — ADMIN ONLY
========================================================= */

export async function POST(request: Request) {
  let uploadedFiles: string[] = [];

  try {
    const auth = await authenticateAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const name = textValue(formData, "name");
    const category = textValue(formData, "category");
    const priceValue = textValue(formData, "price");
    const price = Number(priceValue);

    const oldPriceValue = textValue(formData, "oldPrice");
    const oldPrice = oldPriceValue ? Number(oldPriceValue) : null;

    const badge = nullableText(formData, "badge");
    const description = textValue(formData, "description");
    const details = readDetails(formData);
    const images = getImageFiles(formData);

    if (!name || !category || !priceValue || !description) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid price." },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid old price." },
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

    const imageError = validateImages(images);

    if (imageError) {
      return NextResponse.json(
        { success: false, error: imageError },
        { status: 400 }
      );
    }

    const slug = await createUniqueSlug(name);
    const uploaded = await uploadImages(images, slug);

    uploadedFiles = uploaded.files;

    /* INSERT PRODUCT AND ALL OPTIONAL DETAILS */
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        slug,
        category,
        price,
        old_price: oldPrice,
        badge,
        image: uploaded.urls[0],
        images: uploaded.urls,
        description,
        ...details,
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE PRODUCT INSERT ERROR:", error);
      await removeStorageFiles(uploadedFiles);
      uploadedFiles = [];

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: data,
        message: "Product added successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST PRODUCTS API ERROR:", error);
    await removeStorageFiles(uploadedFiles);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error, "Failed to add product."),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH PRODUCT — ADMIN ONLY
========================================================= */

export async function PATCH(request: Request) {
  let uploadedFiles: string[] = [];

  try {
    const auth = await authenticateAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const id = textValue(formData, "id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }

    const name = textValue(formData, "name");
    const category = textValue(formData, "category");
    const priceValue = textValue(formData, "price");
    const price = Number(priceValue);

    const oldPriceValue = textValue(formData, "oldPrice");
    const oldPrice = oldPriceValue ? Number(oldPriceValue) : null;

    const badge = nullableText(formData, "badge");
    const description = textValue(formData, "description");

    if (!name || !category || !priceValue || !description) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid price." },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid old price." },
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

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    const existing = existingProduct as ProductRecord;
    const details = readUpdatedDetails(formData, existing);
    const slug = await createUniqueSlug(name, id);
    const existingImages = getProductImages(existing);
    const newImages = getImageFiles(formData);

    const imageError = validateImages(newImages);

    if (imageError) {
      return NextResponse.json(
        { success: false, error: imageError },
        { status: 400 }
      );
    }

    let imageUrls = existingImages;

    /* Upload replacement images but keep old images until DB update succeeds. */
    if (newImages.length > 0) {
      const uploaded = await uploadImages(newImages, slug);
      uploadedFiles = uploaded.files;
      imageUrls = uploaded.urls;
    }

    const mainImage =
      imageUrls[0] ||
      (typeof existing.image === "string" ? existing.image : null);

    /* UPDATE PRODUCT AND ALL OPTIONAL DETAILS */
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
        ...details,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("SUPABASE PRODUCT UPDATE ERROR:", error);
      await removeStorageFiles(uploadedFiles);
      uploadedFiles = [];

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* Remove old images only after the database update succeeds. */
    if (newImages.length > 0) {
      const oldFiles = existingImages
        .map(getFileNameFromUrl)
        .filter((file): file is string => Boolean(file));

      await removeStorageFiles(oldFiles);
      uploadedFiles = [];
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("PATCH PRODUCTS API ERROR:", error);
    await removeStorageFiles(uploadedFiles);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error, "Failed to update product."),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PRODUCT — ADMIN ONLY
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
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

    if (fetchError || !product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("SUPABASE PRODUCT DELETE ERROR:", deleteError);

      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    const files = getProductImages(product as ProductRecord)
      .map(getFileNameFromUrl)
      .filter((file): file is string => Boolean(file));

    await removeStorageFiles(files);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PRODUCTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error, "Failed to delete product."),
      },
      { status: 500 }
    );
  }
}
