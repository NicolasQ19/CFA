import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { normalizarRutaSiguiente } from "@/lib/recuperar-contrasena";

/**
 * Procesa enlaces de correo de Supabase Auth (PKCE `?code=` o OTP `?token_hash=&type=recovery`)
 * dejando establecida la cookie de sesión antes de redirigir a la pantalla de nueva contraseña.
 */
export async function GET(peticion) {
  const url = new URL(peticion.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const destino = normalizarRutaSiguiente(
    url.searchParams.get("next"),
    "/restablecer-contrasena"
  );

  const supabase = await crearClienteServidor();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/restablecer-contrasena?enlace_invalido=1", url.origin)
  );
}
