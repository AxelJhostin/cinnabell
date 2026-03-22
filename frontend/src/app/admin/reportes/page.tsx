"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type AdminReportSummaryResponse = {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_today: number;
  revenue_today: number;
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function AdminReportesPage() {
  const [summary, setSummary] = useState<AdminReportSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<AdminReportSummaryResponse>("/admin/reports/summary");
        if (!isMounted) return;
        setSummary(data);
      } catch (requestError) {
        if (!isMounted) return;
        setSummary(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el resumen de reportes."
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

  const reportCards = useMemo(
    () => [
      {
        title: "Pedidos totales",
        value: summary ? String(summary.total_orders) : "--",
        note: "Acumulado historico de pedidos",
      },
      {
        title: "Ingresos totales",
        value: summary ? currencyFormatter.format(summary.total_revenue) : "$ --",
        note: "Suma total de ingresos registrados",
      },
      {
        title: "Ticket promedio",
        value: summary ? currencyFormatter.format(summary.average_order_value) : "$ --",
        note: "Promedio de valor por pedido",
      },
      {
        title: "Pedidos de hoy",
        value: summary ? String(summary.orders_today) : "--",
        note: "Pedidos con dia operativo actual",
      },
      {
        title: "Ingresos de hoy",
        value: summary ? currencyFormatter.format(summary.revenue_today) : "$ --",
        note: "Ingresos asociados al dia actual",
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
            Reportes
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Resumen ejecutivo del negocio con indicadores clave para seguimiento operativo.
          </p>
        </header>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-brand-accent/60">
          <p className="text-sm text-brand-dark/80">
            Indicadores calculados sobre pedidos historicos y actividad del dia.
          </p>
          <Badge className="bg-brand-primary/15 text-brand-primary">Vista general</Badge>
        </div>

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
            ? Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="animate-pulse bg-white ring-brand-accent/60">
                  <CardHeader>
                    <div className="h-4 w-32 rounded bg-brand-soft/70" />
                    <div className="h-3 w-40 rounded bg-brand-soft/60" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-24 rounded bg-brand-soft/80" />
                    <div className="mt-2 h-3 w-28 rounded bg-brand-soft/60" />
                  </CardContent>
                </Card>
              ))
            : reportCards.map((card) => (
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
      </section>
    </div>
  );
}
