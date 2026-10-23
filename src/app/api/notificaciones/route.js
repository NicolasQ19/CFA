import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { consultarAvisosPostulaciones } from "@/lib/notificaciones-postulaciones";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const resultado = await consultarAvisosPostulaciones(await crearClienteServidor(), crearClienteAdmin);
    return Response.json(resultado.datos, { status: resultado.status, headers });
  } catch {
    return Response.json({ error: "No se pudieron cargar las notificaciones." }, { status: 500, headers });
  }
}
