/**
 * Italian Translations
 */

import { createBaseTranslation } from './base.js';

export const it = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Crea elemento', description: '' },
    pinepaper_modify_item: { name: 'Modifica elemento', description: '' },
    pinepaper_delete_item: { name: 'Elimina elemento', description: '' },
    pinepaper_add_relation: { name: 'Aggiungi relazione', description: '' },
    pinepaper_remove_relation: { name: 'Rimuovi relazione', description: '' },
    pinepaper_query_relations: { name: 'Interroga relazioni', description: '' },
    pinepaper_animate: { name: 'Anima', description: '' },
    pinepaper_keyframe_animate: { name: 'Animazione keyframe', description: '' },
    pinepaper_play_timeline: { name: 'Riproduci timeline', description: '' },
    pinepaper_execute_generator: { name: 'Esegui generatore', description: '' },
    pinepaper_list_generators: { name: 'Elenca generatori', description: '' },
    pinepaper_apply_effect: { name: 'Applica effetto', description: '' },
    pinepaper_get_items: { name: 'Ottieni elementi', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistiche relazioni', description: '' },
    pinepaper_set_background_color: { name: 'Imposta colore sfondo', description: '' },
    pinepaper_set_canvas_size: { name: 'Imposta dimensione canvas', description: '' },
    pinepaper_export_svg: { name: 'Esporta SVG', description: '' },
    pinepaper_export_training_data: { name: 'Esporta dati di training', description: '' },
  },

  errors: {
    itemNotFound: 'Elemento non trovato: {{itemId}}',
    invalidRelation: 'Relazione non valida: {{relationType}}',
    invalidParams: 'Parametri non validi: {{details}}',
    generatorNotFound: 'Generatore non trovato: {{generatorName}}',
    exportFailed: 'Esportazione fallita: {{reason}}',
    executionError: 'Errore di esecuzione: {{message}}',
    validationError: 'Errore di validazione: {{message}}',
    unknownTool: 'Strumento sconosciuto: {{toolName}}',
    apiKeyRequired: 'Chiave API richiesta',
    apiKeyInvalid: 'Chiave API non valida',
    apiKeyExpired: 'Chiave API scaduta',
    rateLimitExceeded: 'Limite di richieste superato. Riprova tra {{seconds}} secondi.',
  },

  success: {
    itemCreated: '{{itemType}} creato alla posizione ({{x}}, {{y}})',
    itemModified: 'Elemento {{itemId}} modificato',
    itemDeleted: 'Elemento {{itemId}} eliminato',
    relationAdded: 'Relazione {{relationType}} aggiunta: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relazione rimossa tra {{sourceId}} e {{targetId}}',
    animationApplied: 'Animazione {{animationType}} applicata a {{itemId}}',
    generatorExecuted: 'Generatore {{generatorName}} eseguito',
    effectApplied: 'Effetto {{effectType}} applicato a {{itemId}}',
    backgroundSet: 'Colore sfondo impostato su {{color}}',
    canvasSizeSet: 'Dimensione canvas impostata su {{width}}×{{height}}',
    exported: '{{format}} esportato con successo',
  },

  itemTypes: {
    text: 'Testo',
    circle: 'Cerchio',
    star: 'Stella',
    rectangle: 'Rettangolo',
    triangle: 'Triangolo',
    polygon: 'Poligono',
    ellipse: 'Ellisse',
    path: 'Percorso',
    line: 'Linea',
    arc: 'Arco',
  },

  relationTypes: {
    orbits: 'Orbita',
    follows: 'Segue',
    attached_to: 'Attaccato a',
    maintains_distance: 'Mantiene distanza',
    points_at: 'Punta verso',
    mirrors: 'Riflette',
    parallax: 'Parallasse',
    bounds_to: 'Limitato a',
  },

  animationTypes: {
    pulse: 'Pulsazione',
    rotate: 'Rotazione',
    bounce: 'Rimbalzo',
    fade: 'Dissolvenza',
    wobble: 'Oscillazione',
    slide: 'Scorrimento',
    typewriter: 'Macchina da scrivere',
  },

  generators: {
    drawSunburst: 'Raggi di sole',
    drawSunsetScene: 'Scena tramonto',
    drawGrid: 'Griglia',
    drawStackedCircles: 'Cerchi sovrapposti',
    drawCircuit: 'Circuito',
    drawWaves: 'Onde',
    drawPattern: 'Motivo',
  },

  common: {
    at: 'a',
    with: 'con',
    to: 'a',
    from: 'da',
    position: 'posizione',
    radius: 'raggio',
    color: 'colore',
    speed: 'velocità',
    duration: 'durata',
  },
});

export default it;
