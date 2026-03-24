"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const mobileAccountMenuRef = useRef<HTMLDivElement | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const isProtectedPath =
      pathname.startsWith("/mi-cuenta") || pathname.startsWith("/admin");
    if (!isProtectedPath || isAuthenticated || isLoading) return;
    void fetchMe();
  }, [fetchMe, isAuthenticated, isLoading, pathname]);

  useEffect(() => {
    setIsMobileAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileAccountMenuOpen) return;

    const handlePointerDown = (event: Event) => {
      if (
        mobileAccountMenuRef.current &&
        !mobileAccountMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMobileAccountMenuOpen]);

  const toggleMobileAccountMenu = () => {
    setIsMobileAccountMenuOpen((current) => {
      const next = !current;
      if (next && !isAuthenticated && !hasCheckedSession) {
        void fetchMe();
      }
      return next;
    });
  };

  const closeMobileAccountMenu = () => {
    setIsMobileAccountMenuOpen(false);
  };

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      closeMobileAccountMenu();
      router.push("/");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "No se pudo cerrar sesion.");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-secondary/55 bg-brand-soft/95 text-brand-dark backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="space-y-3 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight text-brand-primary"
            >
              Cinnabell
            </Link>

            <div className="flex items-center gap-1.5">
              <CartDrawer triggerClassName="text-brand-dark" />
              <div className="relative" ref={mobileAccountMenuRef}>
                <button
                  type="button"
                  onClick={toggleMobileAccountMenu}
                  className="flex h-11 items-center rounded-2xl border border-brand-primary/35 bg-white/80 px-4 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-soft"
                  aria-expanded={isMobileAccountMenuOpen}
                  aria-haspopup="menu"
                >
                  {isAuthenticated && user ? "Cuenta" : "Acceder"}
                </button>
                {isMobileAccountMenuOpen && (
                  <div
                    className="absolute right-0 top-12 z-50 w-52 space-y-1 rounded-2xl border border-brand-secondary/60 bg-white p-2 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                    role="menu"
                  >
                    {isAuthenticated && user ? (
                      <>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block rounded-xl px-3 py-2 text-sm text-brand-dark transition-colors hover:bg-brand-soft"
                            onClick={closeMobileAccountMenu}
                          >
                            Panel admin
                          </Link>
                        )}
                        <Link
                          href="/mi-cuenta"
                          className="block rounded-xl px-3 py-2 text-sm text-brand-dark transition-colors hover:bg-brand-soft"
                          onClick={closeMobileAccountMenu}
                        >
                          Mi cuenta
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start px-3"
                          onClick={() => void handleLogout()}
                          disabled={isLoading}
                        >
                          {isLoading ? "Saliendo..." : "Salir"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block rounded-xl px-3 py-2 text-sm text-brand-dark transition-colors hover:bg-brand-soft"
                          onClick={closeMobileAccountMenu}
                        >
                          Login
                        </Link>
                        <Link
                          href="/registro"
                          className="block rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primaryHover"
                          onClick={closeMobileAccountMenu}
                        >
                          Registro
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="rounded-2xl bg-white/75 px-4 py-2.5 text-center text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/45"
            >
              Inicio
            </Link>
            <Link
              href="/menu"
              className="rounded-2xl bg-white/75 px-4 py-2.5 text-center text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/45"
            >
              Menu
            </Link>
          </nav>
        </div>

        <div className="hidden items-center justify-between gap-4 sm:flex">
          <Link
            href="/"
            className="font-display text-3xl font-semibold tracking-tight text-brand-primary"
          >
            Cinnabell
          </Link>

          <nav className="flex items-center gap-2">
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

          <div className="flex flex-wrap items-center justify-end gap-2">
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
            <CartDrawer triggerClassName="text-brand-dark" />
          </div>
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
