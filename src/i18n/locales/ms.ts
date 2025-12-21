/**
 * Malay Translations
 */

import { createBaseTranslation } from './base.js';

export const ms = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Cipta Item', description: '' },
    pinepaper_modify_item: { name: 'Ubah Item', description: '' },
    pinepaper_delete_item: { name: 'Padam Item', description: '' },
    pinepaper_add_relation: { name: 'Tambah Hubungan', description: '' },
    pinepaper_remove_relation: { name: 'Buang Hubungan', description: '' },
    pinepaper_query_relations: { name: 'Pertanyaan Hubungan', description: '' },
    pinepaper_animate: { name: 'Animasi', description: '' },
    pinepaper_keyframe_animate: { name: 'Animasi Bingkai Kunci', description: '' },
    pinepaper_play_timeline: { name: 'Main Garis Masa', description: '' },
    pinepaper_execute_generator: { name: 'Jalankan Penjana', description: '' },
    pinepaper_list_generators: { name: 'Senarai Penjana', description: '' },
    pinepaper_apply_effect: { name: 'Gunakan Kesan', description: '' },
    pinepaper_get_items: { name: 'Dapatkan Item', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistik Hubungan', description: '' },
    pinepaper_set_background_color: { name: 'Tetapkan Warna Latar', description: '' },
    pinepaper_set_canvas_size: { name: 'Tetapkan Saiz Kanvas', description: '' },
    pinepaper_export_svg: { name: 'Eksport SVG', description: '' },
    pinepaper_export_training_data: { name: 'Eksport Data Latihan', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Cipta bentuk rajah', description: '' },
    pinepaper_connect: { name: 'Sambung item', description: '' },
    pinepaper_connect_ports: { name: 'Sambung port', description: '' },
    pinepaper_add_ports: { name: 'Tambah port', description: '' },
    pinepaper_auto_layout: { name: 'Susun atur automatik', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Dapatkan bentuk rajah', description: '' },
    pinepaper_update_connector: { name: 'Kemas kini penyambung', description: '' },
    pinepaper_remove_connector: { name: 'Buang penyambung', description: '' },
    pinepaper_diagram_mode: { name: 'Mod rajah', description: '' },
  },

  errors: {
    itemNotFound: 'Item tidak dijumpai: {{itemId}}',
    invalidRelation: 'Hubungan tidak sah: {{relationType}}',
    invalidParams: 'Parameter tidak sah: {{details}}',
    generatorNotFound: 'Penjana tidak dijumpai: {{generatorName}}',
    exportFailed: 'Eksport gagal: {{reason}}',
    executionError: 'Ralat pelaksanaan: {{message}}',
    validationError: 'Ralat pengesahan: {{message}}',
    unknownTool: 'Alat tidak diketahui: {{toolName}}',
    apiKeyRequired: 'Kunci API diperlukan',
    apiKeyInvalid: 'Kunci API tidak sah',
    apiKeyExpired: 'Kunci API telah tamat tempoh',
    rateLimitExceeded: 'Had permintaan melebihi. Cuba lagi dalam {{seconds}} saat.',
  },

  success: {
    itemCreated: '{{itemType}} dicipta di kedudukan ({{x}}, {{y}})',
    itemModified: 'Item {{itemId}} diubah',
    itemDeleted: 'Item {{itemId}} dipadam',
    relationAdded: 'Hubungan {{relationType}} ditambah: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Hubungan dibuang antara {{sourceId}} dan {{targetId}}',
    animationApplied: 'Animasi {{animationType}} digunakan pada {{itemId}}',
    generatorExecuted: 'Penjana {{generatorName}} dijalankan',
    effectApplied: 'Kesan {{effectType}} digunakan pada {{itemId}}',
    backgroundSet: 'Warna latar ditetapkan kepada {{color}}',
    canvasSizeSet: 'Saiz kanvas ditetapkan kepada {{width}}×{{height}}',
    exported: '{{format}} berjaya dieksport',
  },

  itemTypes: {
    text: 'Teks',
    circle: 'Bulatan',
    star: 'Bintang',
    rectangle: 'Segi Empat',
    triangle: 'Segi Tiga',
    polygon: 'Poligon',
    ellipse: 'Elips',
    path: 'Laluan',
    line: 'Garisan',
    arc: 'Lengkok',
  },

  relationTypes: {
    orbits: 'Mengorbit',
    follows: 'Mengikut',
    attached_to: 'Dilekatkan pada',
    maintains_distance: 'Mengekalkan jarak',
    points_at: 'Menunjuk ke',
    mirrors: 'Mencermin',
    parallax: 'Paralaks',
    bounds_to: 'Terhad kepada',
  },

  animationTypes: {
    pulse: 'Denyutan',
    rotate: 'Putar',
    bounce: 'Lantunan',
    fade: 'Pudar',
    wobble: 'Goyang',
    slide: 'Gelongsor',
    typewriter: 'Mesin taip',
  },

  generators: {
    drawSunburst: 'Sinaran Matahari',
    drawSunsetScene: 'Pemandangan Matahari Terbenam',
    drawGrid: 'Grid',
    drawStackedCircles: 'Bulatan Bertindan',
    drawCircuit: 'Papan Litar',
    drawWaves: 'Gelombang',
    drawPattern: 'Corak',
  },

  common: {
    at: 'di',
    with: 'dengan',
    to: 'ke',
    from: 'dari',
    position: 'kedudukan',
    radius: 'jejari',
    color: 'warna',
    speed: 'kelajuan',
    duration: 'tempoh',
  },
});

export default ms;
