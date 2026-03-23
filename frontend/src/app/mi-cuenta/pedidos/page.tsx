"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type CustomerOrderStatus =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

type CustomerOrderListItem = {
  id: number;
  tracking_token: string;
  status: CustomerOrderStatus;
  total: number;
  created_at: string | null;
  order_day: {
    id: number;
    date: string;
  };
  items_count: number;
  item_names: string[];
};

const statusClassMap: Record<CustomerOrderStatus, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-sky-100 text-sky-800",
  EN_PREPARACION: "bg-violet-100 text-violet-800",
  LISTO: "bg-emerald-100 text-emerald-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabelMap: Record<CustomerOrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparacion",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return dateTimeFormatter.format(parsedDate);
}

function formatOrderDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return dateFormatter.format(parsedDate);
}

export default function MiCuentaPedidosPage() {
  const router = useRouter();
  const authCheckedRef = useRef(false);

  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    let isMounted = true;

    async function loadMyOrders() {
      setIsLoading(true);
      setError(null);

      const currentUser = await fetchMe();
      if (!currentUser) {
        if (isMounted) {
          router.replace("/login?next=/mi-cuenta/pedidos");
        }
        return;
      }

      try {
        const data = await api.get<CustomerOrderListItem[]>("/orders/my");
        if (!isMounted) return;
        setOrders(data);
      } catch (requestError) {
        if (!isMounted) return;
        setOrders([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar tu historial de pedidos."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    if (!authCheckedRef.current || retryKey > 0) {
      authCheckedRef.current = true;
      void loadMyOrders();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchMe, retryKey, router]);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);
  const latestOrder = hasOrders ? orders[0] : null;

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-5xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Mi cuenta
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Mis pedidos
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Revisa el estado actual y el historial de tus pedidos.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-brand-accent text-brand-dark">
            <Link href="/mi-cuenta">Volver a mi cuenta</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Actualizar
          </Button>
        </div>

        {latestOrder && (
          <Card className="bg-white ring-brand-accent/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-2xl text-brand-dark">
                Ultimo pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-brand-dark/70">Pedido #{latestOrder.id}</p>
                <p className="font-mono text-xs text-brand-dark">{latestOrder.tracking_token}</p>
              </div>
              <Badge className={cn("font-medium", statusClassMap[latestOrder.status])}>
                {statusLabelMap[latestOrder.status]}
              </Badge>
              <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
                <Link href={`/pedido/${encodeURIComponent(latestOrder.tracking_token)}`}>
                  Ver seguimiento
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl bg-white/80 ring-1 ring-brand-accent/50"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && !hasOrders && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-6">
              <p className="text-sm text-brand-dark/80">Todavia no tienes pedidos registrados.</p>
              <Button asChild className="mt-3 bg-brand-primary text-white hover:bg-brand-primary/90">
                <Link href="/menu">Ir al menu</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && hasOrders && (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white ring-brand-accent/60">
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-brand-dark">Pedido #{order.id}</p>
                      <p className="font-mono text-xs text-brand-dark/75">{order.tracking_token}</p>
                      <p className="text-sm text-brand-dark/80">
                        Creado: {formatDateTime(order.created_at)}
                      </p>
                      <p className="text-sm text-brand-dark/80">
                        Dia de pedido: {formatOrderDay(order.order_day.date)}
                      </p>
                      <p className="text-sm text-brand-dark/80">Items: {order.items_count}</p>
                      {order.item_names.length > 0 && (
                        <p className="text-sm text-brand-dark/80">
                          Productos: {order.item_names.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={cn("mb-2 font-medium", statusClassMap[order.status])}>
                        {statusLabelMap[order.status]}
                      </Badge>
                      <p className="text-sm font-semibold text-brand-primary">
                        {currencyFormatter.format(order.total)}
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        className="mt-2 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                      >
                        <Link href={`/pedido/${encodeURIComponent(order.tracking_token)}`}>
                          Ver seguimiento
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
