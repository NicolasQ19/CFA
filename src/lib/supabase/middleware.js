import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { evaluarAcceso, obtenerReglaDeRuta } from "@/lib/rutas-protegidas";


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

    const { permitido, motivo, destino } = evaluarAcceso({ ruta, usuario });

    if (!permitido) {
      const url = peticion.nextUrl.clone();
      url.search = "";


      if (motivo === "rol-no-habilitado") {
        url.pathname = "/sin-permiso";
        return NextResponse.rewrite(url);
      }

      url.pathname = destino;
      return NextResponse.redirect(url);
    }
  }

  return respuesta;
}