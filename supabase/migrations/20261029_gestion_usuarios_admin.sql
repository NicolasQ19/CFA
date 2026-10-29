begin;

-- Permite que un administrador activo habilite o desactive cuentas de otros usuarios (CU-04 / RF-04),
-- sin permitir cambiar roles ni desactivar su propia cuenta por accidente.
create or replace function public.es_administrador_activo() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and rol = 'administrador' and cuenta_activa = true
  );
$$;
revoke all on function public.es_administrador_activo() from public;
grant execute on function public.es_administrador_activo() to authenticated, service_role;

drop policy if exists "administradores_actualizan_estado_usuarios" on public.usuarios;
create policy "administradores_actualizan_estado_usuarios"
  on public.usuarios for update to authenticated
  using (public.es_administrador_activo() and id <> auth.uid())
  with check (public.es_administrador_activo() and id <> auth.uid());

-- Refuerza el trigger para impedir cambiar el rol de una cuenta existente o autodesactivarse como admin.
create or replace function public.proteger_privilegios_usuario() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() = 'authenticated' then
    if new.rol is distinct from old.rol then
      raise exception 'El rol de una cuenta no puede modificarse una vez creada.';
    end if;
    if new.cuenta_activa is distinct from old.cuenta_activa then
      if not public.es_administrador_activo() then
        raise exception 'No podés modificar los permisos de la cuenta.';
      end if;
      if old.id = auth.uid() and new.cuenta_activa = false then
        raise exception 'No podés desactivar tu propia cuenta de administrador.';
      end if;
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.proteger_privilegios_usuario() from public;

commit;
