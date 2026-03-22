"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DayPicker } from "@/components/orders/day-picker";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

const steps = [
  { id: 1, label: "Dia" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Contacto" },
  { id: 4, label: "Confirmacion" },
] as const;

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const selectedDateFormatter = new Intl.DateTimeFormat("es-EC", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatSelectedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  const text = selectedDateFormatter.format(parsedDate);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function PedirPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);

  const cartIsEmpty = useMemo(() => totalItems === 0, [totalItems]);
  const canContinueFromStepOne = Boolean(selectedDate) && !cartIsEmpty;

  const selectedDateText = useMemo(
    () => (selectedDate ? formatSelectedDate(selectedDate) : "Sin fecha seleccionada"),
    [selectedDate]
  );

  const handleContinue = () => {
    if (currentStep === 1 && canContinueFromStepOne) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Flujo de pedido
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Realiza tu pedido
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Selecciona tu dia de entrega y avanza paso a paso para completar tu pedido.
          </p>
        </div>

        <ol className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-brand-accent/60 sm:grid-cols-4">
          {steps.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <li
                key={step.id}
                className={[
                  "rounded-xl border px-3 py-2 text-xs transition",
                  isCurrent
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-brand-accent/60 bg-brand-soft/40 text-brand-dark/70",
                ].join(" ")}
              >
                <p className="font-semibold">Paso {step.id}</p>
                <p>{step.label}</p>
              </li>
            );
          })}
        </ol>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60 sm:p-6">
            {currentStep === 1 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-dark">
                  Paso 1: Elige el dia de pedido
                </h2>
                <p className="mt-1 text-sm text-brand-dark/75">
                  Selecciona una fecha habilitada para continuar con tu pedido.
                </p>

                <DayPicker
                  className="mt-4"
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                />

                <div className="mt-4 rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                  <span className="font-medium text-brand-dark">Fecha seleccionada:</span>{" "}
                  {selectedDateText}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-dark">
                  Paso 2: Productos
                </h2>
                <p className="mt-1 text-sm text-brand-dark/75">
                  Base del flujo lista. En el siguiente avance conectaremos este paso con el
                  detalle de productos del pedido.
                </p>
                <div className="mt-4 rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                  <span className="font-medium text-brand-dark">Fecha elegida:</span>{" "}
                  {selectedDateText}
                </div>
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60">
              <h3 className="font-display text-xl font-semibold text-brand-dark">
                Resumen del carrito
              </h3>

              {cartIsEmpty ? (
                <div className="mt-3 space-y-2 text-sm text-brand-dark/80">
                  <p>Tu carrito esta vacio.</p>
                  <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
                    <Link href="/menu">Ir al menu</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-brand-dark/80">
                    Items: <span className="font-semibold text-brand-dark">{totalItems}</span>
                  </p>
                  <p className="text-brand-dark/80">
                    Total:{" "}
                    <span className="font-semibold text-brand-primary">
                      {currencyFormatter.format(totalPrice)}
                    </span>
                  </p>
                  <p className="text-xs text-brand-dark/70">
                    {items.length} linea(s) en carrito.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60">
              <Button
                type="button"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={currentStep !== 1 || !canContinueFromStepOne}
                onClick={handleContinue}
              >
                Continuar
              </Button>
              <p className="mt-2 text-xs text-brand-dark/70">
                Para continuar debes elegir un dia y tener productos en el carrito.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
