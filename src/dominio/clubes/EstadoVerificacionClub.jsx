import Link from "next/link";
import { ESTADOS_VERIFICACION_CLUB } from "@/lib/verificacion-club";
import styles from "./verificacion.module.css";

export function EstadoVerificacionClub({ verificacion }) {
  const estado = verificacion?.estado ?? "pendiente";
  return <aside className={styles.aviso} data-estado={estado}>
    <strong>{ESTADOS_VERIFICACION_CLUB[estado]}</strong>
    <p>{estado === "verificado" ? "Tu club puede publicar ofertas y acceder a candidatos. Si cambiás su identidad o sus canales oficiales, deberá revisarse nuevamente."
      : estado === "rechazado" ? "Revisá las observaciones, corregí los datos y enviá nuevamente tu solicitud."
      : verificacion?.solicitada_en ? "Recibimos tu solicitud. El administrador confirmará tu autorización por un canal oficial del club."
      : "Completá los datos del club y solicitá la verificación. Hasta que se apruebe, no podrás publicar ofertas ni acceder a candidatos."}</p>
    {verificacion?.observaciones && <p><strong>Resultado de la revisión:</strong> {verificacion.observaciones}</p>}
    {estado !== "verificado" && <Link href="/mi-club#verificacion">Completar o revisar solicitud →</Link>}
  </aside>;
}
