import test from "node:test";
import assert from "node:assert/strict";
import {
  USUARIOS_POR_PAGINA,
  cambiarEstadoCuentaUsuario,
  construirHrefUsuarios,
  esFichaRepresentado,
  normalizarFiltrosUsuarios,
  validarCambioEstadoCuenta,
} from "../src/lib/gestion-usuarios.js";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const OBJETIVO_ID = "22222222-2222-4222-8222-222222222222";
const REPRESENTADO_ID = "33333333-3333-4333-8333-333333333333";

function crearSupabaseFalso({
  userId = ADMIN_ID,
  filas = {},
  fallarUpdate = false,
  devolverNuloEnUpdate = false,
} = {}) {
  const estado = structuredClone(filas);
  const llamadasBan = [];

  function crearQueryUsuarios() {
    let filtroId = null;
    let pendienteUpdate = null;

    const builder = {
      select() {
        return builder;
      },
      update(valores) {
        pendienteUpdate = valores;
        return builder;
      },
      eq(columna, valor) {
        if (columna === "id") filtroId = valor;
        return builder;
      },
      async maybeSingle() {
        if (pendienteUpdate) {
          if (fallarUpdate) {
            return { data: null, error: { message: "Política RLS denegada" } };
          }
          if (devolverNuloEnUpdate || !estado[filtroId]) {
            return { data: null, error: null };
          }
          estado[filtroId] = { ...estado[filtroId], ...pendienteUpdate };
          return {
            data: { id: filtroId, cuenta_activa: estado[filtroId].cuenta_activa },
            error: null,
          };
        }
        return { data: estado[filtroId] ?? null, error: null };
      },
    };
    return builder;
  }

  return {
    estado,
    llamadasBan,
    supabase: {
      auth: {
        async getUser() {
          return { data: { user: userId ? { id: userId } : null } };
        },
      },
      from(tabla) {
        assert.equal(tabla, "usuarios");
        return crearQueryUsuarios();
      },
    },
    supabaseAdmin: {
      from(tabla) {
        assert.equal(tabla, "usuarios");
        return crearQueryUsuarios();
      },
      auth: {
        admin: {
          async updateUserById(id, opciones) {
            llamadasBan.push({ id, opciones });
            return { data: { user: { id } }, error: null };
          },
        },
      },
    },
  };
}

test("normalizarFiltrosUsuarios sanea rol, estado, búsqueda y página", () => {
  assert.deepEqual(normalizarFiltrosUsuarios({}), {
    rol: "todos",
    estado: "todos",
    busqueda: "",
    pagina: 1,
  });

  assert.deepEqual(
    normalizarFiltrosUsuarios({
      rol: "club",
      estado: "inactivos",
      q: "  Atlético, % Norte (Sede)  ",
      pagina: "3",
    }),
    {
      rol: "club",
      estado: "inactivos",
      busqueda: "Atlético Norte Sede",
      pagina: 3,
    }
  );

  assert.deepEqual(
    normalizarFiltrosUsuarios({
      rol: "inexistente",
      estado: "otro",
      pagina: "-5",
    }),
    {
      rol: "todos",
      estado: "todos",
      busqueda: "",
      pagina: 1,
    }
  );
  assert.equal(USUARIOS_POR_PAGINA, 20);
});

test("construirHrefUsuarios omite valores por defecto y conserva filtros activos", () => {
  const base = { rol: "todos", estado: "todos", busqueda: "", pagina: 1 };
  assert.equal(construirHrefUsuarios(base), "/admin/usuarios");
  assert.equal(
    construirHrefUsuarios(base, { rol: "candidato", estado: "activos", busqueda: "juan", pagina: 2 }),
    "/admin/usuarios?rol=candidato&estado=activos&q=juan&pagina=2"
  );
});

test("esFichaRepresentado distingue fichas @cfa.local de cuentas con acceso real", () => {
  assert.equal(
    esFichaRepresentado({ correo_electronico: "representado_abc123@cfa.local" }),
    true
  );
  assert.equal(esFichaRepresentado({ correo_electronico: "jugador@club.com.ar" }), false);
  assert.equal(esFichaRepresentado(null), false);
});

