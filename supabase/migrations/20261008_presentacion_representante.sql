begin;

-- Campos opcionales: conserva los perfiles existentes y sus políticas RLS.
alter table public.perfiles_representante
  add column if not exists presentacion text check (char_length(presentacion) <= 2000),
  add column if not exists especializacion text check (char_length(especializacion) <= 300),
  add column if not exists zona_trabajo text check (char_length(zona_trabajo) <= 300);

commit;
