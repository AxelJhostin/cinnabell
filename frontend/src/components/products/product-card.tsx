import Image from "next/image";

import { Button } from "@/components/ui/button";

export type ProductCategory = "individual" | "especial" | "box";

export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: ProductCategory;
};

type ProductCardProps = CatalogProduct;

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

export function ProductCard({
  name,
  description,
  price,
  image_url,
  category,
}: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-accent/60">
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
        <div className="flex h-44 w-full items-center justify-center bg-brand-accent/30 text-sm font-medium text-brand-dark/70">
          Imagen próximamente
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              {categoryLabel[category]}
            </p>
            <h3 className="font-display text-2xl font-semibold text-brand-dark">
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
          className="w-full border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
          disabled
        >
          Ver detalle próximamente
        </Button>
      </div>
    </article>
  );
}
