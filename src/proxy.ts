import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function proxy(peticion: NextRequest) {
  return actualizarSesion(peticion);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
