import test from "node:test";
import assert from "node:assert/strict";
import {
  MENSAJE_ENVIO_RECUPERACION,
  construirUrlRedireccionRecuperacion,
  normalizarRutaSiguiente,
  procesarActualizacionContrasena,
  procesarSolicitudRecuperacion,
  validarNuevaContrasena,
  validarSolicitudRecuperacion,
} from "../src/lib/recuperar-contrasena.js";

function crearSupabaseRecuperacion({
  userId = "11111111-1111-4111-8111-111111111111",
  cuentaActiva = true,
  errorReset = null,
  errorUpdate = null,
} = {}) {
  const llamadasReset = [];
  const llamadasUpdate = [];
  let sesionCerrada = false;

  return {
    llamadasReset,
    llamadasUpdate,
    fueCerradaLaSesion: () => sesionCerrada,
    supabase: {
      auth: {
        async resetPasswordForEmail(correo, opciones) {
          llamadasReset.push({ correo, opciones });
          return { data: errorReset ? null : {}, error: errorReset };
        },
        async getUser() {
          return { data: { user: userId ? { id: userId } : null } };
        },
        async updateUser(datos) {
          llamadasUpdate.push(datos);
          return { data: errorUpdate ? null : { user: { id: userId } }, error: errorUpdate };
        },
        async signOut() {
          sesionCerrada = true;
          return { error: null };
        },
      },
      from(tabla) {
        assert.equal(tabla, "usuarios");
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return {
              data: userId ? { id: userId, cuenta_activa: cuentaActiva } : null,
              error: null,
            };
          },
        };
      },
    },
  };
}

test("validarSolicitudRecuperacion exige formato de correo válido y normaliza mayúsculas", () => {
  assert.match(validarSolicitudRecuperacion("   ").error, /correo electrónico/i);
  assert.match(validarSolicitudRecuperacion("correo-invalido").error, /válido/i);
  assert.deepEqual(validarSolicitudRecuperacion("  Jugador@Club.COM.AR "), {
    correo: "jugador@club.com.ar",
  });
});

test("normalizarRutaSiguiente y construirUrlRedireccionRecuperacion evitan redirecciones abiertas", () => {
  assert.equal(normalizarRutaSiguiente("/restablecer-contrasena"), "/restablecer-contrasena");
  assert.equal(normalizarRutaSiguiente("https://sitio-malicioso.example"), "/restablecer-contrasena");
  assert.equal(normalizarRutaSiguiente("//sitio-malicioso.example"), "/restablecer-contrasena");
  assert.equal(normalizarRutaSiguiente("/\\malicioso"), "/restablecer-contrasena");

  assert.equal(
    construirUrlRedireccionRecuperacion("https://cfa-futbol.vercel.app/iniciar-sesion"),
    "https://cfa-futbol.vercel.app/auth/confirmar?next=/restablecer-contrasena"
  );
  assert.equal(
    construirUrlRedireccionRecuperacion("javascript:alert(1)"),
    "http://localhost:3000/auth/confirmar?next=/restablecer-contrasena"
  );
});

test("procesarSolicitudRecuperacion evita enumeración de cuentas en correos existentes, inexistentes y @cfa.local (TC-AUTH-03)", async () => {
  const entornoOk = crearSupabaseRecuperacion();
  const resRegistrado = await procesarSolicitudRecuperacion({
    supabase: entornoOk.supabase,
    correoElectronico: "club@cfa.ar",
    redirectTo: "http://localhost:3000/auth/confirmar?next=/restablecer-contrasena",
  });

  assert.deepEqual(resRegistrado, {
    exito: true,
    mensaje: MENSAJE_ENVIO_RECUPERACION,
  });
  assert.equal(entornoOk.llamadasReset.length, 1);

  const entornoNoExiste = crearSupabaseRecuperacion({
    errorReset: { code: "user_not_found", status: 400, message: "User not found" },
  });
  const resNoExiste = await procesarSolicitudRecuperacion({
    supabase: entornoNoExiste.supabase,
    correoElectronico: "nadie@cfa.ar",
    redirectTo: "http://localhost:3000/auth/confirmar?next=/restablecer-contrasena",
  });

  assert.deepEqual(resNoExiste, {
    exito: true,
    mensaje: MENSAJE_ENVIO_RECUPERACION,
  });

  const entornoFicha = crearSupabaseRecuperacion();
  const resFicha = await procesarSolicitudRecuperacion({
    supabase: entornoFicha.supabase,
    correoElectronico: "representado_123@cfa.local",
    redirectTo: "http://localhost:3000/auth/confirmar?next=/restablecer-contrasena",
  });

  assert.deepEqual(resFicha, {
    exito: true,
    mensaje: MENSAJE_ENVIO_RECUPERACION,
  });
  assert.equal(entornoFicha.llamadasReset.length, 0);
});

