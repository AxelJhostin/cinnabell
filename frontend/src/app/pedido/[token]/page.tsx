import Link from "next/link";

type PedidoTokenPageProps = {
  params: {
    token: string;
  };
};

export default function PedidoTokenPage({ params }: PedidoTokenPageProps) {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 ring-1 ring-brand-accent/60 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
          Seguimiento de pedido
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-brand-dark sm:text-4xl">
          Pedido confirmado
        </h1>
        <p className="mt-3 text-sm text-brand-dark/80">
          Tu pedido fue creado correctamente. Guarda este token para seguimiento:
        </p>

        <div className="mt-4 rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark">
          <span className="font-medium">Token:</span> {params.token}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-primary/90"
          >
            Volver al inicio
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-md border border-brand-accent px-3 py-2 text-xs font-medium text-brand-dark transition hover:bg-brand-soft/60"
          >
            Ver menu
          </Link>
        </div>
      </section>
    </div>
  );
}
