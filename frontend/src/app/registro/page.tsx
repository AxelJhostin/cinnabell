"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .email("Ingresa un correo valido."),
  phone: z
    .string()
    .trim()
    .max(30, "El telefono no puede exceder 30 caracteres.")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegistroPage() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
        password: values.password,
      });

      setSubmitSuccess("Cuenta creada con exito. Redirigiendo a login...");
      reset();

      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/login?registered=1");
      }, 1200);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo completar el registro."
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
              Crea tu cuenta
            </CardTitle>
            <p className="text-sm text-brand-dark/80">
              Registrate para gestionar tus pedidos mas facilmente.
            </p>
          </CardHeader>

          <CardContent>
            {submitSuccess && (
              <div className="mb-4 rounded-md bg-brand-accent/40 px-3 py-2 text-xs font-medium text-brand-dark">
                {submitSuccess}
              </div>
            )}

            {submitError && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

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
                <Label htmlFor="phone">Telefono (opcional)</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="0999999999"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
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
                {isLoading ? "Creando cuenta..." : "Registrarme"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-brand-dark/80">
              Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-brand-primary underline-offset-4 hover:underline"
              >
                Inicia sesion aqui
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
