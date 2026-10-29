import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerOfertaDelClubPorId } from "@/dominio/ofertas/consultas";
import { FormularioEditarOferta } from "@/dominio/ofertas/FormularioEditarOferta";
import { obtenerReglasEdicionOferta } from "@/lib/editar-oferta";
import { clubEstaVerificado } from "@/lib/verificacion-club";
import styles from "./page.module.css";

export const metadata = {
  title: "Editar oferta | CFA",
  description: "Modificá la información de la búsqueda laboral de tu club.",
};

export default async function PaginaEditarOferta({ params }) {
  const { ofertaId } = await params;
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "club") redirect("/");
  if (!clubEstaVerificado(usuario)) redirect("/mi-club#verificacion");

  const oferta = await obtenerOfertaDelClubPorId(ofertaId, usuario.id);
  if (!oferta) {
    notFound();
  }

  const reglas = obtenerReglasEdicionOferta(oferta, oferta.total_postulantes);

  return (
    <main className={styles.main}>
      <nav aria-label="Ruta de navegación" className={styles.navegacion}>
        <Link href="/mis-ofertas">← Volver a mis ofertas</Link>
      </nav>
      <h1 className={styles.titulo}>Editar oferta</h1>
      <p className={styles.subtitulo}>
        {reglas.identidadEditable
          ? "Modificá los datos o la descripción antes de que la oferta sea publicada."
          : "Ajustá la descripción y aclaraciones de la búsqueda laboral."}
      </p>

      {!reglas.puedeEditar ? (
        <section className={styles.bloqueo} role="status">
          <p className={styles.textoBloqueo}>{reglas.motivoBloqueo}</p>
          <div className={styles.accionesBloqueo}>
            <Link href="/mis-ofertas/nueva" className={styles.botonNueva}>
              Publicar nueva oferta
            </Link>
            <Link href="/mis-ofertas" className={styles.botonVolver}>
              Volver a mis ofertas
            </Link>
          </div>
        </section>
      ) : (
        <div className={styles.contenido}>
          <FormularioEditarOferta oferta={oferta} />
        </div>
      )}
    </main>
  );
}
