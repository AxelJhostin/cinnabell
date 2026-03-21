"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .email("Ingresa un correo valido."),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function resolveNextPath(nextParam: string | null): string {
  if (!nextParam) return "/mi-cuenta";
  if (nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return "/mi-cuenta";
}

function LoginPageFallback() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="h-[380px] animate-pulse rounded-lg bg-white/80 ring-1 ring-brand-accent/60" />
      </div>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const registeredNotice = useMemo(
    () => searchParams.get("registered") === "1",
    [searchParams]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(values);
      router.push(resolveNextPath(searchParams.get("next")));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo iniciar sesion."
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-brand-soft px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <Card className="bg-white ring-brand-accent/60">
          <CardHeader className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              Cinnabell
            </p>
            <CardTitle className="font-display text-3xl text-brand-dark">
              Inicia sesion
            </CardTitle>
            <p className="text-sm text-brand-dark/80">
              Ingresa para continuar con tus pedidos.
            </p>
          </CardHeader>

          <CardContent>
            {registeredNotice && (
              <div className="mb-4 rounded-md bg-brand-accent/40 px-3 py-2 text-xs font-medium text-brand-dark">
                Tu cuenta fue creada con exito. Ahora puedes iniciar sesion.
              </div>
            )}

            {submitError && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu-correo@ejemplo.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Entrar"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-brand-dark/80">
              Aun no tienes cuenta?{" "}
              <Link
                href="/registro"
                className="font-medium text-brand-primary underline-offset-4 hover:underline"
              >
                Registrate aqui
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
