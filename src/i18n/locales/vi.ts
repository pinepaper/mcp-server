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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Tạo hình sơ đồ',
      description: `Tạo hình sơ đồ chuyên dụng trên canvas. Các hình sơ đồ được thiết kế cho sơ đồ lưu chuyển, sơ đồ UML, sơ đồ mạng và các bản vẽ kỹ thuật tương tự.

SỬ DỤNG KHI:
- Tạo sơ đồ lưu chuyển, quy trình hoặc luồng công việc
- Xây dựng sơ đồ lớp UML, sơ đồ use case hoặc sequence diagram
- Thiết kế sơ đồ topology mạng
- Làm sơ đồ tổ chức hoặc cây quyết định

LOẠI HÌNH:
- Flowchart: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Network: cloud, server
- Basic: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Kết nối mục',
      description: `Kết nối hai mục với đầu nối thông minh. Đây là cách chính để vẽ đường/mũi tên giữa các hình sơ đồ.

SỬ DỤNG KHI:
- Vẽ mũi tên giữa các bước trong sơ đồ lưu chuyển
- Kết nối các lớp UML với quan hệ liên kết
- Tạo kết nối mạng giữa các nút
- Bất kỳ sơ đồ nào cần đường nối/mũi tên giữa các phần tử

LOẠI ĐỊNH TUYẾN:
- orthogonal: Chỉ rẽ góc vuông (mặc định)
- direct: Đường thẳng giữa các điểm
- curved: Đường cong Bezier với độ cong tùy chỉnh`,
    },
    pinepaper_connect_ports: {
      name: 'Kết nối cổng',
      description: `Kết nối hai cổng cụ thể trên các mục. Dùng khi cần kiểm soát chính xác cổng nào mà đầu nối gắn vào.

SỬ DỤNG KHI:
- Cần đầu nối gắn vào phía cụ thể của hình
- Tạo sơ đồ phức tạp khi việc chọn cổng tự động không lý tưởng
- Xây dựng sơ đồ dạng mạch với điểm vào/ra cụ thể`,
    },
    pinepaper_add_ports: {
      name: 'Thêm cổng',
      description: `Thêm cổng kết nối vào mục hiện có. Cổng là điểm neo mà đầu nối có thể gắn vào.

SỬ DỤNG KHI:
- Thêm vị trí cổng tùy chỉnh cho hình
- Bật kết nối cho các mục chưa có cổng
- Tạo điểm kết nối chuyên biệt cho sơ đồ phức tạp`,
    },
    pinepaper_auto_layout: {
      name: 'Bố cục tự động',
      description: `Tự động sắp xếp các mục sơ đồ sử dụng thuật toán bố cục. Điều này tổ chức lại các mục để sơ đồ sạch hơn, dễ đọc hơn.

SỬ DỤNG KHI:
- Các mục sơ đồ lộn xộn hoặc chồng chéo
- Muốn tạo bố cục chuyên nghiệp tự động
- Sau khi thêm nhiều mục, cần tổ chức lại

LOẠI BỐ CỤC:
- hierarchical: Tốt nhất cho sơ đồ lưu chuyển, biểu đồ tổ chức
- force-directed: Tốt nhất cho sơ đồ mạng
- tree: Tốt nhất cho cây phân cấp
- radial: Tốt nhất cho sơ đồ tư duy
- grid: Tốt nhất cho các mục có tầm quan trọng bằng nhau`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Lấy hình sơ đồ',
      description: `Lấy danh sách các hình sơ đồ có sẵn với các thuộc tính của chúng.

SỬ DỤNG KHI:
- Cần xem hình sơ đồ nào có sẵn
- Muốn biết kích thước và kiểu dáng mặc định cho các hình
- Xây dựng giao diện động hiển thị tùy chọn hình`,
    },
    pinepaper_update_connector: {
      name: 'Cập nhật đầu nối',
      description: `Cập nhật kiểu dáng hoặc nhãn của đầu nối hiện có.

SỬ DỤNG KHI:
- Thay đổi diện mạo đầu nối sau khi tạo
- Cập nhật nhãn đầu nối
- Thay đổi kiểu mũi tên hoặc màu sắc`,
    },
    pinepaper_remove_connector: {
      name: 'Xóa đầu nối',
      description: `Xóa một đầu nối khỏi canvas.

SỬ DỤNG KHI:
- Xóa kết nối giữa các mục
- Loại bỏ liên kết không chính xác
- Tái cấu trúc kết nối sơ đồ`,
    },
    pinepaper_diagram_mode: {
      name: 'Chế độ sơ đồ',
      description: `Điều khiển chế độ sơ đồ cho chỉnh sửa tương tác.

SỬ DỤNG KHI:
- Chuyển đổi giữa chế độ vẽ và chọn
- Bật/tắt giao diện đặc trưng của sơ đồ
- Thiết lập canvas cho việc tạo sơ đồ

HÀNH ĐỘNG:
- activate: Bật chế độ sơ đồ
- deactivate: Quay lại chế độ canvas thường
- toggle: Chuyển đổi giữa các chế độ
- setMode: Đặt chế độ công cụ cụ thể`,
    },
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
