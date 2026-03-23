"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminOrderDay = {
  id: number;
  date: string;
  is_open: boolean;
  max_capacity: number;
  current_orders: number;
  is_special: boolean;
  note: string | null;
  available_slots: number;
};

type AdminOrderDayDraft = {
  is_open: boolean;
  max_capacity: string;
  is_special: boolean;
  note: string;
};

type RowFeedback = {
  isSaving: boolean;
  error: string | null;
  success: string | null;
};

type AdminOrderDayPatchPayload = {
  is_open?: boolean;
  max_capacity?: number;
  is_special?: boolean;
  note?: string | null;
};

type AdminOrderDayCreatePayload = {
  date: string;
  is_open: boolean;
  max_capacity: number;
  is_special: boolean;
  note?: string | null;
};

type CreateDraft = {
  date: string;
  is_open: boolean;
  max_capacity: string;
  is_special: boolean;
  note: string;
};

type CreateFeedback = {
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return dateFormatter.format(parsedDate);
}

function toDraft(orderDay: AdminOrderDay): AdminOrderDayDraft {
  return {
    is_open: orderDay.is_open,
    max_capacity: String(orderDay.max_capacity),
    is_special: orderDay.is_special,
    note: orderDay.note ?? "",
  };
}

function normalizeNote(value: string): string {
  return value.trim();
}

