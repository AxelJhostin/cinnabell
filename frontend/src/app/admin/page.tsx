import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dashboardCards = [
  {
    title: "Pedidos del dia",
    value: "--",
    note: "Pendiente de conexion con metricas reales",
  },
  {
    title: "Cupos restantes",
    value: "--",
    note: "Segun disponibilidad del calendario",
  },
  {
    title: "Ingresos del dia",
    value: "$ --",
    note: "Resumen economico diario",
  },
] as const;

const quickAccess = [
  { key: "pedidos", label: "Pedidos" },
  { key: "productos", label: "Productos" },
  { key: "calendario", label: "Calendario" },
  { key: "clientes", label: "Clientes" },
  { key: "reportes", label: "Reportes" },
] as const;

export default function AdminPage() {
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
            Base del dashboard operativo. En el siguiente bloque conectaremos metricas
            y modulos reales del panel.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => (
            <Card key={card.title} className="bg-white ring-brand-accent/60">
              <CardHeader>
                <CardTitle className="font-display text-xl text-brand-dark">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-brand-dark/70">{card.note}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-brand-primary">{card.value}</p>
                <p className="mt-2 text-xs text-brand-dark/70">Proximamente</p>
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
                key={item.key}
                href={`/admin?modulo=${item.key}`}
                className="rounded-xl border border-brand-accent/60 bg-brand-soft/45 px-3 py-3 text-sm font-medium text-brand-dark transition hover:border-brand-primary/40 hover:bg-brand-soft"
              >
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs text-brand-dark/65">Proximamente</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
