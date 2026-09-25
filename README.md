# CFA — Contrataciones de Fútbol Argentino

Plataforma web que conecta a **candidatos**, **representantes** y **clubes** de fútbol argentino, en todas las categorías (profesional, amateur, inferiores y fútbol femenino).

A diferencia de un portal de búsqueda enfocado únicamente en jugadores, CFA contempla a cualquier candidato vinculado profesionalmente a un club: jugadores, directores técnicos, preparadores físicos, kinesiólogos, analistas deportivos, coordinadores deportivos, médicos, utileros, ojeadores/scouts, entre otros puestos.

> Proyecto final — Tecnicatura en Programación, Universidad Nacional de Hurlingham (UNAHUR)
> Autores: **Logan Casals** · **Nicolas Quintana**

---

## Índice

- [Descripción](#descripción)
- [Roles del sistema](#roles-del-sistema)
- [Funcionalidades](#funcionalidades)
- [Reglas de negocio](#reglas-de-negocio)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Roadmap](#roadmap)
- [Documentación](#documentación)
- [Autores](#autores)

---

## Descripción

El sistema permite a los clubes publicar búsquedas (ofertas) para cualquier puesto, a los candidatos crear un perfil profesional (CV) adaptado a su especialidad y postularse, y a los representantes gestionar el perfil y las postulaciones de varios candidatos representados.

Incluye roles diferenciados, un panel de administración con moderación de contenido, y un módulo de suscripciones con pago **simulado** (mock, sin pasarela real), dado el carácter académico del proyecto.

## Roles del sistema

| Rol | Descripción | Necesidad principal |
|---|---|---|
| **Candidato** | Persona que busca oportunidades laborales en un club, ya sea como jugador o como parte del cuerpo técnico y staff deportivo (director técnico, preparador físico, kinesiólogo, analista deportivo, coordinador deportivo, médico, utilero, ojeador/scout, u otro puesto). | Ser visible ante clubes y postularse fácilmente a ofertas acordes a su puesto. |
| **Representante** | Agente que gestiona la carrera de uno o varios candidatos, sean jugadores o miembros del cuerpo técnico/staff. | Gestionar múltiples perfiles y postulaciones desde una sola cuenta. |
| **Club / Ofertante** | Club o institución que busca cubrir un puesto, ya sea un jugador o un integrante del cuerpo técnico o staff. | Publicar búsquedas y encontrar candidatos filtrados rápidamente. |
| **Administrador** | Responsable de moderar la plataforma. | Controlar la calidad del contenido publicado y ver métricas de uso. |

## Funcionalidades

- Registro y autenticación con 4 roles: Candidato, Representante, Club/Ofertante, Administrador.
- Selección de **puesto profesional** al registrarse como Candidato: Jugador, Director Técnico, Preparador Físico, Kinesiólogo, Analista Deportivo, Coordinador Deportivo, Médico, Utilero, Ojeador/Scout, u otro.
- Perfil de candidato (CV profesional) con foto, provincia, club actual y trayectoria, más campos específicos según el puesto:
  - **Jugador** → posición, pierna hábil, altura/peso, videos/highlights.
  - **Cuerpo técnico / staff** → título/matrícula, licencia, años de experiencia, especialidad.
- Perfil de club/ofertante: nombre, escudo, provincia y categoría en la que compite.
- Perfil de representante con gestión de una cartera de candidatos representados (no limitada a jugadores).
- Publicación, edición y cierre de ofertas laborales por parte de clubes, para cualquier puesto.
- Listado público de ofertas con filtros por puesto, provincia, categoría y tipo de contrato.
- Postulación a ofertas, directa por el candidato o en su nombre por un representante.
- Seguimiento de estado de la postulación (postulado, visto, preseleccionado, rechazado) con notificaciones in-app.
- Panel de administración: moderación de ofertas y perfiles, listado de usuarios, métricas generales.
- Módulo de suscripciones con planes (Free / Pro / Agencia) y checkout **simulado**.

## Reglas de negocio

### Planes de suscripción (simulados)

| Plan | Rol | Límites / Beneficios |
|---|---|---|
| Candidato Free | Candidato | Perfil visible, hasta 5 postulaciones activas por mes. |
| Candidato Pro | Candidato | Postulaciones ilimitadas, perfil destacado en listados. |
| Club Free | Club | Hasta 1 oferta activa publicada por mes. |
| Club Plus | Club | Hasta 5 ofertas activas, acceso a base de candidatos. |
| Club Full | Club | Ofertas activas ilimitadas, acceso a base de candidatos. |
| Agencia Free | Representante | Hasta 5 candidatos representados por cuenta. |
| Agencia Pro | Representante | Candidatos representados ilimitados. |

### Otras reglas

- Un candidato solo puede tener una postulación activa por oferta (no puede duplicarla).
- Una oferta publicada por un club debe pasar por moderación del administrador antes de ser visible públicamente.
- Un representante no puede postular a un candidato que no esté explícitamente asociado a su cartera.
- Al cerrar una oferta, las postulaciones pendientes quedan marcadas como "oferta cerrada", no se eliminan.
- Los campos específicos del perfil se determinan según el puesto elegido: "Jugador" completa datos deportivos; cualquier otro puesto completa datos técnicos.

## Stack tecnológico

- **Next.js 14** (App Router) + **JavaScript**
- **Tailwind CSS**
- **Supabase**
  - Postgres (base de datos relacional)
  - Auth (registro, login, recuperación de contraseña)
  - Row Level Security (RLS) — permisos por rol a nivel de fila
  - Storage — fotos de perfil, escudos de clubes
- **Vercel** — hosting y despliegue

## Estructura del proyecto

```
cfa/
├── app/
│   ├── (public)/
│   │   ├── ofertas/
│   │   │   ├── page.jsx          # Listado público de ofertas
│   │   │   └── [id]/page.jsx     # Detalle de una oferta
│   │   └── precios/page.jsx      # Planes de suscripción
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── registro/page.jsx
│   ├── (dashboard)/
│   │   ├── candidato/
│   │   │   ├── page.jsx
│   │   │   └── postulaciones/page.jsx
│   │   ├── club/
│   │   │   ├── page.jsx
│   │   │   └── ofertas/page.jsx
│   │   ├── representante/
│   │   │   └── page.jsx
│   │   └── admin/
│   │       └── page.jsx
│   └── api/
├── components/
│   ├── ofertas/
│   ├── candidatos/
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.js
│   │   └── server.js
│   └── actions/                  # Server Actions (lógica de negocio)
├── types/
│   └── base-de-datos.js          # Esquema de las tablas documentado con JSDoc
├── supabase/
│   └── schema.sql
├── docs/
│   └── CFA_BRD.pdf                # Documento de Requerimientos de Negocio
└── README.md
```

## Puesta en marcha

### Requisitos previos

- Node.js 18 o superior
- Cuenta de [Supabase](https://supabase.com) (plan free)

### Instalación

```bash
git clone https://github.com/<usuario>/cfa.git
cd cfa
npm install
```

### Configurar Supabase

1. Crear un proyecto nuevo en Supabase.
2. Ejecutar el schema SQL del proyecto (`supabase/schema.sql`) desde el SQL Editor.
3. Copiar la URL y la anon key del proyecto a las variables de entorno (ver abajo).

### Correr en desarrollo

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Roadmap

| Fase | Contenido | Duración estimada |
|---|---|---|
| 1. Diseño | BRD, schema de base de datos, wireframes principales. | 1-2 semanas |
| 2. Base del sistema | Auth, roles, RLS, estructura del proyecto. | 1-2 semanas |
| 3. Perfiles | Perfil de candidato (con variantes según puesto), club y representante (CRUD). | 2 semanas |
| 4. Ofertas y postulaciones | Publicación, listado, filtros, postulación, estados. | 2 semanas |
| 5. Panel admin y suscripciones | Moderación, métricas, planes y checkout simulado. | 1-2 semanas |
| 6. Pulido y entrega | Responsive, testing manual, documentación final. | 1 semana |

## Documentación

El detalle completo de objetivos, alcance, requerimientos funcionales y no funcionales, reglas de negocio y criterios de éxito está en el [Documento de Requerimientos de Negocio (BRD)](./docs/CFA_BRD.pdf).

## Autores

- **Logan Casals**
- **Nicolas Quintana**

Proyecto final — Tecnicatura en Programación, Universidad Nacional de Hurlingham (UNAHUR).
