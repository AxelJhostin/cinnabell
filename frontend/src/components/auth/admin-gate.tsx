"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type AuthMeResponse = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "client" | "admin";
  created_at: string | null;
};

type GateStatus = "checking" | "allowed" | "forbidden" | "error";

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const logoutLocal = useAuthStore((state) => state.logoutLocal);
  const [status, setStatus] = useState<GateStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function validateAdminAccess() {
      setStatus("checking");
      setErrorMessage(null);

      try {
        const user = await api.get<AuthMeResponse>("/auth/me");
        if (!isMounted) return;

        if (user.role !== "admin") {
          setStatus("forbidden");
          setErrorMessage("No tienes permisos de administrador para acceder a esta area.");
          logoutLocal();
          return;
        }

        setStatus("allowed");
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "No se pudo validar tu sesion.";

        if (message.toLowerCase().includes("no autenticado")) {
          logoutLocal();
          router.replace("/login?next=/admin");
          return;
        }

        if (message.toLowerCase().includes("no autorizado")) {
          setStatus("forbidden");
          setErrorMessage("No tienes permisos de administrador para acceder a esta area.");
          return;
        }

        setStatus("error");
        setErrorMessage(message);
      }
    }

    void validateAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [logoutLocal, retryKey, router]);

  useEffect(() => {
    if (status !== "forbidden") return;

    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, status]);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (status === "checking") {
    return (
      <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
        <Card className="mx-auto w-full max-w-2xl bg-white ring-brand-accent/60">
          <CardContent className="pt-6 text-center text-sm text-brand-dark/80">
            Validando acceso de administrador...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
        <Card className="mx-auto w-full max-w-2xl bg-white ring-brand-accent/60">
          <CardContent className="pt-6 text-center">
            <h2 className="font-display text-2xl text-brand-dark">No autorizado</h2>
            <p className="mt-2 text-sm text-brand-dark/80">
              {errorMessage ?? "No tienes permisos para acceder a esta seccion."}
            </p>
            <p className="mt-2 text-xs text-brand-dark/60">Te redirigimos al inicio...</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
              onClick={() => router.replace("/")}
            >
              Ir ahora al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <Card className="mx-auto w-full max-w-2xl bg-white ring-brand-accent/60">
        <CardContent className="pt-6 text-center">
          <h2 className="font-display text-2xl text-brand-dark">No se pudo cargar el panel</h2>
          <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
