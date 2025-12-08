/**
 * Spanish Translations
 */

import { createBaseTranslation } from './base.js';

export const es = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Crear Elemento', description: '' },
    pinepaper_modify_item: { name: 'Modificar Elemento', description: '' },
    pinepaper_delete_item: { name: 'Eliminar Elemento', description: '' },
    pinepaper_add_relation: { name: 'Añadir Relación', description: '' },
    pinepaper_remove_relation: { name: 'Eliminar Relación', description: '' },
    pinepaper_query_relations: { name: 'Consultar Relaciones', description: '' },
    pinepaper_animate: { name: 'Animar', description: '' },
    pinepaper_keyframe_animate: { name: 'Animación por Fotogramas', description: '' },
    pinepaper_play_timeline: { name: 'Reproducir Línea de Tiempo', description: '' },
    pinepaper_execute_generator: { name: 'Ejecutar Generador', description: '' },
    pinepaper_list_generators: { name: 'Listar Generadores', description: '' },
    pinepaper_apply_effect: { name: 'Aplicar Efecto', description: '' },
    pinepaper_get_items: { name: 'Obtener Elementos', description: '' },
    pinepaper_get_relation_stats: { name: 'Estadísticas de Relaciones', description: '' },
    pinepaper_set_background_color: { name: 'Establecer Color de Fondo', description: '' },
    pinepaper_set_canvas_size: { name: 'Establecer Tamaño del Lienzo', description: '' },
    pinepaper_export_svg: { name: 'Exportar SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportar Datos de Entrenamiento', description: '' },
  },

  errors: {
    itemNotFound: 'Elemento no encontrado: {{itemId}}',
    invalidRelation: 'Relación inválida: {{relationType}}',
    invalidParams: 'Parámetros inválidos: {{details}}',
    generatorNotFound: 'Generador no encontrado: {{generatorName}}',
    exportFailed: 'Error en la exportación: {{reason}}',
    executionError: 'Error de ejecución: {{message}}',
    validationError: 'Error de validación: {{message}}',
    unknownTool: 'Herramienta desconocida: {{toolName}}',
    apiKeyRequired: 'Se requiere clave API',
    apiKeyInvalid: 'Clave API inválida',
    apiKeyExpired: 'Clave API expirada',
    rateLimitExceeded: 'Límite de velocidad excedido. Intente de nuevo en {{seconds}} segundos.',
  },

  success: {
    itemCreated: 'Creado {{itemType}} en posición ({{x}}, {{y}})',
    itemModified: 'Elemento {{itemId}} modificado',
    itemDeleted: 'Elemento {{itemId}} eliminado',
    relationAdded: 'Relación {{relationType}} añadida: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relación eliminada entre {{sourceId}} y {{targetId}}',
    animationApplied: 'Animación {{animationType}} aplicada a {{itemId}}',
    generatorExecuted: 'Generador {{generatorName}} ejecutado',
    effectApplied: 'Efecto {{effectType}} aplicado a {{itemId}}',
    backgroundSet: 'Color de fondo establecido a {{color}}',
    canvasSizeSet: 'Tamaño del lienzo establecido a {{width}}×{{height}}',
    exported: 'Exportado {{format}} exitosamente',
  },

  itemTypes: {
    text: 'Texto',
    circle: 'Círculo',
    star: 'Estrella',
    rectangle: 'Rectángulo',
    triangle: 'Triángulo',
    polygon: 'Polígono',
    ellipse: 'Elipse',
    path: 'Trayecto',
    line: 'Línea',
    arc: 'Arco',
  },

  relationTypes: {
    orbits: 'Orbita',
    follows: 'Sigue',
    attached_to: 'Adjunto a',
    maintains_distance: 'Mantiene distancia',
    points_at: 'Apunta a',
    mirrors: 'Refleja',
    parallax: 'Paralaje',
    bounds_to: 'Limitado a',
  },

  animationTypes: {
    pulse: 'Pulsar',
    rotate: 'Rotar',
    bounce: 'Rebotar',
    fade: 'Desvanecer',
    wobble: 'Oscilar',
    slide: 'Deslizar',
    typewriter: 'Máquina de escribir',
  },

  generators: {
    drawSunburst: 'Rayos de Sol',
    drawSunsetScene: 'Escena de Atardecer',
    drawGrid: 'Cuadrícula',
    drawStackedCircles: 'Círculos Apilados',
    drawCircuit: 'Circuito',
    drawWaves: 'Olas',
    drawPattern: 'Patrón',
  },

  common: {
    at: 'en',
    with: 'con',
    to: 'a',
    from: 'desde',
    position: 'posición',
    radius: 'radio',
    color: 'color',
    speed: 'velocidad',
    duration: 'duración',
  },
});

export default es;
