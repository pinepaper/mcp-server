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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Crear forma de diagrama',
      description: `Crea formas especializadas para diagramas técnicos como diagramas de flujo, UML y redes.

USAR CUANDO:
- Crear diagramas de flujo o procesos
- Diseñar diagramas UML (clases, casos de uso, actores)
- Dibujar topologías de red u organigramas

TIPOS DE FORMA:
- Diagrama de flujo: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Red: cloud, server
- Básicas: rectangle, circle, triangle, star`
    },
    pinepaper_connect: {
      name: 'Conectar elementos',
      description: `Conecta dos elementos con un conector inteligente. Forma principal de dibujar líneas/flechas entre formas.

USAR CUANDO:
- Dibujar flechas entre pasos de un diagrama de flujo
- Conectar clases UML con asociaciones
- Crear conexiones de red entre nodos

TIPOS DE ENRUTAMIENTO:
- orthogonal: Solo giros en ángulo recto (predeterminado)
- direct: Línea recta entre puntos
- curved: Curva Bezier con curvatura ajustable`
    },
    pinepaper_connect_ports: {
      name: 'Conectar puertos',
      description: `Conecta puertos específicos en dos elementos. Usa esto cuando necesites control preciso sobre qué puertos se conectan.

USAR CUANDO:
- Necesitas que el conector se adhiera a un lado específico de la forma
- Crear diagramas complejos donde la selección automática de puertos no es ideal
- Construir diagramas tipo circuito con puntos de entrada/salida específicos`
    },
    pinepaper_add_ports: {
      name: 'Añadir puertos',
      description: `Añade puertos de conexión a un elemento existente. Los puertos son puntos de anclaje donde se pueden adjuntar conectores.

USAR CUANDO:
- Añadir posiciones de puerto personalizadas a formas
- Habilitar conexiones en elementos que no tienen puertos
- Crear puntos de conexión especializados para diagramas complejos`
    },
    pinepaper_auto_layout: {
      name: 'Diseño automático',
      description: `Organiza automáticamente elementos del diagrama usando un algoritmo. Reorganiza elementos para diagramas más limpios y legibles.

USAR CUANDO:
- Los elementos del diagrama están desordenados o superpuestos
- Quieres crear un diseño profesional automáticamente
- Después de añadir muchos elementos, necesitas organizarlos

TIPOS DE DISEÑO:
- hierarchical: Mejor para diagramas de flujo, organigramas
- force-directed: Mejor para diagramas de red
- tree: Mejor para jerarquías
- radial: Mejor para mapas mentales
- grid: Mejor para elementos de igual importancia`
    },
    pinepaper_get_diagram_shapes: {
      name: 'Obtener formas de diagrama',
      description: `Obtiene una lista de formas de diagrama disponibles con sus propiedades.

USAR CUANDO:
- Necesitas ver qué formas de diagrama están disponibles
- Quieres conocer tamaños y estilos predeterminados para formas
- Construir interfaz dinámica que muestre opciones de formas`
    },
    pinepaper_update_connector: {
      name: 'Actualizar conector',
      description: `Actualiza el estilo o etiqueta de un conector existente.

USAR CUANDO:
- Cambiar apariencia del conector después de crearlo
- Actualizar etiquetas del conector
- Cambiar estilos de flecha o colores`
    },
    pinepaper_remove_connector: {
      name: 'Eliminar conector',
      description: `Elimina un conector del lienzo.

USAR CUANDO:
- Eliminar una conexión entre elementos
- Remover enlaces incorrectos
- Reestructurar conexiones del diagrama`
    },
    pinepaper_diagram_mode: {
      name: 'Modo diagrama',
      description: `Controla el modo de diagrama para edición interactiva.

USAR CUANDO:
- Cambiar entre modos de dibujo y selección
- Habilitar/deshabilitar interfaz específica de diagramas
- Configurar el lienzo para creación de diagramas

ACCIONES:
- activate: Habilitar modo diagrama
- deactivate: Volver al modo lienzo normal
- toggle: Alternar entre modos
- setMode: Establecer modo de herramienta específico`
    },
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
