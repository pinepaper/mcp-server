/**
 * Turkish Translations
 */

import { createBaseTranslation } from './base.js';

export const tr = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Öğe Oluştur', description: '' },
    pinepaper_modify_item: { name: 'Öğe Değiştir', description: '' },
    pinepaper_delete_item: { name: 'Öğe Sil', description: '' },
    pinepaper_add_relation: { name: 'İlişki Ekle', description: '' },
    pinepaper_remove_relation: { name: 'İlişki Kaldır', description: '' },
    pinepaper_query_relations: { name: 'İlişkileri Sorgula', description: '' },
    pinepaper_animate: { name: 'Animasyon', description: '' },
    pinepaper_keyframe_animate: { name: 'Kare Animasyonu', description: '' },
    pinepaper_play_timeline: { name: 'Zaman Çizelgesi Oynat', description: '' },
    pinepaper_execute_generator: { name: 'Oluşturucu Çalıştır', description: '' },
    pinepaper_list_generators: { name: 'Oluşturucu Listesi', description: '' },
    pinepaper_apply_effect: { name: 'Efekt Uygula', description: '' },
    pinepaper_get_items: { name: 'Öğeleri Al', description: '' },
    pinepaper_get_relation_stats: { name: 'İlişki İstatistikleri', description: '' },
    pinepaper_set_background_color: { name: 'Arka Plan Rengi Ayarla', description: '' },
    pinepaper_set_canvas_size: { name: 'Tuval Boyutu Ayarla', description: '' },
    pinepaper_export_svg: { name: 'SVG Dışa Aktar', description: '' },
    pinepaper_export_training_data: { name: 'Eğitim Verisi Dışa Aktar', description: '' },
  },

  errors: {
    itemNotFound: 'Öğe bulunamadı: {{itemId}}',
    invalidRelation: 'Geçersiz ilişki: {{relationType}}',
    invalidParams: 'Geçersiz parametreler: {{details}}',
    generatorNotFound: 'Oluşturucu bulunamadı: {{generatorName}}',
    exportFailed: 'Dışa aktarma başarısız: {{reason}}',
    executionError: 'Yürütme hatası: {{message}}',
    validationError: 'Doğrulama hatası: {{message}}',
    unknownTool: 'Bilinmeyen araç: {{toolName}}',
    apiKeyRequired: 'API anahtarı gerekli',
    apiKeyInvalid: 'Geçersiz API anahtarı',
    apiKeyExpired: 'API anahtarı süresi dolmuş',
    rateLimitExceeded: 'İstek sınırı aşıldı. {{seconds}} saniye sonra tekrar deneyin.',
  },

  success: {
    itemCreated: '{{itemType}} ({{x}}, {{y}}) konumunda oluşturuldu',
    itemModified: 'Öğe {{itemId}} değiştirildi',
    itemDeleted: 'Öğe {{itemId}} silindi',
    relationAdded: '{{relationType}} ilişkisi eklendi: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} ve {{targetId}} arasındaki ilişki kaldırıldı',
    animationApplied: '{{itemId}} üzerine {{animationType}} animasyonu uygulandı',
    generatorExecuted: '{{generatorName}} oluşturucusu çalıştırıldı',
    effectApplied: '{{itemId}} üzerine {{effectType}} efekti uygulandı',
    backgroundSet: 'Arka plan rengi {{color}} olarak ayarlandı',
    canvasSizeSet: 'Tuval boyutu {{width}}×{{height}} olarak ayarlandı',
    exported: '{{format}} başarıyla dışa aktarıldı',
  },

  itemTypes: {
    text: 'Metin',
    circle: 'Daire',
    star: 'Yıldız',
    rectangle: 'Dikdörtgen',
    triangle: 'Üçgen',
    polygon: 'Çokgen',
    ellipse: 'Elips',
    path: 'Yol',
    line: 'Çizgi',
    arc: 'Yay',
  },

  relationTypes: {
    orbits: 'Yörünge',
    follows: 'Takip eder',
    attached_to: 'Bağlı',
    maintains_distance: 'Mesafe korur',
    points_at: 'İşaret eder',
    mirrors: 'Yansıtır',
    parallax: 'Paralaks',
    bounds_to: 'Sınırlı',
  },

  animationTypes: {
    pulse: 'Nabız',
    rotate: 'Döndür',
    bounce: 'Zıpla',
    fade: 'Solma',
    wobble: 'Sallanma',
    slide: 'Kayma',
    typewriter: 'Daktilo',
  },

  generators: {
    drawSunburst: 'Güneş Işınları',
    drawSunsetScene: 'Gün Batımı Sahnesi',
    drawGrid: 'Izgara',
    drawStackedCircles: 'Yığılmış Daireler',
    drawCircuit: 'Devre Kartı',
    drawWaves: 'Dalgalar',
    drawPattern: 'Desen',
  },

  common: {
    at: 'de',
    with: 'ile',
    to: 'e',
    from: 'den',
    position: 'konum',
    radius: 'yarıçap',
    color: 'renk',
    speed: 'hız',
    duration: 'süre',
  },
});

export default tr;
