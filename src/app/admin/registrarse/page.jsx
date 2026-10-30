import { notFound } from "next/navigation";
import { FormularioRegistroAdmin } from "@/dominio/autenticacion/FormularioRegistroAdmin";
import styles from "./page.module.css";

/**
 * Ruta no enlazada desde ningún lugar de la UI. La clave de alta se pide dentro
 * del formulario y nunca viaja en la URL: así no queda en el historial, en el
 * encabezado Referer ni en los registros del servidor. `registrarAdministrador`
 * la vuelve a validar antes de crear la cuenta.
 */
export default function PaginaRegistroAdmin() {
  if (!process.env.ADMIN_REGISTRO_SECRETO) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Registro de administrador</h1>
      <p className={styles.subtitulo}>Acceso restringido — CFA</p>

      <div className={styles.contenido}>
        <FormularioRegistroAdmin />
      </div>
    </main>
  );
}
