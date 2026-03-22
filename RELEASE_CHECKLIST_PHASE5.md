# Cinnabell - Checklist de Release Fase 5

## 1) Configuracion de entorno
- Backend:
  - Copiar `backend/.env.example` a `backend/.env`.
  - Confirmar `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, `ENVIRONMENT`.
  - En produccion usar `ENVIRONMENT=production`.
- Frontend:
  - Copiar `frontend/.env.example` a `frontend/.env`.
  - Confirmar `NEXT_PUBLIC_API_URL` segun entorno.

## 2) Base de datos y migraciones
- Ejecutar en backend:
  - `alembic upgrade head`
- Verificar que la migracion monetaria quede aplicada:
  - `1d4f2c9a8b7e_harden_money_precision_numeric`

## 3) Usuario administrador
- Promover admin inicial:
  - `python bootstrap_admin.py --email <admin@email> --allow-production`
- Validar acceso:
  - login admin
  - acceso correcto a `/admin`

## 4) Smoke test funcional minimo
- Publico:
  - Landing y `/menu` cargan sin errores.
  - `/menu/[slug]` muestra detalle.
- Pedido:
  - Flujo invitado crea pedido.
  - Flujo autenticado crea pedido asociado a `user_id`.
  - `/pedido/[token]` muestra tracking.
- Admin:
  - `/admin` dashboard con datos.
  - `/admin/pedidos`, `/admin/productos`, `/admin/calendario`, `/admin/clientes`, `/admin/reportes` cargan y operan.

## 5) Validacion de dinero y reportes
- Confirmar en DB:
  - `products.price`, `product_flavors.extra_price`, `orders.total`, `order_items.unit_price`, `order_items.subtotal` en `NUMERIC(10,2)`.
- Confirmar API:
  - Totales y ticket promedio coherentes (sin ruido de precision).

## 6) Build y calidad
- Frontend:
  - `npm run lint`
  - `npm run build`
- Backend:
  - `python -m compileall app`

## 7) Release
- Desplegar backend (Render).
- Desplegar frontend (Vercel).
- Verificar CORS/cookies en produccion:
  - login -> `/auth/me` -> rutas protegidas.
- Verificar salud final:
  - pedidos, tracking y panel admin operativos.
