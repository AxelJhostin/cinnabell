"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminOrderStatus =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

type AdminOrderGuestData = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
} | null;

type AdminOrderDay = {
  id: number;
  date: string;
};

type AdminOrderItemFlavor = {
  flavor_id?: number | null;
  name?: string | null;
  extra_price?: number;
};

type AdminOrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  selected_flavors: AdminOrderItemFlavor[];
};

type AdminOrderStatusLog = {
  id: number;
  old_status: AdminOrderStatus | null;
  new_status: AdminOrderStatus;
  note: string | null;
  changed_at: string | null;
};

type AdminOrderDetailResponse = {
  id: number;
  tracking_token: string;
  status: AdminOrderStatus;
  total: number;
  created_at: string | null;
  guest_data: AdminOrderGuestData;
  order_day: AdminOrderDay;
  items: AdminOrderItem[];
  status_log: AdminOrderStatusLog[];
  items_count: number;
};

const statusClassMap: Record<AdminOrderStatus, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-sky-100 text-sky-800",
  EN_PREPARACION: "bg-violet-100 text-violet-800",
  LISTO: "bg-emerald-100 text-emerald-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabelMap: Record<AdminOrderStatus, string> = {
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

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  const [year, month, day] = dateValue.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return dateFormatter.format(parsedDate);
}

function formatDateTime(dateValue: string | null): string {
  if (!dateValue) return "-";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return dateTimeFormatter.format(parsedDate);
}

function getStatusLabel(status: AdminOrderStatus): string {
  return statusLabelMap[status] ?? status;
}

export default function AdminPedidoDetailPage() {
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const routeId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [order, setOrder] = useState<AdminOrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDetail() {
      if (!routeId) {
        setIsLoading(false);
        setError("No se encontro el identificador del pedido.");
        return;
      }

      const orderId = Number(routeId);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        setIsLoading(false);
        setError("El identificador del pedido no es valido.");
        return;
      }

      setIsLoading(true);
      setIsNotFound(false);
      setError(null);

      try {
        const data = await api.get<AdminOrderDetailResponse>(`/admin/orders/${orderId}`);
        if (!isMounted) return;
        setOrder(data);
      } catch (requestError) {
        if (!isMounted) return;
        setOrder(null);
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el detalle del pedido.";

        if (message.toLowerCase().includes("no encontrado")) {
          setIsNotFound(true);
        } else {
          setError(message);
        }
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadOrderDetail();

    return () => {
      isMounted = false;
    };
  }, [retryKey, routeId]);

  const orderedStatusLog = useMemo(() => {
    if (!order) return [];

    return [...order.status_log].sort((a, b) => {
      const aTime = a.changed_at ? new Date(a.changed_at).getTime() : 0;
      const bTime = b.changed_at ? new Date(b.changed_at).getTime() : 0;
      if (aTime === bTime) return a.id - b.id;
      return aTime - bTime;
    });
  }, [order]);

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Detalle de pedido
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Vista completa para revisar el pedido antes de gestionar cambios de estado.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-brand-accent text-brand-dark">
            <Link href="/admin/pedidos">Volver a pedidos</Link>
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

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-white/80 ring-1 ring-brand-accent/50"
              />
            ))}
          </div>
        )}

        {!isLoading && isNotFound && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-6 text-center">
              <h2 className="font-display text-2xl text-brand-dark">Pedido no encontrado</h2>
              <p className="mt-2 text-sm text-brand-dark/80">
                Verifica el id e intenta nuevamente.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isNotFound && error && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-6 text-center">
              <h2 className="font-display text-2xl text-brand-dark">
                No se pudo cargar el detalle
              </h2>
              <p className="mt-2 text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isNotFound && !error && order && (
          <div className="space-y-4">
            <Card className="bg-white ring-brand-accent/60">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-2xl text-brand-dark">
                      Pedido #{order.id}
                    </CardTitle>
                    <p className="mt-2 text-xs text-brand-dark/70">Tracking token</p>
                    <p className="mt-1 break-all rounded-md bg-brand-soft/70 px-2 py-1 font-mono text-xs text-brand-dark">
                      {order.tracking_token}
                    </p>
                  </div>
                  <Badge className={cn("font-medium", statusClassMap[order.status])}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                    <p className="text-brand-dark/70">Creado</p>
                    <p className="font-semibold text-brand-dark">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                    <p className="text-brand-dark/70">Dia del pedido</p>
                    <p className="font-semibold text-brand-dark">
                      {formatDate(order.order_day?.date ?? null)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                    <p className="text-brand-dark/70">Items</p>
                    <p className="font-semibold text-brand-dark">{order.items_count}</p>
                  </div>
                  <div className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                    <p className="text-brand-dark/70">Total</p>
                    <p className="font-semibold text-brand-primary">
                      {currencyFormatter.format(order.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <Card className="bg-white ring-brand-accent/60">
                <CardHeader>
                  <CardTitle className="font-display text-2xl text-brand-dark">Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.items.length === 0 ? (
                    <p className="text-sm text-brand-dark/75">Este pedido no tiene items.</p>
                  ) : (
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-brand-soft/50 p-3 ring-1 ring-brand-accent/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-brand-dark">
                                Producto #{item.product_id}
                              </p>
                              <p className="text-xs text-brand-dark/70">
                                Cantidad: {item.quantity}
                              </p>
                              <p className="text-xs text-brand-dark/70">
                                Precio unitario: {currencyFormatter.format(item.unit_price)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-brand-primary">
                              {currencyFormatter.format(item.subtotal)}
                            </p>
                          </div>

                          {item.selected_flavors.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-brand-dark/75">
                              {item.selected_flavors.map((flavor, index) => (
                                <li key={`${item.id}-${flavor.flavor_id ?? "na"}-${index}`}>
                                  Sabor: {flavor.name ?? "Sin nombre"}
                                  {typeof flavor.extra_price === "number" &&
                                  flavor.extra_price > 0
                                    ? ` (+ ${currencyFormatter.format(flavor.extra_price)})`
                                    : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-white ring-brand-accent/60">
                  <CardHeader>
                    <CardTitle className="font-display text-xl text-brand-dark">
                      Datos de contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-brand-dark/85">
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
                  </CardContent>
                </Card>

                <Card className="bg-white ring-brand-accent/60">
                  <CardHeader>
                    <CardTitle className="font-display text-xl text-brand-dark">
                      Historial de estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderedStatusLog.length === 0 ? (
                      <p className="text-sm text-brand-dark/75">
                        Sin movimientos registrados por ahora.
                      </p>
                    ) : (
                      <ol className="space-y-3">
                        {orderedStatusLog.map((log) => (
                          <li key={log.id} className="rounded-lg bg-brand-soft/50 p-3 text-xs">
                            <p className="font-medium text-brand-dark">
                              {log.old_status
                                ? `${getStatusLabel(log.old_status)} -> ${getStatusLabel(log.new_status)}`
                                : getStatusLabel(log.new_status)}
                            </p>
                            <p className="mt-1 text-brand-dark/70">
                              {formatDateTime(log.changed_at)}
                            </p>
                            {log.note && <p className="mt-1 text-brand-dark/75">{log.note}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white ring-brand-accent/60">
                  <CardHeader>
                    <CardTitle className="font-display text-xl text-brand-dark">
                      Cambio de estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-brand-dark/75">
                      Proximamente podras actualizar el estado del pedido desde esta seccion.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
