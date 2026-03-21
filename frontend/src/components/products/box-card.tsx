import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/components/products/product-card";

type BoxCardProps = CatalogProduct;

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function BoxCard({ name, description, price, image_url }: BoxCardProps) {
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
          Imagen próximamente
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
          {description ?? "Descripción disponible pronto."}
        </p>

        <Button
          variant="outline"
          className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary/10"
          disabled
        >
          Ver detalle próximamente
        </Button>
      </div>
    </article>
  );
}
