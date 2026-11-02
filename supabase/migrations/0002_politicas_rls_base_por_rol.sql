  -- Row Level Security (RNF-03): cada rol solo accede a lo que le corresponde.
  -- Referencia: CFA_BRD.pdf, sección 7 (Requerimientos no funcionales).

  alter table usuarios enable row level security;
  alter table perfiles_candidato enable row level security;
  alter table perfiles_club enable row level security;
  alter table perfiles_representante enable row level security;
  alter table candidatos_representados enable row level security;
  alter table ofertas_laborales enable row level security;
  alter table postulaciones enable row level security;

  -- Función auxiliar: rol del usuario autenticado actual
  create or replace function rol_del_usuario_actual()
  returns rol_usuario
  language sql
  security definer
  stable
  as $$
    select rol from usuarios where id = auth.uid();
  $$;

  -- ----------------------------------------------------------------------------
  -- USUARIOS
  -- ----------------------------------------------------------------------------

  create policy "usuarios_leen_su_propia_fila"
    on usuarios for select
    using (id = auth.uid());

  create policy "usuarios_actualizan_su_propia_fila"
    on usuarios for update
    using (id = auth.uid());

  -- Se necesita al registrarse: el usuario recién autenticado crea su propia fila (RF-01)
  create policy "usuarios_crean_su_propia_fila_al_registrarse"
    on usuarios for insert
    with check (id = auth.uid());

  create policy "administradores_leen_todos_los_usuarios"
    on usuarios for select
    using (rol_del_usuario_actual() = 'administrador');

  -- ----------------------------------------------------------------------------
  -- PERFILES DE CANDIDATO
  -- ----------------------------------------------------------------------------

  -- Lectura pública de perfiles visibles (RF-10), para que los clubes los encuentren
  create policy "perfiles_candidato_visibles_son_publicos"
    on perfiles_candidato for select
    using (perfil_visible = true);

  create policy "candidato_gestiona_su_propio_perfil"
    on perfiles_candidato for all
    using (usuario_id = auth.uid())
    with check (usuario_id = auth.uid());

  -- El representante puede ver el perfil completo de sus candidatos representados,
  -- aunque esté marcado como no visible (RF-15)
  create policy "representante_ve_perfiles_de_su_cartera"
    on perfiles_candidato for select
    using (
      exists (
        select 1 from candidatos_representados cr
        where cr.candidato_id = perfiles_candidato.usuario_id
          and cr.representante_id = auth.uid()
      )
    );

  -- ----------------------------------------------------------------------------
  -- PERFILES DE CLUB (públicos: cualquiera puede ver el club que publica una oferta)
  -- ----------------------------------------------------------------------------

  create policy "perfiles_club_son_publicos"
    on perfiles_club for select
    using (true);

  create policy "club_gestiona_su_propio_perfil"
    on perfiles_club for all
    using (usuario_id = auth.uid())
    with check (usuario_id = auth.uid());

  -- ----------------------------------------------------------------------------
  -- PERFILES DE REPRESENTANTE
  -- ----------------------------------------------------------------------------

  create policy "representante_gestiona_su_propio_perfil"
    on perfiles_representante for all
    using (usuario_id = auth.uid())
    with check (usuario_id = auth.uid());

  -- ----------------------------------------------------------------------------
  -- CARTERA DE CANDIDATOS REPRESENTADOS
  -- ----------------------------------------------------------------------------

  create policy "representante_gestiona_su_cartera"
    on candidatos_representados for all
    using (representante_id = auth.uid())
    with check (representante_id = auth.uid());

  -- El candidato puede ver quién lo representa
  create policy "candidato_ve_su_representante"
    on candidatos_representados for select
    using (candidato_id = auth.uid());

  -- ----------------------------------------------------------------------------
  -- OFERTAS LABORALES
  -- ----------------------------------------------------------------------------

  -- Cualquiera puede ver ofertas ya publicadas (listado público, RF-18)
  create policy "ofertas_publicadas_son_publicas"
    on ofertas_laborales for select
    using (estado = 'publicada');

  -- El club ve y gestiona sus propias ofertas en cualquier estado (RF-12, RF-13)
  create policy "club_gestiona_sus_propias_ofertas"
    on ofertas_laborales for all
    using (club_id = auth.uid())
    with check (club_id = auth.uid());

  -- El administrador ve y modera todas las ofertas (RF-25)
  create policy "administrador_gestiona_todas_las_ofertas"
    on ofertas_laborales for all
    using (rol_del_usuario_actual() = 'administrador');

  -- ----------------------------------------------------------------------------
  -- POSTULACIONES
  -- ----------------------------------------------------------------------------

  -- El candidato ve y crea sus propias postulaciones
  create policy "candidato_gestiona_sus_propias_postulaciones"
    on postulaciones for all
    using (candidato_id = auth.uid())
    with check (candidato_id = auth.uid());

  -- El representante postula y ve las postulaciones de su cartera (RF-16)
  create policy "representante_gestiona_postulaciones_de_su_cartera"
    on postulaciones for all
    using (
      exists (
        select 1 from candidatos_representados cr
        where cr.candidato_id = postulaciones.candidato_id
          and cr.representante_id = auth.uid()
      )
    )
    with check (
      postulado_por_representante_id = auth.uid()
      and exists (
        select 1 from candidatos_representados cr
        where cr.candidato_id = postulaciones.candidato_id
          and cr.representante_id = auth.uid()
      )
    );

  -- El club ve las postulaciones recibidas en sus propias ofertas y puede cambiar su estado (RF-14)
  create policy "club_ve_postulaciones_de_sus_ofertas"
    on postulaciones for select
    using (
      exists (
        select 1 from ofertas_laborales o
        where o.id = postulaciones.oferta_id
          and o.club_id = auth.uid()
      )
    );

  create policy "club_actualiza_estado_de_postulaciones_recibidas"
    on postulaciones for update
    using (
      exists (
        select 1 from ofertas_laborales o
        where o.id = postulaciones.oferta_id
          and o.club_id = auth.uid()
      )
    );
