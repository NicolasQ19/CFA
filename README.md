# CFA — Contrataciones de Fútbol Argentino

Plataforma web que conecta a candidatos, representantes y clubes del fútbol argentino para gestionar oportunidades laborales, perfiles profesionales y postulaciones.

**Proyecto integrador · Tecnicatura en Programación · Universidad Nacional de Hurlingham (UNAHUR)**

## Acerca del proyecto

CFA reúne en un mismo espacio la presentación profesional de candidatos, las búsquedas de los clubes y la gestión de carteras de representantes. Su objetivo es facilitar el acceso a oportunidades y organizar el seguimiento de cada candidatura.

La plataforma contempla jugadores, directores técnicos, preparadores físicos, kinesiólogos, analistas deportivos, coordinadores deportivos, médicos, utileros y scouts. Los perfiles se adaptan al puesto y las ofertas incluyen ubicación, categoría de competencia y tipo de contrato.

## Roles y responsabilidades

| Rol | Herramientas principales |
| --- | --- |
| **Candidato** | Crear su perfil profesional, explorar ofertas, postularse, consultar estados y cancelar postulaciones propias. |
| **Club** | Presentar su institución, publicar búsquedas, consultar candidatos y gestionar postulantes. |
| **Representante** | Publicar su presentación profesional, gestionar representados y enviar o retirar postulaciones de su cartera. |
| **Administrador** | Revisar las ofertas pendientes y aprobar o rechazar su publicación. |

## Funcionalidades

### Perfiles profesionales

- Datos específicos para jugadores y profesionales del cuerpo técnico o staff.
- Foto, presentación, trayectoria, formación, experiencias en clubes y disponibilidad laboral del candidato.
- Currículum en PDF y enlaces de videos de YouTube.
- Indicador de completitud y vista previa del perfil antes de guardar.
- Control de visibilidad del candidato en las búsquedas de clubes.
- Perfil institucional del club con escudo, ubicación, categoría, instalaciones y enlaces a su sitio web y redes.
- Perfil público del representante con presentación, especialización, zona de trabajo y contacto profesional.
- Ampliación de fotos, logos y escudos mediante una vista superpuesta.

### Ofertas y postulaciones

- Listado de ofertas publicadas con filtros por puesto, provincia, categoría y tipo de contrato.
- Detalle de cada búsqueda y acceso al perfil institucional del club.
- Creación de ofertas y gestión de sus estados: publicación mediante moderación, pausa, cierre y reapertura.
- Postulaciones de candidatos y representantes con validación de coincidencia de puesto profesional.
- Consulta de estados y cancelación desde el detalle de la oferta o el panel correspondiente.
- Gestión del club con estados de postulación, etapas internas y notas privadas.

### Gestión de representantes

- Alta y edición de representados desde una misma cuenta.
- Nombres, apellidos y fecha de nacimiento para búsqueda y cálculo de edad.
- Vista previa del perfil público del representado durante la edición.
- Cartera con resumen de actividad, búsqueda por nombre y puesto, y seguimiento por estado.
- Selección de candidatos para una oferta con búsqueda por nombre o apellido, orden alfabético, rango de edad y provincia.
- Separación entre la presentación pública de la agencia y la gestión privada de su cartera.

## Reglas de negocio

- Cada candidato puede tener una sola postulación registrada por oferta.
- El puesto profesional del candidato debe coincidir con el solicitado en la oferta.
- Solo las ofertas publicadas admiten nuevas postulaciones.
- Las ofertas nuevas requieren aprobación administrativa antes de aparecer en el listado público.
- Los representantes pueden postular a candidatos asociados a su cartera y cancelar las postulaciones que enviaron para ellos.
- Los candidatos pueden cancelar sus propias postulaciones. Al retirarlas, pueden volver a postularse si la oferta continúa publicada.
- Las notas y etapas internas del club se gestionan por separado del estado comunicado al candidato.
- La descarga de currículums se controla mediante permisos; los archivos se almacenan en un bucket privado.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Aplicación web | Next.js 15 con App Router y React 19 |
| Lenguaje | JavaScript con documentación de modelos mediante JSDoc |
| Interfaz | Tailwind CSS 4 y CSS Modules |
| Autenticación | Supabase Auth y gestión de sesión con `@supabase/ssr` |
| Base de datos | PostgreSQL mediante Supabase, migraciones SQL y funciones RPC |
| Permisos | Row Level Security (RLS) y validaciones en el servidor |
| Archivos | Supabase Storage para fotos, escudos y currículums |
| Pruebas | `node:test` y `node:assert/strict` |

## Arquitectura

La aplicación organiza sus funcionalidades por dominio. Las páginas definen las rutas y componen la interfaz; los módulos de dominio reúnen formularios, consultas y acciones del servidor; las utilidades compartidas contienen validaciones y transformaciones de datos.

