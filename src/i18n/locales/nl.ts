/**
 * Dutch Translations
 */

import { createBaseTranslation } from './base.js';

export const nl = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Item maken', description: '' },
    pinepaper_modify_item: { name: 'Item wijzigen', description: '' },
    pinepaper_delete_item: { name: 'Item verwijderen', description: '' },
    pinepaper_add_relation: { name: 'Relatie toevoegen', description: '' },
    pinepaper_remove_relation: { name: 'Relatie verwijderen', description: '' },
    pinepaper_query_relations: { name: 'Relaties opvragen', description: '' },
    pinepaper_animate: { name: 'Animeren', description: '' },
    pinepaper_keyframe_animate: { name: 'Keyframe-animatie', description: '' },
    pinepaper_play_timeline: { name: 'Tijdlijn afspelen', description: '' },
    pinepaper_execute_generator: { name: 'Generator uitvoeren', description: '' },
    pinepaper_list_generators: { name: 'Generatoren weergeven', description: '' },
    pinepaper_apply_effect: { name: 'Effect toepassen', description: '' },
    pinepaper_get_items: { name: 'Items ophalen', description: '' },
    pinepaper_get_relation_stats: { name: 'Relatiestatistieken', description: '' },
    pinepaper_set_background_color: { name: 'Achtergrondkleur instellen', description: '' },
    pinepaper_set_canvas_size: { name: 'Canvasgrootte instellen', description: '' },
    pinepaper_export_svg: { name: 'SVG exporteren', description: '' },
    pinepaper_export_training_data: { name: 'Trainingsgegevens exporteren', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Diagramvorm maken',
      description: `Maak een diagramvorm op het canvas. Diagramvormen zijn gespecialiseerde vormen voor stroomdiagrammen, UML-diagrammen, netwerkdiagrammen en vergelijkbare technische tekeningen.

GEBRUIK WANNEER:
- Stroomdiagrammen, procesdiagrammen of workflows maken
- UML-klassendiagrammen, use case-diagrammen of sequentiediagrammen bouwen
- Netwerktopologiediagrammen ontwerpen
- Organisatieschema's of beslisbomen maken

VORMTYPEN:
- Stroomdiagram: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Netwerk: cloud, server
- Basis: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Items verbinden',
      description: `Verbind twee items met een slimme connector. Dit is de primaire manier om lijnen/pijlen tussen diagramvormen te tekenen.

GEBRUIK WANNEER:
- Pijlen tekenen tussen stroomdiagramstappen
- UML-klassen verbinden met associaties
- Netwerkverbindingen maken tussen knooppunten
- Elk diagram dat lijnen/pijlen tussen elementen nodig heeft

ROUTERINGSTYPEN:
- orthogonal: Alleen haakse hoeken (standaard)
- direct: Rechte lijn tussen punten
- curved: Bezier-curve met instelbare kromming`,
    },
    pinepaper_connect_ports: {
      name: 'Poorten verbinden',
      description: `Verbind twee specifieke poorten op items. Gebruik dit wanneer je nauwkeurige controle nodig hebt over welke poorten de connector verbindt.

GEBRUIK WANNEER:
- Connector moet aan specifieke zijde van vorm hechten
- Complexe diagrammen maken waar automatische poortselectie niet ideaal is
- Circuitachtige diagrammen bouwen met specifieke in-/uitgangspunten`,
    },
    pinepaper_add_ports: {
      name: 'Poorten toevoegen',
      description: `Voeg verbindingspoorten toe aan een bestaand item. Poorten zijn ankerpunten waar connectors aan kunnen hechten.

GEBRUIK WANNEER:
- Aangepaste poortposities aan vormen toevoegen
- Verbindingen inschakelen op items zonder poorten
- Gespecialiseerde verbindingspunten maken voor complexe diagrammen`,
    },
    pinepaper_auto_layout: {
      name: 'Automatische indeling',
      description: `Rangschik diagramitems automatisch met een indelingsalgoritme. Dit herordent items voor schonere, beter leesbare diagrammen.

GEBRUIK WANNEER:
- Diagramitems rommelig zijn of overlappen
- Automatisch een professionele indeling willen maken
- Na toevoegen van veel items, deze moeten organiseren

INDELINGSTYPEN:
- hierarchical: Best voor stroomdiagrammen, organogrammen
- force-directed: Best voor netwerkdiagrammen
- tree: Best voor hiërarchieën
- radial: Best voor mindmaps
- grid: Best voor items van gelijk belang`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Diagramvormen ophalen',
      description: `Haal een lijst op van beschikbare diagramvormen met hun eigenschappen.

GEBRUIK WANNEER:
- Moet zien welke diagramvormen beschikbaar zijn
- Standaardformaten en styling voor vormen wilt weten
- Dynamische UI bouwen die vormopties toont`,
    },
    pinepaper_update_connector: {
      name: 'Verbinding bijwerken',
      description: `Werk de stijl of het label van een bestaande connector bij.

GEBRUIK WANNEER:
- Connector-uiterlijk na aanmaak wijzigen
- Connectorlabels bijwerken
- Pijlstijlen of kleuren wijzigen`,
    },
    pinepaper_remove_connector: {
      name: 'Verbinding verwijderen',
      description: `Verwijder een connector van het canvas.

GEBRUIK WANNEER:
- Verbinding tussen items verwijderen
- Onjuiste links verwijderen
- Diagramverbindingen herstructureren`,
    },
    pinepaper_diagram_mode: {
      name: 'Diagrammodus',
      description: `Beheer de diagrammodus voor interactief bewerken.

GEBRUIK WANNEER:
- Schakelen tussen teken- en selectiemodi
- Diagramspecifieke UI in-/uitschakelen
- Canvas instellen voor diagramcreatie

ACTIES:
- activate: Diagrammodus inschakelen
- deactivate: Terug naar normale canvasmodus
- toggle: Schakelen tussen modi
- setMode: Specifieke gereedschapsmodus instellen`,
    },
  },

  errors: {
    itemNotFound: 'Item niet gevonden: {{itemId}}',
    invalidRelation: 'Ongeldige relatie: {{relationType}}',
    invalidParams: 'Ongeldige parameters: {{details}}',
    generatorNotFound: 'Generator niet gevonden: {{generatorName}}',
    exportFailed: 'Export mislukt: {{reason}}',
    executionError: 'Uitvoeringsfout: {{message}}',
    validationError: 'Validatiefout: {{message}}',
    unknownTool: 'Onbekend hulpmiddel: {{toolName}}',
    apiKeyRequired: 'API-sleutel vereist',
    apiKeyInvalid: 'Ongeldige API-sleutel',
    apiKeyExpired: 'API-sleutel verlopen',
    rateLimitExceeded: 'Snelheidslimiet overschreden. Probeer opnieuw over {{seconds}} seconden.',
  },

  success: {
    itemCreated: '{{itemType}} gemaakt op positie ({{x}}, {{y}})',
    itemModified: 'Item {{itemId}} gewijzigd',
    itemDeleted: 'Item {{itemId}} verwijderd',
    relationAdded: 'Relatie {{relationType}} toegevoegd: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relatie verwijderd tussen {{sourceId}} en {{targetId}}',
    animationApplied: 'Animatie {{animationType}} toegepast op {{itemId}}',
    generatorExecuted: 'Generator {{generatorName}} uitgevoerd',
    effectApplied: 'Effect {{effectType}} toegepast op {{itemId}}',
    backgroundSet: 'Achtergrondkleur ingesteld op {{color}}',
    canvasSizeSet: 'Canvasgrootte ingesteld op {{width}}×{{height}}',
    exported: '{{format}} succesvol geëxporteerd',
  },

  itemTypes: {
    text: 'Tekst',
    circle: 'Cirkel',
    star: 'Ster',
    rectangle: 'Rechthoek',
    triangle: 'Driehoek',
    polygon: 'Veelhoek',
    ellipse: 'Ellips',
    path: 'Pad',
    line: 'Lijn',
    arc: 'Boog',
  },

  relationTypes: {
    orbits: 'Draait om',
    follows: 'Volgt',
    attached_to: 'Bevestigd aan',
    maintains_distance: 'Houdt afstand',
    points_at: 'Wijst naar',
    mirrors: 'Spiegelt',
    parallax: 'Parallax',
    bounds_to: 'Begrensd tot',
  },

  animationTypes: {
    pulse: 'Pulseren',
    rotate: 'Roteren',
    bounce: 'Stuiteren',
    fade: 'Vervagen',
    wobble: 'Wiebelen',
    slide: 'Schuiven',
    typewriter: 'Typemachine',
  },

  generators: {
    drawSunburst: 'Zonnestralen',
    drawSunsetScene: 'Zonsondergang',
    drawGrid: 'Raster',
    drawStackedCircles: 'Gestapelde cirkels',
    drawCircuit: 'Circuit',
    drawWaves: 'Golven',
    drawPattern: 'Patroon',
  },

  common: {
    at: 'bij',
    with: 'met',
    to: 'naar',
    from: 'van',
    position: 'positie',
    radius: 'straal',
    color: 'kleur',
    speed: 'snelheid',
    duration: 'duur',
  },
});

export default nl;
