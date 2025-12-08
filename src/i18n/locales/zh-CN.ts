/**
 * Simplified Chinese Translations
 */

import { createBaseTranslation } from './base.js';

export const zhCN = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: '创建元素', description: '' },
    pinepaper_modify_item: { name: '修改元素', description: '' },
    pinepaper_delete_item: { name: '删除元素', description: '' },
    pinepaper_add_relation: { name: '添加关系', description: '' },
    pinepaper_remove_relation: { name: '移除关系', description: '' },
    pinepaper_query_relations: { name: '查询关系', description: '' },
    pinepaper_animate: { name: '动画', description: '' },
    pinepaper_keyframe_animate: { name: '关键帧动画', description: '' },
    pinepaper_play_timeline: { name: '播放时间轴', description: '' },
    pinepaper_execute_generator: { name: '执行生成器', description: '' },
    pinepaper_list_generators: { name: '列出生成器', description: '' },
    pinepaper_apply_effect: { name: '应用效果', description: '' },
    pinepaper_get_items: { name: '获取元素', description: '' },
    pinepaper_get_relation_stats: { name: '关系统计', description: '' },
    pinepaper_set_background_color: { name: '设置背景色', description: '' },
    pinepaper_set_canvas_size: { name: '设置画布大小', description: '' },
    pinepaper_export_svg: { name: '导出SVG', description: '' },
    pinepaper_export_training_data: { name: '导出训练数据', description: '' },
  },

  errors: {
    itemNotFound: '未找到元素：{{itemId}}',
    invalidRelation: '无效的关系：{{relationType}}',
    invalidParams: '无效的参数：{{details}}',
    generatorNotFound: '未找到生成器：{{generatorName}}',
    exportFailed: '导出失败：{{reason}}',
    executionError: '执行错误：{{message}}',
    validationError: '验证错误：{{message}}',
    unknownTool: '未知工具：{{toolName}}',
    apiKeyRequired: '需要API密钥',
    apiKeyInvalid: 'API密钥无效',
    apiKeyExpired: 'API密钥已过期',
    rateLimitExceeded: '超出请求限制。请在{{seconds}}秒后重试。',
  },

  success: {
    itemCreated: '在位置({{x}}, {{y}})创建了{{itemType}}',
    itemModified: '已修改元素{{itemId}}',
    itemDeleted: '已删除元素{{itemId}}',
    relationAdded: '已添加{{relationType}}关系：{{sourceId}} → {{targetId}}',
    relationRemoved: '已移除{{sourceId}}和{{targetId}}之间的关系',
    animationApplied: '已将{{animationType}}动画应用于{{itemId}}',
    generatorExecuted: '已执行{{generatorName}}生成器',
    effectApplied: '已将{{effectType}}效果应用于{{itemId}}',
    backgroundSet: '背景色已设置为{{color}}',
    canvasSizeSet: '画布大小已设置为{{width}}×{{height}}',
    exported: '{{format}}导出成功',
  },

  itemTypes: {
    text: '文本',
    circle: '圆形',
    star: '星形',
    rectangle: '矩形',
    triangle: '三角形',
    polygon: '多边形',
    ellipse: '椭圆',
    path: '路径',
    line: '线条',
    arc: '弧形',
  },

  relationTypes: {
    orbits: '环绕',
    follows: '跟随',
    attached_to: '附着于',
    maintains_distance: '保持距离',
    points_at: '指向',
    mirrors: '镜像',
    parallax: '视差',
    bounds_to: '限制于',
  },

  animationTypes: {
    pulse: '脉冲',
    rotate: '旋转',
    bounce: '弹跳',
    fade: '淡入淡出',
    wobble: '摇摆',
    slide: '滑动',
    typewriter: '打字机',
  },

  generators: {
    drawSunburst: '太阳光芒',
    drawSunsetScene: '日落场景',
    drawGrid: '网格',
    drawStackedCircles: '堆叠圆形',
    drawCircuit: '电路板',
    drawWaves: '波浪',
    drawPattern: '图案',
  },

  common: {
    at: '在',
    with: '与',
    to: '到',
    from: '从',
    position: '位置',
    radius: '半径',
    color: '颜色',
    speed: '速度',
    duration: '持续时间',
  },
});

export default zhCN;
