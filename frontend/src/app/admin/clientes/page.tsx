"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

type AdminCustomerListItem = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string | null;
  orders_count: number;
  total_spent: number;
  last_order_date: string | null;
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

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<AdminCustomerListItem[]>("/admin/customers");
        if (!isMounted) return;
        setCustomers(data);
      } catch (requestError) {
        if (!isMounted) return;
        setCustomers([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la lista de clientes."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const hasCustomers = useMemo(() => customers.length > 0, [customers]);

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Clientes
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Vista operativa de clientes registrados y su actividad de compra.
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

        {!isLoading && !error && !hasCustomers && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-5">
              <p className="text-sm text-brand-dark/80">No hay clientes registrados.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && hasCustomers && (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-brand-accent/60">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-brand-soft/70 text-left text-brand-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telefono</th>
                  <th className="px-4 py-3 font-medium">Registro</th>
                  <th className="px-4 py-3 font-medium">Pedidos</th>
                  <th className="px-4 py-3 font-medium">Total gastado</th>
                  <th className="px-4 py-3 font-medium">Ultima compra</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-brand-accent/50 text-brand-dark/90"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.name}</span>
                        <Badge
                          className={
                            customer.orders_count > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {customer.orders_count > 0 ? "Con compras" : "Sin compras"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                    <td className="px-4 py-3">{formatDateTime(customer.created_at)}</td>
                    <td className="px-4 py-3">{customer.orders_count}</td>
                    <td className="px-4 py-3 font-medium text-brand-primary">
                      {currencyFormatter.format(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(customer.last_order_date)}</td>
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
