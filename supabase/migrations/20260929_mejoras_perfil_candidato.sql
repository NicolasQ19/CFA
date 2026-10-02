begin;
alter table public.perfiles_candidato
  add column if not exists presentacion text check (char_length(presentacion) <= 600),
  add column if not exists disponibilidad text check (disponibilidad in ('disponible', 'escucho_ofertas', 'no_disponible')),
  add column if not exists situacion_club text check (situacion_club in ('con_club', 'sin_club')),
  add column if not exists incorporacion_desde date,
  add column if not exists dispuesto_mudarse boolean,
  add column if not exists experiencias jsonb not null default '[]'::jsonb
    check (jsonb_typeof(experiencias) = 'array' and jsonb_array_length(experiencias) <= 20);
commit;
