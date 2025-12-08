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
