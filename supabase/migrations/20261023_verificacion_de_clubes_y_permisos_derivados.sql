begin;

-- La comprobación de rol no debe resolver tablas de un esquema temporal del llamador.
create or replace function public.rol_del_usuario_actual() returns public.rol_usuario
language sql stable security definer set search_path = public, pg_temp as $$
  select rol from public.usuarios where id = auth.uid();
$$;

create table public.verificaciones_club (
  club_id uuid primary key references public.usuarios(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'verificado', 'rechazado')),
  liga_asociacion text check (length(liga_asociacion) <= 200),
  nombre_solicitante text check (length(nombre_solicitante) <= 160),
  cargo text check (length(cargo) <= 120),
  correo_institucional text check (length(correo_institucional) <= 254),
  telefono_institucional text check (length(telefono_institucional) <= 60),
  url_oficial text check (length(url_oficial) <= 500),
  solicitada_en timestamptz,
  revisada_en timestamptz,
  revisada_por uuid references public.usuarios(id) on delete set null,
  canal_confirmado text check (length(canal_confirmado) <= 500),
  observaciones text check (length(observaciones) <= 2000)
);
alter table public.verificaciones_club enable row level security;
revoke all on public.verificaciones_club from anon, authenticated;
grant select on public.verificaciones_club to authenticated;
grant all on public.verificaciones_club to service_role;
create policy "club_y_admin_leen_verificacion" on public.verificaciones_club for select to authenticated
  using (club_id = auth.uid() or public.rol_del_usuario_actual() = 'administrador');

-- Las cuentas existentes no se consideran verificadas automáticamente.
insert into public.verificaciones_club(club_id) select id from public.usuarios where rol = 'club';
alter table public.perfiles_club add column verificado boolean not null default false;

create function public.club_esta_verificado(p_club_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.verificaciones_club v join public.usuarios u on u.id = v.club_id
    where v.club_id = p_club_id and v.estado = 'verificado' and u.rol = 'club' and u.cuenta_activa);
$$;
revoke all on function public.club_esta_verificado(uuid) from public;
grant execute on function public.club_esta_verificado(uuid) to anon, authenticated, service_role;

create function public.inicializar_verificacion_club() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.rol = 'club' then insert into public.verificaciones_club(club_id) values(new.id) on conflict do nothing; end if;
  return new;
end; $$;
create trigger inicializar_verificacion_club after insert on public.usuarios
  for each row execute function public.inicializar_verificacion_club();

-- Impide que un club se otorgue el rol administrador o reactive su propia cuenta.
create function public.proteger_privilegios_usuario() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() = 'authenticated' and public.rol_del_usuario_actual() is distinct from 'administrador'::public.rol_usuario
     and (new.rol is distinct from old.rol or new.cuenta_activa is distinct from old.cuenta_activa) then
    raise exception 'No podés modificar los permisos de la cuenta.';
  end if;
  return new;
end; $$;
create trigger proteger_privilegios_usuario before update on public.usuarios
  for each row execute function public.proteger_privilegios_usuario();

create function public.sincronizar_insignia_club() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.perfiles_club set verificado = (new.estado = 'verificado') where usuario_id = new.club_id;
  return new;
end; $$;
create trigger sincronizar_insignia_club after update of estado on public.verificaciones_club
  for each row execute function public.sincronizar_insignia_club();

create function public.proteger_identidad_club() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (
    new.nombre_club is distinct from old.nombre_club or new.provincia is distinct from old.provincia
    or new.localidad is distinct from old.localidad or new.sitio_web is distinct from old.sitio_web
    or new.instagram is distinct from old.instagram or new.facebook is distinct from old.facebook
  ) then
    new.verificado := false;
    return new;
  end if;
  -- Se ignora cualquier valor de la insignia enviado por el dueño del perfil.
  new.verificado := public.club_esta_verificado(new.usuario_id);
  return new;
end; $$;
create trigger proteger_identidad_club before insert or update on public.perfiles_club
  for each row execute function public.proteger_identidad_club();

