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
    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Diyagram şekli oluştur',
      description: `Tuval üzerinde diyagram şekli oluşturur. Diyagram şekilleri, akış şemaları, UML diyagramları, ağ diyagramları ve benzeri teknik çizimler için özelleştirilmiş şekillerdir.

NE ZAMAN KULLANILIR:
- Akış şemaları, süreç diyagramları veya iş akışları oluştururken
- UML sınıf diyagramları, kullanım durumu diyagramları veya sıralı diyagramlar tasarlarken
- Ağ topolojisi diyagramları çizerken
- Organizasyon şemaları veya karar ağaçları yaparken

ŞEKİL TÜRLERİ:
- Akış şeması: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Ağ: cloud, server
- Temel: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Öğeleri bağla',
      description: `İki öğeyi akıllı bağlayıcı ile bağlar. Bu, diyagram şekilleri arasında çizgi/ok çizmenin birincil yoludur.

NE ZAMAN KULLANILIR:
- Akış şeması adımları arasında oklar çizerken
- UML sınıflarını ilişkilerle bağlarken
- Düğümler arasında ağ bağlantıları oluştururken
- Öğeler arasında çizgi/ok gerektiren herhangi bir diyagramda

YÖNLENDIRME TÜRLERİ:
- orthogonal: Sadece dik açılı dönüşler (varsayılan)
- direct: Noktalar arasında düz çizgi
- curved: Ayarlanabilir eğrilikli Bezier eğrisi`,
    },
    pinepaper_connect_ports: {
      name: 'Portları bağla',
      description: `Öğeler üzerindeki belirli portları bağlar. Bağlayıcının hangi portlara takılacağı konusunda hassas kontrol gerektiğinde kullanın.

NE ZAMAN KULLANILIR:
- Bağlayıcının şeklin belirli bir tarafına takılması gerektiğinde
- Otomatik port seçiminin ideal olmadığı karmaşık diyagramlar oluştururken
- Belirli giriş/çıkış noktalarına sahip devre benzeri diyagramlar tasarlarken`,
    },
    pinepaper_add_ports: {
      name: 'Port ekle',
      description: `Mevcut bir öğeye bağlantı portları ekler. Portlar, bağlayıcıların tutunabileceği bağlantı noktalarıdır.

NE ZAMAN KULLANILIR:
- Şekillere özel port konumları eklerken
- Portu olmayan öğelerde bağlantıları etkinleştirirken
- Karmaşık diyagramlar için özelleştirilmiş bağlantı noktaları oluştururken`,
    },
    pinepaper_auto_layout: {
      name: 'Otomatik düzen',
      description: `Diyagram öğelerini bir düzen algoritması kullanarak otomatik olarak düzenler. Bu, öğeleri daha temiz, daha okunabilir diyagramlar için yeniden organize eder.

NE ZAMAN KULLANILIR:
- Diyagram öğeleri dağınık veya üst üste bindiğinde
- Otomatik olarak profesyonel görünümlü düzen oluşturmak istediğinizde
- Birçok öğe ekledikten sonra onları organize etmek gerektiğinde

DÜZEN TÜRLERİ:
- hierarchical: Akış şemaları, organizasyon şemaları için en iyisi
- force-directed: Ağ diyagramları için en iyisi
- tree: Hiyerarşiler için en iyisi
- radial: Zihin haritaları için en iyisi
- grid: Eşit önem taşıyan öğeler için en iyisi`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Diyagram şekillerini al',
      description: `Kullanılabilir diyagram şekillerinin listesini özellikleriyle birlikte alır.

NE ZAMAN KULLANILIR:
- Hangi diyagram şekillerinin mevcut olduğunu görmek gerektiğinde
- Şekiller için varsayılan boyutları ve stilleri öğrenmek istediğinizde
- Şekil seçeneklerini gösteren dinamik kullanıcı arayüzü oluştururken`,
    },
    pinepaper_update_connector: {
      name: 'Bağlayıcıyı güncelle',
      description: `Mevcut bir bağlayıcının stilini veya etiketini günceller.

NE ZAMAN KULLANILIR:
- Oluşturulduktan sonra bağlayıcı görünümünü değiştirirken
- Bağlayıcı etiketlerini güncellerken
- Ok stillerini veya renklerini değiştirirken`,
    },
    pinepaper_remove_connector: {
      name: 'Bağlayıcıyı kaldır',
      description: `Bir bağlayıcıyı tuvalden kaldırır.

NE ZAMAN KULLANILIR:
- Öğeler arasındaki bağlantıyı silerken
- Yanlış bağlantıları kaldırırken
- Diyagram bağlantılarını yeniden yapılandırırken`,
    },
    pinepaper_diagram_mode: {
      name: 'Diyagram modu',
      description: `Etkileşimli düzenleme için diyagram modunu kontrol eder.

NE ZAMAN KULLANILIR:
- Çizim ve seçim modları arasında geçiş yaparken
- Diyagrama özgü kullanıcı arayüzünü etkinleştirirken/devre dışı bırakırken
- Tuvali diyagram oluşturma için hazırlarken

AKSİYONLAR:
- activate: Diyagram modunu etkinleştir
- deactivate: Normal tuval moduna geri dön
- toggle: Modlar arasında geçiş yap
- setMode: Belirli araç modunu ayarla`,
    },
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
