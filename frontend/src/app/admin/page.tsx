"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const quickAccess = [
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/reportes", label: "Reportes" },
] as const;

type DashboardSummaryResponse = {
  today_date: string;
  today_orders_count: number;
  today_remaining_capacity: number;
  today_revenue: number;
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

function formatSummaryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(parsedDate.getTime())) return isoDate;
  return dateFormatter.format(parsedDate);
}

export default function AdminPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<DashboardSummaryResponse>("/admin/dashboard-summary");
        if (!isMounted) return;
        setSummary(data);
      } catch (requestError) {
        if (!isMounted) return;
        setSummary(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el resumen del dashboard."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const dashboardCards = useMemo(
    () => [
      {
        title: "Pedidos del dia",
        value: summary ? String(summary.today_orders_count) : "--",
        note: "Pedidos asociados a dias programados para hoy",
      },
      {
        title: "Cupos restantes",
        value: summary ? String(summary.today_remaining_capacity) : "--",
        note: "Capacidad disponible para pedidos de hoy",
      },
      {
        title: "Ingresos del dia",
        value: summary ? currencyFormatter.format(summary.today_revenue) : "$ --",
        note: "Suma de pedidos registrados para hoy",
      },
    ],
    [summary]
  );

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Panel de Administracion
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Resumen operativo del dia para monitorear pedidos, capacidad e ingresos.
          </p>
        </header>

        {summary && (
          <div className="rounded-xl bg-white px-4 py-3 text-sm text-brand-dark ring-1 ring-brand-accent/60">
            Resumen del dia:{" "}
            <span className="font-medium text-brand-primary">
              {formatSummaryDate(summary.today_date)}
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-brand-accent/60">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Reintentar
            </Button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="animate-pulse bg-white ring-brand-accent/60"
                >
                  <CardHeader>
                    <div className="h-4 w-28 rounded bg-brand-soft/70" />
                    <div className="h-3 w-40 rounded bg-brand-soft/60" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-20 rounded bg-brand-soft/80" />
                    <div className="mt-2 h-3 w-24 rounded bg-brand-soft/60" />
                  </CardContent>
                </Card>
              ))
            : dashboardCards.map((card) => (
                <Card key={card.title} className="bg-white ring-brand-accent/60">
                  <CardHeader>
                    <CardTitle className="font-display text-xl text-brand-dark">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-brand-dark/70">
                      {card.note}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-brand-primary">{card.value}</p>
                    <p className="mt-2 text-xs text-brand-dark/70">Actualizado hoy</p>
                  </CardContent>
                </Card>
              ))}
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              Accesos rapidos
            </h2>
            <Badge className="bg-brand-primary/15 text-brand-primary">Base lista</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickAccess.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-brand-accent/60 bg-brand-soft/45 px-3 py-3 text-sm font-medium text-brand-dark transition hover:border-brand-primary/40 hover:bg-brand-soft"
              >
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs text-brand-dark/65">Ir al modulo</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
