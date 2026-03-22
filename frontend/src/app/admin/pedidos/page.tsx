"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminOrderGuestData = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
} | null;

type AdminOrderDay = {
  id: number;
  date: string;
};

type AdminOrderListItem = {
  id: number;
  tracking_token: string;
  status: AdminOrderStatus;
  total: number;
  created_at: string | null;
  guest_data: AdminOrderGuestData;
  order_day: AdminOrderDay;
  items_count: number;
};

type AdminOrderStatus =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

const statusOptions: Array<{ label: string; value: "ALL" | AdminOrderStatus }> = [
  { label: "Todos", value: "ALL" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Confirmado", value: "CONFIRMADO" },
  { label: "En preparacion", value: "EN_PREPARACION" },
  { label: "Listo", value: "LISTO" },
  { label: "Entregado", value: "ENTREGADO" },
  { label: "Cancelado", value: "CANCELADO" },
];

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

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateTimeFormatter.format(parsed);
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | AdminOrderStatus>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError(null);

      try {
        const endpoint =
          selectedStatus === "ALL"
            ? "/admin/orders"
            : `/admin/orders?status=${encodeURIComponent(selectedStatus)}`;

        const data = await api.get<AdminOrderListItem[]>(endpoint);
        if (!isMounted) return;
        setOrders(data);
      } catch (requestError) {
        if (!isMounted) return;
        setOrders([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la lista de pedidos."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [retryKey, selectedStatus]);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Pedidos del dia
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Vista operativa de pedidos con filtro por estado.
          </p>
        </header>

        <Card className="bg-white ring-brand-accent/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-brand-dark">
              Filtro por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={selectedStatus === option.value ? "default" : "outline"}
                  className={
                    selectedStatus === option.value
                      ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                      : "border-brand-accent text-brand-dark hover:bg-brand-soft/60"
                  }
                  onClick={() => setSelectedStatus(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-white/80 ring-1 ring-brand-accent/50"
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

        {!isLoading && !error && !hasOrders && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-5">
              <p className="text-sm text-brand-dark/80">
                No hay pedidos para este filtro en el dia actual.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && hasOrders && (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-brand-accent/60">
            <table className="min-w-[820px] w-full text-sm">
              <thead className="bg-brand-soft/70 text-left text-brand-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">Tracking</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-brand-accent/50 text-brand-dark/90"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order.tracking_token}</td>
                    <td className="px-4 py-3">{order.guest_data?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "font-medium",
                          statusClassMap[order.status] ?? "bg-slate-100 text-slate-700"
                        )}
                      >
                        {statusLabelMap[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-primary">
                      {currencyFormatter.format(order.total)}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">{order.items_count}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-xs font-medium text-brand-primary underline-offset-4 hover:underline"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
