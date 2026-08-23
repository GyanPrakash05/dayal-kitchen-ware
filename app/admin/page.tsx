"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image: string | null;
  images?: string[] | null;
  description: string;
  created_at?: string;
};

const MAX_IMAGES = 5;

export default function AdminPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function fetchProducts() {
    try {
      setLoadingProducts(true);

      const response = await fetch(
        "/api/products",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch products."
        );
      }

      setProducts(
        data.products || []
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      const imageInput =
        document.getElementById(
          "images"
        ) as HTMLInputElement | null;

      const files =
        imageInput?.files;

      if (
        !editingProduct &&
        (!files || files.length === 0)
      ) {
        throw new Error(
          "Please select at least one product image."
        );
      }

      if (
        files &&
        files.length > MAX_IMAGES
      ) {
        throw new Error(
          "You can upload maximum 5 images."
        );
      }

      let response: Response;

      if (editingProduct) {
        formData.append(
          "id",
          editingProduct.id
        );

        response = await fetch(
          "/api/products",
          {
            method: "PATCH",
            body: formData,
          }
        );
      } else {
        response = await fetch(
          "/api/products",
          {
            method: "POST",
            body: formData,
          }
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong."
        );
      }

      setMessage(
        editingProduct
          ? "Product updated successfully! ✅"
          : "Product added successfully! ✅"
      );

      form.reset();

      setEditingProduct(null);

      await fetchProducts();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(
    product: Product
  ) {
    setEditingProduct(product);

    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingProduct(null);

    setMessage("");
    setErrorMessage("");

    const form =
      document.getElementById(
        "product-form"
      ) as HTMLFormElement | null;

    form?.reset();
  }

  async function handleDelete(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?\n\nThis will permanently delete the product and all its images.`
      );

    if (!confirmed) return;

    setDeletingId(product.id);
    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          "/api/products",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: product.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete product."
        );
      }

      setMessage(
        "Product deleted successfully! 🗑️"
      );

      if (
        editingProduct?.id ===
        product.id
      ) {
        setEditingProduct(null);
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getProductImages(
    product: Product
  ) {
    if (
      product.images &&
      product.images.length > 0
    ) {
      return product.images;
    }

    if (product.image) {
      return [product.image];
    }

    return [];
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">

      {/* HEADER */}

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Dayal Kitchen Ware
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-zinc-500">
            Add, edit and manage your store products.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* MESSAGES */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* FORM */}

        <section>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {editingProduct
                ? "Update product details"
                : "Add a new product to your store."}
            </h2>
          </div>

          <form
            id="product-form"
            onSubmit={handleSubmit}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-6 sm:grid-cols-2">

              {/* NAME */}

              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={
                    editingProduct?.name ||
                    ""
                  }
                  placeholder="Premium Non-Stick Kadai"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  required
                  defaultValue={
                    editingProduct?.category ||
                    ""
                  }
                  placeholder="Cookware"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* PRICE */}

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  required
                  type="number"
                  min="1"
                  defaultValue={
                    editingProduct?.price ??
                    ""
                  }
                  placeholder="1499"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* OLD PRICE */}

              <div>
                <label
                  htmlFor="oldPrice"
                  className="mb-2 block text-sm font-semibold"
                >
                  Old Price
                </label>

                <input
                  id="oldPrice"
                  name="oldPrice"
                  type="number"
                  min="1"
                  defaultValue={
                    editingProduct?.old_price ??
                    ""
                  }
                  placeholder="1999"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* BADGE */}

              <div>
                <label
                  htmlFor="badge"
                  className="mb-2 block text-sm font-semibold"
                >
                  Badge
                </label>

                <select
                  id="badge"
                  name="badge"
                  defaultValue={
                    editingProduct?.badge ||
                    ""
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">
                    No Badge
                  </option>
                  <option value="NEW">
                    NEW
                  </option>
                  <option value="POPULAR">
                    POPULAR
                  </option>
                  <option value="BEST SELLER">
                    BEST SELLER
                  </option>
                  <option value="SALE">
                    SALE
                  </option>
                </select>
              </div>

              {/* CURRENT IMAGES */}

              {editingProduct && (
                <div className="sm:col-span-2">
                  <label className="mb-3 block text-sm font-semibold">
                    Current Product Images
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {getProductImages(
                      editingProduct
                    ).map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={image}
                          className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-[#eee8dc]"
                        >
                          <img
                            src={image}
                            alt={`${editingProduct.name} ${
                              index + 1
                            }`}
                            className="aspect-square h-full w-full object-contain p-3"
                          />

                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-zinc-900 px-2 py-1 text-[9px] font-bold text-white">
                              MAIN
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    Upload new images below to replace
                    the current gallery.
                  </p>
                </div>
              )}

              {/* IMAGES */}

              <div className="sm:col-span-2">
                <label
                  htmlFor="images"
                  className="mb-2 block text-sm font-semibold"
                >
                  {editingProduct
                    ? "Replace Product Images"
                    : "Product Images"}
                </label>

                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  required={!editingProduct}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Select up to 5 images • JPG, PNG or WEBP
                  • Maximum 5MB each
                </p>

                <p className="mt-1 text-xs font-medium text-amber-700">
                  First image will be used as the main product image.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  defaultValue={
                    editingProduct?.description ||
                    ""
                  }
                  placeholder="Describe your product..."
                  className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? editingProduct
                    ? "Updating Product..."
                    : "Adding Product..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={loading}
                  className="rounded-full border border-zinc-300 bg-white px-6 py-4 font-semibold hover:bg-zinc-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* INVENTORY */}

        <section className="mt-16">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Store Inventory
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                All Products
              </h2>

              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">
                {products.length}{" "}
                {products.length === 1
                  ? "Product"
                  : "Products"}
              </span>
            </div>
          </div>

          {loadingProducts ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <div className="text-5xl">
                🍳
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No products yet
              </h3>

              <p className="mt-2 text-zinc-500">
                Add your first product above.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {products.map(
                (product) => {
                  const images =
                    getProductImages(
                      product
                    );

                  return (
                    <div
                      key={product.id}
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">

                        {/* IMAGE */}

                        <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eee8dc] sm:w-32">
                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-contain p-3"
                            />
                          ) : (
                            <span className="text-5xl">
                              🍳
                            </span>
                          )}

                          {images.length >
                            1 && (
                            <span className="absolute bottom-2 right-2 rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white">
                              +{images.length - 1} photos
                            </span>
                          )}
                        </div>

                        {/* DETAILS */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              {
                                product.category
                              }
                            </span>

                            {product.badge && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                                {
                                  product.badge
                                }
                              </span>
                            )}
                          </div>

                          <h3 className="mt-2 text-xl font-bold">
                            {
                              product.name
                            }
                          </h3>

                          <div className="mt-2 flex items-center gap-3">
                            <span className="font-bold">
                              ₹
                              {
                                product.price
                              }
                            </span>

                            {product.old_price !==
                              null &&
                              product.old_price !==
                                undefined && (
                                <span className="text-sm text-zinc-400 line-through">
                                  ₹
                                  {
                                    product.old_price
                                  }
                                </span>
                              )}
                          </div>

                          {product.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                              {
                                product.description
                              }
                            </p>
                          )}

                          <p className="mt-2 text-xs font-medium text-zinc-400">
                            {images.length}{" "}
                            {images.length ===
                            1
                              ? "image"
                              : "images"}
                          </p>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-36">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            className="w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            className="w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {deletingId ===
                            product.id
                              ? "Deleting..."
                              : "🗑️ Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}