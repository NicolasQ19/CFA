-- Esquema inicial de CFA (Contrataciones de Fútbol Argentino)
-- Referencia: CFA_BRD.pdf — secciones 4 (Roles), 6 (Requerimientos funcionales) y 8 (Reglas de negocio)

-- ============================================================================
-- ENUMS: vocabulario del dominio, tal como lo define el BRD
-- ============================================================================

create type rol_usuario as enum (
  'candidato',
  'representante',
  'club',
  'administrador'
);

create type puesto_profesional as enum (
  'jugador',
  'director_tecnico',
  'preparador_fisico',
  'kinesiologo',
  'analista_deportivo',
  'coordinador_deportivo',
  'medico',
  'utilero',
  'ojeador_scout',
  'otro'
);

create type estado_postulacion as enum (
  'postulado',
  'visto',
  'preseleccionado',
  'rechazado',
  'oferta_cerrada'
);

create type estado_oferta as enum (
  'pendiente_moderacion',
  'publicada',
  'pausada',
  'cerrada',
  'rechazada'
);

create type tipo_contrato as enum (
  'profesional',
  'amateur',
  'inferiores',
  'futbol_femenino'
);

-- ============================================================================
-- USUARIOS: fila espejo de auth.users con el rol elegido en el registro (RF-01)
-- ============================================================================

create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  rol rol_usuario not null,
  nombre_completo text not null,
  correo_electronico text not null,
  cuenta_activa boolean not null default true, -- RF-04: el administrador puede desactivar cuentas
  creado_en timestamptz not null default now()
);

-- ============================================================================
-- PERFIL DE CANDIDATO (RF-05 a RF-10)
-- ============================================================================

create table perfiles_candidato (
  usuario_id uuid primary key references usuarios (id) on delete cascade,
  puesto puesto_profesional not null,
  provincia text not null,
  club_actual text,
  foto_url text,
  enlaces_video text[] not null default '{}', -- hasta 3 enlaces (RF-08), validado en la app
  trayectoria text,
  formacion_academica text,
  perfil_visible boolean not null default true, -- RF-10

  -- Campos deportivos: solo aplican cuando puesto = 'jugador' (RF-06)
  posicion_juego text,
  pierna_habil text,
  altura_cm integer,
  peso_kg integer,

  -- Campos técnicos: aplican al resto de los puestos (cuerpo técnico / staff) (RF-07)
  titulo_o_matricula text,
  licencia text,
  anios_experiencia integer,
  especialidad text,

  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- PERFIL DE CLUB / OFERTANTE (RF-11)
-- ============================================================================

create table perfiles_club (
  usuario_id uuid primary key references usuarios (id) on delete cascade,
  nombre_club text not null,
  escudo_url text,
  provincia text not null,
  categoria text not null, -- ej: Primera, Nacional B, Federal, Liga regional
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- PERFIL DE REPRESENTANTE y su cartera de candidatos (RF-15 a RF-17)
-- ============================================================================

create table perfiles_representante (
  usuario_id uuid primary key references usuarios (id) on delete cascade,
  nombre_agencia text,
  actualizado_en timestamptz not null default now()
);

create table candidatos_representados (
  representante_id uuid not null references perfiles_representante (usuario_id) on delete cascade,
  candidato_id uuid not null references perfiles_candidato (usuario_id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (representante_id, candidato_id)
);

-- ============================================================================
-- OFERTAS LABORALES (RF-11 a RF-14, RF-18, RF-19, RF-25)
-- ============================================================================

create table ofertas_laborales (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references perfiles_club (usuario_id) on delete cascade,
  puesto_buscado puesto_profesional not null,
  posicion_juego text, -- solo aplica cuando puesto_buscado = 'jugador'
  categoria text not null,
  tipo_contrato tipo_contrato not null,
  provincia text not null,
  descripcion text not null,
  estado estado_oferta not null default 'pendiente_moderacion', -- moderación previa (RF-25)
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

-- ============================================================================
-- POSTULACIONES (RF-16, RF-20, RF-21)
-- ============================================================================

create table postulaciones (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references ofertas_laborales (id) on delete cascade,
  candidato_id uuid not null references perfiles_candidato (usuario_id) on delete cascade,
  postulado_por_representante_id uuid references perfiles_representante (usuario_id), -- null = postulación directa
  estado estado_postulacion not null default 'postulado',
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),

  -- RF-20: un candidato solo puede postularse una vez por oferta
  unique (oferta_id, candidato_id)
);

-- ============================================================================
-- ÍNDICES para los filtros del listado público de ofertas (RF-18)
-- ============================================================================

create index indice_ofertas_estado on ofertas_laborales (estado);
create index indice_ofertas_puesto on ofertas_laborales (puesto_buscado);
create index indice_ofertas_provincia on ofertas_laborales (provincia);
create index indice_ofertas_categoria on ofertas_laborales (categoria);
create index indice_postulaciones_candidato on postulaciones (candidato_id);
create index indice_postulaciones_oferta on postulaciones (oferta_id);
