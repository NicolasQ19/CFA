-- Cierra un hueco de seguridad: la política original permitía que cualquier
-- usuario autenticado se insertara a sí mismo con rol 'administrador' llamando
-- directo a la API REST de Supabase, sin pasar por el formulario de registro
-- (que ya no ofrece ese rol) ni por /admin/registrarse (que valida una clave
-- secreta del lado del servidor). El registro de administradores debe hacerse
-- únicamente a través de esa ruta, usando la service_role key.

drop policy "usuarios_crean_su_propia_fila_al_registrarse" on usuarios;

create policy "usuarios_crean_su_propia_fila_al_registrarse"
  on usuarios for insert
  with check (id = auth.uid() and rol <> 'administrador');
