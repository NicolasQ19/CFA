import test from "node:test";
import assert from "node:assert/strict";
import {
  ESTADOS_ABIERTOS_POSTULACION,
  ejecutarCambioEstadoOferta,
} from "../src/lib/cierre-oferta.js";

function crearSupabaseOferta({
  oferta = { id: "oferta-1", club_id: "club-1", estado: "publicada" },
  postulaciones = [],
  errorUpdateOferta = null,
  errorUpdatePostulaciones = null,
} = {}) {
  const estadoOferta = oferta ? { ...oferta } : null;
  const filasPostulaciones = postulaciones.map((p) => ({ ...p }));
  let actualizacionesPostulaciones = 0;

  const supabase = {
    from(tabla) {
      if (tabla === "ofertas_laborales") {
        let valoresPendientes = null;
        return {
          select() {
            return this;
          },
          update(valores) {
            valoresPendientes = valores;
            return this;
          },
          eq(columna, valor) {
            if (valoresPendientes && estadoOferta && columna === "club_id" && estadoOferta.club_id === valor) {
              if (!errorUpdateOferta) {
                Object.assign(estadoOferta, valoresPendientes);
              }
              return Promise.resolve({ error: errorUpdateOferta });
            }
            return this;
          },
          async maybeSingle() {
            return { data: estadoOferta, error: null };
          },
        };
      }

      if (tabla === "postulaciones") {
        let valoresPendientes = null;
        let filtroOferta = null;
        return {
          update(valores) {
            valoresPendientes = valores;
            return this;
          },
          eq(columna, valor) {
            if (columna === "oferta_id") filtroOferta = valor;
            return this;
          },
          async in(columna, estadosPermitidos) {
            assert.equal(columna, "estado");
            assert.deepEqual(estadosPermitidos, ESTADOS_ABIERTOS_POSTULACION);
            actualizacionesPostulaciones += 1;
            if (errorUpdatePostulaciones) {
              return { error: errorUpdatePostulaciones };
            }
            for (const fila of filasPostulaciones) {
              if (fila.oferta_id === filtroOferta && estadosPermitidos.includes(fila.estado)) {
                Object.assign(fila, valoresPendientes);
              }
            }
            return { error: null };
          },
        };
      }

      throw new Error(`Tabla inesperada: ${tabla}`);
    },
  };

  return {
    supabase,
    estadoOferta,
    filasPostulaciones,
    obtenerLlamadasPostulaciones: () => actualizacionesPostulaciones,
  };
}

test("cerrar una oferta propaga oferta_cerrada a postulaciones abiertas sin pisar las rechazadas", async () => {
  const marcaTiempo = "2026-10-30T12:00:00.000Z";
  const entorno = crearSupabaseOferta({
    oferta: { id: "oferta-1", club_id: "club-1", estado: "publicada" },
    postulaciones: [
      { id: "p1", oferta_id: "oferta-1", estado: "postulado", actualizada_en: "2026-10-20T00:00:00.000Z" },
      { id: "p2", oferta_id: "oferta-1", estado: "visto", actualizada_en: "2026-10-21T00:00:00.000Z" },
      { id: "p3", oferta_id: "oferta-1", estado: "preseleccionado", actualizada_en: "2026-10-22T00:00:00.000Z" },
      { id: "p4", oferta_id: "oferta-1", estado: "rechazado", actualizada_en: "2026-10-23T00:00:00.000Z" },
      { id: "p5", oferta_id: "otra-oferta", estado: "postulado", actualizada_en: "2026-10-24T00:00:00.000Z" },
    ],
  });

  const resultado = await ejecutarCambioEstadoOferta({
    supabase: entorno.supabase,
    ofertaId: "oferta-1",
    clubId: "club-1",
    nuevoEstado: "cerrada",
    ahora: marcaTiempo,
  });

  assert.deepEqual(resultado, { exito: true, ofertaCerrada: true });
  assert.equal(entorno.estadoOferta.estado, "cerrada");
  assert.equal(entorno.filasPostulaciones[0].estado, "oferta_cerrada");
  assert.equal(entorno.filasPostulaciones[1].estado, "oferta_cerrada");
  assert.equal(entorno.filasPostulaciones[2].estado, "oferta_cerrada");
  assert.equal(entorno.filasPostulaciones[0].actualizada_en, marcaTiempo);

  // La postulación ya rechazada conserva su estado y fecha originales
  assert.equal(entorno.filasPostulaciones[3].estado, "rechazado");
  assert.equal(entorno.filasPostulaciones[3].actualizada_en, "2026-10-23T00:00:00.000Z");

  // Otra oferta no se ve afectada
  assert.equal(entorno.filasPostulaciones[4].estado, "postulado");
});

test("pausar o reanudar una oferta no altera el estado de las postulaciones", async () => {
  const entorno = crearSupabaseOferta({
    oferta: { id: "oferta-1", club_id: "club-1", estado: "publicada" },
    postulaciones: [{ id: "p1", oferta_id: "oferta-1", estado: "postulado" }],
  });

  const resultado = await ejecutarCambioEstadoOferta({
    supabase: entorno.supabase,
    ofertaId: "oferta-1",
    clubId: "club-1",
    nuevoEstado: "pausada",
  });

  assert.deepEqual(resultado, { exito: true, ofertaCerrada: false });
  assert.equal(entorno.estadoOferta.estado, "pausada");
  assert.equal(entorno.obtenerLlamadasPostulaciones(), 0);
  assert.equal(entorno.filasPostulaciones[0].estado, "postulado");
});

test("rechaza cambios sobre ofertas ajenas o ya cerradas sin tocar postulaciones", async () => {
  const ajena = crearSupabaseOferta({
    oferta: { id: "oferta-1", club_id: "otro-club", estado: "publicada" },
  });
  assert.match(
    (
      await ejecutarCambioEstadoOferta({
        supabase: ajena.supabase,
        ofertaId: "oferta-1",
        clubId: "club-1",
        nuevoEstado: "cerrada",
      })
    ).error,
    /no pertenece/i,
  );
  assert.equal(ajena.obtenerLlamadasPostulaciones(), 0);

  const yaCerrada = crearSupabaseOferta({
    oferta: { id: "oferta-1", club_id: "club-1", estado: "cerrada" },
  });
  assert.match(
    (
      await ejecutarCambioEstadoOferta({
        supabase: yaCerrada.supabase,
        ofertaId: "oferta-1",
        clubId: "club-1",
        nuevoEstado: "publicada",
      })
    ).error,
    /No se puede cambiar/i,
  );
  assert.equal(yaCerrada.obtenerLlamadasPostulaciones(), 0);
});
