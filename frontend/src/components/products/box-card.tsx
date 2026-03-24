"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { CatalogProduct } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

type BoxCardProps = CatalogProduct;

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function BoxCard({
  id,
  slug,
  name,
  description,
  price,
  image_url,
  category,
}: BoxCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (!addedFeedback) return;
    const timeoutId = window.setTimeout(() => setAddedFeedback(false), 1300);
    return () => window.clearTimeout(timeoutId);
  }, [addedFeedback]);

  function handleAddToCart() {
    addItem({
      productId: id,
      slug,
      name,
      price,
      quantity: 1,
      category,
      imageUrl: image_url,
      selectedFlavors: undefined,
    });
    setAddedFeedback(true);
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-2 ring-brand-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
      {image_url ? (
        <Image
          src={image_url}
          alt={name}
          width={640}
          height={400}
          unoptimized
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-brand-primary/12 to-brand-secondary/35 px-4 text-center text-sm font-medium text-brand-dark/75">
          Imagen del box próximamente
        </div>
      )}

      <div className="space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="inline-flex w-fit rounded-full bg-brand-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Box Cinnabell
          </p>
          <h3 className="font-display text-2xl font-semibold leading-tight text-brand-dark">
            {name}
          </h3>
        </div>

        <p className="line-clamp-3 text-sm text-brand-dark/80">
          {description ?? "Descripcion disponible pronto."}
        </p>

        <p className="text-2xl font-bold tracking-tight text-brand-primary">
          {currencyFormatter.format(price)}
        </p>

        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <Button
            type="button"
            className="w-full bg-brand-primary text-white hover:bg-brand-primaryHover"
            onClick={handleAddToCart}
          >
            {addedFeedback ? "Agregado" : "Agregar"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-brand-primary/45 text-brand-primary hover:bg-brand-primary/10"
          >
            <Link href={`/menu/${encodeURIComponent(slug)}`}>Ver detalle</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
