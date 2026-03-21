"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type ProductCategory = "individual" | "especial" | "box";

type MenuProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: ProductCategory;
};

const categoryLabel: Record<ProductCategory, string> = {
  individual: "Individual",
  especial: "Especial",
  box: "Box",
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function MenuPage() {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasProducts = useMemo(() => products.length > 0, [products]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<MenuProduct[]>("/products");
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
  }, []);

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
              onClick={() => window.location.reload()}
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
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-accent/60"
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={640}
                    height={400}
                    unoptimized
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-brand-accent/30 text-sm font-medium text-brand-dark/70">
                    Imagen próximamente
                  </div>
                )}

                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
                        {categoryLabel[product.category]}
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-brand-dark">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-brand-primary">
                      {currencyFormatter.format(product.price)}
                    </p>
                  </div>

                  <p className="line-clamp-3 text-sm text-brand-dark/80">
                    {product.description ?? "Descripción disponible pronto."}
                  </p>

                  <Button
                    variant="outline"
                    className="w-full border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                    disabled
                  >
                    Ver detalle próximamente
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
