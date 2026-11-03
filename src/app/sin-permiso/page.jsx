import { forbidden } from "next/navigation";

/**
 * Destino interno de la reescritura del middleware cuando una cuenta abre una
 * ruta que no corresponde a su rol.
 *
 * No dibuja nada: su único trabajo es cortar con `forbidden()` para que la
 * respuesta salga con estado 403 y Next renderice `app/forbidden.jsx`. La URL
 * que ve la persona sigue siendo la que intentó abrir, porque el middleware
 * reescribe en lugar de redirigir.
 */
export default function PaginaSinPermiso() {
  forbidden();
}
