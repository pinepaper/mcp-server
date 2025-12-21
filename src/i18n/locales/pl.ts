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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Utwórz kształt diagramu',
      description: `Utwórz kształt diagramu na płótnie. Kształty diagramów to wyspecjalizowane kształty do schematów blokowych, diagramów UML, diagramów sieciowych i podobnych rysunków technicznych.

UŻYJ KIEDY:
- Tworzenie schematów blokowych, diagramów procesów lub przepływów pracy
- Budowanie diagramów klas UML, diagramów przypadków użycia lub diagramów sekwencji
- Projektowanie diagramów topologii sieci
- Tworzenie schematów organizacyjnych lub drzew decyzyjnych

TYPY KSZTAŁTÓW:
- Schematy blokowe: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Sieć: cloud, server
- Podstawowe: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Połącz elementy',
      description: `Połącz dwa elementy inteligentnym łącznikiem. To podstawowy sposób rysowania linii/strzałek między kształtami diagramu.

UŻYJ KIEDY:
- Rysowanie strzałek między krokami schematu blokowego
- Łączenie klas UML za pomocą asocjacji
- Tworzenie połączeń sieciowych między węzłami
- Każdy diagram wymagający linii/strzałek między elementami

TYPY ROUTINGU:
- orthogonal: Tylko skręty pod kątem prostym (domyślnie)
- direct: Prosta linia między punktami
- curved: Krzywa Béziera z regulowaną krzywizną`,
    },
    pinepaper_connect_ports: {
      name: 'Połącz porty',
      description: `Połącz dwa konkretne porty na elementach. Użyj tego, gdy potrzebujesz precyzyjnej kontroli nad tym, do których portów łącznik się podłącza.

UŻYJ KIEDY:
- Łącznik musi być podłączony do określonej strony kształtu
- Tworzenie złożonych diagramów, gdzie automatyczny wybór portu nie jest idealny
- Budowanie diagramów przypominających obwody z konkretnymi punktami wejścia/wyjścia`,
    },
    pinepaper_add_ports: {
      name: 'Dodaj porty',
      description: `Dodaj porty połączeń do istniejącego elementu. Porty to punkty kotwiczenia, do których mogą się podłączyć łączniki.

UŻYJ KIEDY:
- Dodawanie niestandardowych pozycji portów do kształtów
- Włączanie połączeń na elementach, które nie mają portów
- Tworzenie wyspecjalizowanych punktów połączeń dla złożonych diagramów`,
    },
    pinepaper_auto_layout: {
      name: 'Automatyczny układ',
      description: `Automatycznie rozmieść elementy diagramu używając algorytmu układu. To reorganizuje elementy dla czystszych, bardziej czytelnych diagramów.

UŻYJ KIEDY:
- Elementy diagramu są nieporządne lub nakładają się na siebie
- Chcesz automatycznie stworzyć profesjonalnie wyglądający układ
- Po dodaniu wielu elementów, trzeba je uporządkować

TYPY UKŁADÓW:
- hierarchical: Najlepszy dla schematów blokowych, schematów organizacyjnych
- force-directed: Najlepszy dla diagramów sieciowych
- tree: Najlepszy dla hierarchii
- radial: Najlepszy dla map myśli
- grid: Najlepszy dla elementów o równej wadze`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Pobierz kształty diagramu',
      description: `Pobierz listę dostępnych kształtów diagramu z ich właściwościami.

UŻYJ KIEDY:
- Potrzebujesz zobaczyć, jakie kształty diagramów są dostępne
- Chcesz poznać domyślne rozmiary i style kształtów
- Budowanie dynamicznego interfejsu pokazującego opcje kształtów`,
    },
    pinepaper_update_connector: {
      name: 'Aktualizuj łącznik',
      description: `Zaktualizuj styl lub etykietę istniejącego łącznika.

UŻYJ KIEDY:
- Zmiana wyglądu łącznika po utworzeniu
- Aktualizacja etykiet łączników
- Zmiana stylów strzałek lub kolorów`,
    },
    pinepaper_remove_connector: {
      name: 'Usuń łącznik',
      description: `Usuń łącznik z płótna.

UŻYJ KIEDY:
- Usuwanie połączenia między elementami
- Usuwanie nieprawidłowych łączy
- Restrukturyzacja połączeń diagramu`,
    },
    pinepaper_diagram_mode: {
      name: 'Tryb diagramu',
      description: `Kontroluj tryb diagramu do interaktywnej edycji.

UŻYJ KIEDY:
- Przełączanie między trybami rysowania i zaznaczania
- Włączanie/wyłączanie interfejsu specyficznego dla diagramów
- Przygotowanie płótna do tworzenia diagramów

AKCJE:
- activate: Włącz tryb diagramu
- deactivate: Powrót do normalnego trybu płótna
- toggle: Przełącz między trybami
- setMode: Ustaw konkretny tryb narzędzia`,
    },
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
