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
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-brand-primary/30">
      {image_url ? (
        <Image
          src={image_url}
          alt={name}
          width={640}
          height={400}
          unoptimized
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-brand-primary/15 text-sm font-medium text-brand-dark/70">
          Imagen proximamente
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full bg-brand-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
              Box Cinnabell
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-brand-dark">
              {name}
            </h3>
          </div>
          <p className="text-sm font-semibold text-brand-primary">
            {currencyFormatter.format(price)}
          </p>
        </div>

        <p className="line-clamp-3 text-sm text-brand-dark/80">
          {description ?? "Descripcion disponible pronto."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={handleAddToCart}
          >
            {addedFeedback ? "Agregado" : "Agregar"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
          >
            <Link href={`/menu/${encodeURIComponent(slug)}`}>Ver detalle</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
