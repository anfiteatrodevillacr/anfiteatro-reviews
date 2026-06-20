// Copy ES/EN armonizado (Codex 2026-06-15). NO modificar copy sin revisar el visor del ERP.

export const COPY = {
  marca: {
    nombre: "Anfiteatro de Villa",
    ciudad: "Ciudad Colón, Costa Rica",
  },

  menu: {
    titulo: "Centro de Reseñas",
    subtitulo: "Anfiteatro de Villa · Todos los sistemas en un solo lugar",
    cliente_titulo: "Páginas para Clientes",
    equipo_titulo: "Herramientas del Equipo",
    cliente_count: 4,
    equipo_count: 1,
    footer: "Guarda este link en favoritos. Desde aquí podés abrir o compartir cualquier página del sistema.",
    open: "Abrir",
    copy: "Copiar link",
    copied: "✓ Copiado",
  },

  cavernas: {
    titulo: "Las Cavernas del Cañón",
    subtitulo: "by Anfiteatro de Villa",
    pregunta: "¿Recomendarías esta experiencia?",
    yes: "Sí, la recomendaría",
    no: "No del todo — tengo comentarios",
    back: "Volver",
    header_privado: "Tu opinión cuenta",
    stars_label: "¿Cuántas estrellas nos das?",
    textarea_label: "Contanos qué podríamos mejorar.",
    submit: "Enviar",
    gracias_titulo: "Gracias por tu sinceridad",
    gracias_body: "Significa mucho para nosotros. Tu feedback va directo al equipo. Lo tomamos muy en serio para seguir mejorando.",
    codigo_titulo: "Tu código de 10% de descuento",
    codigo_copied: "✓ Copiado",
    codigo_valido: "Válido en tu próxima visita · Lo podés compartir.",
    redirigir_google: "Compartí en Google",
    redirigir_tripadvisor: "Compartí en TripAdvisor",
  },

  restaurante: {
    titulo: "Reseña de Restaurante",
    subtitulo: "Anfiteatro de Villa",
    servicio_label: "Califica nuestro servicio",
    comida_label: "Califica la calidad de la comida",
    comentario_label: "Comentario (opcional)",
    comentario_placeholder: "Tu opinión nos ayuda a mejorar cada plato y cada detalle.",
    submit: "Enviar reseña",
    gracias_titulo: "Gracias por tu reseña",
    gracias_body: "Y como agradecimiento, te invitamos un postre de cortesía en tu próxima visita.",
    codigo_titulo: "🍰 Tu postre de cortesía",
    codigo_copied: "✓ Copiado",
    codigo_valido: "Presenta este codigo a tu mesero en tu proxima visita.",
    salonero_badge: "Mesero: ",
  },

  evento: {
    titulo: "Reseña de Evento",
    subtitulo: "Anfiteatro de Villa",
    experiencia_label: "El evento cumplió sus expectativas",
    servicio_label: "El servicio cumplió sus expectativas",
    comentario_label: "Comentario (opcional)",
    submit: "Enviar reseña",
    gracias_titulo: "Gracias por tu reseña",
    gracias_body: "Y como agradecimiento, te regalamos un tour de cortesía para una persona en Las Cavernas del Cañón.",
    codigo_titulo: "Tour de cortesía · 1 persona",
    codigo_copied: "✓ Copiado",
    codigo_valido: "Presenta este código para canjear un tour de cortesía para 1 persona en Las Cavernas del Cañón.",
  },

  servicio: {
    titulo: "Reseña de Atención al Cliente",
    subtitulo: "Anfiteatro de Villa",
    estrellas_label: "Califica la atención recibida",
    resolvio_label: "¿Resolvimos tu consulta?",
    resolvio_si: "Sí",
    resolvio_no: "No",
    comentario_label: "Tu opinión nos ayuda a mejorar. Gracias!!",
    submit: "Enviar",
    gracias_titulo: "Gracias por tus comentarios",
    gracias_body: "Tu opinión nos ayuda a mejorar nuestra atención cada día. Significa muchísimo para el equipo.",
  },

  dashboard: {
    titulo: "Panel de Métricas",
    subtitulo: "Centro de Reseñas · Equipo",
    tab_resumen: "Resumen",
    tab_resenas: "Reseñas",
    tab_codigos: "Códigos",
    tab_saloneros: "Saloneros",
    canje_label: "Canjear código",
    canje_placeholder: "ANFI-XXXX-XXXX",
    canje_btn: "Canjear",
  },
} as const;

export type Copy = typeof COPY;