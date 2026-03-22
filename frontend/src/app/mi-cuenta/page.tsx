import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MiCuentaPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-accent/60 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
          Cinnabell
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">
          Mi cuenta
        </h1>
        <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
          Bienvenido a tu espacio personal. Muy pronto aquí podrás revisar tus
          pedidos y gestionar tus datos de cuenta.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <Link href="/menu">Ir al menú</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-brand-accent text-brand-dark"
            disabled
          >
            Mis pedidos (próximamente)
          </Button>
        </div>
      </section>
    </div>
  );
}
