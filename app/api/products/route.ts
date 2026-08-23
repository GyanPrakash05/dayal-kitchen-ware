import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   CHECK ADMIN AUTHENTICATION
========================================================= */

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: "Authentication required.",
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      authenticated: false,
      error: "Authentication required.",
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.error("AUTH ERROR:", error);

    return {
      authenticated: false,
      error: "Invalid or expired session.",
    };
  }

  return {
    authenticated: true,
    user,
  };
}

/* =========================================================
   GET PRODUCTS
   Public — no login required
========================================================= */

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

/* =========================================================
   POST PRODUCT
   Protected — login required
========================================================= */

export async function POST(request: Request) {
  try {
    /* -------------------------------------------------------
       AUTH CHECK
    ------------------------------------------------------- */

    const auth = await verifyAdmin(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: 401 }
      );
    }

    /* -------------------------------------------------------
       FORM DATA
    ------------------------------------------------------- */

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();

    const category = String(
      formData.get("category") || ""
    ).trim();

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

    const image = formData.get("image");

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       IMAGE SIZE
    ------------------------------------------------------- */

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "Image must be smaller than 5MB.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       IMAGE TYPE
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       SLUG
    ------------------------------------------------------- */

    const slug = createSlug(name);

    /* -------------------------------------------------------
       FILE EXTENSION
    ------------------------------------------------------- */

    const extension =
      image.type === "image/png"
        ? "png"
        : image.type === "image/webp"
        ? "webp"
        : "jpg";

    /* -------------------------------------------------------
       UNIQUE FILE NAME
    ------------------------------------------------------- */

    const fileName = `${slug}-${Date.now()}.${extension}`;

    /* -------------------------------------------------------
       CONVERT FILE TO BUFFER
    ------------------------------------------------------- */

    const arrayBuffer = await image.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    /* -------------------------------------------------------
       UPLOAD IMAGE TO SUPABASE STORAGE
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       PUBLIC IMAGE URL
    ------------------------------------------------------- */

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(fileName);

    /* -------------------------------------------------------
       INSERT PRODUCT
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       IF DATABASE INSERT FAILS
       DELETE UPLOADED IMAGE
    ------------------------------------------------------- */

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);

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

    /* -------------------------------------------------------
       SUCCESS
    ------------------------------------------------------- */

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