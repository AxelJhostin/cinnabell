import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ProductCategory = "individual" | "especial" | "box";

export type SelectedFlavor = {
  flavorId?: number;
  name: string;
  extraPrice?: number;
};

export type CartItem = {
  lineId: string;
  productId: number;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  imageUrl?: string | null;
  selectedFlavors?: SelectedFlavor[];
};

export type AddCartItemInput = Omit<CartItem, "lineId"> & {
  lineId?: string;
};

type CartStore = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  hasHydrated: boolean;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (value: boolean) => void;
};

function normalizeFlavors(flavors?: SelectedFlavor[]): SelectedFlavor[] {
  if (!flavors || flavors.length === 0) {
    return [];
  }

  return flavors
    .map((flavor) => ({
      flavorId: flavor.flavorId,
      name: flavor.name,
      extraPrice: flavor.extraPrice ?? 0,
    }))
    .sort((a, b) => {
      const aKey = `${a.flavorId ?? ""}-${a.name}-${a.extraPrice ?? 0}`;
      const bKey = `${b.flavorId ?? ""}-${b.name}-${b.extraPrice ?? 0}`;
      return aKey.localeCompare(bKey);
    });
}

function haveSameConfiguration(a: AddCartItemInput, b: CartItem): boolean {
  if (a.productId !== b.productId) {
    return false;
  }

  const aFlavors = normalizeFlavors(a.selectedFlavors);
  const bFlavors = normalizeFlavors(b.selectedFlavors);

  if (aFlavors.length !== bFlavors.length) {
    return false;
  }

  return aFlavors.every((flavor, index) => {
    const other = bFlavors[index];
    return (
      flavor.flavorId === other.flavorId &&
      flavor.name === other.name &&
      (flavor.extraPrice ?? 0) === (other.extraPrice ?? 0)
    );
  });
}

function buildLineId(item: AddCartItemInput): string {
  const flavors = normalizeFlavors(item.selectedFlavors);
  const flavorKey =
    flavors.length === 0
      ? "no-flavors"
      : flavors
          .map(
            (flavor) =>
              `${flavor.flavorId ?? "na"}:${flavor.name}:${flavor.extraPrice ?? 0}`
          )
          .join("|");

  return `${item.productId}__${flavorKey}`;
}

function recalculateTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return { totalItems, totalPrice: Number(totalPrice.toFixed(2)) };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      hasHydrated: false,

      addItem: (incomingItem) =>
        set((state) => {
          const incomingQuantity = Math.max(1, Math.floor(incomingItem.quantity));
          const existingIndex = state.items.findIndex((item) =>
            haveSameConfiguration(incomingItem, item)
          );

          let nextItems: CartItem[];

          if (existingIndex >= 0) {
            nextItems = state.items.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + incomingQuantity }
                : item
            );
          } else {
            const newItem: CartItem = {
              ...incomingItem,
              lineId: incomingItem.lineId ?? buildLineId(incomingItem),
              quantity: incomingQuantity,
              selectedFlavors: normalizeFlavors(incomingItem.selectedFlavors),
            };
            nextItems = [...state.items, newItem];
          }

          return {
            items: nextItems,
            ...recalculateTotals(nextItems),
          };
        }),

      removeItem: (lineId) =>
        set((state) => {
          const nextItems = state.items.filter((item) => item.lineId !== lineId);
          return {
            items: nextItems,
            ...recalculateTotals(nextItems),
          };
        }),

      updateQuantity: (lineId, quantity) =>
        set((state) => {
          const normalizedQuantity = Math.floor(quantity);

          let nextItems: CartItem[];
          if (normalizedQuantity <= 0) {
            nextItems = state.items.filter((item) => item.lineId !== lineId);
          } else {
            nextItems = state.items.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: normalizedQuantity }
                : item
            );
          }

          return {
            items: nextItems,
            ...recalculateTotals(nextItems),
          };
        }),

      clearCart: () =>
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "cinnabell-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persistedItems = Array.isArray((persistedState as { items?: unknown })?.items)
          ? ((persistedState as { items: CartItem[] }).items ?? [])
          : [];

        return {
          ...currentState,
          items: persistedItems,
          ...recalculateTotals(persistedItems),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
