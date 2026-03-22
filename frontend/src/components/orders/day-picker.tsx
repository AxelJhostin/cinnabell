"use client";

import { useEffect, useMemo, useState } from "react";

import { CapacityBadge, getCapacityMeta } from "@/components/orders/capacity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export type OrderDayAvailability = {
  id: number;
  date: string;
  is_open: boolean;
  max_capacity: number;
  current_orders: number;
  available_slots?: number;
  is_special: boolean;
  note: string | null;
};

type DayPickerProps = {
  value?: string;
  onChange?: (date: string) => void;
  className?: string;
};

const dayFormatter = new Intl.DateTimeFormat("es-EC", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatFriendlyDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  const text = dayFormatter.format(parsedDate);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  return fullDateFormatter.format(parsedDate);
}

export function DayPicker({ value, onChange, className }: DayPickerProps) {
  const [days, setDays] = useState<OrderDayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState<string>("");

  const selectedValue = value ?? internalValue;

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDays() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<OrderDayAvailability[]>("/order-days");
        if (!isMounted) return;
        setDays(data);
      } catch (requestError) {
        if (!isMounted) return;
        setDays([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la disponibilidad."
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
  }, []);

  const hasDays = useMemo(() => days.length > 0, [days]);

  const handleSelect = (day: OrderDayAvailability) => {
    const capacityMeta = getCapacityMeta({
      isOpen: day.is_open,
      availableSlots: day.available_slots,
      currentOrders: day.current_orders,
      maxCapacity: day.max_capacity,
    });
    const isDisabled = capacityMeta.state === "closed" || capacityMeta.state === "full";

    if (isDisabled) return;

    if (value === undefined) {
      setInternalValue(day.date);
    }
    onChange?.(day.date);
  };

  if (isLoading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-white/70 ring-1 ring-brand-accent/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-2xl bg-white p-5 text-center ring-1 ring-brand-accent/60", className)}>
        <p className="font-medium text-brand-dark">No pudimos cargar los dias de pedido.</p>
        <p className="mt-1 text-xs text-brand-dark/75">{error}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!hasDays) {
    return (
      <div className={cn("rounded-2xl bg-white p-5 text-center ring-1 ring-brand-accent/60", className)}>
        <p className="font-medium text-brand-dark">No hay dias habilitados por ahora.</p>
        <p className="mt-1 text-xs text-brand-dark/75">
          Pronto publicaremos nuevas fechas de pedido.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {days.map((day) => {
        const capacityMeta = getCapacityMeta({
          isOpen: day.is_open,
          availableSlots: day.available_slots,
          currentOrders: day.current_orders,
          maxCapacity: day.max_capacity,
        });
        const isSelected = selectedValue === day.date;
        const isDisabled = capacityMeta.state === "closed" || capacityMeta.state === "full";

        return (
          <button
            key={day.id}
            type="button"
            onClick={() => handleSelect(day)}
            disabled={isDisabled}
            className={cn(
              "w-full rounded-2xl border bg-white p-4 text-left transition",
              "border-brand-accent/60 ring-1 ring-transparent",
              "hover:border-brand-primary/50 hover:ring-brand-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-70",
              isSelected && "border-brand-primary ring-brand-primary/35"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-dark">{formatFriendlyDate(day.date)}</p>
                <p className="text-xs text-brand-dark/70">{formatFullDate(day.date)}</p>
              </div>
              {day.is_special && (
                <Badge className="bg-brand-primary/15 text-brand-primary">Especial</Badge>
              )}
            </div>

            <div className="mt-3">
              <CapacityBadge
                isOpen={day.is_open}
                availableSlots={day.available_slots}
                currentOrders={day.current_orders}
                maxCapacity={day.max_capacity}
              />
            </div>

            {day.note && <p className="mt-2 text-xs text-brand-dark/75">{day.note}</p>}
          </button>
        );
      })}
    </div>
  );
}
