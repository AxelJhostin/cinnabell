"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cartStore";

type CartDrawerProps = {
  triggerClassName?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const categoryLabel: Record<"individual" | "especial" | "box", string> = {
  individual: "Individual",
  especial: "Especial",
  box: "Box",
};

export function CartDrawer({ triggerClassName }: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const hasItems = hasHydrated && items.length > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={triggerClassName}
          aria-label="Abrir carrito"
        >
          <span className="relative inline-flex">
            <ShoppingBag />
            {hasHydrated && totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </Badge>
            )}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full border-l-brand-accent/70 bg-brand-soft p-0 text-brand-dark sm:max-w-md"
      >
        <SheetHeader className="border-b border-brand-accent/70 bg-white/80">
          <SheetTitle className="font-display text-2xl text-brand-dark">
            Tu carrito
          </SheetTitle>
          <SheetDescription className="text-brand-dark/70">
            Revisa tu pedido antes de continuar.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!hasHydrated ? (
            <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
              <p className="font-display text-xl font-semibold text-brand-dark">
                Cargando carrito
              </p>
              <p className="mt-2 text-sm text-brand-dark/75">
                Recuperando tus productos guardados...
              </p>
            </div>
          ) : !hasItems ? (
            <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
              <p className="font-display text-xl font-semibold text-brand-dark">
                Tu carrito esta vacio
              </p>
              <p className="mt-2 text-sm text-brand-dark/75">
                Agrega tus roles favoritos y aqui veras el resumen.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.lineId}
                  className="rounded-2xl bg-white p-4 ring-1 ring-brand-accent/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-dark">{item.name}</p>
                      <p className="text-xs text-brand-dark/70">
                        {categoryLabel[item.category]}
                        {item.selectedFlavors && item.selectedFlavors.length > 0
                          ? ` - ${item.selectedFlavors.map((flavor) => flavor.name).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-primary">
                      {currencyFormatter.format(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md border border-brand-accent bg-brand-soft/60 p-1">
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-brand-dark"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="min-w-6 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-brand-dark"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-brand-dark/80 hover:text-destructive"
                      onClick={() => removeItem(item.lineId)}
                    >
                      <Trash2 />
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t border-brand-accent/70 bg-white/90">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-dark/80">Total de items</span>
              <span className="font-semibold text-brand-dark">
                {hasHydrated ? totalItems : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-medium text-brand-dark">Total</span>
              <span className="font-semibold text-brand-primary">
                {hasHydrated ? currencyFormatter.format(totalPrice) : "-"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-brand-accent text-brand-dark"
                onClick={clearCart}
                disabled={!hasHydrated || !hasItems}
              >
                Vaciar carrito
              </Button>
              {hasHydrated && hasItems ? (
                <SheetClose asChild>
                  <Button asChild type="button" className="bg-brand-primary text-white hover:bg-brand-primary/90">
                    <Link href="/pedir">Continuar</Link>
                  </Button>
                </SheetClose>
              ) : (
                <Button
                  type="button"
                  className="bg-brand-primary text-white hover:bg-brand-primary/90"
                  disabled
                >
                  Continuar
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
