/**
 * Indonesian Translations
 */

import { createBaseTranslation } from './base.js';

export const id = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Buat Item', description: '' },
    pinepaper_modify_item: { name: 'Ubah Item', description: '' },
    pinepaper_delete_item: { name: 'Hapus Item', description: '' },
    pinepaper_add_relation: { name: 'Tambah Relasi', description: '' },
    pinepaper_remove_relation: { name: 'Hapus Relasi', description: '' },
    pinepaper_query_relations: { name: 'Kueri Relasi', description: '' },
    pinepaper_animate: { name: 'Animasi', description: '' },
    pinepaper_keyframe_animate: { name: 'Animasi Keyframe', description: '' },
    pinepaper_play_timeline: { name: 'Putar Timeline', description: '' },
    pinepaper_execute_generator: { name: 'Jalankan Generator', description: '' },
    pinepaper_list_generators: { name: 'Daftar Generator', description: '' },
    pinepaper_apply_effect: { name: 'Terapkan Efek', description: '' },
    pinepaper_get_items: { name: 'Ambil Item', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistik Relasi', description: '' },
    pinepaper_set_background_color: { name: 'Atur Warna Latar', description: '' },
    pinepaper_set_canvas_size: { name: 'Atur Ukuran Kanvas', description: '' },
    pinepaper_export_svg: { name: 'Ekspor SVG', description: '' },
    pinepaper_export_training_data: { name: 'Ekspor Data Pelatihan', description: '' },
  },

  errors: {
    itemNotFound: 'Item tidak ditemukan: {{itemId}}',
    invalidRelation: 'Relasi tidak valid: {{relationType}}',
    invalidParams: 'Parameter tidak valid: {{details}}',
    generatorNotFound: 'Generator tidak ditemukan: {{generatorName}}',
    exportFailed: 'Ekspor gagal: {{reason}}',
    executionError: 'Kesalahan eksekusi: {{message}}',
    validationError: 'Kesalahan validasi: {{message}}',
    unknownTool: 'Alat tidak dikenal: {{toolName}}',
    apiKeyRequired: 'Kunci API diperlukan',
    apiKeyInvalid: 'Kunci API tidak valid',
    apiKeyExpired: 'Kunci API kedaluwarsa',
    rateLimitExceeded: 'Batas permintaan terlampaui. Coba lagi dalam {{seconds}} detik.',
  },

  success: {
    itemCreated: '{{itemType}} dibuat di posisi ({{x}}, {{y}})',
    itemModified: 'Item {{itemId}} diubah',
    itemDeleted: 'Item {{itemId}} dihapus',
    relationAdded: 'Relasi {{relationType}} ditambahkan: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relasi dihapus antara {{sourceId}} dan {{targetId}}',
    animationApplied: 'Animasi {{animationType}} diterapkan ke {{itemId}}',
    generatorExecuted: 'Generator {{generatorName}} dijalankan',
    effectApplied: 'Efek {{effectType}} diterapkan ke {{itemId}}',
    backgroundSet: 'Warna latar diatur ke {{color}}',
    canvasSizeSet: 'Ukuran kanvas diatur ke {{width}}×{{height}}',
    exported: '{{format}} berhasil diekspor',
  },

  itemTypes: {
    text: 'Teks',
    circle: 'Lingkaran',
    star: 'Bintang',
    rectangle: 'Persegi Panjang',
    triangle: 'Segitiga',
    polygon: 'Poligon',
    ellipse: 'Elips',
    path: 'Jalur',
    line: 'Garis',
    arc: 'Busur',
  },

  relationTypes: {
    orbits: 'Mengorbit',
    follows: 'Mengikuti',
    attached_to: 'Melekat pada',
    maintains_distance: 'Menjaga jarak',
    points_at: 'Menunjuk ke',
    mirrors: 'Mencerminkan',
    parallax: 'Paralaks',
    bounds_to: 'Terbatas pada',
  },

  animationTypes: {
    pulse: 'Denyut',
    rotate: 'Putar',
    bounce: 'Pantulan',
    fade: 'Pudar',
    wobble: 'Goyangan',
    slide: 'Geser',
    typewriter: 'Mesin ketik',
  },

  generators: {
    drawSunburst: 'Sinar Matahari',
    drawSunsetScene: 'Pemandangan Matahari Terbenam',
    drawGrid: 'Kisi',
    drawStackedCircles: 'Lingkaran Bertumpuk',
    drawCircuit: 'Papan Sirkuit',
    drawWaves: 'Gelombang',
    drawPattern: 'Pola',
  },

  common: {
    at: 'di',
    with: 'dengan',
    to: 'ke',
    from: 'dari',
    position: 'posisi',
    radius: 'radius',
    color: 'warna',
    speed: 'kecepatan',
    duration: 'durasi',
  },
});

export default id;
