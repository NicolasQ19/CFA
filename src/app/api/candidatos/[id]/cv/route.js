import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { BUCKET_CV } from "@/lib/curriculum";

export async function GET(_request, { params }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Iniciá sesión para descargar el CV.", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const { data: perfil } = await supabase.from("perfiles_candidato")
    .select("cv_ruta").eq("usuario_id", id).maybeSingle();
  if (!perfil?.cv_ruta || !perfil.cv_ruta.startsWith(`${id}/`)) {
    return new Response("CV no disponible", { status: 404 });
  }
  // Storage aplica los permisos del usuario, también para perfiles ocultos.
  const { data, error } = await supabase.storage.from(BUCKET_CV).download(perfil.cv_ruta);
  if (error) return new Response("CV no disponible", { status: 404 });
  return new Response(data, { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="curriculum.pdf"',
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
