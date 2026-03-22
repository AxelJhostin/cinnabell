"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type TrackingFlavor = {
  flavor_id?: number;
  name?: string;
  extra_price?: number;
};

type TrackingItem = {
  id: number;
  product_id: number;
  quantity: number;
  selected_flavors: TrackingFlavor[] | null;
  unit_price: number;
  subtotal: number;
};

type TrackingGuestData = {
  name?: string;
  email?: string;
  phone?: string;
} | null;

type TrackingOrderDay = {
  id: number;
  date: string;
};

type TrackingStatusLog = {
  id: number;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_at: string | null;
};

type TrackingOrderResponse = {
  id: number;
  tracking_token: string;
  status: string;
  total: number;
  created_at: string | null;
  guest_data: TrackingGuestData;
  order_day: TrackingOrderDay;
  items: TrackingItem[];
  status_log: TrackingStatusLog[];
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusLabelMap: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparacion",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const statusClassMap: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-sky-100 text-sky-800",
  EN_PREPARACION: "bg-violet-100 text-violet-800",
  LISTO: "bg-emerald-100 text-emerald-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return dateFormatter.format(parsed);
}

function formatDateTime(dateValue: string | null): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return dateTimeFormatter.format(parsed);
}

function getStatusLabel(status: string): string {
  return statusLabelMap[status] ?? status;
}

export default function PedidoTokenPage() {
  const params = useParams<{ token: string }>();
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const [order, setOrder] = useState<TrackingOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadTracking() {
      if (!token) {
        setIsLoading(false);
        setError("No se encontro el token del pedido.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const data = await api.get<TrackingOrderResponse>(
          `/orders/track/${encodeURIComponent(token)}`
        );
        if (!isMounted) return;
        setOrder(data);
      } catch (requestError) {
        if (!isMounted) return;
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el seguimiento del pedido.";
        if (message.toLowerCase().includes("no encontrado")) {
          setIsNotFound(true);
        } else {
          setError(message);
        }
        setOrder(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadTracking();

    return () => {
      isMounted = false;
    };
  }, [retryKey, token]);

  const orderedLog = useMemo(() => {
    if (!order) return [];
    return [...order.status_log].sort((a, b) => {
      const aTime = a.changed_at ? new Date(a.changed_at).getTime() : 0;
      const bTime = b.changed_at ? new Date(b.changed_at).getTime() : 0;
      if (aTime === bTime) return a.id - b.id;
      return aTime - bTime;
    });
  }, [order]);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-5xl space-y-5">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Seguimiento de pedido
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-brand-dark sm:text-4xl">
            Seguimiento de tu pedido
          </h1>
          <p className="mt-2 text-sm text-brand-dark/80">
            Consulta el estado actual y el resumen de tu pedido con tu token de seguimiento.
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-4">
            <div className="h-36 animate-pulse rounded-2xl bg-white/80 ring-1 ring-brand-accent/50" />
            <div className="h-48 animate-pulse rounded-2xl bg-white/80 ring-1 ring-brand-accent/50" />
            <div className="h-44 animate-pulse rounded-2xl bg-white/80 ring-1 ring-brand-accent/50" />
          </div>
        )}

        {!isLoading && isNotFound && (
          <article className="rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              Pedido no encontrado
            </h2>
            <p className="mt-2 text-sm text-brand-dark/80">
              Verifica el token e intenta nuevamente.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                Reintentar
              </Button>
              <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
                <Link href="/menu">Ir al menu</Link>
              </Button>
            </div>
          </article>
        )}

        {!isLoading && !isNotFound && error && (
          <article className="rounded-2xl bg-white p-6 text-center ring-1 ring-brand-accent/60">
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              No pudimos cargar tu pedido
            </h2>
            <p className="mt-2 text-sm text-brand-dark/80">{error}</p>
            <Button
              type="button"
              className="mt-4 bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Reintentar
            </Button>
          </article>
        )}

        {!isLoading && !isNotFound && !error && order && (
          <div className="space-y-4">
            <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
                    Token
                  </p>
                  <p className="mt-1 break-all rounded-md bg-brand-soft/70 px-2 py-1 font-mono text-xs text-brand-dark">
                    {order.tracking_token}
                  </p>
                </div>
                <Badge
                  className={`w-fit font-medium ${statusClassMap[order.status] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                  <p className="text-brand-dark/70">Pedido #</p>
                  <p className="font-semibold text-brand-dark">{order.id}</p>
                </div>
                <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                  <p className="text-brand-dark/70">Creado</p>
                  <p className="font-semibold text-brand-dark">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                  <p className="text-brand-dark/70">Dia de pedido</p>
                  <p className="font-semibold text-brand-dark">
                    {formatDate(order.order_day?.date ?? null)}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                  <p className="text-brand-dark/70">Total</p>
                  <p className="font-semibold text-brand-primary">
                    {currencyFormatter.format(order.total)}
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60 sm:p-6">
                <h2 className="font-display text-2xl font-semibold text-brand-dark">Items</h2>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-brand-soft/50 p-3 ring-1 ring-brand-accent/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-brand-dark">Producto #{item.product_id}</p>
                          <p className="text-xs text-brand-dark/70">
                            {item.quantity} x {currencyFormatter.format(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-brand-primary">
                          {currencyFormatter.format(item.subtotal)}
                        </p>
                      </div>

                      {item.selected_flavors && item.selected_flavors.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-brand-dark/75">
                          {item.selected_flavors.map((flavor, index) => (
                            <li key={`${item.id}-${flavor.flavor_id ?? "na"}-${index}`}>
                              Sabor: {flavor.name ?? "Sin nombre"}
                              {typeof flavor.extra_price === "number" && flavor.extra_price > 0
                                ? ` (+ ${currencyFormatter.format(flavor.extra_price)})`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <aside className="space-y-4">
                <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60">
                  <h3 className="font-display text-xl font-semibold text-brand-dark">
                    Contacto
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-brand-dark/85">
                    <p>
                      <span className="font-medium text-brand-dark">Nombre:</span>{" "}
                      {order.guest_data?.name ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Correo:</span>{" "}
                      {order.guest_data?.email ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Telefono:</span>{" "}
                      {order.guest_data?.phone ?? "-"}
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60">
                  <h3 className="font-display text-xl font-semibold text-brand-dark">
                    Historial de estado
                  </h3>
                  {orderedLog.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-dark/75">
                      Sin movimientos adicionales por ahora.
                    </p>
                  ) : (
                    <ol className="mt-3 space-y-3">
                      {orderedLog.map((log) => (
                        <li key={log.id} className="rounded-lg bg-brand-soft/50 p-3 text-xs">
                          <p className="font-medium text-brand-dark">
                            {getStatusLabel(log.new_status)}
                          </p>
                          <p className="mt-1 text-brand-dark/70">
                            {formatDateTime(log.changed_at)}
                          </p>
                          {log.note && (
                            <p className="mt-1 text-brand-dark/75">{log.note}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
