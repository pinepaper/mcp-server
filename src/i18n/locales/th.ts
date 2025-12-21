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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'สร้างรูปร่างไดอะแกรม',
      description: `สร้างรูปร่างไดอะแกรมบนแคนวาส รูปร่างไดอะแกรมเป็นรูปร่างพิเศษสำหรับผังงาน UML ไดอะแกรมเครือข่าย และแผนภาพทางเทคนิค

ใช้เมื่อ:
- สร้างผังงาน แผนผังกระบวนการ หรือเวิร์กโฟลว์
- สร้าง UML class diagrams, use case diagrams, sequence diagrams
- ออกแบบไดอะแกรมโครงสร้างเครือข่าย
- ทำแผนผังองค์กรหรือต้นไม้การตัดสินใจ

ประเภทรูปร่าง:
- Flowchart: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Network: cloud, server
- Basic: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'เชื่อมต่อรายการ',
      description: `เชื่อมต่อสองรายการด้วยตัวเชื่อมต่ออัจฉริยะ วิธีหลักในการวดเส้น/ลูกศรระหว่างรูปร่างไดอะแกรม

ใช้เมื่อ:
- วาดลูกศรระหว่างขั้นตอนในผังงาน
- เชื่อมต่อ UML classes ด้วย associations
- สร้างการเชื่อมต่อเครือข่ายระหว่าง nodes
- ไดอะแกรมใดๆ ที่ต้องการเส้น/ลูกศรระหว่างองค์ประกอบ

ประเภทการเดินเส้น:
- orthogonal: เลี้ยวมุมฉากเท่านั้น (ค่าเริ่มต้น)
- direct: เส้นตรงระหว่างจุด
- curved: เส้นโค้ง Bezier ปรับความโค้งได้`,
    },
    pinepaper_connect_ports: {
      name: 'เชื่อมต่อพอร์ต',
      description: `เชื่อมต่อพอร์ตเฉพาะบนรายการ ใช้เมื่อต้องการควบคุมอย่างแม่นยำว่าตัวเชื่อมต่อติดกับพอร์ตใด

ใช้เมื่อ:
- ต้องการให้ตัวเชื่อมต่อติดกับด้านเฉพาะของรูปร่าง
- สร้างไดอะแกรมซับซ้อนที่การเลือกพอร์ตอัตโนมัติไม่เหมาะสม
- สร้างไดอะแกรมคล้ายวงจรที่มีจุดเข้า/ออกเฉพาะ`,
    },
    pinepaper_add_ports: {
      name: 'เพิ่มพอร์ต',
      description: `เพิ่มพอร์ตการเชื่อมต่อให้กับรายการที่มีอยู่ พอร์ตคือจุดยึดที่ตัวเชื่อมต่อสามารถติดได้

ใช้เมื่อ:
- เพิ่มตำแหน่งพอร์ตแบบกำหนดเองให้กับรูปร่าง
- เปิดใช้งานการเชื่อมต่อบนรายการที่ไม่มีพอร์ต
- สร้างจุดเชื่อมต่อพิเศษสำหรับไดอะแกรมซับซ้อน`,
    },
    pinepaper_auto_layout: {
      name: 'จัดวางอัตโนมัติ',
      description: `จัดเรียงรายการไดอะแกรมโดยอัตโนมัติโดยใช้อัลกอริทึมการจัดวาง จัดระเบียบรายการใหม่เพื่อไดอะแกรมที่สะอาดและอ่านง่ายขึ้น

ใช้เมื่อ:
- รายการไดอะแกรมยุ่งเหยิงหรือทับซ้อนกัน
- ต้องการสร้างเลย์เอาต์แบบมืออาชีพโดยอัตโนมัติ
- หลังจากเพิ่มรายการหลายรายการ ต้องการจัดระเบียบ

ประเภทเลย์เอาต์:
- hierarchical: เหมาะสำหรับผังงาน แผนผังองค์กร
- force-directed: เหมาะสำหรับไดอะแกรมเครือข่าย
- tree: เหมาะสำหรับลำดับชั้น
- radial: เหมาะสำหรับ mind maps
- grid: เหมาะสำหรับรายการที่มีความสำคัญเท่ากัน`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'รับรูปร่างไดอะแกรม',
      description: `รับรายการรูปร่างไดอะแกรมที่มีพร้อมคุณสมบัติ

ใช้เมื่อ:
- ต้องการดูว่ามีรูปร่างไดอะแกรมอะไรบ้าง
- ต้องการทราบขนาดและสไตล์เริ่มต้นของรูปร่าง
- สร้าง UI แบบไดนามิกที่แสดงตัวเลือกรูปร่าง`,
    },
    pinepaper_update_connector: {
      name: 'อัปเดตตัวเชื่อมต่อ',
      description: `อัปเดตสไตล์หรือป้ายกำกับของตัวเชื่อมต่อที่มีอยู่

ใช้เมื่อ:
- เปลี่ยนรูปลักษณ์ตัวเชื่อมต่อหลังจากสร้างแล้ว
- อัปเดตป้ายกำกับตัวเชื่อมต่อ
- เปลี่ยนสไตล์ลูกศรหรือสี`,
    },
    pinepaper_remove_connector: {
      name: 'ลบตัวเชื่อมต่อ',
      description: `ลบตัวเชื่อมต่อออกจากแคนวาส

ใช้เมื่อ:
- ลบการเชื่อมต่อระหว่างรายการ
- ลบลิงก์ที่ไม่ถูกต้อง
- ปรับโครงสร้างการเชื่อมต่อไดอะแกรมใหม่`,
    },
    pinepaper_diagram_mode: {
      name: 'โหมดไดอะแกรม',
      description: `ควบคุมโหมดไดอะแกรมสำหรับการแก้ไขแบบโต้ตอบ

ใช้เมื่อ:
- สลับระหว่างโหมดการวาดและการเลือก
- เปิด/ปิด UI เฉพาะไดอะแกรม
- ตั้งค่าแคนวาสสำหรับสร้างไดอะแกรม

การกระทำ:
- activate: เปิดใช้งานโหมดไดอะแกรม
- deactivate: กลับสู่โหมดแคนวาสปกติ
- toggle: สลับระหว่างโหมด
- setMode: ตั้งค่าโหมดเครื่องมือเฉพาะ`,
    },
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
