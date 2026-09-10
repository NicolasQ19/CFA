import { notFound } from "next/navigation";
import { FormularioRegistroAdmin } from "@/dominio/autenticacion/FormularioRegistroAdmin";
import styles from "./page.module.css";

interface Props {
  searchParams: Promise<{ clave?: string }>;
}

/**
 * Ruta no enlazada desde ningún lugar de la UI: solo la conoce quien tenga la
 * URL con la clave secreta correcta (?clave=...). Sin la clave correcta, se
 * comporta como una página inexistente (404) para no revelar que existe.
 * La clave se vuelve a validar del lado del servidor en `registrarAdministrador`.
 */
export default async function PaginaRegistroAdmin({ searchParams }: Props) {
  const { clave } = await searchParams;
  const claveEsperada = process.env.ADMIN_REGISTRO_SECRETO;

  if (!claveEsperada || clave !== claveEsperada) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Registro de administrador</h1>
      <p className={styles.subtitulo}>Acceso restringido — CFA</p>

      <div className={styles.contenido}>
        <FormularioRegistroAdmin claveSecreta={clave} />
      </div>
    </main>
  );
}
