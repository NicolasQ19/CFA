import test from "node:test";
import assert from "node:assert/strict";
import {
  eliminarUsuarioComoAdmin,
  validarEliminacionUsuario,
} from "../src/lib/gestion-usuarios.js";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const OTRO_ADMIN_ID = "44444444-4444-4444-8444-444444444444";
const CANDIDATO_ID = "22222222-2222-4222-8222-222222222222";
const REPRESENTADO_ID = "33333333-3333-4333-8333-333333333333";

const ADMIN = { id: ADMIN_ID, rol: "administrador", cuenta_activa: true };

function crearEntorno({ userId = ADMIN_ID, filas = {}, fallarBorrado = false } = {}) {
  const estado = structuredClone(filas);
  const borradosAuth = [];

  function crearQueryUsuarios() {
    let filtroId = null;
    let esBorrado = false;

    const builder = {
      select() {
        return builder;
      },
      delete() {
        esBorrado = true;
        return builder;
      },
      eq(columna, valor) {
        if (columna === "id") filtroId = valor;
        if (esBorrado) {
          if (fallarBorrado) return { data: null, error: { message: "Política RLS denegada" } };
          delete estado[filtroId];
          return { data: null, error: null };
        }
        return builder;
      },
      async maybeSingle() {
        return { data: estado[filtroId] ?? null, error: null };
      },
    };
    return builder;
  }

  return {
    estado,
    borradosAuth,
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
          async deleteUser(id) {
            borradosAuth.push(id);
            return { data: null, error: null };
          },
        },
      },
    },
  };
}

const FILAS = {
  [ADMIN_ID]: {
    id: ADMIN_ID,
    rol: "administrador",
    cuenta_activa: true,
    nombre_completo: "Admin CFA",
    correo_electronico: "admin@cfa.test",
  },
  [OTRO_ADMIN_ID]: {
    id: OTRO_ADMIN_ID,
    rol: "administrador",
    cuenta_activa: true,
    nombre_completo: "Otro Admin",
    correo_electronico: "otro@cfa.test",
  },
  [CANDIDATO_ID]: {
    id: CANDIDATO_ID,
    rol: "candidato",
    cuenta_activa: true,
    nombre_completo: "Ana Candidata",
    correo_electronico: "ana@mail.test",
  },
  [REPRESENTADO_ID]: {
    id: REPRESENTADO_ID,
    rol: "candidato",
    cuenta_activa: true,
    nombre_completo: "Ficha Cartera",
    correo_electronico: "ficha@cfa.local",
  },
};

test("validarEliminacionUsuario rechaza admins, la cuenta propia y los ids inválidos", () => {
  const objetivo = FILAS[CANDIDATO_ID];

  assert.deepEqual(
    validarEliminacionUsuario({ admin: ADMIN, objetivo, objetivoId: CANDIDATO_ID }),
    { ok: true }
  );

  assert.match(
    validarEliminacionUsuario({
      admin: { ...ADMIN, rol: "club" },
      objetivo,
      objetivoId: CANDIDATO_ID,
    }).error,
    /Solo un administrador activo/i
  );

  assert.match(
    validarEliminacionUsuario({
      admin: { ...ADMIN, cuenta_activa: false },
      objetivo,
      objetivoId: CANDIDATO_ID,
    }).error,
    /Solo un administrador activo/i
  );

  assert.match(
    validarEliminacionUsuario({ admin: ADMIN, objetivo, objetivoId: "no-es-uuid" }).error,
    /inválido/i
  );

  assert.match(
    validarEliminacionUsuario({ admin: ADMIN, objetivo: FILAS[ADMIN_ID], objetivoId: ADMIN_ID })
      .error,
    /tu propia cuenta/i
  );

  assert.match(
    validarEliminacionUsuario({
      admin: ADMIN,
      objetivo: FILAS[OTRO_ADMIN_ID],
      objetivoId: OTRO_ADMIN_ID,
    }).error,
    /administrador no se pueden eliminar/i
  );

  assert.match(
    validarEliminacionUsuario({ admin: ADMIN, objetivo: null, objetivoId: CANDIDATO_ID }).error,
    /No se encontró/i
  );
});

test("eliminarUsuarioComoAdmin borra la cuenta en Auth y en la tabla", async () => {
  const entorno = crearEntorno({ filas: FILAS });

  const respuesta = await eliminarUsuarioComoAdmin({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: CANDIDATO_ID,
  });

  assert.equal(respuesta.exito, true);
  assert.equal(respuesta.nombre, "Ana Candidata");
  assert.deepEqual(entorno.borradosAuth, [CANDIDATO_ID]);
  assert.equal(entorno.estado[CANDIDATO_ID], undefined);
});

test("eliminarUsuarioComoAdmin borra la ficha de cartera sin tocar Auth", async () => {
  const entorno = crearEntorno({ filas: FILAS });

  const respuesta = await eliminarUsuarioComoAdmin({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: REPRESENTADO_ID,
  });

  assert.equal(respuesta.exito, true);
  assert.deepEqual(entorno.borradosAuth, []);
  assert.equal(entorno.estado[REPRESENTADO_ID], undefined);
});

test("eliminarUsuarioComoAdmin no elimina cuentas de administrador", async () => {
  const entorno = crearEntorno({ filas: FILAS });

  const respuesta = await eliminarUsuarioComoAdmin({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: OTRO_ADMIN_ID,
  });

  assert.match(respuesta.error, /administrador no se pueden eliminar/i);
  assert.deepEqual(entorno.borradosAuth, []);
  assert.ok(entorno.estado[OTRO_ADMIN_ID]);
});

test("eliminarUsuarioComoAdmin exige la clave de servicio y una sesión de administrador", async () => {
  const sinClave = crearEntorno({ filas: FILAS });
  const respuestaSinClave = await eliminarUsuarioComoAdmin({
    supabase: sinClave.supabase,
    supabaseAdmin: null,
    objetivoId: CANDIDATO_ID,
  });
  assert.match(respuestaSinClave.error, /SUPABASE_SERVICE_ROLE_KEY/);

  const sinSesion = crearEntorno({ filas: FILAS, userId: null });
  const respuestaSinSesion = await eliminarUsuarioComoAdmin({
    supabase: sinSesion.supabase,
    supabaseAdmin: sinSesion.supabaseAdmin,
    objetivoId: CANDIDATO_ID,
  });
  assert.match(respuestaSinSesion.error, /Iniciá sesión como administrador/i);
});

test("eliminarUsuarioComoAdmin informa el error cuando la base rechaza el borrado", async () => {
  const entorno = crearEntorno({ filas: FILAS, fallarBorrado: true });

  const respuesta = await eliminarUsuarioComoAdmin({
    supabase: entorno.supabase,
    supabaseAdmin: entorno.supabaseAdmin,
    objetivoId: REPRESENTADO_ID,
  });

  assert.match(respuesta.error, /Política RLS denegada/);
  assert.ok(entorno.estado[REPRESENTADO_ID]);
});
