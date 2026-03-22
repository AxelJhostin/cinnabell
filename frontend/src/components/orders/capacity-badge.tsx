import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CapacityState = "available" | "low" | "full" | "closed";

type CapacityBadgeProps = {
  isOpen: boolean;
  availableSlots?: number | null;
  currentOrders?: number;
  maxCapacity?: number;
  className?: string;
};

type CapacityMeta = {
  state: CapacityState;
  label: string;
  availableSlots: number;
};

export function getCapacityMeta({
  isOpen,
  availableSlots,
  currentOrders,
  maxCapacity,
}: Pick<
  CapacityBadgeProps,
  "isOpen" | "availableSlots" | "currentOrders" | "maxCapacity"
>): CapacityMeta {
  const safeMaxCapacity =
    typeof maxCapacity === "number" ? Math.max(0, maxCapacity) : 0;
  const resolvedAvailableSlots =
    typeof availableSlots === "number"
      ? Math.max(0, availableSlots)
      : Math.max(0, safeMaxCapacity - (currentOrders ?? 0));

  if (!isOpen) {
    return {
      state: "closed",
      label: "Cerrado",
      availableSlots: resolvedAvailableSlots,
    };
  }

  if (resolvedAvailableSlots <= 0) {
    return {
      state: "full",
      label: "Sin cupos",
      availableSlots: resolvedAvailableSlots,
    };
  }

  const hasLowCapacity =
    resolvedAvailableSlots <= 5 ||
    (safeMaxCapacity > 0 && resolvedAvailableSlots / safeMaxCapacity <= 0.25);

  if (hasLowCapacity) {
    return {
      state: "low",
      label: "Pocos cupos",
      availableSlots: resolvedAvailableSlots,
    };
  }

  return {
    state: "available",
    label: "Disponible",
    availableSlots: resolvedAvailableSlots,
  };
}

const STATE_CLASSNAME: Record<CapacityState, string> = {
  available: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-800",
  full: "bg-red-100 text-red-800",
  closed: "bg-slate-200 text-slate-700",
};

export function CapacityBadge({
  isOpen,
  availableSlots,
  currentOrders,
  maxCapacity,
  className,
}: CapacityBadgeProps) {
  const meta = getCapacityMeta({
    isOpen,
    availableSlots,
    currentOrders,
    maxCapacity,
  });

  const slotsLabel =
    meta.state === "available" || meta.state === "low"
      ? ` - ${meta.availableSlots} cupos`
      : "";

  return (
    <Badge className={cn("font-medium", STATE_CLASSNAME[meta.state], className)}>
      {meta.label}
      {slotsLabel}
    </Badge>
  );
}
