import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase GET ERROR:", error);

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
    products: data,
  });
}

export async function POST(request: Request) {
  try {
    // FormData receive karo
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const price = Number(formData.get("price"));

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

    // Image
    const image = formData.get("image");

    // Basic validation
    if (!name || !category || !price || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a product image.",
        },
        { status: 400 }
      );
    }

    // 5 MB limit
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "Image must be smaller than 5MB.",
        },
        { status: 400 }
      );
    }

    // Allowed image types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG and WEBP images are allowed.",
        },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    // File extension
    const extension =
      image.type === "image/png"
        ? "png"
        : image.type === "image/webp"
        ? "webp"
        : "jpg";

    // Unique file name
    const fileName = `${slug}-${Date.now()}.${extension}`;

    // Convert browser File to Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Supabase Storage
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

      return NextResponse.json(
        {
          success: false,
          error: `Image upload failed: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    // Public image URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(fileName);

    // Save product + image URL in database
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        slug,
        category,
        price,
        old_price: oldPrice,
        badge,
        image: publicUrl,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);

      // Agar database insert fail ho jaye,
      // uploaded image ko bhi remove karne ki koshish karo.
      await supabaseAdmin.storage
        .from("products")
        .remove([fileName]);

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
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request.",
      },
      { status: 400 }
    );
  }
}