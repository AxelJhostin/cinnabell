"""
Script de bootstrap para promover un usuario existente a admin.

Uso base:
  python bootstrap_admin.py --email usuario@correo.com

Ejemplo con seguridad en produccion:
  python bootstrap_admin.py --email usuario@correo.com --allow-production

Opcional (solo si no existe y quieres crearlo desde CLI):
  python bootstrap_admin.py --email usuario@correo.com --create-if-missing --name "Admin Inicial"
"""

from __future__ import annotations

import argparse
import getpass
import re
import sys
from urllib.parse import urlsplit

from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _sanitize_database_url(database_url: str) -> str:
    parsed = urlsplit(database_url)
    if not parsed.scheme:
        return "<DATABASE_URL invalida>"

    host = parsed.hostname or "<host>"
    port = f":{parsed.port}" if parsed.port else ""
    database_name = parsed.path.lstrip("/") or "<db>"
    return f"{parsed.scheme}://{host}{port}/{database_name}"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Promueve un usuario existente a rol admin en Cinnabell."
    )
    parser.add_argument("--email", help="Email del usuario a promover.")
    parser.add_argument(
        "--create-if-missing",
        action="store_true",
        help="Si el usuario no existe, permite crearlo con rol admin.",
    )
    parser.add_argument("--name", help="Nombre del usuario (solo con --create-if-missing).")
    parser.add_argument(
        "--password", help="Contrasena del usuario (solo con --create-if-missing)."
    )
    parser.add_argument("--phone", help="Telefono opcional para creacion.", default=None)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra que se haria sin persistir cambios en base de datos.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Evita confirmaciones interactivas.",
    )
    parser.add_argument(
        "--allow-production",
        action="store_true",
        help="Permite ejecutar si ENVIRONMENT=production.",
    )
    return parser.parse_args()


def _validate_runtime_environment(args: argparse.Namespace) -> None:
    environment = settings.ENVIRONMENT.strip().lower()
    safe_database_url = _sanitize_database_url(settings.DATABASE_URL)
    print(f"[INFO] ENVIRONMENT={environment}")
    print(f"[INFO] DATABASE={safe_database_url}")

    if environment == "production" and not args.allow_production:
        raise ValueError(
            "Bloqueado por seguridad: ENVIRONMENT=production. "
            "Si confirmas el entorno, vuelve a ejecutar con --allow-production."
        )


def _resolve_email(args: argparse.Namespace) -> str:
    email = args.email or input("Ingresa el email del usuario a promover: ").strip()
    if not email:
        raise ValueError("Debes ingresar un email valido.")

    normalized = _normalize_email(email)
    if not EMAIL_REGEX.match(normalized):
        raise ValueError("El email no tiene un formato valido.")

    return normalized


def _resolve_creation_data(args: argparse.Namespace) -> tuple[str, str]:
    name = (args.name or "").strip()
    if not name:
        name = input("Usuario no existe. Ingresa nombre para crear admin inicial: ").strip()

    password = args.password or ""
    if not password:
        password = getpass.getpass("Ingresa contrasena para el admin inicial: ").strip()

    if not name:
        raise ValueError("El nombre es obligatorio para crear el admin inicial.")
    if len(password) < 8:
        raise ValueError("La contrasena debe tener al menos 8 caracteres.")

    return name, password


def _confirm_or_abort(args: argparse.Namespace, message: str) -> bool:
    if args.yes:
        return True

    response = input(f"{message} [y/N]: ").strip().lower()
    return response in {"y", "yes", "s", "si"}


def promote_or_create_admin(args: argparse.Namespace) -> int:
    try:
        _validate_runtime_environment(args)
        email = _resolve_email(args)
    except ValueError as error:
        print(f"[ERROR] {error}")
        return 2

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            if user.role == UserRole.admin:
                print(f"[OK] El usuario {email} ya tiene rol admin. No se realizaron cambios.")
                return 0

            if args.dry_run:
                print(f"[DRY-RUN] Se promoveria a admin el usuario existente: {email}")
                return 0

            if not _confirm_or_abort(args, f"Confirmar promocion a admin para {email}?"):
                print("[INFO] Operacion cancelada por usuario.")
                return 0

            user.role = UserRole.admin
            db.commit()
            print(f"[OK] Usuario promovido a admin: {email}")
            return 0

        if not args.create_if_missing:
            print(
                f"[INFO] No existe usuario con email {email}. "
                "No se realizaron cambios. Usa --create-if-missing si deseas crearlo."
            )
            return 1

        try:
            name, password = _resolve_creation_data(args)
        except ValueError as error:
            print(f"[ERROR] {error}")
            return 2

        if args.dry_run:
            print(f"[DRY-RUN] Se crearia un nuevo admin: {email}")
            return 0

        if not _confirm_or_abort(args, f"Confirmar creacion de admin inicial para {email}?"):
            print("[INFO] Operacion cancelada por usuario.")
            return 0

        new_user = User(
            name=name,
            email=email,
            phone=args.phone,
            password_hash=get_password_hash(password),
            role=UserRole.admin,
        )
        db.add(new_user)
        db.commit()
        print(f"[OK] Admin creado correctamente: {email}")
        return 0
    except SQLAlchemyError as error:
        db.rollback()
        print(f"[ERROR] No se pudo completar la operacion en base de datos: {error}")
        return 1
    except Exception as error:  # pragma: no cover - seguridad defensiva para CLI
        db.rollback()
        print(f"[ERROR] Fallo inesperado: {error}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    cli_args = _parse_args()
    sys.exit(promote_or_create_admin(cli_args))
