// Prueba aislada de la migración: requiere @electric-sql/pglite, sin conexión remota.
// CFA_PGLITE_MODULE puede indicar la ruta absoluta a su módulo dist/index.js.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const { PGlite } = await import(process.env.CFA_PGLITE_MODULE ? pathToFileURL(process.env.CFA_PGLITE_MODULE).href : "@electric-sql/pglite");
const db = new PGlite();
const club = "11111111-1111-4111-8111-111111111111";
const admin = "22222222-2222-4222-8222-222222222222";
const candidato = "33333333-3333-4333-8333-333333333333";
const clubAjeno = "44444444-4444-4444-8444-444444444444";
const sql = nombre => readFile(new URL(`../supabase/migrations/${nombre}`, import.meta.url), "utf8");
async function actuar(id, rol = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false)", [id ?? "", rol]);
  await db.exec(`set role ${rol}`);
}
async function rechaza(consulta, parametros = []) {
  await assert.rejects(db.query(consulta, parametros));
}
async function decidir(estado) {
  await db.query("select public.resolver_verificacion_club($1, $2, 'Autorización revisada', 'Teléfono publicado en sitio oficial', (select solicitada_en from public.verificaciones_club where club_id = $1))", [club, estado]);
}

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    create schema storage; create table storage.objects(id uuid, bucket_id text, name text);
    alter table storage.objects enable row level security;
    create policy base_lectura_storage on storage.objects for select using(true);
    grant usage on schema storage to anon, authenticated;
    grant select on storage.objects to anon, authenticated;
  `);
  await db.exec(await sql("0001_esquema_inicial.sql"));
  await db.exec(await sql("0002_seguridad_rls.sql"));
  await db.exec(await sql("0003_bloquear_autorregistro_admin.sql"));
  await db.exec(`
    alter table public.perfiles_club add column localidad text, add column descripcion text,
      add column instalaciones text, add column sitio_web text, add column instagram text, add column facebook text;
    grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
  `);
  for (const [id, rol] of [[club, "club"], [admin, "administrador"], [candidato, "candidato"], [clubAjeno, "club"]]) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query("insert into public.usuarios(id, rol, nombre_completo, correo_electronico) values($1, $2, 'Prueba', 'prueba@example.test')", [id, rol]);
  }
  await db.query("insert into public.perfiles_club(usuario_id, nombre_club, provincia, categoria, localidad) values($1, 'Club Prueba', 'Buenos Aires', 'Regional', 'Hurlingham')", [club]);
  await db.query("insert into public.perfiles_candidato(usuario_id, puesto, provincia) values($1, 'jugador', 'Buenos Aires')", [candidato]);
  await db.exec("insert into storage.objects values(gen_random_uuid(), 'curriculums', 'prueba/cv.pdf')");
  await db.exec(await sql("20261023_verificacion_clubes.sql"));
  console.log("OK: migración aplicada sobre PostgreSQL aislado.");

  await actuar(club);
  assert.equal((await db.query("select estado from public.verificaciones_club where club_id = $1", [club])).rows[0].estado, "pendiente");
  assert.equal((await db.query("select count(*)::integer as n from public.perfiles_candidato")).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::integer as n from storage.objects where bucket_id = 'curriculums'")).rows[0].n, 0);
  await rechaza("update public.verificaciones_club set estado = 'verificado' where club_id = $1", [club]);
  await rechaza("update public.usuarios set rol = 'administrador' where id = $1", [club]);
  await db.query("update public.perfiles_club set verificado = true where usuario_id = $1", [club]);
  assert.equal((await db.query("select verificado from public.perfiles_club where usuario_id = $1", [club])).rows[0].verificado, false);
  await rechaza("insert into public.ofertas_laborales(club_id,puesto_buscado,categoria,tipo_contrato,provincia,descripcion) values($1,'jugador','Regional','amateur','Buenos Aires','Prueba')", [club]);
  await db.query("select public.solicitar_verificacion_club('Liga Prueba','Persona Prueba','Secretaría','contacto@club.test','1112345678','https://club.test')");
  await rechaza("select public.resolver_verificacion_club($1, 'verificado', 'Intento propio', 'Teléfono', (select solicitada_en from public.verificaciones_club where club_id = $1))", [club]);
  console.log("OK: pendiente sin candidatos, CV, ofertas, autoverificación ni escalada de rol.");

  await actuar(clubAjeno);
  assert.equal((await db.query("select count(*)::integer as n from public.verificaciones_club where club_id = $1", [club])).rows[0].n, 0);
  await actuar(admin);
  await rechaza("select public.resolver_verificacion_club($1, 'verificado', 'Sin canal', '', (select solicitada_en from public.verificaciones_club where club_id = $1))", [club]);
  await rechaza("select public.resolver_verificacion_club($1, 'verificado', 'Solicitud antigua', 'Teléfono', '2000-01-01'::timestamptz)", [club]);
  await decidir("verificado");
  await actuar(club);
  assert.equal((await db.query("select verificado from public.perfiles_club where usuario_id = $1", [club])).rows[0].verificado, true);
  assert.equal((await db.query("select count(*)::integer as n from public.perfiles_candidato")).rows[0].n, 1);
  assert.equal((await db.query("select count(*)::integer as n from storage.objects where bucket_id = 'curriculums'")).rows[0].n, 1);
  const oferta = (await db.query("insert into public.ofertas_laborales(club_id,puesto_buscado,categoria,tipo_contrato,provincia,descripcion) values($1,'jugador','Regional','amateur','Buenos Aires','Prueba') returning id", [club])).rows[0].id;
  console.log("OK: solo administrador resuelve; verificado obtiene permisos e insignia.");

  await db.query("update public.perfiles_club set nombre_club = 'Otra institución' where usuario_id = $1", [club]);
  assert.equal((await db.query("select verificado from public.perfiles_club where usuario_id = $1", [club])).rows[0].verificado, false);
  assert.equal((await db.query("select estado from public.verificaciones_club where club_id = $1", [club])).rows[0].estado, "pendiente");
  await actuar(admin);
  await rechaza("update public.ofertas_laborales set estado = 'publicada' where id = $1", [oferta]);
  await decidir("verificado");
  await db.query("update public.ofertas_laborales set estado = 'publicada' where id = $1", [oferta]);
  await decidir("rechazado");
  await actuar(candidato);
  assert.equal((await db.query("select count(*)::integer as n from public.ofertas_laborales where id = $1", [oferta])).rows[0].n, 0);
  await actuar(club);
  await db.query("select public.solicitar_verificacion_club('Liga Prueba','Persona Prueba','Secretaría','contacto@club.test','1112345678','https://club.test')");
  await actuar(admin); await decidir("verificado");
  await actuar(club);
  await db.query("delete from public.perfiles_club where usuario_id = $1", [club]);
  await db.query("insert into public.perfiles_club(usuario_id,nombre_club,provincia,categoria,localidad,verificado) values($1,'Suplantación','Buenos Aires','Regional','Hurlingham',true)", [club]);
  assert.equal((await db.query("select verificado from public.perfiles_club where usuario_id = $1", [club])).rows[0].verificado, false);
  console.log("OK: cambios de identidad, rechazo y borrado del perfil revocan los permisos.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.close(); }
