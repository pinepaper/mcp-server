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

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: '创建图表形状',
      description: `在画布上创建图表形状。用于流程图、UML图、网络图等技术图表。

使用场景:
- 创建流程图、过程图或工作流
- 构建UML类图、用例图或序列图
- 设计网络拓扑图
- 制作组织结构图或决策树

形状类型:
- 流程图: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- 网络: cloud, server
- 基本: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: '连接项目',
      description: `使用智能连接器连接两个元素。这是在图表形状之间绘制线条/箭头的主要方法。

使用场景:
- 在流程图步骤之间绘制箭头
- 用关联连接UML类
- 在节点之间创建网络连接
- 任何需要在元素之间绘制线条/箭头的图表

路由类型:
- orthogonal: 仅直角转弯(默认)
- direct: 点之间的直线
- curved: 可调曲率的贝塞尔曲线`,
    },
    pinepaper_connect_ports: {
      name: '连接端口',
      description: `连接元素上的特定端口。当需要精确控制连接器附着到哪个端口时使用。

使用场景:
- 需要连接器附着到形状的特定一侧
- 创建复杂图表,自动端口选择不理想时
- 构建具有特定进出点的类似电路的图表`,
    },
    pinepaper_add_ports: {
      name: '添加端口',
      description: `向现有元素添加连接端口。端口是连接器可以附着的锚点。

使用场景:
- 向形状添加自定义端口位置
- 在没有端口的元素上启用连接
- 为复杂图表创建专用连接点`,
    },
    pinepaper_auto_layout: {
      name: '自动布局',
      description: `使用布局算法自动排列图表元素。重新组织元素以获得更清晰、更易读的图表。

使用场景:
- 图表元素杂乱或重叠时
- 想要自动创建专业外观的布局
- 添加许多元素后需要组织它们

布局类型:
- hierarchical: 最适合流程图、组织结构图
- force-directed: 最适合网络图
- tree: 最适合层次结构
- radial: 最适合思维导图
- grid: 最适合同等重要的元素`,
    },
    pinepaper_get_diagram_shapes: {
      name: '获取图表形状',
      description: `获取可用图表形状及其属性的列表。

使用场景:
- 需要查看有哪些图表形状可用
- 想了解形状的默认大小和样式
- 构建显示形状选项的动态UI`,
    },
    pinepaper_update_connector: {
      name: '更新连接器',
      description: `更新现有连接器的样式或标签。

使用场景:
- 创建后更改连接器外观
- 更新连接器标签
- 更改箭头样式或颜色`,
    },
    pinepaper_remove_connector: {
      name: '删除连接器',
      description: `从画布中删除连接器。

使用场景:
- 删除元素之间的连接
- 移除错误的链接
- 重组图表连接`,
    },
    pinepaper_diagram_mode: {
      name: '图表模式',
      description: `控制交互式编辑的图表模式。

使用场景:
- 在绘图和选择模式之间切换
- 启用/禁用图表特定的UI
- 为图表创建设置画布

操作:
- activate: 启用图表模式
- deactivate: 返回正常画布模式
- toggle: 在模式之间切换
- setMode: 设置特定工具模式`,
    },
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
