/**
 * Kannada Translations
 */

import { createBaseTranslation } from './base.js';

export const kn = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'ಐಟಂ ರಚಿಸಿ', description: '' },
    pinepaper_modify_item: { name: 'ಐಟಂ ಮಾರ್ಪಡಿಸಿ', description: '' },
    pinepaper_delete_item: { name: 'ಐಟಂ ಅಳಿಸಿ', description: '' },
    pinepaper_add_relation: { name: 'ಸಂಬಂಧ ಸೇರಿಸಿ', description: '' },
    pinepaper_remove_relation: { name: 'ಸಂಬಂಧ ತೆಗೆದುಹಾಕಿ', description: '' },
    pinepaper_query_relations: { name: 'ಸಂಬಂಧಗಳನ್ನು ಪ್ರಶ್ನಿಸಿ', description: '' },
    pinepaper_animate: { name: 'ಅನಿಮೇಟ್ ಮಾಡಿ', description: '' },
    pinepaper_keyframe_animate: { name: 'ಕೀಫ್ರೇಮ್ ಅನಿಮೇಶನ್', description: '' },
    pinepaper_play_timeline: { name: 'ಟೈಮ್‌ಲೈನ್ ಪ್ಲೇ ಮಾಡಿ', description: '' },
    pinepaper_execute_generator: { name: 'ಜನರೇಟರ್ ಚಲಾಯಿಸಿ', description: '' },
    pinepaper_list_generators: { name: 'ಜನರೇಟರ್ ಪಟ್ಟಿ', description: '' },
    pinepaper_apply_effect: { name: 'ಎಫೆಕ್ಟ್ ಅನ್ವಯಿಸಿ', description: '' },
    pinepaper_get_items: { name: 'ಐಟಂಗಳನ್ನು ಪಡೆಯಿರಿ', description: '' },
    pinepaper_get_relation_stats: { name: 'ಸಂಬಂಧ ಅಂಕಿಅಂಶಗಳು', description: '' },
    pinepaper_set_background_color: { name: 'ಹಿನ್ನೆಲೆ ಬಣ್ಣ ಹೊಂದಿಸಿ', description: '' },
    pinepaper_set_canvas_size: { name: 'ಕ್ಯಾನ್ವಾಸ್ ಗಾತ್ರ ಹೊಂದಿಸಿ', description: '' },
    pinepaper_export_svg: { name: 'SVG ರಫ್ತು ಮಾಡಿ', description: '' },
    pinepaper_export_training_data: { name: 'ತರಬೇತಿ ಡೇಟಾ ರಫ್ತು ಮಾಡಿ', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'ರೇಖಾಚಿತ್ರ ಆಕಾರ ರಚಿಸಿ', description: '' },
    pinepaper_connect: { name: 'ಐಟಂಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ', description: '' },
    pinepaper_connect_ports: { name: 'ಪೋರ್ಟ್‌ಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ', description: '' },
    pinepaper_add_ports: { name: 'ಪೋರ್ಟ್‌ಗಳನ್ನು ಸೇರಿಸಿ', description: '' },
    pinepaper_auto_layout: { name: 'ಸ್ವಯಂಚಾಲಿತ ಲೇಔಟ್', description: '' },
    pinepaper_get_diagram_shapes: { name: 'ರೇಖಾಚಿತ್ರ ಆಕಾರಗಳನ್ನು ಪಡೆಯಿರಿ', description: '' },
    pinepaper_update_connector: { name: 'ಕನೆಕ್ಟರ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ', description: '' },
    pinepaper_remove_connector: { name: 'ಕನೆಕ್ಟರ್ ತೆಗೆದುಹಾಕಿ', description: '' },
    pinepaper_diagram_mode: { name: 'ರೇಖಾಚಿತ್ರ ಮೋಡ್', description: '' },
  },

  errors: {
    itemNotFound: 'ಐಟಂ ಕಂಡುಬಂದಿಲ್ಲ: {{itemId}}',
    invalidRelation: 'ಅಮಾನ್ಯ ಸಂಬಂಧ: {{relationType}}',
    invalidParams: 'ಅಮಾನ್ಯ ನಿಯತಾಂಕಗಳು: {{details}}',
    generatorNotFound: 'ಜನರೇಟರ್ ಕಂಡುಬಂದಿಲ್ಲ: {{generatorName}}',
    exportFailed: 'ರಫ್ತು ವಿಫಲವಾಗಿದೆ: {{reason}}',
    executionError: 'ಕಾರ್ಯಗತಗೊಳಿಸುವ ದೋಷ: {{message}}',
    validationError: 'ಮೌಲ್ಯೀಕರಣ ದೋಷ: {{message}}',
    unknownTool: 'ಅಪರಿಚಿತ ಉಪಕರಣ: {{toolName}}',
    apiKeyRequired: 'API ಕೀ ಅಗತ್ಯವಿದೆ',
    apiKeyInvalid: 'ಅಮಾನ್ಯ API ಕೀ',
    apiKeyExpired: 'API ಕೀ ಅವಧಿ ಮುಗಿದಿದೆ',
    rateLimitExceeded: 'ವಿನಂತಿ ಮಿತಿ ಮೀರಿದೆ. {{seconds}} ಸೆಕೆಂಡುಗಳ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  },

  success: {
    itemCreated: '{{itemType}} ಸ್ಥಾನದಲ್ಲಿ ({{x}}, {{y}}) ರಚಿಸಲಾಗಿದೆ',
    itemModified: 'ಐಟಂ {{itemId}} ಮಾರ್ಪಡಿಸಲಾಗಿದೆ',
    itemDeleted: 'ಐಟಂ {{itemId}} ಅಳಿಸಲಾಗಿದೆ',
    relationAdded: '{{relationType}} ಸಂಬಂಧ ಸೇರಿಸಲಾಗಿದೆ: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} ಮತ್ತು {{targetId}} ನಡುವಿನ ಸಂಬಂಧ ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
    animationApplied: '{{itemId}} ಗೆ {{animationType}} ಅನಿಮೇಶನ್ ಅನ್ವಯಿಸಲಾಗಿದೆ',
    generatorExecuted: '{{generatorName}} ಜನರೇಟರ್ ಚಲಾಯಿಸಲಾಗಿದೆ',
    effectApplied: '{{itemId}} ಗೆ {{effectType}} ಎಫೆಕ್ಟ್ ಅನ್ವಯಿಸಲಾಗಿದೆ',
    backgroundSet: 'ಹಿನ್ನೆಲೆ ಬಣ್ಣ {{color}} ಗೆ ಹೊಂದಿಸಲಾಗಿದೆ',
    canvasSizeSet: 'ಕ್ಯಾನ್ವಾಸ್ ಗಾತ್ರ {{width}}×{{height}} ಗೆ ಹೊಂದಿಸಲಾಗಿದೆ',
    exported: '{{format}} ಯಶಸ್ವಿಯಾಗಿ ರಫ್ತು ಮಾಡಲಾಗಿದೆ',
  },

  itemTypes: {
    text: 'ಪಠ್ಯ',
    circle: 'ವೃತ್ತ',
    star: 'ನಕ್ಷತ್ರ',
    rectangle: 'ಆಯತ',
    triangle: 'ತ್ರಿಕೋನ',
    polygon: 'ಬಹುಭುಜ',
    ellipse: 'ದೀರ್ಘವೃತ್ತ',
    path: 'ಮಾರ್ಗ',
    line: 'ರೇಖೆ',
    arc: 'ಚಾಪ',
  },

  relationTypes: {
    orbits: 'ಪರಿಭ್ರಮಣ',
    follows: 'ಅನುಸರಣೆ',
    attached_to: 'ಲಗತ್ತಿಸಲಾಗಿದೆ',
    maintains_distance: 'ಅಂತರ ಕಾಯ್ದುಕೊಳ್ಳುತ್ತದೆ',
    points_at: 'ಸೂಚಿಸುತ್ತದೆ',
    mirrors: 'ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ',
    parallax: 'ಪ್ಯಾರಲ್ಯಾಕ್ಸ್',
    bounds_to: 'ಸೀಮಿತ',
  },

  animationTypes: {
    pulse: 'ಬಡಿತ',
    rotate: 'ತಿರುಗುವಿಕೆ',
    bounce: 'ಪುಟಿಯುವಿಕೆ',
    fade: 'ಮಸುಕು',
    wobble: 'ತೂಗಾಟ',
    slide: 'ಜಾರುವಿಕೆ',
    typewriter: 'ಟೈಪ್‌ರೈಟರ್',
  },

  generators: {
    drawSunburst: 'ಸೂರ್ಯಕಿರಣಗಳು',
    drawSunsetScene: 'ಸೂರ್ಯಾಸ್ತ ದೃಶ್ಯ',
    drawGrid: 'ಗ್ರಿಡ್',
    drawStackedCircles: 'ಜೋಡಿಸಿದ ವೃತ್ತಗಳು',
    drawCircuit: 'ಸರ್ಕ್ಯೂಟ್ ಬೋರ್ಡ್',
    drawWaves: 'ಅಲೆಗಳು',
    drawPattern: 'ಮಾದರಿ',
  },

  common: {
    at: 'ನಲ್ಲಿ',
    with: 'ಜೊತೆ',
    to: 'ಗೆ',
    from: 'ಇಂದ',
    position: 'ಸ್ಥಾನ',
    radius: 'ತ್ರಿಜ್ಯ',
    color: 'ಬಣ್ಣ',
    speed: 'ವೇಗ',
    duration: 'ಅವಧಿ',
  },
});

export default kn;
