import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CapacityState = "available" | "low" | "full" | "closed";

type CapacityBadgeProps = {
  isOpen: boolean;
  currentOrders: number;
  maxCapacity: number;
  className?: string;
};

type CapacityMeta = {
  state: CapacityState;
  label: string;
  availableSlots: number;
};

export function getCapacityMeta({
  isOpen,
  currentOrders,
  maxCapacity,
}: Pick<CapacityBadgeProps, "isOpen" | "currentOrders" | "maxCapacity">): CapacityMeta {
  const safeMaxCapacity = Math.max(0, maxCapacity);
  const availableSlots = Math.max(0, safeMaxCapacity - currentOrders);

  if (!isOpen) {
    return { state: "closed", label: "Cerrado", availableSlots };
  }

  if (safeMaxCapacity <= 0 || availableSlots <= 0) {
    return { state: "full", label: "Sin cupos", availableSlots };
  }

  const hasLowCapacity = availableSlots <= 5 || availableSlots / safeMaxCapacity <= 0.25;
  if (hasLowCapacity) {
    return { state: "low", label: "Pocos cupos", availableSlots };
  }

  return { state: "available", label: "Disponible", availableSlots };
}

const STATE_CLASSNAME: Record<CapacityState, string> = {
  available: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-800",
  full: "bg-red-100 text-red-800",
  closed: "bg-slate-200 text-slate-700",
};

export function CapacityBadge({
  isOpen,
  currentOrders,
  maxCapacity,
  className,
}: CapacityBadgeProps) {
  const meta = getCapacityMeta({ isOpen, currentOrders, maxCapacity });
  const slotsLabel =
    meta.state === "available" || meta.state === "low"
      ? ` • ${meta.availableSlots} cupos`
      : "";

  return (
    <Badge className={cn("font-medium", STATE_CLASSNAME[meta.state], className)}>
      {meta.label}
      {slotsLabel}
    </Badge>
  );
}
