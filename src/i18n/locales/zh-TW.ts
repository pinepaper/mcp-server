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
