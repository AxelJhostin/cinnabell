import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Navbar() {
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

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-brand-dark sm:hidden"
            aria-label="Carrito"
          >
            <ShoppingBag />
          </Button>
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
            Menú
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <Link href="/registro">Registro</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden text-brand-dark sm:inline-flex"
            aria-label="Carrito"
          >
            <ShoppingBag />
          </Button>
        </div>
      </div>
    </header>
  );
}
