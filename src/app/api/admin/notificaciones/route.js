import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { listarFilasNotificaciones } from "@/lib/lectura-notificaciones";
import { combinarAvisosAdmin } from "@/lib/notificaciones-admin";

export const dynamic = "force-dynamic";

function respuesta(datos, status = 200) {
  return Response.json(datos, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Las ofertas pendientes y las solicitudes de verificación sin resolver alimentan la campana del administrador. */
export async function GET() {
  try {
    const supabase = await crearClienteServidor();
    const { data: { user }, error: errorSesion } = await supabase.auth.getUser();
    if (errorSesion || !user) return respuesta({ error: "Iniciá sesión para continuar." }, 401);

    const { data: usuario, error: errorUsuario } = await supabase.from("usuarios")
      .select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
    if (errorUsuario) return respuesta({ error: "No se pudieron consultar los permisos." }, 500);
    if (usuario?.rol !== "administrador" || !usuario.cuenta_activa) {
      return respuesta({ error: "Acceso exclusivo para administradores." }, 403);
    }

    const [ofertas, verificaciones] = await Promise.all([
      listarFilasNotificaciones(() => supabase.from("ofertas_laborales")
        .select("id, puesto_buscado, creada_en, perfiles_club(nombre_club)")
        .eq("estado", "pendiente_moderacion")
        .order("creada_en", { ascending: false }).order("id")),
      listarFilasNotificaciones(() => supabase.from("verificaciones_club")
        .select("club_id, solicitada_en, club:usuarios!verificaciones_club_club_id_fkey(nombre_completo, perfiles_club(nombre_club))")
        .eq("estado", "pendiente").not("solicitada_en", "is", null)
        .order("solicitada_en", { ascending: false }).order("club_id")),
    ]);
    const notificaciones = combinarAvisosAdmin({ ofertas, verificaciones });

    return respuesta({ total: notificaciones.length, notificaciones });
  } catch {
    return respuesta({ error: "No se pudieron cargar las notificaciones." }, 500);
  }
}
