/**
 * Thai Translations
 */

import { createBaseTranslation } from './base.js';

export const th = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'สร้างรายการ', description: '' },
    pinepaper_modify_item: { name: 'แก้ไขรายการ', description: '' },
    pinepaper_delete_item: { name: 'ลบรายการ', description: '' },
    pinepaper_add_relation: { name: 'เพิ่มความสัมพันธ์', description: '' },
    pinepaper_remove_relation: { name: 'ลบความสัมพันธ์', description: '' },
    pinepaper_query_relations: { name: 'สอบถามความสัมพันธ์', description: '' },
    pinepaper_animate: { name: 'แอนิเมชัน', description: '' },
    pinepaper_keyframe_animate: { name: 'แอนิเมชันคีย์เฟรม', description: '' },
    pinepaper_play_timeline: { name: 'เล่นไทม์ไลน์', description: '' },
    pinepaper_execute_generator: { name: 'รันเจเนอเรเตอร์', description: '' },
    pinepaper_list_generators: { name: 'รายการเจเนอเรเตอร์', description: '' },
    pinepaper_apply_effect: { name: 'ใช้เอฟเฟกต์', description: '' },
    pinepaper_get_items: { name: 'ดึงรายการ', description: '' },
    pinepaper_get_relation_stats: { name: 'สถิติความสัมพันธ์', description: '' },
    pinepaper_set_background_color: { name: 'ตั้งสีพื้นหลัง', description: '' },
    pinepaper_set_canvas_size: { name: 'ตั้งขนาดแคนวาส', description: '' },
    pinepaper_export_svg: { name: 'ส่งออก SVG', description: '' },
    pinepaper_export_training_data: { name: 'ส่งออกข้อมูลฝึกอบรม', description: '' },
  },

  errors: {
    itemNotFound: 'ไม่พบรายการ: {{itemId}}',
    invalidRelation: 'ความสัมพันธ์ไม่ถูกต้อง: {{relationType}}',
    invalidParams: 'พารามิเตอร์ไม่ถูกต้อง: {{details}}',
    generatorNotFound: 'ไม่พบเจเนอเรเตอร์: {{generatorName}}',
    exportFailed: 'การส่งออกล้มเหลว: {{reason}}',
    executionError: 'ข้อผิดพลาดในการดำเนินการ: {{message}}',
    validationError: 'ข้อผิดพลาดในการตรวจสอบ: {{message}}',
    unknownTool: 'เครื่องมือที่ไม่รู้จัก: {{toolName}}',
    apiKeyRequired: 'ต้องการคีย์ API',
    apiKeyInvalid: 'คีย์ API ไม่ถูกต้อง',
    apiKeyExpired: 'คีย์ API หมดอายุ',
    rateLimitExceeded: 'เกินขีดจำกัดคำขอ ลองอีกครั้งใน {{seconds}} วินาที',
  },

  success: {
    itemCreated: 'สร้าง {{itemType}} ที่ตำแหน่ง ({{x}}, {{y}})',
    itemModified: 'แก้ไขรายการ {{itemId}} แล้ว',
    itemDeleted: 'ลบรายการ {{itemId}} แล้ว',
    relationAdded: 'เพิ่มความสัมพันธ์ {{relationType}}: {{sourceId}} → {{targetId}}',
    relationRemoved: 'ลบความสัมพันธ์ระหว่าง {{sourceId}} และ {{targetId}}',
    animationApplied: 'ใช้แอนิเมชัน {{animationType}} กับ {{itemId}}',
    generatorExecuted: 'รันเจเนอเรเตอร์ {{generatorName}} แล้ว',
    effectApplied: 'ใช้เอฟเฟกต์ {{effectType}} กับ {{itemId}}',
    backgroundSet: 'ตั้งสีพื้นหลังเป็น {{color}}',
    canvasSizeSet: 'ตั้งขนาดแคนวาสเป็น {{width}}×{{height}}',
    exported: 'ส่งออก {{format}} สำเร็จ',
  },

  itemTypes: {
    text: 'ข้อความ',
    circle: 'วงกลม',
    star: 'ดาว',
    rectangle: 'สี่เหลี่ยมผืนผ้า',
    triangle: 'สามเหลี่ยม',
    polygon: 'รูปหลายเหลี่ยม',
    ellipse: 'วงรี',
    path: 'เส้นทาง',
    line: 'เส้น',
    arc: 'ส่วนโค้ง',
  },

  relationTypes: {
    orbits: 'โคจร',
    follows: 'ติดตาม',
    attached_to: 'แนบกับ',
    maintains_distance: 'รักษาระยะห่าง',
    points_at: 'ชี้ไปที่',
    mirrors: 'สะท้อน',
    parallax: 'พารัลแลกซ์',
    bounds_to: 'จำกัดถึง',
  },

  animationTypes: {
    pulse: 'เต้น',
    rotate: 'หมุน',
    bounce: 'กระดอน',
    fade: 'จางหาย',
    wobble: 'โยก',
    slide: 'เลื่อน',
    typewriter: 'พิมพ์ดีด',
  },

  generators: {
    drawSunburst: 'แสงอาทิตย์',
    drawSunsetScene: 'ฉากพระอาทิตย์ตก',
    drawGrid: 'ตาราง',
    drawStackedCircles: 'วงกลมซ้อน',
    drawCircuit: 'แผงวงจร',
    drawWaves: 'คลื่น',
    drawPattern: 'ลวดลาย',
  },

  common: {
    at: 'ที่',
    with: 'กับ',
    to: 'ถึง',
    from: 'จาก',
    position: 'ตำแหน่ง',
    radius: 'รัศมี',
    color: 'สี',
    speed: 'ความเร็ว',
    duration: 'ระยะเวลา',
  },
});

export default th;
