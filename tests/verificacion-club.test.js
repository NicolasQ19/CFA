import test from "node:test";
import assert from "node:assert/strict";
import { clubEstaVerificado, comprobarClubVerificado, validarSolicitudClub, validarRevisionClub } from "../src/lib/verificacion-club.js";

function form(valores) { const f = new FormData(); for (const [k, v] of Object.entries(valores)) f.set(k, v); return f; }
const solicitud = { liga: "Liga Regional", nombre: "Persona del Club", cargo: "Secretaría", correo: "contacto@club.test", telefono: "+54 11 1234 5678", url: "https://club.test" };
const revision = { clubId: "11111111-1111-4111-8111-111111111111", solicitadaEn: "2026-10-23T10:00:00Z", estado: "verificado", confirmado: "on", canal: "Teléfono del sitio oficial", observaciones: "Secretaría confirmó su autorización" };

test("solo un club activo con verificación aprobada obtiene acceso", () => {
  const usuario = { rol: "club", cuenta_activa: true, verificacion_club: { estado: "verificado" } };
  assert.equal(clubEstaVerificado(usuario), true);
  for (const otro of [null, { ...usuario, cuenta_activa: false }, { ...usuario, rol: "candidato" }, { ...usuario, verificacion_club: null }, { ...usuario, verificacion_club: { estado: "pendiente" } }, { ...usuario, verificacion_club: { estado: "rechazado" } }]) assert.equal(clubEstaVerificado(otro), false);
});

test("si falla la consulta de verificación el acceso queda bloqueado", async () => {
  assert.equal(await comprobarClubVerificado({ rpc: async () => ({ data: true, error: null }) }, "club"), true);
  for (const respuesta of [{ data: null, error: {} }, { data: false }, { data: "true" }]) assert.equal(await comprobarClubVerificado({ rpc: async () => respuesta }, "club"), false);
});

test("la solicitud exige liga, responsable, cargo y contactos válidos", () => {
  assert.equal(validarSolicitudClub(form(solicitud)).error, undefined);
  for (const cambio of [{ liga: "" }, { nombre: "" }, { cargo: "" }, { correo: "falso" }, { telefono: "abc123" }, { url: "javascript:alert(1)" }, { url: "https://usuario:clave@club.test" }, { nombre: "x".repeat(161) }]) assert.ok(validarSolicitudClub(form({ ...solicitud, ...cambio })).error);
});

test("verificar requiere confirmar la autorización y registrar canal y resultado", () => {
  assert.equal(validarRevisionClub(form(revision)).error, undefined);
  for (const cambio of [{ confirmado: "" }, { canal: "" }, { observaciones: "" }, { clubId: "inexistente" }, { solicitadaEn: "" }, { estado: "otro" }]) assert.ok(validarRevisionClub(form({ ...revision, ...cambio })).error);
  assert.equal(validarRevisionClub(form({ ...revision, estado: "rechazado", confirmado: "", canal: "" })).error, undefined);
});
