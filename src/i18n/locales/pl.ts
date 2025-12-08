/**
 * Polish Translations
 */

import { createBaseTranslation } from './base.js';

export const pl = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Utwórz element', description: '' },
    pinepaper_modify_item: { name: 'Modyfikuj element', description: '' },
    pinepaper_delete_item: { name: 'Usuń element', description: '' },
    pinepaper_add_relation: { name: 'Dodaj relację', description: '' },
    pinepaper_remove_relation: { name: 'Usuń relację', description: '' },
    pinepaper_query_relations: { name: 'Zapytaj o relacje', description: '' },
    pinepaper_animate: { name: 'Animuj', description: '' },
    pinepaper_keyframe_animate: { name: 'Animacja klatek kluczowych', description: '' },
    pinepaper_play_timeline: { name: 'Odtwórz oś czasu', description: '' },
    pinepaper_execute_generator: { name: 'Uruchom generator', description: '' },
    pinepaper_list_generators: { name: 'Lista generatorów', description: '' },
    pinepaper_apply_effect: { name: 'Zastosuj efekt', description: '' },
    pinepaper_get_items: { name: 'Pobierz elementy', description: '' },
    pinepaper_get_relation_stats: { name: 'Statystyki relacji', description: '' },
    pinepaper_set_background_color: { name: 'Ustaw kolor tła', description: '' },
    pinepaper_set_canvas_size: { name: 'Ustaw rozmiar płótna', description: '' },
    pinepaper_export_svg: { name: 'Eksportuj SVG', description: '' },
    pinepaper_export_training_data: { name: 'Eksportuj dane treningowe', description: '' },
  },

  errors: {
    itemNotFound: 'Element nie znaleziony: {{itemId}}',
    invalidRelation: 'Nieprawidłowa relacja: {{relationType}}',
    invalidParams: 'Nieprawidłowe parametry: {{details}}',
    generatorNotFound: 'Generator nie znaleziony: {{generatorName}}',
    exportFailed: 'Eksport nie powiódł się: {{reason}}',
    executionError: 'Błąd wykonania: {{message}}',
    validationError: 'Błąd walidacji: {{message}}',
    unknownTool: 'Nieznane narzędzie: {{toolName}}',
    apiKeyRequired: 'Wymagany klucz API',
    apiKeyInvalid: 'Nieprawidłowy klucz API',
    apiKeyExpired: 'Klucz API wygasł',
    rateLimitExceeded: 'Przekroczono limit żądań. Spróbuj ponownie za {{seconds}} sekund.',
  },

  success: {
    itemCreated: 'Utworzono {{itemType}} na pozycji ({{x}}, {{y}})',
    itemModified: 'Element {{itemId}} zmodyfikowany',
    itemDeleted: 'Element {{itemId}} usunięty',
    relationAdded: 'Dodano relację {{relationType}}: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Usunięto relację między {{sourceId}} a {{targetId}}',
    animationApplied: 'Zastosowano animację {{animationType}} do {{itemId}}',
    generatorExecuted: 'Wykonano generator {{generatorName}}',
    effectApplied: 'Zastosowano efekt {{effectType}} do {{itemId}}',
    backgroundSet: 'Ustawiono kolor tła na {{color}}',
    canvasSizeSet: 'Ustawiono rozmiar płótna na {{width}}×{{height}}',
    exported: 'Pomyślnie wyeksportowano {{format}}',
  },

  itemTypes: {
    text: 'Tekst',
    circle: 'Koło',
    star: 'Gwiazda',
    rectangle: 'Prostokąt',
    triangle: 'Trójkąt',
    polygon: 'Wielokąt',
    ellipse: 'Elipsa',
    path: 'Ścieżka',
    line: 'Linia',
    arc: 'Łuk',
  },

  relationTypes: {
    orbits: 'Orbituje',
    follows: 'Podąża',
    attached_to: 'Przyłączony do',
    maintains_distance: 'Utrzymuje dystans',
    points_at: 'Wskazuje na',
    mirrors: 'Odbija',
    parallax: 'Paralaksa',
    bounds_to: 'Ograniczony do',
  },

  animationTypes: {
    pulse: 'Pulsowanie',
    rotate: 'Obrót',
    bounce: 'Odbijanie',
    fade: 'Zanikanie',
    wobble: 'Kołysanie',
    slide: 'Przesuwanie',
    typewriter: 'Maszyna do pisania',
  },

  generators: {
    drawSunburst: 'Promienie słońca',
    drawSunsetScene: 'Scena zachodu słońca',
    drawGrid: 'Siatka',
    drawStackedCircles: 'Ułożone koła',
    drawCircuit: 'Obwód',
    drawWaves: 'Fale',
    drawPattern: 'Wzór',
  },

  common: {
    at: 'w',
    with: 'z',
    to: 'do',
    from: 'z',
    position: 'pozycja',
    radius: 'promień',
    color: 'kolor',
    speed: 'prędkość',
    duration: 'czas trwania',
  },
});

export default pl;
