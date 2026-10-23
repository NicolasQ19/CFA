import test from "node:test";
import assert from "node:assert/strict";
import { guardarGestionPostulante } from "../src/lib/guardar-seguimiento-club.js";

function formulario(valores = {}) {
  const datos = new FormData();
  for (const [clave, valor] of Object.entries({ postulacionId: "p1", estado: "preseleccionado", etapa: "evaluacion", notas: "Nota privada", ...valores })) datos.set(clave, valor);
  return datos;
}

function clienteFalso({ user = { id: "club-1" }, usuario = { rol: "club", cuenta_activa: true }, postulacion = { oferta_id: "oferta-1", estado: "postulado" }, verificado = true, errorSeguimiento = null, errorEstado = null } = {}) {
  const consultas = [];
  const escrituras = [];
  return {
    consultas, escrituras,
    auth: { getUser: async () => ({ data: { user } }) },
    rpc: async () => ({ data: verificado, error: null }),
    from(tabla) {
      const pasos = [["from", tabla]];
      consultas.push(pasos);
      let operacion = "leer";
      const consulta = {};
      for (const metodo of ["select", "eq", "maybeSingle", "single", "upsert", "update"]) {
        consulta[metodo] = (...args) => {
          pasos.push([metodo, ...args]);
          if (["upsert", "update"].includes(metodo)) { operacion = metodo; escrituras.push({ tabla, metodo, datos: args[0] }); }
          return consulta;
        };
      }
      consulta.then = (resolver, rechazar) => Promise.resolve(
        operacion === "upsert" ? { error: errorSeguimiento }
          : operacion === "update" ? { data: errorEstado ? null : { id: "p1" }, error: errorEstado }
          : { data: tabla === "usuarios" ? usuario : postulacion }
      ).then(resolver, rechazar);
      return consulta;
    },
  };
}

test("guardar seguimiento aplica el estado elegido después de guardar los datos privados", async () => {
  const cliente = clienteFalso();
  const resultado = await guardarGestionPostulante(cliente, formulario());
  assert.equal(resultado.exito, true);
  assert.equal(resultado.ofertaId, "oferta-1");
  assert.deepEqual(cliente.escrituras.map(e => e.tabla), ["seguimiento_club", "postulaciones"]);
  assert.equal(cliente.escrituras[0].datos.club_id, "club-1");
  assert.equal(cliente.escrituras[1].datos.estado, "preseleccionado");
  assert.deepEqual(Object.keys(cliente.escrituras[1].datos).sort(), ["actualizada_en", "estado"]);
  assert.ok(cliente.consultas[1].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "ofertas_laborales.club_id", "club-1"])));
  assert.ok(cliente.consultas[3].some(paso => JSON.stringify(paso) === JSON.stringify(["eq", "estado", "postulado"])));
});

test("guardar notas sin cambiar estado no actualiza su fecha ni genera otra novedad", async () => {
  const cliente = clienteFalso();
  const resultado = await guardarGestionPostulante(cliente, formulario({ estado: "postulado" }));
  assert.equal(resultado.exito, true);
  assert.deepEqual(cliente.escrituras.map(e => e.tabla), ["seguimiento_club"]);
});

test("una validación fallida no guarda ni seguimiento ni estado", async () => {
  for (const valores of [{ estado: "desconocido" }, { etapa: "desconocida" }, { notas: "x".repeat(3001) }]) {
    const cliente = clienteFalso();
    assert.ok((await guardarGestionPostulante(cliente, formulario(valores))).error);
    assert.equal(cliente.escrituras.length, 0);
    assert.equal(cliente.consultas.length, 0);
  }
});

test("sin sesión, con otro rol, inactivo o postulación ajena no se escribe", async () => {
  for (const opciones of [{ user: null }, { usuario: { rol: "candidato", cuenta_activa: true } }, { usuario: { rol: "club", cuenta_activa: false } }, { postulacion: null }, { verificado: false }]) {
    const cliente = clienteFalso(opciones);
    assert.ok((await guardarGestionPostulante(cliente, formulario())).error);
    assert.equal(cliente.escrituras.length, 0);
  }
});

test("si falla el seguimiento no se cambia el estado público", async () => {
  const cliente = clienteFalso({ errorSeguimiento: { message: "Sin acceso" } });
  const resultado = await guardarGestionPostulante(cliente, formulario());
  assert.ok(resultado.error);
  assert.equal(resultado.exito, undefined);
  assert.equal(cliente.escrituras.length, 1);
  assert.equal(cliente.escrituras[0].tabla, "seguimiento_club");
});

test("un fallo o cambio concurrente del estado informa el guardado parcial", async () => {
  const cliente = clienteFalso({ errorEstado: { message: "No hay filas" } });
  const resultado = await guardarGestionPostulante(cliente, formulario());
  assert.equal(resultado.seguimientoGuardado, true);
  assert.equal(resultado.exito, undefined);
  assert.match(resultado.error, /seguimiento privado/);
  assert.match(resultado.error, /no se pudo cambiar/);
});

test("permite conservar oferta_cerrada pero no asignarlo como un nuevo estado", async () => {
  const cliente = clienteFalso({ postulacion: { oferta_id: "o1", estado: "oferta_cerrada" } });
  assert.equal((await guardarGestionPostulante(cliente, formulario({ estado: "oferta_cerrada" }))).exito, true);
  assert.equal(cliente.escrituras.length, 1);
  const otro = clienteFalso();
  assert.ok((await guardarGestionPostulante(otro, formulario({ estado: "oferta_cerrada" }))).error);
  assert.equal(otro.escrituras.length, 0);
});