test("validarCambioEstadoCuenta exige administrador activo e impide autodesactivación", () => {
  assert.match(
    validarCambioEstadoCuenta({
      admin: { id: ADMIN_ID, rol: "club", cuenta_activa: true },
      objetivoId: OBJETIVO_ID,
      cuentaActiva: false,
    }).error,
    /administrador activo/i
  );

  assert.match(
    validarCambioEstadoCuenta({
      admin: { id: ADMIN_ID, rol: "administrador", cuenta_activa: false },
      objetivoId: OBJETIVO_ID,
      cuentaActiva: false,
    }).error,
    /administrador activo/i
  );

  assert.match(
    validarCambioEstadoCuenta({
      admin: { id: ADMIN_ID, rol: "administrador", cuenta_activa: true },
      objetivoId: ADMIN_ID,
      cuentaActiva: false,
    }).error,
    /propia cuenta/i
  );

  assert.match(
    validarCambioEstadoCuenta({
      admin: { id: ADMIN_ID, rol: "administrador", cuenta_activa: true },
      objetivoId: "no-es-uuid",
      cuentaActiva: false,
    }).error,
    /inválido/i
  );

  assert.deepEqual(
    validarCambioEstadoCuenta({
      admin: { id: ADMIN_ID, rol: "administrador", cuenta_activa: true },
      objetivoId: OBJETIVO_ID,
      cuentaActiva: false,
    }),
    { ok: true }
  );
});

test("cambiarEstadoCuentaUsuario desactiva y reactiva cuentas reales sincronizando ban_duration", async () => {
  const entorno = crearSupabaseFalso({
    filas: {
      [ADMIN_ID]: {
        id: ADMIN_ID,
        rol: "administrador",
        correo_electronico: "admin@cfa.ar",
        cuenta_activa: true,
      },
      [OBJETIVO_ID]: {
        id: OBJETIVO_ID,
        rol: "club",
        correo_electronico: "contacto@club.ar",
        cuenta_activa: true,
      },
    },
  });

  const desactivar = await cambiarEstadoCuentaUsuario({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: OBJETIVO_ID,
    cuentaActiva: false,
  });

  assert.deepEqual(desactivar, { exito: true, cuenta_activa: false });
  assert.equal(entorno.estado[OBJETIVO_ID].cuenta_activa, false);
  assert.deepEqual(entorno.llamadasBan[0], {
    id: OBJETIVO_ID,
    opciones: { ban_duration: "876000h" },
  });

  const reactivar = await cambiarEstadoCuentaUsuario({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: OBJETIVO_ID,
    cuentaActiva: true,
  });

  assert.deepEqual(reactivar, { exito: true, cuenta_activa: true });
  assert.equal(entorno.estado[OBJETIVO_ID].cuenta_activa, true);
  assert.deepEqual(entorno.llamadasBan[1], {
    id: OBJETIVO_ID,
    opciones: { ban_duration: "none" },
  });
});

test("cambiarEstadoCuentaUsuario omite sincronización Auth en fichas @cfa.local y no reporta falso éxito en fallo RLS", async () => {
  const entornoFicha = crearSupabaseFalso({
    filas: {
      [ADMIN_ID]: {
        id: ADMIN_ID,
        rol: "administrador",
        correo_electronico: "admin@cfa.ar",
        cuenta_activa: true,
      },
      [REPRESENTADO_ID]: {
        id: REPRESENTADO_ID,
        rol: "candidato",
        correo_electronico: `representado_${REPRESENTADO_ID}@cfa.local`,
        cuenta_activa: true,
      },
    },
  });

  const respuestaFicha = await cambiarEstadoCuentaUsuario({
    supabase: entornoFicha.supabase,
    supabaseAdmin: entornoFicha.supabaseAdmin,
    objetivoId: REPRESENTADO_ID,
    cuentaActiva: false,
  });

  assert.deepEqual(respuestaFicha, { exito: true, cuenta_activa: false });
  assert.equal(entornoFicha.llamadasBan.length, 0);

  const entornoSinPermiso = crearSupabaseFalso({
    devolverNuloEnUpdate: true,
    filas: {
      [ADMIN_ID]: {
        id: ADMIN_ID,
        rol: "administrador",
        correo_electronico: "admin@cfa.ar",
        cuenta_activa: true,
      },
      [OBJETIVO_ID]: {
        id: OBJETIVO_ID,
        rol: "candidato",
        correo_electronico: "jugador@cfa.ar",
        cuenta_activa: true,
      },
    },
  });

  const respuestaFallida = await cambiarEstadoCuentaUsuario({
    supabase: entornoSinPermiso.supabase,
    objetivoId: OBJETIVO_ID,
    cuentaActiva: false,
  });

  assert.match(respuestaFallida.error, /No se pudo actualizar/i);
});
