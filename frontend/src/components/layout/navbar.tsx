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
    <header className="sticky top-0 z-40 border-b border-brand-secondary/55 bg-brand-soft/95 text-brand-dark backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-brand-primary sm:text-3xl"
          >
            Cinnabell
          </Link>

          <CartDrawer triggerClassName="text-brand-dark sm:hidden" />
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/45"
          >
            Inicio
          </Link>
          <Link
            href="/menu"
            className="rounded-xl px-3 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/45"
          >
            Menu
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {isAdmin && (
                <Button asChild variant="outline" className="bg-white/75">
                  <Link href="/admin">Panel admin</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="bg-white/75">
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
              <Button asChild variant="outline" className="bg-white/75">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-brand-primary text-white hover:bg-brand-primaryHover">
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
