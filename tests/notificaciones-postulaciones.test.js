import test from "node:test";
import assert from "node:assert/strict";
import { obtenerAvisosPostulaciones, consultarAvisosPostulaciones } from "../src/lib/notificaciones-postulaciones.js";

function clienteFalso(respuestas, usuarioSesion = null) {
  const consultas = [];
  return {
    consultas,
    auth: { getUser: async () => ({ data: { user: usuarioSesion }, error: null }) },
    from(tabla) {
      const pasos = [["from", tabla]];
      consultas.push(pasos);
      const resultado = respuestas.shift();
      const consulta = {};
      for (const metodo of ["select", "eq", "in", "order", "limit", "range", "maybeSingle"]) {
        consulta[metodo] = (...args) => { pasos.push([metodo, ...args]); return consulta; };
      }
      consulta.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
      return consulta;
    },
  };
}

const creacion = "2026-10-23T12:00:00Z";
const cambio = "2026-10-23T13:00:00Z";
const postulacion = (valores = {}) => ({
  id: "postulacion-1", estado: "postulado", creada_en: creacion, actualizada_en: creacion,
  ofertas_laborales: { puesto_buscado: "jugador", posicion_juego: "Arquero", perfiles_club: { nombre_club: "Club Uno" } },
  ...valores,
});

test("un visitante o una cuenta inactiva no consulta datos privilegiados", async () => {
  const crearDatos = () => { throw new Error("No debe acceder a los datos"); };
  const anonimo = clienteFalso([]);
  assert.equal((await consultarAvisosPostulaciones(anonimo, crearDatos)).status, 401);
  assert.equal(anonimo.consultas.length, 0);
  for (const usuario of [{ rol: "club", cuenta_activa: false }, { rol: "representante", cuenta_activa: false }, { rol: "administrador", cuenta_activa: true }, null]) {
    const sesion = clienteFalso([{ data: usuario }], { id: "usuario-1" });
    assert.equal((await consultarAvisosPostulaciones(sesion, crearDatos)).status, 403);
  }
});

test("el representante recibe cambios con nombre del representado y solo consulta postulaciones que envió", async () => {
  const cliente = clienteFalso([{ data: [
    postulacion({ estado: "preseleccionado", actualizada_en: cambio, perfiles_candidato: { usuarios: { nombre_completo: "Juan Pérez" } } }),
    postulacion({ id: "sin-cambio" }),
    postulacion({ id: "rechazada", estado: "rechazado", actualizada_en: cambio }),
    postulacion({ id: "restablecida", actualizada_en: cambio }),
  ] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "representante-1", rol: "representante" });
  assert.equal(resultado.total, 3);
  assert.equal(resultado.notificaciones[0].origen, "Club Uno");
  assert.match(resultado.notificaciones[0].mensaje, /Juan Pérez: Preseleccionado/);
  assert.match(resultado.notificaciones[0].detalle, /Arquero/);
  assert.equal(resultado.notificaciones[0].href, "/mi-cartera#postulacion-postulacion-1");
  assert.equal(resultado.notificaciones[0].fecha, cambio);
  assert.match(resultado.notificaciones[1].mensaje, /tu representado: No seleccionado/);
  assert.match(resultado.notificaciones[2].mensaje, /Postulado/);
  assert.ok(cliente.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "postulado_por_representante_id", "representante-1"])));
  assert.ok(!JSON.stringify(cliente.consultas).includes("seguimiento_club"));
});

test("los avisos del representante usan la identidad autenticada y propagan errores", async () => {
  const sesion = clienteFalso([{ data: { id: "otro-id", rol: "representante", cuenta_activa: true } }], { id: "representante-autenticado" });
  const datos = clienteFalso([{ data: [] }]);
  const resultado = await consultarAvisosPostulaciones(sesion, () => datos);
  assert.equal(resultado.status, 200);
  assert.equal(resultado.datos.total, 0);
  assert.ok(datos.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "postulado_por_representante_id", "representante-autenticado"])));
  await assert.rejects(obtenerAvisosPostulaciones(clienteFalso([{ error: new Error("Sin conexión") }]), { id: "r1", rol: "representante" }), /Sin conexión/);
});

