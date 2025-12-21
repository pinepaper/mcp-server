/**
 * Punjabi Translations
 */

import { createBaseTranslation } from './base.js';

export const pa = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'ਆਈਟਮ ਬਣਾਓ', description: '' },
    pinepaper_modify_item: { name: 'ਆਈਟਮ ਸੋਧੋ', description: '' },
    pinepaper_delete_item: { name: 'ਆਈਟਮ ਮਿਟਾਓ', description: '' },
    pinepaper_add_relation: { name: 'ਸੰਬੰਧ ਜੋੜੋ', description: '' },
    pinepaper_remove_relation: { name: 'ਸੰਬੰਧ ਹਟਾਓ', description: '' },
    pinepaper_query_relations: { name: 'ਸੰਬੰਧ ਖੋਜੋ', description: '' },
    pinepaper_animate: { name: 'ਐਨੀਮੇਟ ਕਰੋ', description: '' },
    pinepaper_keyframe_animate: { name: 'ਕੀਫ੍ਰੇਮ ਐਨੀਮੇਸ਼ਨ', description: '' },
    pinepaper_play_timeline: { name: 'ਟਾਈਮਲਾਈਨ ਚਲਾਓ', description: '' },
    pinepaper_execute_generator: { name: 'ਜਨਰੇਟਰ ਚਲਾਓ', description: '' },
    pinepaper_list_generators: { name: 'ਜਨਰੇਟਰ ਸੂਚੀ', description: '' },
    pinepaper_apply_effect: { name: 'ਇਫੈਕਟ ਲਾਗੂ ਕਰੋ', description: '' },
    pinepaper_get_items: { name: 'ਆਈਟਮ ਪ੍ਰਾਪਤ ਕਰੋ', description: '' },
    pinepaper_get_relation_stats: { name: 'ਸੰਬੰਧ ਅੰਕੜੇ', description: '' },
    pinepaper_set_background_color: { name: 'ਬੈਕਗ੍ਰਾਊਂਡ ਰੰਗ ਸੈੱਟ ਕਰੋ', description: '' },
    pinepaper_set_canvas_size: { name: 'ਕੈਨਵਸ ਆਕਾਰ ਸੈੱਟ ਕਰੋ', description: '' },
    pinepaper_export_svg: { name: 'SVG ਐਕਸਪੋਰਟ ਕਰੋ', description: '' },
    pinepaper_export_training_data: { name: 'ਸਿਖਲਾਈ ਡਾਟਾ ਐਕਸਪੋਰਟ ਕਰੋ', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'ਡਾਇਆਗ੍ਰਾਮ ਆਕਾਰ ਬਣਾਓ', description: '' },
    pinepaper_connect: { name: 'ਆਈਟਮਾਂ ਨੂੰ ਜੋੜੋ', description: '' },
    pinepaper_connect_ports: { name: 'ਪੋਰਟ ਜੋੜੋ', description: '' },
    pinepaper_add_ports: { name: 'ਪੋਰਟ ਸ਼ਾਮਲ ਕਰੋ', description: '' },
    pinepaper_auto_layout: { name: 'ਆਟੋ ਲੇਆਉਟ', description: '' },
    pinepaper_get_diagram_shapes: { name: 'ਡਾਇਆਗ੍ਰਾਮ ਆਕਾਰ ਪ੍ਰਾਪਤ ਕਰੋ', description: '' },
    pinepaper_update_connector: { name: 'ਕਨੈਕਟਰ ਅੱਪਡੇਟ ਕਰੋ', description: '' },
    pinepaper_remove_connector: { name: 'ਕਨੈਕਟਰ ਹਟਾਓ', description: '' },
    pinepaper_diagram_mode: { name: 'ਡਾਇਆਗ੍ਰਾਮ ਮੋਡ', description: '' },
  },

  errors: {
    itemNotFound: 'ਆਈਟਮ ਨਹੀਂ ਮਿਲੀ: {{itemId}}',
    invalidRelation: 'ਅਵੈਧ ਸੰਬੰਧ: {{relationType}}',
    invalidParams: 'ਅਵੈਧ ਪੈਰਾਮੀਟਰ: {{details}}',
    generatorNotFound: 'ਜਨਰੇਟਰ ਨਹੀਂ ਮਿਲਿਆ: {{generatorName}}',
    exportFailed: 'ਐਕਸਪੋਰਟ ਅਸਫਲ: {{reason}}',
    executionError: 'ਐਗਜ਼ੀਕਿਊਸ਼ਨ ਗਲਤੀ: {{message}}',
    validationError: 'ਪ੍ਰਮਾਣਿਕਤਾ ਗਲਤੀ: {{message}}',
    unknownTool: 'ਅਣਜਾਣ ਟੂਲ: {{toolName}}',
    apiKeyRequired: 'API ਕੁੰਜੀ ਲੋੜੀਂਦੀ ਹੈ',
    apiKeyInvalid: 'ਅਵੈਧ API ਕੁੰਜੀ',
    apiKeyExpired: 'API ਕੁੰਜੀ ਦੀ ਮਿਆਦ ਖਤਮ ਹੋ ਗਈ',
    rateLimitExceeded: 'ਬੇਨਤੀ ਸੀਮਾ ਪਾਰ ਹੋ ਗਈ। {{seconds}} ਸਕਿੰਟਾਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },

  success: {
    itemCreated: '{{itemType}} ਸਥਿਤੀ ({{x}}, {{y}}) ਤੇ ਬਣਾਇਆ ਗਿਆ',
    itemModified: 'ਆਈਟਮ {{itemId}} ਸੋਧੀ ਗਈ',
    itemDeleted: 'ਆਈਟਮ {{itemId}} ਮਿਟਾਈ ਗਈ',
    relationAdded: '{{relationType}} ਸੰਬੰਧ ਜੋੜਿਆ ਗਿਆ: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} ਅਤੇ {{targetId}} ਵਿਚਕਾਰ ਸੰਬੰਧ ਹਟਾਇਆ ਗਿਆ',
    animationApplied: '{{itemId}} ਤੇ {{animationType}} ਐਨੀਮੇਸ਼ਨ ਲਾਗੂ ਕੀਤੀ ਗਈ',
    generatorExecuted: '{{generatorName}} ਜਨਰੇਟਰ ਚਲਾਇਆ ਗਿਆ',
    effectApplied: '{{itemId}} ਤੇ {{effectType}} ਇਫੈਕਟ ਲਾਗੂ ਕੀਤਾ ਗਿਆ',
    backgroundSet: 'ਬੈਕਗ੍ਰਾਊਂਡ ਰੰਗ {{color}} ਤੇ ਸੈੱਟ ਕੀਤਾ ਗਿਆ',
    canvasSizeSet: 'ਕੈਨਵਸ ਆਕਾਰ {{width}}×{{height}} ਤੇ ਸੈੱਟ ਕੀਤਾ ਗਿਆ',
    exported: '{{format}} ਸਫਲਤਾਪੂਰਵਕ ਐਕਸਪੋਰਟ ਕੀਤਾ ਗਿਆ',
  },

  itemTypes: {
    text: 'ਟੈਕਸਟ',
    circle: 'ਚੱਕਰ',
    star: 'ਤਾਰਾ',
    rectangle: 'ਆਇਤ',
    triangle: 'ਤਿਕੋਣ',
    polygon: 'ਬਹੁਭੁਜ',
    ellipse: 'ਅੰਡਾਕਾਰ',
    path: 'ਮਾਰਗ',
    line: 'ਲਾਈਨ',
    arc: 'ਚਾਪ',
  },

  relationTypes: {
    orbits: 'ਚੱਕਰ',
    follows: 'ਅਨੁਸਰਣ',
    attached_to: 'ਜੁੜਿਆ',
    maintains_distance: 'ਦੂਰੀ ਬਣਾਈ ਰੱਖਦਾ',
    points_at: 'ਇਸ਼ਾਰਾ ਕਰਦਾ',
    mirrors: 'ਪ੍ਰਤੀਬਿੰਬ',
    parallax: 'ਪੈਰਾਲੈਕਸ',
    bounds_to: 'ਸੀਮਤ',
  },

  animationTypes: {
    pulse: 'ਧੜਕਣ',
    rotate: 'ਘੁੰਮਣਾ',
    bounce: 'ਉਛਾਲ',
    fade: 'ਫਿੱਕਾ',
    wobble: 'ਡੋਲਣਾ',
    slide: 'ਸਲਾਈਡ',
    typewriter: 'ਟਾਈਪਰਾਈਟਰ',
  },

  generators: {
    drawSunburst: 'ਸੂਰਜ ਦੀਆਂ ਕਿਰਨਾਂ',
    drawSunsetScene: 'ਸੂਰਜ ਡੁੱਬਣ ਦਾ ਦ੍ਰਿਸ਼',
    drawGrid: 'ਗਰਿੱਡ',
    drawStackedCircles: 'ਸਟੈਕਡ ਚੱਕਰ',
    drawCircuit: 'ਸਰਕਟ ਬੋਰਡ',
    drawWaves: 'ਲਹਿਰਾਂ',
    drawPattern: 'ਪੈਟਰਨ',
  },

  common: {
    at: 'ਤੇ',
    with: 'ਨਾਲ',
    to: 'ਨੂੰ',
    from: 'ਤੋਂ',
    position: 'ਸਥਿਤੀ',
    radius: 'ਰੇਡੀਅਸ',
    color: 'ਰੰਗ',
    speed: 'ਗਤੀ',
    duration: 'ਅਵਧੀ',
  },
});

export default pa;
