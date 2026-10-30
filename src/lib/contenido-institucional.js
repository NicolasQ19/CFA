/**
 * Contenido editorial de las páginas públicas (inicio, cómo funciona, preguntas
 * frecuentes y planes). Vive acá para que la página principal y cada página
 * independiente muestren exactamente el mismo texto.
 */

export const ROLES_PUBLICOS = [
  {
    rol: "candidato",
    numero: "01",
    titulo: "Para candidatos",
    texto: "Dale un lugar a tu trayectoria y encontrá búsquedas para tu puesto profesional.",
    beneficios: [
      "Perfil con experiencia, videos y CV en PDF",
      "Ofertas filtradas por puesto y ubicación",
      "Seguimiento del estado de tus postulaciones",
    ],
    href: "/mi-perfil",
    accion: "Completar mi perfil",
  },
  {
    rol: "club",
    numero: "02",
    titulo: "Para clubes",
    texto: "Presentá tu institución y organizá la búsqueda de tu próximo integrante.",
    beneficios: [
      "Publicación de ofertas con moderación previa",
      "Búsqueda de candidatos por perfil profesional",
      "Gestión de postulantes y notas internas",
    ],
    href: "/mis-ofertas",
    accion: "Gestionar mis búsquedas",
  },
  {
    rol: "representante",
    numero: "03",
    titulo: "Para representantes",
    texto: "Acompañá a tus talentos con una cartera organizada y oportunidades acordes a cada perfil.",
    beneficios: [
      "Carga y edición de fichas de representados",
      "Vista previa de los perfiles antes de guardar",
      "Postulación y cancelación desde tu cartera",
    ],
    href: "/mi-cartera",
    accion: "Gestionar mi cartera",
  },
];

export const PASOS = [
  {
    titulo: "Creá tu perfil",
    texto:
      "Los candidatos cargan trayectoria, videos y CV. Los clubes presentan su institución y los representantes organizan su cartera.",
    detalle:
      "El registro es gratuito y pide solo correo y contraseña. Después elegís el rol con el que vas a trabajar en la plataforma y completás los datos propios de tu actividad: puesto profesional y experiencia para los candidatos, datos institucionales para los clubes y la cartera de representados para los representantes.",
  },
  {
    titulo: "Postulate o publicá",
    texto:
      "Los candidatos y representantes envían postulaciones a búsquedas del mismo puesto. Los clubes crean ofertas que pasan por moderación.",
    detalle:
      "Las ofertas se filtran por puesto, provincia, categoría y tipo de contrato. Solo podés postularte a búsquedas del mismo puesto profesional que declaraste, así el club recibe candidaturas pertinentes. Cada oferta publicada por un club pasa antes por la moderación del equipo de CFA.",
  },
  {
    titulo: "Seguí el proceso",
    texto:
      "Cada postulación muestra su estado, y el club organiza a los postulantes por etapa hasta la decisión final.",
    detalle:
      "Desde Mis postulaciones ves en qué etapa está cada candidatura y recibís una notificación cuando cambia. El club mueve a los postulantes por estados y deja notas internas que solo ve su equipo.",
  },
];

export const PREGUNTAS = [
  {
    titulo: "¿CFA es solo para jugadores?",
    texto:
      "También está pensada para directores técnicos, preparadores físicos, kinesiólogos, médicos, analistas, coordinadores, utileros y scouts. Cada candidato completa la información específica de su puesto.",
  },
  {
    titulo: "¿Cómo me postulo a una oferta?",
    texto:
      "Creá una cuenta de candidato, completá tu perfil profesional y abrí una oferta publicada. Tu puesto debe coincidir con el solicitado por el club. Desde Mis postulaciones podés consultar el estado del proceso.",
  },
  {
    titulo: "¿Un representante puede postular a sus candidatos?",
    texto:
      "Sí. Puede cargar las fichas de sus representados, buscar candidatos dentro de su cartera y postularlos a ofertas del mismo puesto profesional. También puede retirar las postulaciones que envió desde la oferta o desde Mi cartera.",
  },
  {
    titulo: "¿Las ofertas se publican inmediatamente?",
    texto:
      "Las búsquedas creadas por los clubes pasan por moderación antes de aparecer en el listado público. Una vez publicadas, el club puede gestionar sus postulantes y pausar o cerrar la búsqueda.",
  },
  {
    titulo: "¿Crear una cuenta tiene costo?",
    texto:
      "No. Todas las cuentas empiezan en el plan Base, que es gratuito y no vence. El plan Pro es opcional y solo saca los topes de ofertas activas o de postulaciones mensuales según el rol.",
  },
  {
    titulo: "¿Qué pasa si doy de baja el plan Pro?",
    texto:
      "La cuenta vuelve a los límites del plan Base sin perder ofertas, postulaciones ni representados. Lo ya cargado sigue disponible; solo se vuelven a aplicar los cupos del plan gratuito.",
  },
  {
    titulo: "¿Cómo recupero mi contraseña?",
    texto:
      "Desde Iniciar sesión podés pedir un enlace de recuperación a tu correo. El enlace te lleva a una página donde definís una contraseña nueva.",
  },
  {
    titulo: "¿Los clubes están verificados?",
    texto:
      "La administración de CFA revisa la documentación de cada club. Los clubes verificados pueden además buscar candidatos dentro de la plataforma.",
  },
];

export const TITULOS_PLAN_POR_ROL = {
  candidato: "Candidatos",
  club: "Clubes",
  representante: "Representantes",
};
