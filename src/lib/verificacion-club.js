import { urlPublica } from "./club.js";

export const ESTADOS_VERIFICACION_CLUB = {
  pendiente: "Pendiente de verificación", verificado: "Club verificado", rechazado: "Verificación rechazada",
};

export function clubEstaVerificado(usuario) {
  return usuario?.rol === "club" && usuario.cuenta_activa === true && usuario.verificacion_club?.estado === "verificado";
}

export async function comprobarClubVerificado(cliente, clubId) {
  const { data, error } = await cliente.rpc("club_esta_verificado", { p_club_id: clubId });
  return !error && data === true;
}

export function validarSolicitudClub(formulario) {
  const campos = { p_liga: ["liga", 200], p_nombre: ["nombre", 160], p_cargo: ["cargo", 120], p_correo: ["correo", 254], p_telefono: ["telefono", 60], p_url: ["url", 500] };
  const datos = {};
  for (const [clave, [campo, limite]] of Object.entries(campos)) {
    const valor = String(formulario.get(campo) ?? "").trim();
    if (!valor || valor.length > limite) return { error: "Completá todos los datos de la solicitud respetando los límites indicados." };
    datos[clave] = valor;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.p_correo)) return { error: "Ingresá un correo institucional válido." };
  if (!/^[+\d\s().-]{6,60}$/.test(datos.p_telefono)) return { error: "Ingresá un teléfono institucional válido." };
  if (!urlPublica(datos.p_url)) return { error: "Ingresá la URL completa del sitio web o red oficial del club." };
  return { datos };
}

export function validarRevisionClub(formulario) {
  const estado = String(formulario.get("estado") ?? "");
  const observaciones = String(formulario.get("observaciones") ?? "").trim();
  const canal = String(formulario.get("canal") ?? "").trim();
  if (!["verificado", "rechazado"].includes(estado)) return { error: "Seleccioná una decisión válida." };
  if (!observaciones || observaciones.length > 2000 || canal.length > 500) return { error: "Registrá el resultado de la revisión (hasta 2000 caracteres)." };
  if (estado === "verificado" && (formulario.get("confirmado") !== "on" || canal.length < 3)) {
    return { error: "Confirmá la autorización del solicitante y registrá el canal oficial que contactaste." };
  }
  const clubId = String(formulario.get("clubId") ?? "");
  const solicitadaEn = String(formulario.get("solicitadaEn") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId) || !Number.isFinite(Date.parse(solicitadaEn))) return { error: "Recargá la solicitud antes de revisarla." };
  return { datos: { p_club_id: clubId, p_estado: estado, p_observaciones: observaciones, p_canal: canal, p_solicitada_en: solicitadaEn } };
}
