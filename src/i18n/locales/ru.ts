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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Создать фигуру диаграммы',
      description: `Создать фигуру диаграммы на холсте. Специализированные фигуры для блок-схем, UML диаграмм, сетевых диаграмм и технических чертежей.

ИСПОЛЬЗОВАТЬ КОГДА:
- Создание блок-схем, процессов или рабочих потоков
- Построение UML диаграмм классов, прецедентов или последовательностей
- Проектирование топологии сети
- Создание организационных схем или деревьев решений

ТИПЫ ФИГУР:
- Блок-схемы: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Сеть: cloud, server
- Базовые: rectangle, circle, triangle, star`
    },
    pinepaper_connect: {
      name: 'Соединить элементы',
      description: `Соединить два элемента умным соединителем. Основной способ рисования линий/стрелок между фигурами диаграммы.

ИСПОЛЬЗОВАТЬ КОГДА:
- Рисование стрелок между шагами блок-схемы
- Соединение UML классов ассоциациями
- Создание сетевых соединений между узлами
- Любая диаграмма, требующая линий/стрелок между элементами

ТИПЫ МАРШРУТИЗАЦИИ:
- orthogonal: Только прямые углы (по умолчанию)
- direct: Прямая линия между точками
- curved: Кривая Безье с настраиваемой кривизной`
    },
    pinepaper_connect_ports: {
      name: 'Соединить порты',
      description: `Соединить два конкретных порта на элементах. Используйте для точного контроля, к каким портам прикрепляется соединитель.

ИСПОЛЬЗОВАТЬ КОГДА:
- Нужно прикрепить соединитель к определённой стороне фигуры
- Создание сложных диаграмм, где автоматический выбор портов не идеален
- Построение схем цепей с конкретными точками входа/выхода`
    },
    pinepaper_add_ports: {
      name: 'Добавить порты',
      description: `Добавить порты подключения к существующему элементу. Порты - это точки привязки, куда могут прикрепляться соединители.

ИСПОЛЬЗОВАТЬ КОГДА:
- Добавление пользовательских позиций портов к фигурам
- Включение соединений на элементах без портов
- Создание специализированных точек подключения для сложных диаграмм`
    },
    pinepaper_auto_layout: {
      name: 'Автоматическая компоновка',
      description: `Автоматически расположить элементы диаграммы с помощью алгоритма компоновки. Переорганизует элементы для более чистых и читаемых диаграмм.

ИСПОЛЬЗОВАТЬ КОГДА:
- Элементы диаграммы беспорядочны или перекрываются
- Нужно создать профессионально выглядящую компоновку автоматически
- После добавления многих элементов нужно организовать их

ТИПЫ КОМПОНОВКИ:
- hierarchical: Лучше для блок-схем, оргдиаграмм
- force-directed: Лучше для сетевых диаграмм
- tree: Лучше для иерархий
- radial: Лучше для ментальных карт
- grid: Лучше для элементов равной важности`
    },
    pinepaper_get_diagram_shapes: {
      name: 'Получить фигуры диаграммы',
      description: `Получить список доступных фигур диаграммы с их свойствами.

ИСПОЛЬЗОВАТЬ КОГДА:
- Нужно увидеть, какие фигуры диаграммы доступны
- Хотите узнать размеры и стили по умолчанию для фигур
- Построение динамического UI, показывающего опции фигур`
    },
    pinepaper_update_connector: {
      name: 'Обновить соединитель',
      description: `Обновить стиль или метку существующего соединителя.

ИСПОЛЬЗОВАТЬ КОГДА:
- Изменение внешнего вида соединителя после создания
- Обновление меток соединителей
- Изменение стилей стрелок или цветов`
    },
    pinepaper_remove_connector: {
      name: 'Удалить соединитель',
      description: `Удалить соединитель с холста.

ИСПОЛЬЗОВАТЬ КОГДА:
- Удаление соединения между элементами
- Удаление неправильных связей
- Реструктуризация соединений диаграммы`
    },
    pinepaper_diagram_mode: {
      name: 'Режим диаграммы',
      description: `Управление режимом диаграммы для интерактивного редактирования.

ИСПОЛЬЗОВАТЬ КОГДА:
- Переключение между режимами рисования и выделения
- Включение/выключение специфичного для диаграмм UI
- Настройка холста для создания диаграммы

ДЕЙСТВИЯ:
- activate: Включить режим диаграммы
- deactivate: Вернуться в обычный режим холста
- toggle: Переключить между режимами
- setMode: Установить конкретный режим инструмента`
    },
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
