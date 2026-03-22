import { create } from "zustand";

import { ApiError, api } from "@/lib/api";

export type UserRole = "client" | "admin";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string | null;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

type AuthStore = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchMe: () => Promise<AuthUser | null>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutLocal: () => void;
};

function toStoreError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error(fallbackMessage);
}

export const useAuthStore = create<AuthStore>((set, get) => {
  let pendingActions = 0;

  const startLoading = () => {
    pendingActions += 1;
    set({ isLoading: true });
  };

  const stopLoading = () => {
    pendingActions = Math.max(0, pendingActions - 1);
    set({ isLoading: pendingActions > 0 });
  };

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,

    fetchMe: async () => {
      startLoading();
      try {
        const user = await api.get<AuthUser>("/auth/me");
        set({ user, isAuthenticated: true });
        return user;
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
          const shouldLog =
            error instanceof ApiError
              ? error.isNetworkError || error.status === null || error.status >= 500
              : true;

          if (shouldLog) {
            console.error("Error real al reconstruir sesion en /auth/me", error);
          }
        }

        set({ user: null, isAuthenticated: false });
        return null;
      } finally {
        stopLoading();
      }
    },

    login: async (payload) => {
      startLoading();
      try {
        await api.post<{ message: string }>("/auth/login", payload);
        const user = await get().fetchMe();

        if (!user) {
          throw new Error("No se pudo recuperar la sesión del usuario.");
        }

        return user;
      } catch (error) {
        set({ user: null, isAuthenticated: false });
        throw toStoreError(error, "No se pudo iniciar sesión.");
      } finally {
        stopLoading();
      }
    },

    register: async (payload) => {
      startLoading();
      try {
        const createdUser = await api.post<AuthUser>("/auth/register", payload);
        return createdUser;
      } catch (error) {
        throw toStoreError(error, "No se pudo completar el registro.");
      } finally {
        stopLoading();
      }
    },

    logout: async () => {
      startLoading();
      try {
        await api.post<{ message: string }>("/auth/logout");
      } catch (error) {
        throw toStoreError(error, "No se pudo cerrar sesion.");
      } finally {
        set({
          user: null,
          isAuthenticated: false,
        });
        stopLoading();
      }
    },

    logoutLocal: () => {
      set({
        user: null,
        isAuthenticated: false,
      });
    },
  };
});