test("procesarSolicitudRecuperacion informa límite de tasa cuando se exceden intentos", async () => {
  const entornoLimite = crearSupabaseRecuperacion({
    errorReset: { code: "over_email_send_rate_limit", status: 429 },
  });
  const respuesta = await procesarSolicitudRecuperacion({
    supabase: entornoLimite.supabase,
    correoElectronico: "club@cfa.ar",
    redirectTo: "http://localhost:3000/auth/confirmar?next=/restablecer-contrasena",
  });

  assert.match(respuesta.error, /demasiadas solicitudes/i);
});

test("validarNuevaContrasena controla longitud mínima y coincidencia", () => {
  assert.match(
    validarNuevaContrasena({ contrasena: "123", confirmarContrasena: "123" }).error,
    /al menos 6/i
  );
  assert.match(
    validarNuevaContrasena({ contrasena: "claveSegura1", confirmarContrasena: "otraClave2" })
      .error,
    /no coinciden/i
  );
  assert.deepEqual(
    validarNuevaContrasena({ contrasena: "claveSegura1", confirmarContrasena: "claveSegura1" }),
    { contrasena: "claveSegura1" }
  );
});

test("procesarActualizacionContrasena rechaza enlaces vencidos, cuentas suspendidas y contraseñas repetidas", async () => {
  const sinSesion = crearSupabaseRecuperacion({ userId: null });
  const resSinSesion = await procesarActualizacionContrasena({
    supabase: sinSesion.supabase,
    contrasena: "nuevaClave123",
    confirmarContrasena: "nuevaClave123",
  });
  assert.match(resSinSesion.error, /venció o no es válido/i);

  const suspendida = crearSupabaseRecuperacion({ cuentaActiva: false });
  const resSuspendida = await procesarActualizacionContrasena({
    supabase: suspendida.supabase,
    contrasena: "nuevaClave123",
    confirmarContrasena: "nuevaClave123",
  });
  assert.match(resSuspendida.error, /suspendida/i);
  assert.equal(suspendida.fueCerradaLaSesion(), true);
  assert.equal(suspendida.llamadasUpdate.length, 0);

  const repetida = crearSupabaseRecuperacion({
    errorUpdate: { code: "same_password", message: "New password should be different" },
  });
  const resRepetida = await procesarActualizacionContrasena({
    supabase: repetida.supabase,
    contrasena: "mismaClave123",
    confirmarContrasena: "mismaClave123",
  });
  assert.match(resRepetida.error, /diferente a la contraseña actual/i);
});

test("procesarActualizacionContrasena actualiza la clave y cierra la sesión temporal de recuperación", async () => {
  const entorno = crearSupabaseRecuperacion();
  const resultado = await procesarActualizacionContrasena({
    supabase: entorno.supabase,
    contrasena: "nuevaClaveSegura99",
    confirmarContrasena: "nuevaClaveSegura99",
  });

  assert.deepEqual(resultado, { exito: true });
  assert.deepEqual(entorno.llamadasUpdate, [{ password: "nuevaClaveSegura99" }]);
  assert.equal(entorno.fueCerradaLaSesion(), true);
});
