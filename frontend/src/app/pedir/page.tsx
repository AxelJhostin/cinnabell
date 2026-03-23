"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DayPicker } from "@/components/orders/day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
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
  phone: z.string().trim().max(30, "El telefono no puede exceder 30 caracteres."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type OrderDayDetail = {
  id: number;
  date: string;
};

type CreateOrderItemFlavorPayload = {
  flavor_id?: number;
  name?: string;
  extra_price?: number;
};

type CreateOrderItemPayload = {
  product_id: number;
  quantity: number;
  selected_flavors?: CreateOrderItemFlavorPayload[];
};

type CreateOrderPayload = {
  order_day_id: number;
  guest_data?: {
    name: string;
    email: string;
    phone: string;
  };
  items: CreateOrderItemPayload[];
};

type CreateOrderResponse = {
  id: number;
  tracking_token: string;
  status: string;
  total: number;
  created_at: string | null;
};

function formatSelectedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  const text = selectedDateFormatter.format(parsedDate);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function PedirPage() {
  const router = useRouter();
  const didPrefillContactRef = useRef(false);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedOrderDayId, setSelectedOrderDayId] = useState<number | null>(null);
  const [isResolvingOrderDay, setIsResolvingOrderDay] = useState(false);
  const [orderDayResolveError, setOrderDayResolveError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactFormValues | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitOrderError, setSubmitOrderError] = useState<string | null>(null);

  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const hasHydratedCart = useCartStore((state) => state.hasHydrated);
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const cartIsEmpty = useMemo(
    () => (hasHydratedCart ? totalItems === 0 : true),
    [hasHydratedCart, totalItems]
  );
  const authenticatedUser = useMemo(
    () => (isAuthenticated && authUser ? authUser : null),
    [isAuthenticated, authUser]
  );
  const canContinueFromStepOne =
    hasHydratedCart &&
    Boolean(selectedDate) &&
    selectedOrderDayId !== null &&
    !isResolvingOrderDay &&
    !orderDayResolveError &&
    !cartIsEmpty;
  const canContinueFromStepTwo = hasHydratedCart && !cartIsEmpty;

  const selectedDateText = useMemo(
    () => (selectedDate ? formatSelectedDate(selectedDate) : "Sin fecha seleccionada"),
    [selectedDate]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setError,
    clearErrors,
    reset,
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
  const contactSummary = useMemo(
    () => ({
      name: normalizedContactData.name?.trim() || authenticatedUser?.name || "",
      email: normalizedContactData.email?.trim() || authenticatedUser?.email || "",
      phone: normalizedContactData.phone?.trim() || authenticatedUser?.phone || "",
    }),
    [normalizedContactData, authenticatedUser]
  );

  useEffect(() => {
    if (!authenticatedUser || didPrefillContactRef.current) return;

    const prefilledContact: ContactFormValues = {
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      phone: authenticatedUser.phone ?? "",
    };

    didPrefillContactRef.current = true;
    reset(prefilledContact);
    setContactData(prefilledContact);
  }, [authenticatedUser, reset]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedOrderDayId(null);
      setOrderDayResolveError(null);
      setIsResolvingOrderDay(false);
      return;
    }
    const selectedDateValue = selectedDate;

    let isMounted = true;

    async function resolveOrderDayId() {
      setIsResolvingOrderDay(true);
      setOrderDayResolveError(null);
      setSelectedOrderDayId(null);

      try {
        const day = await api.get<OrderDayDetail>(
          `/order-days/${encodeURIComponent(selectedDateValue)}`
        );
        if (!isMounted) return;
        setSelectedOrderDayId(day.id);
      } catch (error) {
        if (!isMounted) return;
        setOrderDayResolveError(
          error instanceof Error
            ? error.message
            : "No se pudo validar el dia seleccionado."
        );
      } finally {
        if (!isMounted) return;
        setIsResolvingOrderDay(false);
      }
    }

    void resolveOrderDayId();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const continueButtonLabel = useMemo(() => {
    if (currentStep === 1) return "Continuar a productos";
    if (currentStep === 2) return "Continuar a contacto";
    if (currentStep === 3) return "Continuar a confirmacion";
    return "Paso final";
  }, [currentStep]);

  const continueDisabled = useMemo(() => {
    if (currentStep === 1) return !canContinueFromStepOne;
    if (currentStep === 2) return !canContinueFromStepTwo;
    if (currentStep === 3) return !isValid;
    return true;
  }, [currentStep, canContinueFromStepOne, canContinueFromStepTwo, isValid]);

  const helperText = useMemo(() => {
    if (currentStep === 1) {
      if (!hasHydratedCart) {
        return "Estamos cargando tu carrito guardado...";
      }
      return "Para continuar debes elegir un dia valido y tener productos en el carrito.";
    }
    if (currentStep === 2) {
      if (!hasHydratedCart) {
        return "Estamos cargando tu carrito guardado...";
      }
      return "Revisa tu carrito antes de pasar al formulario de contacto.";
    }
    if (currentStep === 3) {
      return authenticatedUser
        ? "Puedes confirmar con los datos de tu cuenta o ajustarlos antes de continuar."
        : "Completa tus datos para ir a la confirmacion final.";
    }
    return "Confirma para crear tu pedido real y obtener tu token de seguimiento.";
  }, [currentStep, authenticatedUser, hasHydratedCart]);

  const handleStepThreeSubmit = handleSubmit((values) => {
    const normalizedPhone = values.phone.trim();
    if (!authenticatedUser && normalizedPhone.length < 7) {
      setError("phone", {
        type: "manual",
        message: "Ingresa un telefono valido.",
      });
      return;
    }

    clearErrors("phone");
    setContactData({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: normalizedPhone,
    });
    setSubmitOrderError(null);
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

  const handleConfirmOrder = async () => {
    if (isSubmittingOrder) return;
    if (!hasHydratedCart) {
      setSubmitOrderError("Estamos cargando tu carrito. Intenta nuevamente en un momento.");
      return;
    }

    if (!selectedOrderDayId) {
      setSubmitOrderError("No se pudo resolver el dia de pedido seleccionado.");
      return;
    }

    if (cartIsEmpty) {
      setSubmitOrderError("Tu carrito esta vacio.");
      return;
    }

    const contact = contactData ?? getValues();
    const normalizedContact = {
      name: contact.name?.trim() || authenticatedUser?.name || "",
      email: contact.email?.trim() || authenticatedUser?.email || "",
      phone: contact.phone?.trim() || authenticatedUser?.phone || "",
    };

    const payloadItems: CreateOrderItemPayload[] = items.map((item) => {
      const flavors: CreateOrderItemFlavorPayload[] =
        item.selectedFlavors
          ?.map((flavor) => ({
            flavor_id: flavor.flavorId,
            name: flavor.name,
            extra_price: flavor.extraPrice ?? 0,
          }))
          .filter((flavor) => flavor.flavor_id !== undefined || Boolean(flavor.name)) ?? [];

      const payloadItem: CreateOrderItemPayload = {
        product_id: item.productId,
        quantity: item.quantity,
      };

      if (flavors.length > 0) {
        payloadItem.selected_flavors = flavors;
      }

      return payloadItem;
    });

    const payload: CreateOrderPayload = {
      order_day_id: selectedOrderDayId,
      items: payloadItems,
    };

    if (!authenticatedUser) {
      if (
        !normalizedContact.name ||
        !normalizedContact.email ||
        !normalizedContact.phone ||
        normalizedContact.phone.length < 7
      ) {
        setSubmitOrderError("Completa tus datos de contacto antes de confirmar.");
        return;
      }

      payload.guest_data = {
        name: normalizedContact.name,
        email: normalizedContact.email,
        phone: normalizedContact.phone,
      };
    }

    setSubmitOrderError(null);
    setIsSubmittingOrder(true);

    try {
      const createdOrder = await api.post<CreateOrderResponse>("/orders", payload);
      clearCart();
      router.push(`/pedido/${encodeURIComponent(createdOrder.tracking_token)}`);
    } catch (error) {
      setSubmitOrderError(
        error instanceof Error
          ? error.message
          : "No se pudo confirmar el pedido. Intenta nuevamente."
      );
    } finally {
      setIsSubmittingOrder(false);
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

                <DayPicker className="mt-4" value={selectedDate} onChange={setSelectedDate} />

                <div className="mt-4 rounded-xl bg-brand-soft/70 p-3 text-sm text-brand-dark/80">
                  <span className="font-medium text-brand-dark">Fecha seleccionada:</span>{" "}
                  {selectedDateText}
                </div>

                {!hasHydratedCart && (
                  <p className="mt-2 text-xs text-brand-dark/70">
                    Cargando carrito guardado...
                  </p>
                )}

                {isResolvingOrderDay && (
                  <p className="mt-2 text-xs text-brand-dark/70">Validando disponibilidad del dia...</p>
                )}

                {orderDayResolveError && (
                  <p className="mt-2 text-xs text-destructive">{orderDayResolveError}</p>
                )}
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

                {!hasHydratedCart ? (
                  <div className="mt-4 rounded-xl bg-brand-soft/70 p-4 text-sm text-brand-dark/80">
                    Cargando carrito guardado...
                  </div>
                ) : cartIsEmpty ? (
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
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 rounded-md border border-brand-accent bg-brand-soft/70 p-1">
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="text-brand-dark"
                                onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                                aria-label={`Disminuir cantidad de ${item.name}`}
                              >
                                <Minus />
                              </Button>
                              <span className="min-w-6 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="text-brand-dark"
                                onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                                aria-label={`Aumentar cantidad de ${item.name}`}
                              >
                                <Plus />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-brand-dark/80 hover:text-destructive"
                              onClick={() => removeItem(item.lineId)}
                            >
                              <Trash2 />
                              Eliminar
                            </Button>
                          </div>
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

                {authenticatedUser && (
                  <div className="mt-4 rounded-xl bg-brand-soft/70 p-3 text-xs text-brand-dark/80">
                    Pedido autenticado: se asociara a tu cuenta y se usaran tus datos de perfil.
                  </div>
                )}

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
                    <Label htmlFor="contact-phone">
                      {authenticatedUser ? "Telefono (opcional)" : "Telefono"}
                    </Label>
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
                  Revisa el resumen y confirma para crear tu pedido real.
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
                      <span className="font-medium text-brand-dark">Tipo de pedido:</span>{" "}
                      {authenticatedUser ? "Cuenta autenticada" : "Invitado"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Nombre:</span>{" "}
                      {contactSummary.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Correo:</span>{" "}
                      {contactSummary.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-brand-dark">Telefono:</span>{" "}
                      {contactSummary.phone || "-"}
                    </p>
                  </div>
                </div>

                {submitOrderError && (
                  <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {submitOrderError}
                  </div>
                )}

                <Button
                  type="button"
                  className="mt-4 w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                  disabled={
                    isSubmittingOrder ||
                    !hasHydratedCart ||
                    cartIsEmpty ||
                    selectedOrderDayId === null
                  }
                  onClick={() => {
                    void handleConfirmOrder();
                  }}
                >
                  {isSubmittingOrder ? "Confirmando pedido..." : "Confirmar pedido"}
                </Button>
              </div>
            ) : null}
          </article>

          <aside className="space-y-4">
            <article className="rounded-2xl bg-white p-5 ring-1 ring-brand-accent/60">
              <h3 className="font-display text-xl font-semibold text-brand-dark">
                Resumen del carrito
              </h3>

              {!hasHydratedCart ? (
                <div className="mt-3 space-y-2 text-sm text-brand-dark/80">
                  <p>Cargando carrito guardado...</p>
                </div>
              ) : cartIsEmpty ? (
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
                  <p className="text-xs text-brand-dark/70">{items.length} linea(s) en carrito.</p>
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

              {currentStep < 4 && (
                <>
                  <Button
                    type="button"
                    className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                    disabled={continueDisabled}
                    onClick={handleContinue}
                  >
                    {continueButtonLabel}
                  </Button>
                  <p className="mt-2 text-xs text-brand-dark/70">{helperText}</p>
                </>
              )}

              {currentStep === 4 && <p className="text-xs text-brand-dark/70">{helperText}</p>}
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
