import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { evaluarAcceso, obtenerReglaDeRuta } from "@/lib/rutas-protegidas";

/**
 * Refresca la sesión de Supabase en cada request, la propaga en las cookies y
 * aplica el control de acceso de `rutas-protegidas` antes de renderizar la página.
 * Se ejecuta desde src/middleware.js.
 */
export async function actualizarSesion(peticion) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return peticion.cookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          for (const { name, value } of cookiesParaGuardar) {
            peticion.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of cookiesParaGuardar) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = peticion.nextUrl.pathname;

  // Solo se consulta el rol en las rutas restringidas: las públicas no pagan la consulta.
  if (obtenerReglaDeRuta(ruta)) {
    let usuario = null;

    if (user) {
      const { data } = await supabase
        .from("usuarios")
        .select("rol, cuenta_activa")
        .eq("id", user.id)
        .maybeSingle();
      usuario = data;
    }

    const { permitido, destino } = evaluarAcceso({ ruta, usuario });

    if (!permitido) {
      const url = peticion.nextUrl.clone();
      url.pathname = destino;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return respuesta;
}