function getRowStatusClass(orderDay: AdminOrderDay): string {
  if (!orderDay.is_open) return "bg-slate-100 text-slate-700";
  if (orderDay.available_slots <= 0) return "bg-red-100 text-red-800";
  if (orderDay.available_slots <= 3) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

export default function AdminCalendarioPage() {
  const [days, setDays] = useState<AdminOrderDay[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AdminOrderDayDraft>>({});
  const [rowFeedback, setRowFeedback] = useState<Record<number, RowFeedback>>({});
  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    date: "",
    is_open: true,
    max_capacity: "30",
    is_special: false,
    note: "",
  });
  const [createFeedback, setCreateFeedback] = useState<CreateFeedback>({
    isSubmitting: false,
    error: null,
    success: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDays() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<AdminOrderDay[]>("/admin/order-days");
        if (!isMounted) return;

        setDays(data);
        setDrafts(
          Object.fromEntries(data.map((orderDay) => [orderDay.id, toDraft(orderDay)]))
        );
        setRowFeedback({});
      } catch (requestError) {
        if (!isMounted) return;
        setDays([]);
        setDrafts({});
        setRowFeedback({});
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el calendario operativo."
        );
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadOrderDays();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const hasRows = useMemo(() => days.length > 0, [days]);

  function updateDraft(orderDayId: number, patch: Partial<AdminOrderDayDraft>) {
    setDrafts((current) => ({
      ...current,
      [orderDayId]: {
        ...(current[orderDayId] ?? {
          is_open: false,
          max_capacity: "0",
          is_special: false,
          note: "",
        }),
        ...patch,
      },
    }));
  }

  function setRowState(orderDayId: number, patch: Partial<RowFeedback>) {
    setRowFeedback((current) => ({
      ...current,
      [orderDayId]: {
        isSaving: current[orderDayId]?.isSaving ?? false,
        error: current[orderDayId]?.error ?? null,
        success: current[orderDayId]?.success ?? null,
        ...patch,
      },
    }));
  }

  async function handleCreateDay() {
    const parsedCapacity = Number(createDraft.max_capacity);
    if (!createDraft.date) {
      setCreateFeedback({
        isSubmitting: false,
        error: "Debes seleccionar una fecha para crear el dia.",
        success: null,
      });
      return;
    }

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 0) {
      setCreateFeedback({
        isSubmitting: false,
        error: "La capacidad maxima debe ser un numero entero mayor o igual a 0.",
        success: null,
      });
      return;
    }

    const payload: AdminOrderDayCreatePayload = {
      date: createDraft.date,
      is_open: createDraft.is_open,
      max_capacity: parsedCapacity,
      is_special: createDraft.is_special,
      note: normalizeNote(createDraft.note) || undefined,
    };

    setCreateFeedback({ isSubmitting: true, error: null, success: null });

    try {
      const createdDay = await api.post<AdminOrderDay>("/admin/order-days", payload);
      setDays((current) =>
        [...current, createdDay].sort((a, b) => a.date.localeCompare(b.date))
      );
      setDrafts((current) => ({ ...current, [createdDay.id]: toDraft(createdDay) }));
      setCreateDraft({
        date: "",
        is_open: true,
        max_capacity: "30",
        is_special: false,
        note: "",
      });
      setCreateFeedback({
        isSubmitting: false,
        error: null,
        success: "Dia de pedido creado correctamente.",
      });
    } catch (requestError) {
      setCreateFeedback({
        isSubmitting: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "No se pudo crear el dia de pedido.",
        success: null,
      });
    }
  }

  async function handleSaveRow(orderDay: AdminOrderDay) {
    const draft = drafts[orderDay.id];
    if (!draft) return;

    const parsedCapacity = Number(draft.max_capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 0) {
      setRowState(orderDay.id, {
        isSaving: false,
        error: "La capacidad maxima debe ser un numero entero mayor o igual a 0.",
        success: null,
      });
      return;
    }

    const payload: AdminOrderDayPatchPayload = {};

    if (draft.is_open !== orderDay.is_open) {
      payload.is_open = draft.is_open;
    }
    if (parsedCapacity !== orderDay.max_capacity) {
      payload.max_capacity = parsedCapacity;
    }
    if (draft.is_special !== orderDay.is_special) {
      payload.is_special = draft.is_special;
    }

    const originalNote = normalizeNote(orderDay.note ?? "");
    const nextNote = normalizeNote(draft.note);
    if (nextNote !== originalNote) {
      payload.note = nextNote === "" ? null : nextNote;
    }

    if (Object.keys(payload).length === 0) {
      setRowState(orderDay.id, {
        isSaving: false,
        error: null,
        success: "No hay cambios para guardar.",
      });
      return;
    }

    setRowState(orderDay.id, { isSaving: true, error: null, success: null });

    try {
      const updated = await api.patch<AdminOrderDay>(
        `/admin/order-days/${orderDay.id}`,
        payload
      );

      setDays((current) =>
        current.map((day) => (day.id === updated.id ? updated : day))
      );
      setDrafts((current) => ({ ...current, [updated.id]: toDraft(updated) }));
      setRowState(orderDay.id, {
        isSaving: false,
        error: null,
        success: "Cambios guardados correctamente.",
      });
    } catch (requestError) {
      setRowState(orderDay.id, {
        isSaving: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron guardar los cambios de esta fila.",
        success: null,
      });
    }
  }

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Cinnabell Admin
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark sm:text-5xl">
            Calendario operativo
          </h1>
          <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
            Gestiona apertura, capacidad y notas de los dias disponibles para pedidos.
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

        <Card className="bg-white ring-brand-accent/60">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-2xl text-brand-dark">
              Crear nuevo dia de pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                  Fecha
                </p>
                <Input
                  type="date"
                  value={createDraft.date}
                  disabled={createFeedback.isSubmitting}
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, date: event.target.value }))
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                  Capacidad maxima
                </p>
                <Input
                  type="number"
                  min={0}
                  value={createDraft.max_capacity}
                  disabled={createFeedback.isSubmitting}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      max_capacity: event.target.value,
                    }))
                  }
                  className="h-9"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-brand-dark sm:self-end">
                <input
                  type="checkbox"
                  checked={createDraft.is_open}
                  disabled={createFeedback.isSubmitting}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      is_open: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-brand-accent"
                />
                Abierto
              </label>

              <label className="flex items-center gap-2 text-sm text-brand-dark sm:self-end">
                <input
                  type="checkbox"
                  checked={createDraft.is_special}
                  disabled={createFeedback.isSubmitting}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      is_special: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-brand-accent"
                />
                Dia especial
              </label>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                Nota (opcional)
              </p>
              <Input
                type="text"
                value={createDraft.note}
                disabled={createFeedback.isSubmitting}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Ejemplo: Produccion especial por feriado"
                className="h-9"
              />
            </div>

            {createFeedback.error && (
              <p className="text-xs text-destructive">{createFeedback.error}</p>
            )}
            {createFeedback.success && (
              <p className="text-xs text-emerald-700">{createFeedback.success}</p>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={createFeedback.isSubmitting}
                onClick={() => {
                  void handleCreateDay();
                }}
              >
                {createFeedback.isSubmitting ? "Creando..." : "Crear dia"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-white/80 ring-1 ring-brand-accent/50"
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

        {!isLoading && !error && !hasRows && (
          <Card className="bg-white ring-brand-accent/60">
            <CardContent className="pt-5">
              <p className="text-sm text-brand-dark/80">
                No hay dias configurados para hoy o fechas futuras.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && hasRows && (
          <div className="space-y-3">
            {days.map((day) => {
              const draft = drafts[day.id] ?? toDraft(day);
              const feedback = rowFeedback[day.id] ?? {
                isSaving: false,
                error: null,
                success: null,
              };

              return (
                <Card key={day.id} className="bg-white ring-brand-accent/60">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle className="font-display text-2xl text-brand-dark">
                          {formatDate(day.date)}
                        </CardTitle>
                        <p className="mt-1 text-xs text-brand-dark/70">ID #{day.id}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("font-medium", getRowStatusClass(day))}>
                          {day.is_open ? "Abierto" : "Cerrado"}
                        </Badge>
                        <Badge className="bg-brand-primary/15 text-brand-primary">
                          Cupos: {day.available_slots}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-brand-soft/55 p-3">
                        <p className="text-brand-dark/70">Pedidos actuales</p>
                        <p className="font-semibold text-brand-dark">{day.current_orders}</p>
                      </div>
                      <div className="rounded-xl bg-brand-soft/55 p-3">
                        <p className="text-brand-dark/70">Capacidad actual</p>
                        <p className="font-semibold text-brand-dark">{day.max_capacity}</p>
                      </div>
                      <div className="rounded-xl bg-brand-soft/55 p-3">
                        <p className="text-brand-dark/70">Especial</p>
                        <p className="font-semibold text-brand-dark">
                          {day.is_special ? "Si" : "No"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-brand-soft/55 p-3">
                        <p className="text-brand-dark/70">Nota actual</p>
                        <p className="font-semibold text-brand-dark">{day.note ?? "-"}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 rounded-xl border border-brand-accent/60 p-4 lg:grid-cols-4">
                      <label className="flex items-center gap-2 text-sm text-brand-dark">
                        <input
                          type="checkbox"
                          checked={draft.is_open}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(day.id, { is_open: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-brand-accent"
                        />
                        Abierto
                      </label>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                          Capacidad maxima
                        </p>
                        <Input
                          type="number"
                          min={0}
                          value={draft.max_capacity}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(day.id, { max_capacity: event.target.value })
                          }
                          className="h-9"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-brand-dark">
                        <input
                          type="checkbox"
                          checked={draft.is_special}
                          disabled={feedback.isSaving}
                          onChange={(event) =>
                            updateDraft(day.id, { is_special: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-brand-accent"
                        />
                        Dia especial
                      </label>

                      <div className="space-y-1 lg:col-span-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/70">
                          Nota
                        </p>
                        <Input
                          type="text"
                          value={draft.note}
                          disabled={feedback.isSaving}
                          onChange={(event) => updateDraft(day.id, { note: event.target.value })}
                          placeholder="Opcional"
                          className="h-9"
                        />
                      </div>

                      {feedback.error && (
                        <p className="text-xs text-destructive lg:col-span-3">{feedback.error}</p>
                      )}
                      {feedback.success && (
                        <p className="text-xs text-emerald-700 lg:col-span-3">{feedback.success}</p>
                      )}

                      <div className="lg:col-span-1 lg:justify-self-end">
                        <Button
                          type="button"
                          className="w-full bg-brand-primary text-white hover:bg-brand-primary/90 lg:w-auto"
                          disabled={feedback.isSaving}
                          onClick={() => {
                            void handleSaveRow(day);
                          }}
                        >
                          {feedback.isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
