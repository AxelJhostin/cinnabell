"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type ProductCategory = "individual" | "especial" | "box";

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: ProductCategory;
  is_active: boolean;
};

type AdminProductDraft = {
  description: string;
  price: string;
  image_url: string;
  is_active: boolean;
};

type RowFeedback = {
  isSaving: boolean;
  error: string | null;
  success: string | null;
};

type AdminProductPatchPayload = {
  description?: string | null;
  price?: number;
  image_url?: string | null;
  is_active?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const categoryLabelMap: Record<ProductCategory, string> = {
  individual: "Individual",
  especial: "Especial",
  box: "Box",
};

function toDraft(product: AdminProduct): AdminProductDraft {
  return {
    description: product.description ?? "",
    price: String(product.price),
    image_url: product.image_url ?? "",
    is_active: product.is_active,
  };
}

function normalizeText(value: string): string {
  return value.trim();
}

function getStatusBadgeClass(isActive: boolean): string {
  return isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AdminProductDraft>>({});
  const [rowFeedback, setRowFeedback] = useState<Record<number, RowFeedback>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<AdminProduct[]>("/admin/products");
        if (!isMounted) return;

        setProducts(data);
        setDrafts(Object.fromEntries(data.map((product) => [product.id, toDraft(product)])));
        setRowFeedback({});
      } catch (requestError) {
        if (!isMounted) return;
        setProducts([]);
        setDrafts({});
        setRowFeedback({});
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el catalogo de productos."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const hasRows = useMemo(() => products.length > 0, [products]);

  function updateDraft(productId: number, patch: Partial<AdminProductDraft>) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? {
          description: "",
          price: "0",
          image_url: "",
          is_active: false,
        }),
        ...patch,
      },
    }));
  }

  function setRowState(productId: number, patch: Partial<RowFeedback>) {
    setRowFeedback((current) => ({
      ...current,
      [productId]: {
        isSaving: current[productId]?.isSaving ?? false,
        error: current[productId]?.error ?? null,
        success: current[productId]?.success ?? null,
        ...patch,
      },
    }));
  }

  async function handleSaveRow(product: AdminProduct) {
    const draft = drafts[product.id];
    if (!draft) return;

    const parsedPrice = Number(draft.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setRowState(product.id, {
        isSaving: false,
        error: "El precio debe ser un numero mayor o igual a 0.",
        success: null,
      });
      return;
    }

    const payload: AdminProductPatchPayload = {};

    const nextDescription = normalizeText(draft.description);
    const currentDescription = normalizeText(product.description ?? "");
    if (nextDescription !== currentDescription) {
      payload.description = nextDescription === "" ? null : nextDescription;
    }

    const roundedPrice = Number(parsedPrice.toFixed(2));
    const currentRoundedPrice = Number(product.price.toFixed(2));
    if (roundedPrice !== currentRoundedPrice) {
      payload.price = roundedPrice;
    }

    const nextImageUrl = normalizeText(draft.image_url);
    const currentImageUrl = normalizeText(product.image_url ?? "");
    if (nextImageUrl !== currentImageUrl) {
      payload.image_url = nextImageUrl === "" ? null : nextImageUrl;
    }

    if (draft.is_active !== product.is_active) {
      payload.is_active = draft.is_active;
    }

    if (Object.keys(payload).length === 0) {
      setRowState(product.id, {
        isSaving: false,
        error: null,
        success: "No hay cambios para guardar.",
      });
      return;
    }

    setRowState(product.id, { isSaving: true, error: null, success: null });

    try {
      const updated = await api.patch<AdminProduct>(`/admin/products/${product.id}`, payload);

      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setDrafts((current) => ({ ...current, [updated.id]: toDraft(updated) }));
      setRowState(product.id, {
        isSaving: false,
        error: null,
        success: "Cambios guardados correctamente.",
      });
    } catch (requestError) {
      setRowState(product.id, {
        isSaving: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron guardar los cambios del producto.",
        success: null,
      });
    }
  }

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Gestion de productos
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Actualiza informacion clave del catalogo, estado activo y datos visuales.
          </p>
        </header>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Actualizar lista
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl bg-white/80 ring-1 ring-brand-accent/50"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-5">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && !hasRows && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-5">
              <p className="text-sm text-brand-dark/80">No hay productos en el catalogo.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && hasRows && (
          <div className="space-y-3">
            {products.map((product) => {
              const draft = drafts[product.id] ?? toDraft(product);
              const feedback = rowFeedback[product.id] ?? {
                isSaving: false,
                error: null,
                success: null,
              };

              return (
                <Card key={product.id} className="bg-white ring-brand-accent/60">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="font-display text-2xl text-brand-dark">
                          {product.name}
                        </CardTitle>
                        <p className="mt-1 font-mono text-xs text-brand-dark/70">{product.slug}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-brand-primary/15 text-brand-primary">
                          {categoryLabelMap[product.category] ?? product.category}
                        </Badge>
                        <Badge className={cn("font-medium", getStatusBadgeClass(product.is_active))}>
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge className="bg-brand-soft text-brand-dark">
                          {currencyFormatter.format(product.price)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-4 rounded-xl border border-brand-accent/60 p-4 lg:grid-cols-2">
                      <div className="space-y-1 lg:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                          Descripcion
                        </p>
                        <textarea
                          value={draft.description}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(product.id, { description: event.target.value })
                          }
                          rows={3}
                          placeholder="Descripcion del producto"
                          className="w-full resize-none rounded-md border border-brand-accent/70 bg-white px-3 py-2 text-sm text-brand-dark outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:bg-brand-soft/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                          Precio
                        </p>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={draft.price}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(product.id, { price: event.target.value })
                          }
                          className="h-9"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-brand-dark">
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(product.id, { is_active: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-brand-accent"
                        />
                        Producto activo
                      </label>

                      <div className="space-y-1 lg:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                          URL de imagen
                        </p>
                        <Input
                          type="text"
                          value={draft.image_url}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(product.id, { image_url: event.target.value })
                          }
                          placeholder="https://..."
                          className="h-9"
                        />
                        {normalizeText(draft.image_url) && (
                          <p className="text-xs text-brand-dark/70">
                            Vista: {normalizeText(draft.image_url)}
                          </p>
                        )}
                      </div>

                      {feedback.error && (
                        <p className="text-xs text-destructive lg:col-span-2">{feedback.error}</p>
                      )}
                      {feedback.success && (
                        <p className="text-xs text-emerald-700 lg:col-span-2">{feedback.success}</p>
                      )}

                      <div className="lg:col-span-2 lg:justify-self-end">
                        <Button
                          type="button"
                          className="w-full bg-brand-primary text-white hover:bg-brand-primary/90 lg:w-auto"
                          disabled={feedback.isSaving}
                          onClick={() => {
                            void handleSaveRow(product);
                          }}
                        >
                          {feedback.isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
