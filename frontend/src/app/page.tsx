import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-brand-soft">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-3xl border border-brand-accent/60 bg-gradient-to-br from-white via-brand-soft to-brand-accent/30 p-8 shadow-sm sm:p-12">
          <p className="mb-3 inline-flex rounded-full bg-brand-accent/60 px-3 py-1 text-xs font-medium text-brand-dark">
            Repostería artesanal bajo pedido
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-brand-dark sm:text-5xl">
            Roles de canela artesanales con sabor cálido y memorable.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-brand-dark/80 sm:text-lg">
            En Cinnabell horneamos cada pedido con ingredientes seleccionados y
            combinaciones que hacen de cada bocado un momento especial.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              Ver menú
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center rounded-md border border-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
            >
              Pedir ahora
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="font-display text-3xl font-semibold text-brand-dark">
          ¿Qué hace diferente a Cinnabell?
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-brand-accent/60 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-brand-dark">
              Hecho a mano
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Cada rol se prepara en pequeñas tandas para conservar textura,
              aroma y frescura.
            </p>
          </article>
          <article className="rounded-2xl border border-brand-accent/60 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-brand-dark">
              Sabores especiales
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Desde clásicos hasta combinaciones premium para sorprender en cada
              pedido.
            </p>
          </article>
          <article className="rounded-2xl border border-brand-accent/60 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-brand-dark">
              Pedido fácil
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Elige tus favoritos, confirma tu orden y nosotros nos encargamos
              del resto.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="font-display text-3xl font-semibold text-brand-dark">
          Cómo funciona
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-accent/60">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              1
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold text-brand-dark">
              Elige
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Explora nuestras opciones y selecciona los sabores que más te
              gusten.
            </p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-accent/60">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              2
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold text-brand-dark">
              Pide
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Realiza tu pedido en pocos pasos y confirma fácilmente tu orden.
            </p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-accent/60">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              3
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold text-brand-dark">
              Disfruta
            </h3>
            <p className="mt-2 text-sm text-brand-dark/80">
              Recibe tus roles de canela y comparte un momento delicioso.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="rounded-3xl bg-brand-primary p-8 text-white sm:p-10">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            ¿Lista tu próxima cajita favorita?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
            Descubre nuestro menú y elige tus roles de canela ideales para hoy.
          </p>
          <div className="mt-6">
            <Link
              href="/menu"
              className="inline-flex items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-white/90"
            >
              Ir al menú
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
