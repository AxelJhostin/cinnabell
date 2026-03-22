"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DayPicker } from "@/components/orders/day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre."),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .email("Ingresa un correo valido."),
  phone: z
    .string()
    .trim()
    .min(7, "Ingresa un telefono valido.")
    .max(30, "El telefono no puede exceder 30 caracteres."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function formatSelectedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  const text = selectedDateFormatter.format(parsedDate);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function PedirPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [contactData, setContactData] = useState<ContactFormValues | null>(null);

  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);

  const cartIsEmpty = useMemo(() => totalItems === 0, [totalItems]);
  const canContinueFromStepOne = Boolean(selectedDate) && !cartIsEmpty;
  const canContinueFromStepTwo = !cartIsEmpty;

  const selectedDateText = useMemo(
    () => (selectedDate ? formatSelectedDate(selectedDate) : "Sin fecha seleccionada"),
    [selectedDate]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const normalizedContactData = useMemo(() => {
    if (contactData) {
      return contactData;
    }
    return getValues();
  }, [contactData, getValues]);

  const continueButtonLabel = useMemo(() => {
    if (currentStep === 1) return "Continuar a productos";
    if (currentStep === 2) return "Continuar a contacto";
    if (currentStep === 3) return "Continuar a confirmacion";
    return "Base lista";
  }, [currentStep]);

  const continueDisabled = useMemo(() => {
    if (currentStep === 1) return !canContinueFromStepOne;
    if (currentStep === 2) return !canContinueFromStepTwo;
    if (currentStep === 3) return !isValid;
    return true;
  }, [currentStep, canContinueFromStepOne, canContinueFromStepTwo, isValid]);

  const helperText = useMemo(() => {
    if (currentStep === 1) {
      return "Para continuar debes elegir un dia y tener productos en el carrito.";
    }
    if (currentStep === 2) {
      return "Revisa tu carrito antes de pasar al formulario de contacto.";
    }
    if (currentStep === 3) {
      return "Completa tus datos para ir al resumen de confirmacion.";
    }
    return "El envio real de la orden se implementara en el siguiente avance.";
  }, [currentStep]);

  const handleStepThreeSubmit = handleSubmit((values) => {
    setContactData(values);
    setCurrentStep(4);
  });

  const handleContinue = () => {
    if (currentStep === 1 && canContinueFromStepOne) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2 && canContinueFromStepTwo) {
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      void handleStepThreeSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
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
            ) : null}

            {currentStep === 2 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-dark">
                  Paso 2: Productos
                </h2>
                <p className="mt-1 text-sm text-brand-dark/75">
                  Revisa lo que estas por pedir antes de pasar a tus datos de contacto.
                </p>

                {cartIsEmpty ? (
                  <div className="mt-4 rounded-xl bg-brand-soft/70 p-4 text-sm text-brand-dark/80">
                    <p>Tu carrito esta vacio.</p>
                    <Button
                      asChild
                      className="mt-3 bg-brand-primary text-white hover:bg-brand-primary/90"
                    >
                      <Link href="/menu">Ir al menu</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {items.map((item) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <div
                          key={item.lineId}
                          className="rounded-xl bg-brand-soft/50 p-3 ring-1 ring-brand-accent/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-brand-dark">{item.name}</p>
                              <p className="text-xs text-brand-dark/70">
                                {item.quantity} x {currencyFormatter.format(item.price)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-brand-primary">
                              {currencyFormatter.format(lineTotal)}
                            </p>
                          </div>
                          {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                            <p className="mt-2 text-xs text-brand-dark/75">
                              Sabores: {item.selectedFlavors.map((flavor) => flavor.name).join(", ")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div className="rounded-xl bg-white p-3 ring-1 ring-brand-accent/60">
                      <p className="text-sm text-brand-dark/80">
                        Total general:{" "}
                        <span className="font-semibold text-brand-primary">
                          {currencyFormatter.format(totalPrice)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-dark">
                  Paso 3: Datos de contacto
                </h2>
                <p className="mt-1 text-sm text-brand-dark/75">
                  Completa tus datos para preparar la confirmacion del pedido.
                </p>

                <form className="mt-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nombre</Label>
                    <Input id="contact-name" type="text" placeholder="Tu nombre" {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Correo</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="tu-correo@ejemplo.com"
                      {...register("email")}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telefono</Label>
                    <Input id="contact-phone" type="text" placeholder="0999999999" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </form>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-dark">
                  Paso 4: Confirmacion
                </h2>
                <p className="mt-1 text-sm text-brand-dark/75">
                  Placeholder listo. En el siguiente avance enviaremos esta data al backend.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                    <span className="font-medium text-brand-dark">Dia elegido:</span>{" "}
                    {selectedDateText}
                  </div>

                  <div className="rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                    <p>
                      <span className="font-medium text-brand-dark">Items:</span> {totalItems}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Total:</span>{" "}
                      {currencyFormatter.format(totalPrice)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                    <p>
                      <span className="font-medium text-brand-dark">Nombre:</span>{" "}
                      {normalizedContactData.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Correo:</span>{" "}
                      {normalizedContactData.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Telefono:</span>{" "}
                      {normalizedContactData.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
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
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="mb-2 w-full border-brand-accent text-brand-dark"
                  onClick={handleBack}
                >
                  Volver
                </Button>
              )}
              <Button
                type="button"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={continueDisabled}
                onClick={handleContinue}
              >
                {continueButtonLabel}
              </Button>
              <p className="mt-2 text-xs text-brand-dark/70">{helperText}</p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
