/**
 * Vietnamese Translations
 */

import { createBaseTranslation } from './base.js';

export const vi = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Tạo mục', description: '' },
    pinepaper_modify_item: { name: 'Sửa mục', description: '' },
    pinepaper_delete_item: { name: 'Xóa mục', description: '' },
    pinepaper_add_relation: { name: 'Thêm quan hệ', description: '' },
    pinepaper_remove_relation: { name: 'Xóa quan hệ', description: '' },
    pinepaper_query_relations: { name: 'Truy vấn quan hệ', description: '' },
    pinepaper_animate: { name: 'Hoạt ảnh', description: '' },
    pinepaper_keyframe_animate: { name: 'Hoạt ảnh khung hình chính', description: '' },
    pinepaper_play_timeline: { name: 'Phát dòng thời gian', description: '' },
    pinepaper_execute_generator: { name: 'Chạy bộ tạo', description: '' },
    pinepaper_list_generators: { name: 'Danh sách bộ tạo', description: '' },
    pinepaper_apply_effect: { name: 'Áp dụng hiệu ứng', description: '' },
    pinepaper_get_items: { name: 'Lấy các mục', description: '' },
    pinepaper_get_relation_stats: { name: 'Thống kê quan hệ', description: '' },
    pinepaper_set_background_color: { name: 'Đặt màu nền', description: '' },
    pinepaper_set_canvas_size: { name: 'Đặt kích thước canvas', description: '' },
    pinepaper_export_svg: { name: 'Xuất SVG', description: '' },
    pinepaper_export_training_data: { name: 'Xuất dữ liệu huấn luyện', description: '' },
  },

  errors: {
    itemNotFound: 'Không tìm thấy mục: {{itemId}}',
    invalidRelation: 'Quan hệ không hợp lệ: {{relationType}}',
    invalidParams: 'Tham số không hợp lệ: {{details}}',
    generatorNotFound: 'Không tìm thấy bộ tạo: {{generatorName}}',
    exportFailed: 'Xuất thất bại: {{reason}}',
    executionError: 'Lỗi thực thi: {{message}}',
    validationError: 'Lỗi xác thực: {{message}}',
    unknownTool: 'Công cụ không xác định: {{toolName}}',
    apiKeyRequired: 'Yêu cầu khóa API',
    apiKeyInvalid: 'Khóa API không hợp lệ',
    apiKeyExpired: 'Khóa API đã hết hạn',
    rateLimitExceeded: 'Vượt quá giới hạn yêu cầu. Thử lại sau {{seconds}} giây.',
  },

  success: {
    itemCreated: 'Đã tạo {{itemType}} tại vị trí ({{x}}, {{y}})',
    itemModified: 'Đã sửa mục {{itemId}}',
    itemDeleted: 'Đã xóa mục {{itemId}}',
    relationAdded: 'Đã thêm quan hệ {{relationType}}: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Đã xóa quan hệ giữa {{sourceId}} và {{targetId}}',
    animationApplied: 'Đã áp dụng hoạt ảnh {{animationType}} cho {{itemId}}',
    generatorExecuted: 'Đã chạy bộ tạo {{generatorName}}',
    effectApplied: 'Đã áp dụng hiệu ứng {{effectType}} cho {{itemId}}',
    backgroundSet: 'Đã đặt màu nền thành {{color}}',
    canvasSizeSet: 'Đã đặt kích thước canvas thành {{width}}×{{height}}',
    exported: 'Xuất {{format}} thành công',
  },

  itemTypes: {
    text: 'Văn bản',
    circle: 'Hình tròn',
    star: 'Ngôi sao',
    rectangle: 'Hình chữ nhật',
    triangle: 'Tam giác',
    polygon: 'Đa giác',
    ellipse: 'Elip',
    path: 'Đường dẫn',
    line: 'Đường thẳng',
    arc: 'Cung',
  },

  relationTypes: {
    orbits: 'Quay quanh',
    follows: 'Theo dõi',
    attached_to: 'Gắn với',
    maintains_distance: 'Duy trì khoảng cách',
    points_at: 'Chỉ về',
    mirrors: 'Phản chiếu',
    parallax: 'Thị sai',
    bounds_to: 'Giới hạn đến',
  },

  animationTypes: {
    pulse: 'Nhịp đập',
    rotate: 'Xoay',
    bounce: 'Nảy',
    fade: 'Mờ dần',
    wobble: 'Lắc lư',
    slide: 'Trượt',
    typewriter: 'Máy đánh chữ',
  },

  generators: {
    drawSunburst: 'Tia nắng',
    drawSunsetScene: 'Cảnh hoàng hôn',
    drawGrid: 'Lưới',
    drawStackedCircles: 'Vòng tròn xếp chồng',
    drawCircuit: 'Bảng mạch',
    drawWaves: 'Sóng',
    drawPattern: 'Hoa văn',
  },

  common: {
    at: 'tại',
    with: 'với',
    to: 'đến',
    from: 'từ',
    position: 'vị trí',
    radius: 'bán kính',
    color: 'màu',
    speed: 'tốc độ',
    duration: 'thời lượng',
  },
});

export default vi;
