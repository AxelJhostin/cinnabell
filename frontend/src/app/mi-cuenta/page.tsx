"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export default function MiCuentaPage() {
  const router = useRouter();
  const sessionCheckedRef = useRef(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;
    void (async () => {
      const currentUser = await fetchMe();
      if (!currentUser) {
        router.replace("/login?next=/mi-cuenta");
      }
    })();
  }, [fetchMe, router]);

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
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-accent/60 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
          Cinnabell
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">
          Mi cuenta
        </h1>
        <p className="mt-3 text-sm text-brand-dark/80 sm:text-base">
          {user?.name
            ? `Bienvenido, ${user.name}. Desde aqui puedes revisar el estado y el historial de tus pedidos.`
            : "Bienvenido a tu espacio personal. Desde aqui puedes revisar el estado y el historial de tus pedidos."}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          {isAdmin && (
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/admin">Volver al panel admin</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/mi-cuenta/pedidos">Ver mis pedidos</Link>
          </Button>
          <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <Link href="/menu">Ir al menu</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
            onClick={() => void handleLogout()}
            disabled={isLoading}
          >
            {isLoading ? "Cerrando sesion..." : "Cerrar sesion"}
          </Button>
        </div>

        {logoutError && <p className="mt-3 text-xs text-destructive">{logoutError}</p>}
      </section>
    </div>
  );
}
