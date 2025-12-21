/**
 * Ukrainian Translations
 */

import { createBaseTranslation } from './base.js';

export const uk = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Створити елемент', description: '' },
    pinepaper_modify_item: { name: 'Змінити елемент', description: '' },
    pinepaper_delete_item: { name: 'Видалити елемент', description: '' },
    pinepaper_add_relation: { name: 'Додати зв\'язок', description: '' },
    pinepaper_remove_relation: { name: 'Видалити зв\'язок', description: '' },
    pinepaper_query_relations: { name: 'Запитати зв\'язки', description: '' },
    pinepaper_animate: { name: 'Анімувати', description: '' },
    pinepaper_keyframe_animate: { name: 'Ключова анімація', description: '' },
    pinepaper_play_timeline: { name: 'Відтворити часову шкалу', description: '' },
    pinepaper_execute_generator: { name: 'Виконати генератор', description: '' },
    pinepaper_list_generators: { name: 'Список генераторів', description: '' },
    pinepaper_apply_effect: { name: 'Застосувати ефект', description: '' },
    pinepaper_get_items: { name: 'Отримати елементи', description: '' },
    pinepaper_get_relation_stats: { name: 'Статистика зв\'язків', description: '' },
    pinepaper_set_background_color: { name: 'Встановити колір фону', description: '' },
    pinepaper_set_canvas_size: { name: 'Встановити розмір полотна', description: '' },
    pinepaper_export_svg: { name: 'Експорт SVG', description: '' },
    pinepaper_export_training_data: { name: 'Експорт навчальних даних', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Створити фігуру діаграми',
      description: `Створити фігуру діаграми на полотні. Фігури діаграми - це спеціалізовані фігури для блок-схем, UML-діаграм, мережевих діаграм та подібних технічних креслень.

КОЛИ ВИКОРИСТОВУВАТИ:
- Створення блок-схем, процесних діаграм або робочих процесів
- Побудова UML діаграм класів, прецедентів або послідовностей
- Розробка діаграм мережевої топології
- Створення організаційних схем або дерев рішень

ТИПИ ФІГУР:
- Блок-схеми: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Мережа: cloud, server
- Базові: rectangle, circle, triangle, star`
    },
    pinepaper_connect: {
      name: "З'єднати елементи",
      description: `З'єднати два елементи розумним з'єднувачем. Це основний спосіб малювати лінії/стрілки між фігурами діаграми.

КОЛИ ВИКОРИСТОВУВАТИ:
- Малювання стрілок між кроками блок-схеми
- З'єднання UML-класів з асоціаціями
- Створення мережевих з'єднань між вузлами
- Будь-яка діаграма, що потребує ліній/стрілок між елементами

ТИПИ МАРШРУТИЗАЦІЇ:
- orthogonal: Тільки прямокутні повороти (за замовчуванням)
- direct: Пряма лінія між точками
- curved: Крива Безьє з налаштовуваною кривизною`
    },
    pinepaper_connect_ports: {
      name: "З'єднати порти",
      description: `З'єднати два конкретних порти на елементах. Використовуйте це, коли потрібен точний контроль над тим, до яких портів приєднується з'єднувач.

КОЛИ ВИКОРИСТОВУВАТИ:
- Потрібно приєднати з'єднувач до конкретної сторони фігури
- Створення складних діаграм, де автоматичний вибір портів не ідеальний
- Побудова схемоподібних діаграм з конкретними точками входу/виходу`
    },
    pinepaper_add_ports: {
      name: 'Додати порти',
      description: `Додати порти з'єднання до існуючого елемента. Порти - це точки прив'язки, до яких можуть приєднуватися з'єднувачі.

КОЛИ ВИКОРИСТОВУВАТИ:
- Додавання користувацьких позицій портів до фігур
- Увімкнення з'єднань на елементах без портів
- Створення спеціалізованих точок з'єднання для складних діаграм`
    },
    pinepaper_auto_layout: {
      name: 'Автоматичне компонування',
      description: `Автоматично розташувати елементи діаграми за допомогою алгоритму компонування. Це реорганізує елементи для чистіших, більш читабельних діаграм.

КОЛИ ВИКОРИСТОВУВАТИ:
- Елементи діаграми безладні або перекриваються
- Потрібно автоматично створити професійне компонування
- Після додавання багатьох елементів потрібно їх організувати

ТИПИ КОМПОНУВАННЯ:
- hierarchical: Найкраще для блок-схем, організаційних діаграм
- force-directed: Найкраще для мережевих діаграм
- tree: Найкраще для ієрархій
- radial: Найкраще для інтелект-карт
- grid: Найкраще для елементів однакової важливості`
    },
    pinepaper_get_diagram_shapes: {
      name: 'Отримати фігури діаграми',
      description: `Отримати список доступних фігур діаграми з їх властивостями.

КОЛИ ВИКОРИСТОВУВАТИ:
- Потрібно побачити, які фігури діаграми доступні
- Потрібно знати розміри та стилізацію фігур за замовчуванням
- Побудова динамічного інтерфейсу, що показує варіанти фігур`
    },
    pinepaper_update_connector: {
      name: "Оновити з'єднувач",
      description: `Оновити стиль або мітку існуючого з'єднувача.

КОЛИ ВИКОРИСТОВУВАТИ:
- Зміна вигляду з'єднувача після створення
- Оновлення міток з'єднувача
- Зміна стилів стрілок або кольорів`
    },
    pinepaper_remove_connector: {
      name: "Видалити з'єднувач",
      description: `Видалити з'єднувач з полотна.

КОЛИ ВИКОРИСТОВУВАТИ:
- Видалення з'єднання між елементами
- Видалення неправильних зв'язків
- Реструктуризація з'єднань діаграми`
    },
    pinepaper_diagram_mode: {
      name: 'Режим діаграми',
      description: `Керувати режимом діаграми для інтерактивного редагування.

КОЛИ ВИКОРИСТОВУВАТИ:
- Перемикання між режимами малювання та виділення
- Увімкнення/вимкнення специфічного для діаграм інтерфейсу
- Налаштування полотна для створення діаграми

ДІЇ:
- activate: Увімкнути режим діаграми
- deactivate: Повернутися до звичайного режиму полотна
- toggle: Перемикатися між режимами
- setMode: Встановити конкретний режим інструменту`
    },
  },

  errors: {
    itemNotFound: 'Елемент не знайдено: {{itemId}}',
    invalidRelation: 'Недійсний зв\'язок: {{relationType}}',
    invalidParams: 'Недійсні параметри: {{details}}',
    generatorNotFound: 'Генератор не знайдено: {{generatorName}}',
    exportFailed: 'Помилка експорту: {{reason}}',
    executionError: 'Помилка виконання: {{message}}',
    validationError: 'Помилка перевірки: {{message}}',
    unknownTool: 'Невідомий інструмент: {{toolName}}',
    apiKeyRequired: 'Потрібен ключ API',
    apiKeyInvalid: 'Недійсний ключ API',
    apiKeyExpired: 'Термін дії ключа API закінчився',
    rateLimitExceeded: 'Перевищено ліміт запитів. Спробуйте знову через {{seconds}} секунд.',
  },

  success: {
    itemCreated: '{{itemType}} створено в позиції ({{x}}, {{y}})',
    itemModified: 'Елемент {{itemId}} змінено',
    itemDeleted: 'Елемент {{itemId}} видалено',
    relationAdded: 'Зв\'язок {{relationType}} додано: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Зв\'язок видалено між {{sourceId}} та {{targetId}}',
    animationApplied: 'Анімацію {{animationType}} застосовано до {{itemId}}',
    generatorExecuted: 'Генератор {{generatorName}} виконано',
    effectApplied: 'Ефект {{effectType}} застосовано до {{itemId}}',
    backgroundSet: 'Колір фону встановлено на {{color}}',
    canvasSizeSet: 'Розмір полотна встановлено на {{width}}×{{height}}',
    exported: '{{format}} успішно експортовано',
  },

  itemTypes: {
    text: 'Текст',
    circle: 'Коло',
    star: 'Зірка',
    rectangle: 'Прямокутник',
    triangle: 'Трикутник',
    polygon: 'Багатокутник',
    ellipse: 'Еліпс',
    path: 'Шлях',
    line: 'Лінія',
    arc: 'Дуга',
  },

  relationTypes: {
    orbits: 'Обертається навколо',
    follows: 'Слідує за',
    attached_to: 'Прикріплено до',
    maintains_distance: 'Підтримує відстань',
    points_at: 'Вказує на',
    mirrors: 'Відображає',
    parallax: 'Паралакс',
    bounds_to: 'Обмежено',
  },

  animationTypes: {
    pulse: 'Пульсація',
    rotate: 'Обертання',
    bounce: 'Відскок',
    fade: 'Згасання',
    wobble: 'Хитання',
    slide: 'Ковзання',
    typewriter: 'Друкарська машинка',
  },

  generators: {
    drawSunburst: 'Сонячні промені',
    drawSunsetScene: 'Сцена заходу сонця',
    drawGrid: 'Сітка',
    drawStackedCircles: 'Складені кола',
    drawCircuit: 'Схема',
    drawWaves: 'Хвилі',
    drawPattern: 'Візерунок',
  },

  common: {
    at: 'в',
    with: 'з',
    to: 'до',
    from: 'від',
    position: 'позиція',
    radius: 'радіус',
    color: 'колір',
    speed: 'швидкість',
    duration: 'тривалість',
  },
});

export default uk;
