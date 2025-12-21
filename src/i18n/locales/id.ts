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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Buat bentuk diagram',
      description: `Buat bentuk diagram di kanvas. Bentuk diagram adalah bentuk khusus untuk flowchart, diagram UML, diagram jaringan, dan gambar teknis serupa.

GUNAKAN SAAT:
- Membuat flowchart, diagram proses, atau alur kerja
- Membangun diagram kelas UML, diagram use case, atau diagram sequence
- Merancang diagram topologi jaringan
- Membuat bagan organisasi atau pohon keputusan

TIPE BENTUK:
- Flowchart: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Network: cloud, server
- Basic: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Hubungkan item',
      description: `Hubungkan dua item dengan konektor pintar. Ini adalah cara utama untuk menggambar garis/panah antara bentuk diagram.

GUNAKAN SAAT:
- Menggambar panah antara langkah-langkah flowchart
- Menghubungkan kelas UML dengan asosiasi
- Membuat koneksi jaringan antara node
- Diagram apa pun yang memerlukan garis/panah antara elemen

TIPE ROUTING:
- orthogonal: Hanya belokan sudut siku-siku (default)
- direct: Garis lurus antara titik
- curved: Kurva Bezier dengan kelengkungan yang dapat disesuaikan`,
    },
    pinepaper_connect_ports: {
      name: 'Hubungkan port',
      description: `Hubungkan dua port spesifik pada item. Gunakan ini saat Anda memerlukan kontrol presisi atas port mana yang dilekatkan konektor.

GUNAKAN SAAT:
- Perlu konektor dilampirkan ke sisi tertentu dari bentuk
- Membuat diagram kompleks di mana pemilihan port otomatis tidak ideal
- Membangun diagram seperti sirkuit dengan titik masuk/keluar tertentu`,
    },
    pinepaper_add_ports: {
      name: 'Tambah port',
      description: `Tambahkan port koneksi ke item yang ada. Port adalah titik jangkar di mana konektor dapat dilampirkan.

GUNAKAN SAAT:
- Menambahkan posisi port khusus ke bentuk
- Mengaktifkan koneksi pada item yang tidak memiliki port
- Membuat titik koneksi khusus untuk diagram kompleks`,
    },
    pinepaper_auto_layout: {
      name: 'Tata letak otomatis',
      description: `Susun item diagram secara otomatis menggunakan algoritma tata letak. Ini mengatur ulang item untuk diagram yang lebih bersih dan mudah dibaca.

GUNAKAN SAAT:
- Item diagram berantakan atau tumpang tindih
- Ingin membuat tata letak yang terlihat profesional secara otomatis
- Setelah menambahkan banyak item, perlu mengorganisirnya

TIPE TATA LETAK:
- hierarchical: Terbaik untuk flowchart, bagan organisasi
- force-directed: Terbaik untuk diagram jaringan
- tree: Terbaik untuk hierarki
- radial: Terbaik untuk peta pikiran
- grid: Terbaik untuk item dengan kepentingan yang sama`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Dapatkan bentuk diagram',
      description: `Dapatkan daftar bentuk diagram yang tersedia dengan propertinya.

GUNAKAN SAAT:
- Perlu melihat bentuk diagram apa yang tersedia
- Ingin mengetahui ukuran dan gaya default untuk bentuk
- Membangun UI dinamis yang menampilkan opsi bentuk`,
    },
    pinepaper_update_connector: {
      name: 'Perbarui konektor',
      description: `Perbarui gaya atau label konektor yang ada.

GUNAKAN SAAT:
- Mengubah tampilan konektor setelah pembuatan
- Memperbarui label konektor
- Mengubah gaya panah atau warna`,
    },
    pinepaper_remove_connector: {
      name: 'Hapus konektor',
      description: `Hapus konektor dari kanvas.

GUNAKAN SAAT:
- Menghapus koneksi antara item
- Menghapus tautan yang salah
- Merestrukturisasi koneksi diagram`,
    },
    pinepaper_diagram_mode: {
      name: 'Mode diagram',
      description: `Kontrol mode diagram untuk pengeditan interaktif.

GUNAKAN SAAT:
- Beralih antara mode menggambar dan seleksi
- Mengaktifkan/menonaktifkan UI khusus diagram
- Menyiapkan kanvas untuk pembuatan diagram

AKSI:
- activate: Aktifkan mode diagram
- deactivate: Kembali ke mode kanvas normal
- toggle: Beralih antara mode
- setMode: Atur mode alat tertentu`,
    },
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