test("pagina todas las postulaciones del representante manteniendo el filtro de autoría", async () => {
  const filas = Array.from({ length: 500 }, (_, i) => postulacion({ id: `p${i}`, estado: "visto", actualizada_en: cambio }));
  const cliente = clienteFalso([{ data: filas }, { data: [postulacion({ id: "ultima", estado: "oferta_cerrada", actualizada_en: cambio })] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "r1", rol: "representante" });
  assert.equal(resultado.total, 501);
  assert.match(resultado.notificaciones.at(-1).mensaje, /Oferta cerrada/);
  for (const consulta of cliente.consultas) {
    assert.ok(consulta.some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "postulado_por_representante_id", "r1"])));
  }
  assert.ok(cliente.consultas[1].some(paso => JSON.stringify(paso) === JSON.stringify(["range", 500, 999])));
});

test("el club recibe el candidato y oferta, y la consulta se limita a su club y pendientes", async () => {
  const cliente = clienteFalso([{ count: 12, data: [{ id: "p1", oferta_id: "o1", creada_en: creacion,
    perfiles_candidato: { usuarios: { nombre_completo: "Candidato Uno" } },
    ofertas_laborales: { puesto_buscado: "jugador", posicion_juego: "Arquero" },
  }] }, { data: [], count: 0 }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "club-1", rol: "club", verificacion_club: { estado: "verificado" } });
  assert.equal(resultado.total, 1);
  assert.equal(resultado.notificaciones[0].origen, "Candidato Uno");
  assert.equal(resultado.notificaciones[0].href, "/mis-ofertas/o1/postulantes#postulacion-p1");
  assert.match(resultado.notificaciones[0].detalle, /Arquero/);
  assert.ok(cliente.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "ofertas_laborales.club_id", "club-1"])));
  assert.ok(cliente.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "estado", "postulado"])));
  assert.ok(!JSON.stringify(cliente.consultas).includes("seguimiento_club"));
});

test("el candidato no recibe aviso inicial y recibe el estado actualizado y el club", async () => {
  const cliente = clienteFalso([{ data: [postulacion({ estado: "preseleccionado", actualizada_en: cambio }), postulacion({ id: "sin-cambio" })] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "candidato-1", rol: "candidato" });
  assert.equal(resultado.total, 1);
  assert.equal(resultado.notificaciones[0].origen, "Club Uno");
  assert.match(resultado.notificaciones[0].mensaje, /Preseleccionado/);
  assert.equal(resultado.notificaciones[0].fecha, cambio);
  assert.equal(resultado.notificaciones[0].href, "/mis-postulaciones#postulacion-postulacion-1");
  assert.ok(cliente.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "candidato_id", "candidato-1"])));
});

test("volver al estado postulado genera aviso y el rechazo usa el texto del candidato", async () => {
  const cliente = clienteFalso([{ data: [postulacion({ actualizada_en: cambio }), postulacion({ id: "p2", estado: "rechazado", actualizada_en: cambio })] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "candidato-1", rol: "candidato" });
  assert.equal(resultado.total, 2);
  assert.match(resultado.notificaciones[0].mensaje, /Postulado/);
  assert.match(resultado.notificaciones[1].mensaje, /No seleccionado/);
});

test("devuelve todas las versiones al paginar para calcular los avisos sin leer", async () => {
  const filas = Array.from({ length: 500 }, (_, i) => postulacion({ id: `p${i}`, estado: "visto", actualizada_en: cambio }));
  const cliente = clienteFalso([{ data: filas }, { data: [postulacion({ id: "ultimo", estado: "rechazado" })] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "candidato-1", rol: "candidato" });
  assert.equal(resultado.total, 501);
  assert.equal(resultado.notificaciones.length, 501);
  assert.equal(cliente.consultas.length, 2);
});

test("la identidad proviene de la sesión y un fallo de consulta no se muestra como cero avisos", async () => {
  const sesion = clienteFalso([{ data: { id: "id-incorrecto", rol: "club", cuenta_activa: true } }, { data: { estado: "verificado" } }], { id: "club-autenticado" });
  const datos = clienteFalso([{ data: [], count: 0 }, { data: [], count: 0 }]);
  assert.equal((await consultarAvisosPostulaciones(sesion, () => datos)).status, 200);
  assert.ok(datos.consultas[0].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "ofertas_laborales.club_id", "club-autenticado"])));
  await assert.rejects(obtenerAvisosPostulaciones(clienteFalso([{ error: new Error("Sin conexión") }]), { id: "c1", rol: "candidato" }), /Sin conexión/);
});

