/**
 * Traditional Chinese Translations
 */

import { createBaseTranslation } from './base.js';

export const zhTW = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: '建立元素', description: '' },
    pinepaper_modify_item: { name: '修改元素', description: '' },
    pinepaper_delete_item: { name: '刪除元素', description: '' },
    pinepaper_add_relation: { name: '新增關係', description: '' },
    pinepaper_remove_relation: { name: '移除關係', description: '' },
    pinepaper_query_relations: { name: '查詢關係', description: '' },
    pinepaper_animate: { name: '動畫', description: '' },
    pinepaper_keyframe_animate: { name: '關鍵影格動畫', description: '' },
    pinepaper_play_timeline: { name: '播放時間軸', description: '' },
    pinepaper_execute_generator: { name: '執行產生器', description: '' },
    pinepaper_list_generators: { name: '列出產生器', description: '' },
    pinepaper_apply_effect: { name: '套用效果', description: '' },
    pinepaper_get_items: { name: '取得元素', description: '' },
    pinepaper_get_relation_stats: { name: '關係統計', description: '' },
    pinepaper_set_background_color: { name: '設定背景色', description: '' },
    pinepaper_set_canvas_size: { name: '設定畫布大小', description: '' },
    pinepaper_export_svg: { name: '匯出SVG', description: '' },
    pinepaper_export_training_data: { name: '匯出訓練資料', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: '建立圖表形狀',
      description: `在畫布上建立圖表形狀。圖表形狀是專為流程圖、UML圖、網路圖和類似技術繪圖而設計的特殊形狀。

使用時機：
- 建立流程圖、流程圖或工作流程
- 構建UML類別圖、使用案例圖或序列圖
- 設計網路拓撲圖
- 製作組織圖或決策樹

形狀類型：
- 流程圖：process、decision、terminal、data、document、database、preparation
- UML：uml-class、uml-usecase、uml-actor
- 網路：cloud、server
- 基本：rectangle、circle、triangle、star`,
    },
    pinepaper_connect: {
      name: '連接項目',
      description: `使用智慧連接器連接兩個項目。這是在圖表形狀之間繪製線條/箭頭的主要方法。

使用時機：
- 在流程圖步驟之間繪製箭頭
- 使用關聯連接UML類別
- 在節點之間建立網路連接
- 任何需要在元素之間繪製線條/箭頭的圖表

路由類型：
- orthogonal：僅直角轉彎（預設）
- direct：點之間的直線
- curved：可調整曲率的貝茲曲線`,
    },
    pinepaper_connect_ports: {
      name: '連接端口',
      description: `連接項目上的特定端口。當您需要精確控制連接器附加到哪些端口時使用此工具。

使用時機：
- 需要將連接器附加到形狀的特定側面
- 建立自動端口選擇不理想的複雜圖表
- 構建具有特定進入/退出點的類電路圖`,
    },
    pinepaper_add_ports: {
      name: '新增端口',
      description: `為現有項目新增連接端口。端口是連接器可以附加的錨點。

使用時機：
- 為形狀新增自訂端口位置
- 為沒有端口的項目啟用連接
- 為複雜圖表建立專門的連接點`,
    },
    pinepaper_auto_layout: {
      name: '自動佈局',
      description: `使用佈局演算法自動排列圖表項目。這會重新組織項目以獲得更清晰、更易讀的圖表。

使用時機：
- 圖表項目雜亂或重疊
- 想要自動建立專業外觀的佈局
- 新增許多項目後，需要組織它們

佈局類型：
- hierarchical：最適合流程圖、組織圖
- force-directed：最適合網路圖
- tree：最適合階層結構
- radial：最適合心智圖
- grid：最適合同等重要性的項目`,
    },
    pinepaper_get_diagram_shapes: {
      name: '取得圖表形狀',
      description: `取得可用圖表形狀及其屬性的列表。

使用時機：
- 需要查看可用的圖表形狀
- 想要了解形狀的預設大小和樣式
- 構建顯示形狀選項的動態UI`,
    },
    pinepaper_update_connector: {
      name: '更新連接器',
      description: `更新現有連接器的樣式或標籤。

使用時機：
- 建立後變更連接器外觀
- 更新連接器標籤
- 變更箭頭樣式或顏色`,
    },
    pinepaper_remove_connector: {
      name: '刪除連接器',
      description: `從畫布中移除連接器。

使用時機：
- 刪除項目之間的連接
- 移除不正確的連結
- 重組圖表連接`,
    },
    pinepaper_diagram_mode: {
      name: '圖表模式',
      description: `控制互動式編輯的圖表模式。

使用時機：
- 在繪圖和選擇模式之間切換
- 啟用/停用圖表特定UI
- 設定畫布以建立圖表

動作：
- activate：啟用圖表模式
- deactivate：返回正常畫布模式
- toggle：在模式之間切換
- setMode：設定特定工具模式`,
    },
  },

  errors: {
    itemNotFound: '找不到元素：{{itemId}}',
    invalidRelation: '無效的關係：{{relationType}}',
    invalidParams: '無效的參數：{{details}}',
    generatorNotFound: '找不到產生器：{{generatorName}}',
    exportFailed: '匯出失敗：{{reason}}',
    executionError: '執行錯誤：{{message}}',
    validationError: '驗證錯誤：{{message}}',
    unknownTool: '未知工具：{{toolName}}',
    apiKeyRequired: '需要API金鑰',
    apiKeyInvalid: 'API金鑰無效',
    apiKeyExpired: 'API金鑰已過期',
    rateLimitExceeded: '超出請求限制。請在{{seconds}}秒後重試。',
  },

  success: {
    itemCreated: '在位置({{x}}, {{y}})建立了{{itemType}}',
    itemModified: '已修改元素{{itemId}}',
    itemDeleted: '已刪除元素{{itemId}}',
    relationAdded: '已新增{{relationType}}關係：{{sourceId}} → {{targetId}}',
    relationRemoved: '已移除{{sourceId}}和{{targetId}}之間的關係',
    animationApplied: '已將{{animationType}}動畫套用於{{itemId}}',
    generatorExecuted: '已執行{{generatorName}}產生器',
    effectApplied: '已將{{effectType}}效果套用於{{itemId}}',
    backgroundSet: '背景色已設定為{{color}}',
    canvasSizeSet: '畫布大小已設定為{{width}}×{{height}}',
    exported: '{{format}}匯出成功',
  },

  itemTypes: {
    text: '文字',
    circle: '圓形',
    star: '星形',
    rectangle: '矩形',
    triangle: '三角形',
    polygon: '多邊形',
    ellipse: '橢圓',
    path: '路徑',
    line: '線條',
    arc: '弧形',
  },

  relationTypes: {
    orbits: '環繞',
    follows: '跟隨',
    attached_to: '附著於',
    maintains_distance: '保持距離',
    points_at: '指向',
    mirrors: '鏡像',
    parallax: '視差',
    bounds_to: '限制於',
  },

  animationTypes: {
    pulse: '脈衝',
    rotate: '旋轉',
    bounce: '彈跳',
    fade: '淡入淡出',
    wobble: '搖擺',
    slide: '滑動',
    typewriter: '打字機',
  },

  generators: {
    drawSunburst: '太陽光芒',
    drawSunsetScene: '日落場景',
    drawGrid: '網格',
    drawStackedCircles: '堆疊圓形',
    drawCircuit: '電路板',
    drawWaves: '波浪',
    drawPattern: '圖案',
  },

  common: {
    at: '在',
    with: '與',
    to: '到',
    from: '從',
    position: '位置',
    radius: '半徑',
    color: '顏色',
    speed: '速度',
    duration: '持續時間',
  },
});

export default zhTW;
