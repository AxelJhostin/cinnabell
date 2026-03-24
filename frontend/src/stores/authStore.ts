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
  hasCheckedSession: boolean;
  fetchMe: (options?: { force?: boolean }) => Promise<AuthUser | null>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutLocal: () => void;
};

const GUEST_CACHE_KEY = "cinnabell-auth-guest";
const AUTH_USER_CACHE_KEY = "cinnabell-auth-user";

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined";
}

function hasGuestCache(): boolean {
  if (!isBrowserEnvironment()) return false;
  return window.sessionStorage.getItem(GUEST_CACHE_KEY) === "1";
}

function getCachedUser(): AuthUser | null {
  if (!isBrowserEnvironment()) return null;

  const rawUser = window.localStorage.getItem(AUTH_USER_CACHE_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_CACHE_KEY);
    return null;
  }
}

function setGuestCache(value: boolean): void {
  if (!isBrowserEnvironment()) return;
  if (value) {
    window.sessionStorage.setItem(GUEST_CACHE_KEY, "1");
    return;
  }
  window.sessionStorage.removeItem(GUEST_CACHE_KEY);
}

function setCachedUser(user: AuthUser | null): void {
  if (!isBrowserEnvironment()) return;

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
}

function toStoreError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error(fallbackMessage);
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const initialUser = getCachedUser();
  const initialIsAuthenticated = Boolean(initialUser);
  const initialHasCheckedSession = initialIsAuthenticated || hasGuestCache();
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
    user: initialUser,
    isAuthenticated: initialIsAuthenticated,
    isLoading: false,
    hasCheckedSession: initialHasCheckedSession,

    fetchMe: async (options) => {
      const shouldSkipRequest =
        !options?.force &&
        ((get().hasCheckedSession && !get().isAuthenticated) || hasGuestCache());
      if (shouldSkipRequest) {
        return null;
      }

      startLoading();
      try {
        const user = await api.get<AuthUser>("/auth/me");
        setCachedUser(user);
        setGuestCache(false);
        set({ user, isAuthenticated: true, hasCheckedSession: true });
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
        } else {
          setGuestCache(true);
        }

        setCachedUser(null);
        set({ user: null, isAuthenticated: false, hasCheckedSession: true });
        return null;
      } finally {
        stopLoading();
      }
    },

    login: async (payload) => {
      startLoading();
      try {
        await api.post<{ message: string }>("/auth/login", payload);
        const user = await get().fetchMe({ force: true });

        if (!user) {
          throw new Error("No se pudo recuperar la sesión del usuario.");
        }

        setGuestCache(false);
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
        setCachedUser(null);
        setGuestCache(true);
        set({
          user: null,
          isAuthenticated: false,
          hasCheckedSession: true,
        });
        stopLoading();
      }
    },

    logoutLocal: () => {
      setCachedUser(null);
      setGuestCache(true);
      set({
        user: null,
        isAuthenticated: false,
        hasCheckedSession: true,
      });
    },
  };
});
