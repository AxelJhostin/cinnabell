"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export function Navbar() {
  const router = useRouter();
  const sessionCheckedRef = useRef(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;
    void fetchMe();
  }, [fetchMe]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "No se pudo cerrar sesion.");
    }
  };

  return (
    <header className="border-b bg-brand-soft text-brand-dark">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between sm:justify-start">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-brand-primary"
          >
            Cinnabell
          </Link>

          <CartDrawer triggerClassName="text-brand-dark sm:hidden" />
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-accent/50"
          >
            Inicio
          </Link>
          <Link
            href="/menu"
            className="rounded-md px-2 py-1 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-accent/50"
          >
            Menu
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {isAdmin && (
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/admin">Panel admin</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/mi-cuenta">Mi cuenta</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                onClick={() => void handleLogout()}
                disabled={isLoading}
              >
                {isLoading ? "Saliendo..." : "Salir"}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
                <Link href="/registro">Registro</Link>
              </Button>
            </>
          )}
          <CartDrawer triggerClassName="hidden text-brand-dark sm:inline-flex" />
        </div>
      </div>

      {logoutError && (
        <div className="border-t bg-white px-4 py-2 text-center text-xs text-destructive sm:px-6">
          {logoutError}
        </div>
      )}
    </header>
  );
}
