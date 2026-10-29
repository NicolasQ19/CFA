import test from "node:test";
import assert from "node:assert/strict";
import {
  obtenerReglasEdicionOferta,
  validarDatosOferta,
  validarEdicionOferta,
} from "../src/lib/editar-oferta.js";

function formulario(valores) {
  const form = new FormData();
  for (const [clave, valor] of Object.entries(valores)) {
    form.set(clave, valor);
  }
  return form;
}

const OFERTA_BASE = {
  id: "oferta-1",
  club_id: "club-1",
  estado: "pendiente_moderacion",
  puesto_buscado: "director_tecnico",
  posicion_juego: null,
  categoria: "Primera Nacional",
  tipo_contrato: "profesional",
  provincia: "Buenos Aires",
  descripcion: "Se busca entrenador principal con experiencia en el ascenso.",
};

test("validarDatosOferta valida campos obligatorios, opciones cerradas y limpia posición en cuerpo técnico", () => {
  const okJugador = validarDatosOferta(
    formulario({
      puestoBuscado: "jugador",
      posicionJuego: "Delantero centro",
      categoria: "Primera Nacional",
      tipoContrato: "profesional",
      provincia: "Buenos Aires",
      descripcion: "Se busca delantero centro con experiencia en la categoría.",
    }),
  );

  assert.equal(okJugador.error, undefined);
  assert.equal(okJugador.datos.puesto_buscado, "jugador");
  assert.equal(okJugador.datos.posicion_juego, "Delantero centro");

  const okTecnico = validarDatosOferta(
    formulario({
      puestoBuscado: "director_tecnico",
      posicionJuego: "Delantero centro",
      categoria: "Primera",
      tipoContrato: "profesional",
      provincia: "Córdoba",
      descripcion: "Nuevo cuerpo técnico para la temporada.",
    }),
  );
  assert.equal(okTecnico.datos.posicion_juego, null);

  assert.match(
    validarDatosOferta(
      formulario({
        puestoBuscado: "jugador",
        categoria: "Primera",
        tipoContrato: "profesional",
        provincia: "Buenos Aires",
        descripcion: "   ",
      }),
    ).error,
    /obligatorios/,
  );

  assert.ok(
    validarDatosOferta(
      formulario({
        puestoBuscado: "invalido",
        categoria: "Federal A",
        tipoContrato: "profesional",
        provincia: "Santa Fe",
        descripcion: "Búsqueda abierta.",
      }),
    ).error,
  );
});

test("obtenerReglasEdicionOferta permite edición completa solo antes de publicar y sin postulantes", () => {
  assert.equal(obtenerReglasEdicionOferta(OFERTA_BASE, 0).identidadEditable, true);
  assert.equal(
    obtenerReglasEdicionOferta({ ...OFERTA_BASE, estado: "rechazada" }, 0).identidadEditable,
    true,
  );

  // Con postulantes previos (ej. estuvo publicada y fue rechazada) se bloquea cambiar el puesto
  assert.equal(
    obtenerReglasEdicionOferta({ ...OFERTA_BASE, estado: "rechazada" }, 2).identidadEditable,
    false,
  );

  // Publicada o pausada bloquean identidad aunque aún tengan 0 postulantes
  assert.equal(
    obtenerReglasEdicionOferta({ ...OFERTA_BASE, estado: "publicada" }, 0).identidadEditable,
    false,
  );
  assert.equal(
    obtenerReglasEdicionOferta({ ...OFERTA_BASE, estado: "pausada" }, 0).identidadEditable,
    false,
  );

  // Cerrada no admite ninguna edición
  const cerrada = obtenerReglasEdicionOferta({ ...OFERTA_BASE, estado: "cerrada" }, 3);
  assert.equal(cerrada.puedeEditar, false);
  assert.match(cerrada.motivoBloqueo, /cerradas son definitivas/i);
});

test("validarEdicionOferta permite corregir puesto y condiciones si está pendiente o rechazada sin postulantes", () => {
  const resultado = validarEdicionOferta({
    datosFormulario: formulario({
      puestoBuscado: "preparador_fisico",
      categoria: "Federal A",
      tipoContrato: "profesional",
      provincia: "Mendoza",
      descripcion: "Descripción corregida antes de aprobarse.",
    }),
    ofertaActual: { ...OFERTA_BASE, estado: "rechazada" },
    totalPostulantes: 0,
  });

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.datos.puesto_buscado, "preparador_fisico");
  assert.equal(resultado.datos.estado, "pendiente_moderacion");
});

test("validarEdicionOferta impide cambiar el puesto en ofertas publicadas o con postulantes (protección DT → Jugador)", () => {
  const intentoCambiarRol = validarEdicionOferta({
    datosFormulario: formulario({
      puestoBuscado: "jugador",
      posicionJuego: "Arquero",
      descripcion: "Ahora buscamos arquero.",
    }),
    ofertaActual: { ...OFERTA_BASE, estado: "publicada" },
    totalPostulantes: 1,
  });

  assert.match(intentoCambiarRol.error, /no pueden modificarse/i);

  const intentoEnRechazadaConPostulantes = validarEdicionOferta({
    datosFormulario: formulario({
      puestoBuscado: "jugador",
      descripcion: "Cambio de rol con postulantes.",
    }),
    ofertaActual: { ...OFERTA_BASE, estado: "rechazada" },
    totalPostulantes: 2,
  });

  assert.match(intentoEnRechazadaConPostulantes.error, /no pueden modificarse/i);
});

test("validarEdicionOferta en oferta publicada o pausada solo actualiza descripción y la reenvía a pendiente_moderacion", () => {
  const resultado = validarEdicionOferta({
    datosFormulario: formulario({
      descripcion: "Se suma disponibilidad para entrenamientos en turno mañana.",
    }),
    ofertaActual: { ...OFERTA_BASE, estado: "publicada" },
    totalPostulantes: 4,
  });

  assert.deepEqual(resultado, {
    datos: {
      descripcion: "Se suma disponibilidad para entrenamientos en turno mañana.",
      estado: "pendiente_moderacion",
    },
  });
});

test("validarEdicionOferta rechaza editar ofertas cerradas y evita reenviar a moderación si no hubo cambios reales", () => {
  const cerrada = validarEdicionOferta({
    datosFormulario: formulario({ descripcion: "Intento de reciclar oferta cerrada." }),
    ofertaActual: { ...OFERTA_BASE, estado: "cerrada" },
    totalPostulantes: 1,
  });
  assert.match(cerrada.error, /cerradas son definitivas/i);

  const sinCambios = validarEdicionOferta({
    datosFormulario: formulario({ descripcion: OFERTA_BASE.descripcion }),
    ofertaActual: { ...OFERTA_BASE, estado: "publicada" },
    totalPostulantes: 1,
  });
  assert.match(sinCambios.error, /No realizaste cambios/i);
});
