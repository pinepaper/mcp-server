/**
 * German Translations
 */

import { createBaseTranslation } from './base.js';

export const de = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Element erstellen', description: '' },
    pinepaper_modify_item: { name: 'Element ändern', description: '' },
    pinepaper_delete_item: { name: 'Element löschen', description: '' },
    pinepaper_add_relation: { name: 'Beziehung hinzufügen', description: '' },
    pinepaper_remove_relation: { name: 'Beziehung entfernen', description: '' },
    pinepaper_query_relations: { name: 'Beziehungen abfragen', description: '' },
    pinepaper_animate: { name: 'Animieren', description: '' },
    pinepaper_keyframe_animate: { name: 'Keyframe-Animation', description: '' },
    pinepaper_play_timeline: { name: 'Zeitleiste abspielen', description: '' },
    pinepaper_execute_generator: { name: 'Generator ausführen', description: '' },
    pinepaper_list_generators: { name: 'Generatoren auflisten', description: '' },
    pinepaper_apply_effect: { name: 'Effekt anwenden', description: '' },
    pinepaper_get_items: { name: 'Elemente abrufen', description: '' },
    pinepaper_get_relation_stats: { name: 'Beziehungsstatistik', description: '' },
    pinepaper_set_background_color: { name: 'Hintergrundfarbe festlegen', description: '' },
    pinepaper_set_canvas_size: { name: 'Leinwandgröße festlegen', description: '' },
    pinepaper_export_svg: { name: 'SVG exportieren', description: '' },
    pinepaper_export_training_data: { name: 'Trainingsdaten exportieren', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Diagrammform erstellen',
      description: `Erstellt spezialisierte Diagrammformen für Flussdiagramme, UML-Diagramme und Netzwerkdiagramme.

VERWENDUNG:
- Flussdiagramme und Prozessabläufe
- UML-Klassendiagramme, Use-Case-Diagramme
- Netzwerktopologie-Diagramme
- Organigramme und Entscheidungsbäume

FORMTYPEN:
- Flussdiagramm: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Netzwerk: cloud, server
- Basis: rectangle, circle, triangle, star`
    },
    pinepaper_connect: {
      name: 'Elemente verbinden',
      description: `Verbindet zwei Elemente mit intelligenten Verbindungslinien. Hauptmethode zum Zeichnen von Pfeilen zwischen Diagrammformen.

VERWENDUNG:
- Pfeile zwischen Flussdiagramm-Schritten
- UML-Klassenassoziationen
- Netzwerkverbindungen zwischen Knoten

ROUTING-TYPEN:
- orthogonal: Nur rechtwinklige Biegungen (Standard)
- direct: Gerade Linie zwischen Punkten
- curved: Bézierkurve mit einstellbarer Krümmung`
    },
    pinepaper_connect_ports: {
      name: 'Ports verbinden',
      description: `Verbindet zwei spezifische Ports an Elementen. Nutzen Sie dies für präzise Kontrolle, an welchen Ports die Verbindung angebracht wird.

VERWENDUNG:
- Verbindung an bestimmter Seite der Form
- Komplexe Diagramme mit spezifischen Ein-/Ausgangspunkten
- Schaltkreis-ähnliche Diagramme`
    },
    pinepaper_add_ports: {
      name: 'Ports hinzufügen',
      description: `Fügt Verbindungs-Ports zu einem Element hinzu. Ports sind Ankerpunkte, an denen Verbindungen angebracht werden können.

VERWENDUNG:
- Benutzerdefinierte Port-Positionen an Formen
- Verbindungen an Elementen ohne Ports ermöglichen
- Spezielle Verbindungspunkte für komplexe Diagramme`
    },
    pinepaper_auto_layout: {
      name: 'Automatisches Layout',
      description: `Ordnet Diagrammelemente automatisch mit Layout-Algorithmen an. Reorganisiert Elemente für übersichtlichere, lesbare Diagramme.

VERWENDUNG:
- Unordentliche oder überlappende Diagrammelemente
- Professionelles Layout automatisch erstellen
- Nach Hinzufügen vieler Elemente organisieren

LAYOUT-TYPEN:
- hierarchical: Optimal für Flussdiagramme, Organigramme
- force-directed: Optimal für Netzwerkdiagramme
- tree: Optimal für Hierarchien
- radial: Optimal für Mind Maps
- grid: Optimal für gleichwertige Elemente`
    },
    pinepaper_get_diagram_shapes: {
      name: 'Diagrammformen abrufen',
      description: `Ruft Liste verfügbarer Diagrammformen mit ihren Eigenschaften ab.

VERWENDUNG:
- Verfügbare Diagrammformen anzeigen
- Standardgrößen und Stile von Formen ermitteln
- Dynamische UI mit Formoptionen erstellen`
    },
    pinepaper_update_connector: {
      name: 'Verbindung aktualisieren',
      description: `Aktualisiert Stil oder Beschriftung einer bestehenden Verbindung.

VERWENDUNG:
- Verbindungsdarstellung nach Erstellung ändern
- Verbindungsbeschriftungen aktualisieren
- Pfeilstile oder Farben ändern`
    },
    pinepaper_remove_connector: {
      name: 'Verbindung entfernen',
      description: `Entfernt eine Verbindung von der Leinwand.

VERWENDUNG:
- Verbindung zwischen Elementen löschen
- Falsche Links entfernen
- Diagrammverbindungen umstrukturieren`
    },
    pinepaper_diagram_mode: {
      name: 'Diagrammmodus',
      description: `Steuert den Diagrammmodus für interaktive Bearbeitung.

VERWENDUNG:
- Zwischen Zeichen- und Auswahlmodus wechseln
- Diagrammspezifische UI aktivieren/deaktivieren
- Leinwand für Diagrammerstellung einrichten

AKTIONEN:
- activate: Diagrammmodus aktivieren
- deactivate: Zu normalem Leinwandmodus zurückkehren
- toggle: Zwischen Modi wechseln
- setMode: Spezifischen Werkzeugmodus setzen`
    },
  },

  errors: {
    itemNotFound: 'Element nicht gefunden: {{itemId}}',
    invalidRelation: 'Ungültige Beziehung: {{relationType}}',
    invalidParams: 'Ungültige Parameter: {{details}}',
    generatorNotFound: 'Generator nicht gefunden: {{generatorName}}',
    exportFailed: 'Export fehlgeschlagen: {{reason}}',
    executionError: 'Ausführungsfehler: {{message}}',
    validationError: 'Validierungsfehler: {{message}}',
    unknownTool: 'Unbekanntes Werkzeug: {{toolName}}',
    apiKeyRequired: 'API-Schlüssel erforderlich',
    apiKeyInvalid: 'Ungültiger API-Schlüssel',
    apiKeyExpired: 'API-Schlüssel abgelaufen',
    rateLimitExceeded: 'Anfragelimit überschritten. Versuchen Sie es in {{seconds}} Sekunden erneut.',
  },

  success: {
    itemCreated: '{{itemType}} an Position ({{x}}, {{y}}) erstellt',
    itemModified: 'Element {{itemId}} geändert',
    itemDeleted: 'Element {{itemId}} gelöscht',
    relationAdded: 'Beziehung {{relationType}} hinzugefügt: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Beziehung zwischen {{sourceId}} und {{targetId}} entfernt',
    animationApplied: 'Animation {{animationType}} auf {{itemId}} angewendet',
    generatorExecuted: 'Generator {{generatorName}} ausgeführt',
    effectApplied: 'Effekt {{effectType}} auf {{itemId}} angewendet',
    backgroundSet: 'Hintergrundfarbe auf {{color}} gesetzt',
    canvasSizeSet: 'Leinwandgröße auf {{width}}×{{height}} gesetzt',
    exported: '{{format}} erfolgreich exportiert',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Kreis',
    star: 'Stern',
    rectangle: 'Rechteck',
    triangle: 'Dreieck',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    path: 'Pfad',
    line: 'Linie',
    arc: 'Bogen',
  },

  relationTypes: {
    orbits: 'Umkreist',
    follows: 'Folgt',
    attached_to: 'Angehängt an',
    maintains_distance: 'Hält Abstand',
    points_at: 'Zeigt auf',
    mirrors: 'Spiegelt',
    parallax: 'Parallaxe',
    bounds_to: 'Begrenzt auf',
  },

  animationTypes: {
    pulse: 'Pulsieren',
    rotate: 'Rotieren',
    bounce: 'Hüpfen',
    fade: 'Verblassen',
    wobble: 'Wackeln',
    slide: 'Gleiten',
    typewriter: 'Schreibmaschine',
  },

  generators: {
    drawSunburst: 'Sonnenstrahlen',
    drawSunsetScene: 'Sonnenuntergang',
    drawGrid: 'Raster',
    drawStackedCircles: 'Gestapelte Kreise',
    drawCircuit: 'Schaltkreis',
    drawWaves: 'Wellen',
    drawPattern: 'Muster',
  },

  common: {
    at: 'bei',
    with: 'mit',
    to: 'zu',
    from: 'von',
    position: 'Position',
    radius: 'Radius',
    color: 'Farbe',
    speed: 'Geschwindigkeit',
    duration: 'Dauer',
  },
});

export default de;
