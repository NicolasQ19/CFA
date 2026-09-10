# CFA — Contrataciones de Fútbol Argentino

Proyecto final UNAHUR. Plataforma que conecta candidatos, representantes y clubes
de fútbol argentino. Ver `CFA_BRD.pdf` para el detalle de requerimientos.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/Datos**: Supabase (Postgres + Auth + Row Level Security)
- **Deploy**: Vercel

## Estructura del código

- `src/app/` — rutas de Next.js (páginas). Nombres en español, iguales a las
  rutas que ve el usuario (`/ofertas`, `/mi-perfil`, `/mis-ofertas`, etc.).
- `src/dominio/` — lógica de negocio agrupada por contexto, siguiendo el
  vocabulario del BRD: `autenticacion`, `perfiles`, `ofertas`, `postulaciones`.
  Cada carpeta tiene `acciones.ts` (Server Actions, escriben datos) y
  `consultas.ts` (lectura de datos).
- `src/tipos/` — tipos compartidos: `dominio.ts` (enums del negocio, con sus
  etiquetas en español para la UI) y `base-de-datos.ts` (forma de las tablas
  de Supabase).
- `src/lib/supabase/` — configuración de los clientes de Supabase (navegador,
  servidor y middleware de sesión).
- `supabase/migrations/` — esquema SQL de la base de datos y políticas RLS.

## Poner en marcha el proyecto

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor de Supabase, ejecutar en orden los archivos de
   `supabase/migrations/` (`0001_esquema_inicial.sql`, luego `0002_seguridad_rls.sql`).
3. Copiar `env.example` a `.env.local` y completar con la URL y la anon key
   del proyecto (Project Settings → API).
4. Instalar dependencias y levantar el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run lint    # ESLint
```

## Estado del MVP

Implementado:
- Registro e inicio de sesión con rol (candidato, representante, club, administrador).
- Perfil de candidato con campos condicionales según el puesto elegido
  (datos deportivos si es jugador, datos técnicos para el resto).
- Perfil de club.
- Perfil público de candidato y de club (`/perfil-publico`, `/perfil-publico-club`).
- Publicación de ofertas por parte del club.
- Listado público de ofertas con filtros (puesto, provincia, categoría).
- Postulación de un candidato a una oferta.
- Panel de administración con moderación de ofertas pendientes (`/admin`).

Pendiente (ver `CFA_BRD.pdf`, sección 3):
- Perfil de representante y gestión de cartera de candidatos.
- Métricas en el panel de administración.
- Módulo de suscripciones con checkout simulado.
- Notificaciones de cambio de estado de postulación.
