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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Crea forma diagramma',
      description: `Crea una forma per diagrammi sul canvas. Le forme diagramma sono forme specializzate per diagrammi di flusso, diagrammi UML, diagrammi di rete e disegni tecnici simili.

USARE QUANDO:
- Creare diagrammi di flusso, diagrammi di processo o workflow
- Costruire diagrammi UML (classi, casi d'uso, sequenze)
- Progettare diagrammi di topologia di rete
- Creare organigrammi o alberi decisionali

TIPI DI FORME:
- Diagrammi di flusso: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Rete: cloud, server
- Base: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Connetti elementi',
      description: `Connetti due elementi con un connettore intelligente. Questo è il modo principale per disegnare linee/frecce tra forme di diagrammi.

USARE QUANDO:
- Disegnare frecce tra passaggi di diagrammi di flusso
- Connettere classi UML con associazioni
- Creare connessioni di rete tra nodi
- Qualsiasi diagramma che necessita linee/frecce tra elementi

TIPI DI ROUTING:
- orthogonal: Solo angoli retti (predefinito)
- direct: Linea retta tra i punti
- curved: Curva di Bezier con curvatura regolabile`,
    },
    pinepaper_connect_ports: {
      name: 'Connetti porte',
      description: `Connetti due porte specifiche su elementi. Usare quando serve controllo preciso su quali porte attaccare il connettore.

USARE QUANDO:
- Il connettore deve attaccarsi a un lato specifico della forma
- Creare diagrammi complessi dove la selezione automatica delle porte non è ideale
- Costruire diagrammi tipo circuito con punti specifici di entrata/uscita`,
    },
    pinepaper_add_ports: {
      name: 'Aggiungi porte',
      description: `Aggiungi porte di connessione a un elemento esistente. Le porte sono punti di ancoraggio dove i connettori possono attaccarsi.

USARE QUANDO:
- Aggiungere posizioni di porta personalizzate alle forme
- Abilitare connessioni su elementi che non hanno porte
- Creare punti di connessione specializzati per diagrammi complessi`,
    },
    pinepaper_auto_layout: {
      name: 'Layout automatico',
      description: `Disponi automaticamente gli elementi del diagramma usando un algoritmo di layout. Questo riorganizza gli elementi per diagrammi più puliti e leggibili.

USARE QUANDO:
- Gli elementi del diagramma sono disordinati o sovrapposti
- Vuoi creare un layout dall'aspetto professionale automaticamente
- Dopo aver aggiunto molti elementi, serve organizzarli

TIPI DI LAYOUT:
- hierarchical: Migliore per diagrammi di flusso, organigrammi
- force-directed: Migliore per diagrammi di rete
- tree: Migliore per gerarchie
- radial: Migliore per mappe mentali
- grid: Migliore per elementi di uguale importanza`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Ottieni forme diagramma',
      description: `Ottieni un elenco delle forme diagramma disponibili con le loro proprietà.

USARE QUANDO:
- Serve vedere quali forme diagramma sono disponibili
- Vuoi conoscere dimensioni predefinite e stile per le forme
- Costruire UI dinamica che mostra opzioni di forme`,
    },
    pinepaper_update_connector: {
      name: 'Aggiorna connettore',
      description: `Aggiorna lo stile o l'etichetta di un connettore esistente.

USARE QUANDO:
- Cambiare l'aspetto del connettore dopo la creazione
- Aggiornare etichette dei connettori
- Cambiare stili di freccia o colori`,
    },
    pinepaper_remove_connector: {
      name: 'Rimuovi connettore',
      description: `Rimuovi un connettore dal canvas.

USARE QUANDO:
- Eliminare una connessione tra elementi
- Rimuovere collegamenti errati
- Ristrutturare connessioni del diagramma`,
    },
    pinepaper_diagram_mode: {
      name: 'Modalità diagramma',
      description: `Controlla la modalità diagramma per editing interattivo.

USARE QUANDO:
- Passare tra modalità disegno e selezione
- Abilitare/disabilitare UI specifiche per diagrammi
- Preparare il canvas per creazione di diagrammi

AZIONI:
- activate: Abilita modalità diagramma
- deactivate: Ritorna alla modalità canvas normale
- toggle: Cambia tra le modalità
- setMode: Imposta modalità strumento specifica`,
    },
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
