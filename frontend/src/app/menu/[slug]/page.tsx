"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { CatalogProduct } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { resolveCatalogImageUrl } from "@/lib/product-images";
import { useCartStore } from "@/stores/cartStore";

type ProductFlavor = {
  id: number;
  flavor_name: string;
  extra_price: number;
};

type ProductDetail = CatalogProduct & {
  flavors: ProductFlavor[];
};

const categoryLabel = {
  individual: "Individual",
  especial: "Especial",
  box: "Box",
} as const;

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<number[]>([]);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!slug) {
        setIsLoading(false);
        setError("No se encontró el identificador del producto.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const data = await api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
        if (!isMounted) return;
        setProduct(data);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar el producto en este momento.";

        const loweredMessage = message.toLowerCase();
        if (loweredMessage.includes("no encontrado")) {
          setIsNotFound(true);
        } else {
          setError(message);
        }
        setProduct(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, reloadKey]);

  useEffect(() => {
    setSelectedFlavorIds([]);
  }, [product?.id]);

  useEffect(() => {
    if (!addedFeedback) return;
    const timeoutId = window.setTimeout(() => setAddedFeedback(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [addedFeedback]);

  const selectedFlavors = useMemo(() => {
    if (!product || selectedFlavorIds.length === 0) {
      return [];
    }

    return product.flavors
      .filter((flavor) => selectedFlavorIds.includes(flavor.id))
      .map((flavor) => ({
        flavorId: flavor.id,
        name: flavor.flavor_name,
        extraPrice: flavor.extra_price,
      }));
  }, [product, selectedFlavorIds]);

  const resolvedImageUrl = useMemo(() => {
    if (!product) return null;
    return resolveCatalogImageUrl(product.slug, product.image_url);
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!product) {
      return 0;
    }

    const extras = selectedFlavors.reduce(
      (sum, flavor) => sum + (flavor.extraPrice ?? 0),
      0
    );
    return Number((product.price + extras).toFixed(2));
  }, [product, selectedFlavors]);

  function toggleFlavor(flavorId: number) {
    setSelectedFlavorIds((current) =>
      current.includes(flavorId)
        ? current.filter((id) => id !== flavorId)
        : [...current, flavorId]
    );
  }

  function handleAddToCart() {
    if (!product) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: unitPrice,
      quantity: 1,
      category: product.category,
      imageUrl: resolvedImageUrl,
      selectedFlavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
    });

    setAddedFeedback(true);
  }

  return (
    <div className="bg-brand-soft">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/menu"
          className="inline-flex text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
        >
          Volver al menú
        </Link>

        {isLoading && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-3xl bg-white/70 ring-1 ring-brand-accent/60" />
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded bg-white/70" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-white/70" />
              <div className="h-5 w-24 animate-pulse rounded bg-white/70" />
              <div className="h-20 w-full animate-pulse rounded bg-white/70" />
            </div>
          </div>
        )}

        {!isLoading && isNotFound && (
          <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h1 className="font-display text-3xl font-semibold text-brand-dark">
              Producto no encontrado
            </h1>
            <p className="mt-2 text-sm text-brand-dark/80">
              El producto que buscas no está disponible o ya no existe.
            </p>
            <Button asChild className="mt-4 bg-brand-primary text-white hover:bg-brand-primary/90">
              <Link href="/menu">Ver productos disponibles</Link>
            </Button>
          </div>
        )}

        {!isLoading && !isNotFound && error && (
          <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h1 className="font-display text-3xl font-semibold text-brand-dark">
              No pudimos cargar este producto
            </h1>
            <p className="mt-2 text-sm text-brand-dark/80">{error}</p>
            <Button
              className="mt-4 bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !isNotFound && !error && product && (
          <article className="mt-6 grid gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-accent/60 sm:p-7 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-brand-accent/20">
              {resolvedImageUrl ? (
                <Image
                  src={resolvedImageUrl}
                  alt={product.name}
                  width={900}
                  height={700}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm font-medium text-brand-dark/70">
                  Imagen próximamente
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <p className="inline-flex w-fit rounded-full bg-brand-accent/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-dark">
                {categoryLabel[product.category]}
              </p>

              <h1 className="font-display text-4xl font-semibold text-brand-dark">
                {product.name}
              </h1>

              <p className="text-lg font-semibold text-brand-primary">
                {currencyFormatter.format(unitPrice)}
              </p>

              <p className="text-sm text-brand-dark/80">
                {product.description ?? "Descripción disponible pronto."}
              </p>

              {product.flavors.length > 0 && (
                <div className="rounded-2xl bg-brand-soft/70 p-4 ring-1 ring-brand-accent/60">
                  <h2 className="font-display text-xl font-semibold text-brand-dark">
                    Sabores disponibles
                  </h2>
                  <p className="mt-1 text-xs text-brand-dark/70">
                    Puedes seleccionar uno o más sabores.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {product.flavors.map((flavor) => {
                      const checked = selectedFlavorIds.includes(flavor.id);

                      return (
                        <li
                          key={flavor.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm"
                        >
                          <label className="flex cursor-pointer items-center gap-2 text-brand-dark/90">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFlavor(flavor.id)}
                              className="h-4 w-4 rounded border-brand-accent text-brand-primary focus:ring-brand-primary"
                            />
                            <span>{flavor.flavor_name}</span>
                          </label>
                          <span className="font-medium text-brand-primary">
                            {flavor.extra_price > 0
                              ? `+ ${currencyFormatter.format(flavor.extra_price)}`
                              : "Incluido"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <Button
                type="button"
                className="mt-2 w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                onClick={handleAddToCart}
              >
                {addedFeedback ? "Agregado al carrito" : "Agregar al carrito"}
              </Button>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
