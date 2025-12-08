/**
 * Russian Translations
 */

import { createBaseTranslation } from './base.js';

export const ru = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Создать элемент', description: '' },
    pinepaper_modify_item: { name: 'Изменить элемент', description: '' },
    pinepaper_delete_item: { name: 'Удалить элемент', description: '' },
    pinepaper_add_relation: { name: 'Добавить связь', description: '' },
    pinepaper_remove_relation: { name: 'Удалить связь', description: '' },
    pinepaper_query_relations: { name: 'Запросить связи', description: '' },
    pinepaper_animate: { name: 'Анимировать', description: '' },
    pinepaper_keyframe_animate: { name: 'Ключевая анимация', description: '' },
    pinepaper_play_timeline: { name: 'Воспроизвести временную шкалу', description: '' },
    pinepaper_execute_generator: { name: 'Выполнить генератор', description: '' },
    pinepaper_list_generators: { name: 'Список генераторов', description: '' },
    pinepaper_apply_effect: { name: 'Применить эффект', description: '' },
    pinepaper_get_items: { name: 'Получить элементы', description: '' },
    pinepaper_get_relation_stats: { name: 'Статистика связей', description: '' },
    pinepaper_set_background_color: { name: 'Установить цвет фона', description: '' },
    pinepaper_set_canvas_size: { name: 'Установить размер холста', description: '' },
    pinepaper_export_svg: { name: 'Экспорт SVG', description: '' },
    pinepaper_export_training_data: { name: 'Экспорт обучающих данных', description: '' },
  },

  errors: {
    itemNotFound: 'Элемент не найден: {{itemId}}',
    invalidRelation: 'Недопустимая связь: {{relationType}}',
    invalidParams: 'Недопустимые параметры: {{details}}',
    generatorNotFound: 'Генератор не найден: {{generatorName}}',
    exportFailed: 'Ошибка экспорта: {{reason}}',
    executionError: 'Ошибка выполнения: {{message}}',
    validationError: 'Ошибка проверки: {{message}}',
    unknownTool: 'Неизвестный инструмент: {{toolName}}',
    apiKeyRequired: 'Требуется ключ API',
    apiKeyInvalid: 'Недействительный ключ API',
    apiKeyExpired: 'Срок действия ключа API истёк',
    rateLimitExceeded: 'Превышен лимит запросов. Повторите попытку через {{seconds}} секунд.',
  },

  success: {
    itemCreated: '{{itemType}} создан в позиции ({{x}}, {{y}})',
    itemModified: 'Элемент {{itemId}} изменён',
    itemDeleted: 'Элемент {{itemId}} удалён',
    relationAdded: 'Связь {{relationType}} добавлена: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Связь удалена между {{sourceId}} и {{targetId}}',
    animationApplied: 'Анимация {{animationType}} применена к {{itemId}}',
    generatorExecuted: 'Генератор {{generatorName}} выполнен',
    effectApplied: 'Эффект {{effectType}} применён к {{itemId}}',
    backgroundSet: 'Цвет фона установлен на {{color}}',
    canvasSizeSet: 'Размер холста установлен на {{width}}×{{height}}',
    exported: '{{format}} успешно экспортирован',
  },

  itemTypes: {
    text: 'Текст',
    circle: 'Круг',
    star: 'Звезда',
    rectangle: 'Прямоугольник',
    triangle: 'Треугольник',
    polygon: 'Многоугольник',
    ellipse: 'Эллипс',
    path: 'Путь',
    line: 'Линия',
    arc: 'Дуга',
  },

  relationTypes: {
    orbits: 'Вращается вокруг',
    follows: 'Следует за',
    attached_to: 'Прикреплён к',
    maintains_distance: 'Поддерживает расстояние',
    points_at: 'Указывает на',
    mirrors: 'Отражает',
    parallax: 'Параллакс',
    bounds_to: 'Ограничен',
  },

  animationTypes: {
    pulse: 'Пульсация',
    rotate: 'Вращение',
    bounce: 'Отскок',
    fade: 'Затухание',
    wobble: 'Покачивание',
    slide: 'Скольжение',
    typewriter: 'Печатная машинка',
  },

  generators: {
    drawSunburst: 'Солнечные лучи',
    drawSunsetScene: 'Сцена заката',
    drawGrid: 'Сетка',
    drawStackedCircles: 'Сложенные круги',
    drawCircuit: 'Схема',
    drawWaves: 'Волны',
    drawPattern: 'Узор',
  },

  common: {
    at: 'в',
    with: 'с',
    to: 'к',
    from: 'от',
    position: 'позиция',
    radius: 'радиус',
    color: 'цвет',
    speed: 'скорость',
    duration: 'длительность',
  },
});

export default ru;
