"use client";

import { useEffect, useMemo, useState } from "react";

import { BoxCard } from "@/components/products/box-card";
import {
  ProductCard,
  type CatalogProduct,
} from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function MenuPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const hasProducts = useMemo(() => products.length > 0, [products]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<CatalogProduct[]>("/products");
        if (!isMounted) return;
        setProducts(data);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar el menú en este momento.";
        setError(message);
        setProducts([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  return (
    <div className="bg-brand-soft">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-brand-accent/60 px-3 py-1 text-xs font-medium text-brand-dark">
            Catálogo Cinnabell
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Menú
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Descubre nuestros roles de canela artesanales y encuentra tu
            combinación favorita para hoy.
          </p>
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl bg-white/70 ring-1 ring-brand-accent/50"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              No pudimos cargar el menú
            </h2>
            <p className="mt-2 text-sm text-brand-dark/80">{error}</p>
            <Button
              className="mt-4 bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !error && !hasProducts && (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              Menú temporalmente vacío
            </h2>
            <p className="mt-2 text-sm text-brand-dark/80">
              Estamos preparando nuevos sabores. Vuelve en unos minutos.
            </p>
          </div>
        )}

        {!isLoading && !error && hasProducts && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) =>
              product.category === "box" ? (
                <BoxCard key={product.id} {...product} />
              ) : (
                <ProductCard key={product.id} {...product} />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
