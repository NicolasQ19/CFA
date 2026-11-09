import test from "node:test";
import assert from "node:assert/strict";
import { evaluarAcceso, obtenerReglaDeRuta } from "../src/lib/rutas-protegidas.js";

const CANDIDATO = { rol: "candidato", cuenta_activa: true };
const CLUB = { rol: "club", cuenta_activa: true };
const REPRESENTANTE = { rol: "representante", cuenta_activa: true };
const ADMIN = { rol: "administrador", cuenta_activa: true };

test("las rutas públicas no tienen regla", () => {
  for (const ruta of ["/", "/ofertas", "/ofertas/abc", "/planes", "/como-funciona", "/registrarse"]) {
    assert.equal(obtenerReglaDeRuta(ruta), null, ruta);
    assert.equal(evaluarAcceso({ ruta, usuario: null }).permitido, true, ruta);
  }
});

test("los perfiles públicos con id siguen siendo públicos", () => {
  for (const ruta of ["/perfil-publico-club", "/perfil-publico-representante"]) {
    assert.equal(obtenerReglaDeRuta(ruta), null, ruta);
  }
  // En cambio /perfil-publico (el propio) exige sesión.
  assert.ok(obtenerReglaDeRuta("/perfil-publico"));
});

test("el alta de administrador no exige sesión, pero el resto de /admin sí", () => {
  assert.equal(evaluarAcceso({ ruta: "/admin/registrarse", usuario: null }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/admin/usuarios", usuario: null }).permitido, false);
});

test("sin sesión, toda ruta restringida manda a iniciar sesión", () => {
  for (const ruta of ["/admin", "/admin/usuarios", "/mi-cartera", "/mis-ofertas/nueva"]) {
    assert.deepEqual(evaluarAcceso({ ruta, usuario: null }), {
      permitido: false,
      motivo: "sin-sesion",
      destino: "/iniciar-sesion",
    });
  }
});

test("cada rol entra solo a lo suyo", () => {
  assert.equal(evaluarAcceso({ ruta: "/admin/metricas", usuario: ADMIN }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/admin/metricas", usuario: CLUB }).permitido, false);

  assert.equal(evaluarAcceso({ ruta: "/mis-ofertas", usuario: CLUB }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/mis-ofertas", usuario: CANDIDATO }).permitido, false);

  assert.equal(evaluarAcceso({ ruta: "/mi-cartera/nuevo", usuario: REPRESENTANTE }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/mi-cartera/nuevo", usuario: CLUB }).permitido, false);

  assert.equal(evaluarAcceso({ ruta: "/mis-postulaciones", usuario: CANDIDATO }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/mis-postulaciones", usuario: REPRESENTANTE }).permitido, false);

  // /mi-perfil lo usan candidatos y representantes.
  assert.equal(evaluarAcceso({ ruta: "/mi-perfil", usuario: CANDIDATO }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/mi-perfil", usuario: REPRESENTANTE }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/mi-perfil", usuario: CLUB }).permitido, false);

  // Buscar candidatos lo comparten club y administración.
  assert.equal(evaluarAcceso({ ruta: "/buscar-candidatos", usuario: CLUB }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/buscar-candidatos", usuario: ADMIN }).permitido, true);
  assert.equal(evaluarAcceso({ ruta: "/buscar-candidatos", usuario: CANDIDATO }).permitido, false);
});

test("una cuenta desactivada no entra a ninguna ruta restringida", () => {
  const suspendido = { rol: "club", cuenta_activa: false };
  assert.deepEqual(evaluarAcceso({ ruta: "/mis-ofertas", usuario: suspendido }), {
    permitido: false,
    motivo: "cuenta-inactiva",
    destino: "/",
  });
});

test("entrar a la ruta de otro rol da 403, no una redirección", () => {
  // El motivo es lo que hace que el middleware reescriba a /sin-permiso en vez
  // de mandar al inicio: la ruta existe, pero no es de este rol.
  for (const [ruta, usuario] of [
    ["/mis-ofertas", CANDIDATO],
    ["/mi-cartera", CLUB],
    ["/mis-postulaciones", REPRESENTANTE],
    ["/admin/usuarios", CLUB],
    ["/mi-perfil", CLUB],
  ]) {
    assert.deepEqual(evaluarAcceso({ ruta, usuario }), {
      permitido: false,
      motivo: "rol-no-habilitado",
      destino: null,
    }, ruta);
  }
});

test("sin sesión gana sobre el rol: primero se pide iniciar sesión", () => {
  // Una ruta de otro rol sin sesión no debe dar 403, porque todavía no se sabe
  // quién es: tiene que poder iniciar sesión y volver.
  assert.equal(evaluarAcceso({ ruta: "/mis-ofertas", usuario: null }).motivo, "sin-sesion");
});

test("un prefijo no se confunde con otra ruta que empiece igual", () => {
  assert.equal(obtenerReglaDeRuta("/mi-clubes-favoritos"), null);
  assert.equal(obtenerReglaDeRuta("/administracion"), null);
  assert.ok(obtenerReglaDeRuta("/mi-club"));
  assert.ok(obtenerReglaDeRuta("/admin/clubes"));
});