test("el club recibe publicación y rechazo con enlace a su oferta y contador combinado", async () => {
  const cliente = clienteFalso([
    { data: [], count: 5 },
    { count: 10, data: [
      { id: "aprobada", estado: "publicada", puesto_buscado: "jugador", posicion_juego: "Arquero", actualizada_en: cambio },
      { id: "denegada", estado: "rechazada", puesto_buscado: "director_tecnico", actualizada_en: creacion },
    ] },
  ]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "club-1", rol: "club", verificacion_club: { estado: "verificado" } });
  assert.equal(resultado.total, 2);
  assert.match(resultado.notificaciones[0].mensaje, /fue publicada/);
  assert.match(resultado.notificaciones[1].mensaje, /fue rechazada/);
  assert.equal(resultado.notificaciones[0].href, "/mis-ofertas#oferta-aprobada");
  assert.equal(resultado.notificaciones[0].fecha, cambio);
  assert.match(resultado.notificaciones[0].detalle, /Arquero/);
  assert.ok(cliente.consultas[1].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "club_id", "club-1"])));
  assert.ok(cliente.consultas[1].some(paso => JSON.stringify(paso) === JSON.stringify(["in", "estado", ["publicada", "rechazada"]])));
});

test("combina las dos fuentes por fecha y conserva todas las versiones para descontar lecturas", async () => {
  const cliente = clienteFalso([
    { count: 8, data: Array.from({ length: 8 }, (_, i) => ({ id: String(i), oferta_id: "o1", creada_en: creacion })) },
    { count: 8, data: Array.from({ length: 8 }, (_, i) => ({ id: String(i), estado: "publicada", actualizada_en: cambio })) },
  ]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "club-1", rol: "club", verificacion_club: { estado: "verificado" } });
  assert.equal(resultado.total, 16);
  assert.equal(resultado.notificaciones.length, 16);
  assert.ok(resultado.notificaciones.slice(0, 8).every(aviso => aviso.id.startsWith("oferta-") && aviso.fecha === cambio));
  assert.equal(new Set(resultado.notificaciones.map(aviso => aviso.id)).size, 16);
});

test("no informa cero novedades si falla la consulta de ofertas", async () => {
  const cliente = clienteFalso([{ data: [], count: 0 }, { error: new Error("Error de ofertas") }]);
  await assert.rejects(obtenerAvisosPostulaciones(cliente, { id: "club-1", rol: "club", verificacion_club: { estado: "verificado" } }), /Error de ofertas/);
});

test("un club sin verificar solo recibe su resultado y no consulta datos de candidatos", async () => {
  const sesion = clienteFalso([
    { data: { id: "club-1", rol: "club", cuenta_activa: true } },
    { data: { estado: "rechazado", revisada_en: cambio, observaciones: "Corregí el contacto institucional" } },
  ], { id: "club-1" });
  const resultado = await consultarAvisosPostulaciones(sesion, () => { throw new Error("No debe abrir el cliente privilegiado"); });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.datos.total, 1);
  assert.match(resultado.datos.notificaciones[0].mensaje, /rechazó la verificación/);
  assert.match(resultado.datos.notificaciones[0].mensaje, /contacto institucional/);
  assert.equal(resultado.datos.notificaciones[0].href, "/mi-club#verificacion");
  const pendientes = await obtenerAvisosPostulaciones(null, { id: "club-1", rol: "club", verificacion_club: { estado: "pendiente" } });
  assert.equal(pendientes.total, 0);
});

test("un club aprobado recibe la confirmación junto con sus otros avisos", async () => {
  const cliente = clienteFalso([{ data: [] }, { data: [] }]);
  const resultado = await obtenerAvisosPostulaciones(cliente, { id: "club-1", rol: "club", verificacion_club: { estado: "verificado", revisada_en: cambio } });
  assert.equal(resultado.total, 1);
  assert.match(resultado.notificaciones[0].mensaje, /verificó tu club/);
});