create function public.revisar_cambio_identidad_club() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    update public.verificaciones_club set estado = 'pendiente', solicitada_en = null,
      revisada_en = null, revisada_por = null, canal_confirmado = null, observaciones = null where club_id = old.usuario_id;
    return old;
  end if;
  if new.nombre_club is distinct from old.nombre_club or new.provincia is distinct from old.provincia
    or new.localidad is distinct from old.localidad or new.sitio_web is distinct from old.sitio_web
    or new.instagram is distinct from old.instagram or new.facebook is distinct from old.facebook then
    update public.verificaciones_club set estado = 'pendiente', revisada_en = null, revisada_por = null,
      canal_confirmado = null, observaciones = null,
      solicitada_en = case when solicitada_en is null then null else now() end
      where club_id = new.usuario_id;
  end if;
  return new;
end; $$;
create trigger revisar_cambio_identidad_club after update or delete on public.perfiles_club
  for each row execute function public.revisar_cambio_identidad_club();

create function public.solicitar_verificacion_club(p_liga text, p_nombre text, p_cargo text, p_correo text, p_telefono text, p_url text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid := auth.uid();
begin
  if not exists(select 1 from public.usuarios where id = v_id and rol = 'club' and cuenta_activa) then
    raise exception 'Solo un club activo puede solicitar la verificación.';
  end if;
  if not exists(select 1 from public.perfiles_club where usuario_id = v_id
    and length(trim(nombre_club)) > 0 and length(trim(coalesce(localidad, ''))) > 0) then
    raise exception 'Completá el nombre y la localidad en Datos del club antes de solicitar la verificación.';
  end if;
  if coalesce(length(trim(p_liga)), 0) not between 1 and 200
    or coalesce(length(trim(p_nombre)), 0) not between 1 and 160
    or coalesce(length(trim(p_cargo)), 0) not between 1 and 120
    or coalesce(length(trim(p_correo)), 0) not between 3 and 254 or p_correo !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or coalesce(length(trim(p_telefono)), 0) not between 6 and 60 or p_telefono !~ '^[+0-9 ().-]{6,60}$'
    or coalesce(length(trim(p_url)), 0) not between 8 and 500 or p_url !~ '^https?://[^[:space:]]+$' then
    raise exception 'Revisá los datos de contacto y el canal oficial del club.';
  end if;
  -- No permite sustituir silenciosamente el contacto de un club ya verificado.
  if public.club_esta_verificado(v_id) then raise exception 'El club ya está verificado.'; end if;
  insert into public.verificaciones_club(club_id, estado, liga_asociacion, nombre_solicitante, cargo,
    correo_institucional, telefono_institucional, url_oficial, solicitada_en)
    values(v_id, 'pendiente', trim(p_liga), trim(p_nombre), trim(p_cargo), trim(p_correo), trim(p_telefono), trim(p_url), now())
  on conflict(club_id) do update set estado = 'pendiente', liga_asociacion = excluded.liga_asociacion,
    nombre_solicitante = excluded.nombre_solicitante, cargo = excluded.cargo,
    correo_institucional = excluded.correo_institucional, telefono_institucional = excluded.telefono_institucional,
    url_oficial = excluded.url_oficial, solicitada_en = now(), revisada_en = null, revisada_por = null,
    canal_confirmado = null, observaciones = null;
end; $$;
revoke all on function public.solicitar_verificacion_club(text,text,text,text,text,text) from public;
grant execute on function public.solicitar_verificacion_club(text,text,text,text,text,text) to authenticated;

create function public.resolver_verificacion_club(p_club_id uuid, p_estado text, p_observaciones text, p_canal text, p_solicitada_en timestamptz)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_solicitud public.verificaciones_club;
begin
  if not exists(select 1 from public.usuarios where id = auth.uid() and rol = 'administrador' and cuenta_activa) then
    raise exception 'Solo un administrador activo puede verificar clubes.';
  end if;
  if p_estado is null or p_estado not in ('verificado', 'rechazado')
    or coalesce(length(trim(p_observaciones)), 0) not between 1 and 2000 then
    raise exception 'Seleccioná una decisión y registrá el resultado de la revisión.';
  end if;
  select * into v_solicitud from public.verificaciones_club where club_id = p_club_id for update;
  if not found or v_solicitud.solicitada_en is null then raise exception 'El club todavía no envió una solicitud completa.'; end if;
  if v_solicitud.solicitada_en is distinct from p_solicitada_en then raise exception 'La solicitud cambió. Recargá la página antes de resolverla.'; end if;
  if p_estado = 'verificado' and coalesce(length(trim(p_canal)), 0) not between 3 and 500 then
    raise exception 'Registrá el canal oficial por el que confirmaste la autorización del solicitante.';
  end if;
  if not exists(select 1 from public.usuarios u join public.perfiles_club p on p.usuario_id = u.id
    where u.id = p_club_id and u.rol = 'club' and u.cuenta_activa and length(trim(coalesce(p.localidad, ''))) > 0) then
    raise exception 'El club debe tener una cuenta activa y su perfil completo.';
  end if;
  update public.verificaciones_club set estado = p_estado, observaciones = trim(p_observaciones),
    canal_confirmado = nullif(trim(p_canal), ''), revisada_en = now(), revisada_por = auth.uid() where club_id = p_club_id;
end; $$;
revoke all on function public.resolver_verificacion_club(uuid,text,text,text,timestamptz) from public;
grant execute on function public.resolver_verificacion_club(uuid,text,text,text,timestamptz) to authenticated;

create function public.exigir_verificacion_oferta() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.rol_del_usuario_actual() = 'club' and not public.club_esta_verificado(auth.uid()) then
    raise exception 'Tu club debe estar verificado para gestionar ofertas.';
  end if;
  if new.estado = 'publicada' and not public.club_esta_verificado(new.club_id) then
    raise exception 'No se puede publicar una oferta de un club sin verificar.';
  end if;
  return new;
end; $$;
create trigger exigir_verificacion_oferta before insert or update on public.ofertas_laborales
  for each row execute function public.exigir_verificacion_oferta();

drop policy "ofertas_publicadas_son_publicas" on public.ofertas_laborales;
create policy "ofertas_publicadas_son_publicas" on public.ofertas_laborales for select
  using (estado = 'publicada' and public.club_esta_verificado(club_id));

-- Restrictivas: las políticas permisivas anteriores no pueden abrir un camino alternativo.
create policy "clubes_verificados_ven_candidatos" on public.perfiles_candidato as restrictive for select to public
  using (auth.uid() is not null and (public.rol_del_usuario_actual() <> 'club' or public.club_esta_verificado(auth.uid())));
create policy "clubes_verificados_ven_datos_candidatos" on public.usuarios as restrictive for select to public
  using (rol <> 'candidato' or (auth.uid() is not null and (public.rol_del_usuario_actual() <> 'club' or public.club_esta_verificado(auth.uid()))));
create policy "clubes_verificados_gestionan_postulaciones" on public.postulaciones as restrictive for all to authenticated
  using (public.rol_del_usuario_actual() <> 'club' or public.club_esta_verificado(auth.uid()))
  with check (public.rol_del_usuario_actual() <> 'club' or public.club_esta_verificado(auth.uid()));
create policy "clubes_verificados_descargan_cv" on storage.objects as restrictive for select to public
  using (bucket_id <> 'curriculums' or (auth.uid() is not null and (public.rol_del_usuario_actual() <> 'club' or public.club_esta_verificado(auth.uid()))));

-- Las funciones de trigger no se invocan como RPC.
revoke all on function public.inicializar_verificacion_club(), public.proteger_privilegios_usuario(),
  public.sincronizar_insignia_club(), public.proteger_identidad_club(), public.revisar_cambio_identidad_club(), public.exigir_verificacion_oferta() from public;
commit;