Las operaciones de escritura se realizan mediante Server Actions. El acceso a los datos utiliza clientes de Supabase y funciones RPC según el caso. Las migraciones versionan el esquema, las políticas de acceso y las funciones de base de datos.

## Estructura del proyecto

El árbol resume las carpetas y archivos principales del repositorio. Los componentes y páginas utilizan archivos `.module.css` para sus estilos.

```text
original/
├── src/
│   ├── app/                                  # Rutas de Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── iniciar-sesion/
│   │   │   └── registrarse/
│   │   ├── admin/
│   │   │   └── registrarse/
│   │   ├── api/candidatos/[id]/cv/            # Descarga autorizada de CV
│   │   ├── buscar-candidatos/
│   │   ├── mi-cartera/
│   │   │   ├── [candidatoId]/editar/
│   │   │   └── nuevo/
│   │   ├── mi-club/
│   │   ├── mi-perfil/
│   │   ├── mis-ofertas/
│   │   │   ├── [ofertaId]/postulantes/
│   │   │   └── nueva/
│   │   ├── mis-postulaciones/
│   │   ├── ofertas/
│   │   │   └── [ofertaId]/
│   │   ├── perfil-publico/
│   │   ├── perfil-publico-club/
│   │   ├── perfil-publico-representante/
│   │   ├── globals.css
│   │   ├── layout.jsx                        # Navegación y footer compartidos
│   │   └── page.jsx                          # Página principal
│   ├── componentes/
│   │   ├── ImagenAmpliable.jsx
│   │   └── PiePagina.jsx
│   ├── dominio/
│   │   ├── autenticacion/
│   │   ├── ofertas/
│   │   ├── perfiles/
│   │   ├── postulaciones/
│   │   └── representantes/
│   ├── lib/
│   │   ├── supabase/                         # Clientes y actualización de sesión
│   │   ├── cancelar-postulacion.js
│   │   ├── club.js
│   │   ├── curriculum.js
│   │   ├── perfil-candidato.js
│   │   ├── perfil-representante.js
│   │   ├── postulacion-cartera.js
│   │   ├── vista-previa-representado.js
│   │   └── youtube.js
│   ├── tipos/                               # Modelos JSDoc y vocabulario del dominio
│   ├── middleware.js
│   └── proxy.js
├── supabase/
│   ├── migrations/                          # Esquema, RLS, Storage y funciones RPC
│   ├── config.toml
│   └── README.md                            # Documentación de base de datos
├── tests/                                   # Pruebas de validación y reglas de negocio
├── public/                                  # Recursos estáticos
├── CFA_BRD.pdf                              # Requerimientos de negocio
├── AGENTS.md
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── README.md
```

## Navegación principal

| Ruta | Propósito |
| --- | --- |
| `/` | Presentación de CFA, información por rol y últimas ofertas. |
| `/ofertas` | Exploración y filtrado de oportunidades. |
| `/ofertas/[ofertaId]` | Detalle de la búsqueda y gestión de postulaciones. |
| `/mi-perfil` | Edición del perfil de candidato o representante. |
| `/perfil-publico` | Perfil profesional del candidato. |
| `/mi-club` | Edición de la información institucional del club. |
| `/perfil-publico-club` | Presentación del club y ofertas abiertas. |
| `/perfil-publico-representante` | Presentación y contacto del representante. |
| `/mi-cartera` | Representados y postulaciones gestionadas por el representante. |
| `/mis-postulaciones` | Seguimiento y cancelación de postulaciones del candidato. |
| `/mis-ofertas` | Gestión de búsquedas del club. |
| `/mis-ofertas/[ofertaId]/postulantes` | Evaluación y seguimiento de candidatos a una oferta propia. |
| `/buscar-candidatos` | Búsqueda de perfiles disponibles para clubes y administradores. |
| `/admin` | Moderación de ofertas. |

## Pruebas y validación

La suite automatizada cubre validaciones de perfiles y archivos, completitud, filtros de candidatos, cálculo de edad, preparación de vistas previas y autorización de cancelaciones de postulaciones.

```bash
node --test tests/*.test.js
```

La persistencia, las políticas RLS y los flujos de interacción se verifican también con cuentas de cada rol sobre una base de datos con las migraciones correspondientes.

## Documentación

- [Documento de requerimientos de negocio](./CFA_BRD.pdf): objetivos, alcance y requisitos del proyecto.
- [Documentación de Supabase](./supabase/README.md): migraciones y verificaciones de persistencia y permisos.
- [Migraciones SQL](./supabase/migrations/): evolución versionada de la base de datos.
- [Pruebas automatizadas](./tests/): validación de utilidades y reglas implementadas.

## Autores

**Logan Casals** · **Nicolás Quintana**

Proyecto integrador de la Tecnicatura en Programación de la Universidad Nacional de Hurlingham.
