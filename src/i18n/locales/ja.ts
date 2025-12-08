/**
 * Japanese Translations
 */

import { createBaseTranslation } from './base.js';

export const ja = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'アイテム作成', description: '' },
    pinepaper_modify_item: { name: 'アイテム変更', description: '' },
    pinepaper_delete_item: { name: 'アイテム削除', description: '' },
    pinepaper_add_relation: { name: '関係追加', description: '' },
    pinepaper_remove_relation: { name: '関係削除', description: '' },
    pinepaper_query_relations: { name: '関係照会', description: '' },
    pinepaper_animate: { name: 'アニメーション', description: '' },
    pinepaper_keyframe_animate: { name: 'キーフレームアニメーション', description: '' },
    pinepaper_play_timeline: { name: 'タイムライン再生', description: '' },
    pinepaper_execute_generator: { name: 'ジェネレーター実行', description: '' },
    pinepaper_list_generators: { name: 'ジェネレーター一覧', description: '' },
    pinepaper_apply_effect: { name: 'エフェクト適用', description: '' },
    pinepaper_get_items: { name: 'アイテム取得', description: '' },
    pinepaper_get_relation_stats: { name: '関係統計', description: '' },
    pinepaper_set_background_color: { name: '背景色設定', description: '' },
    pinepaper_set_canvas_size: { name: 'キャンバスサイズ設定', description: '' },
    pinepaper_export_svg: { name: 'SVGエクスポート', description: '' },
    pinepaper_export_training_data: { name: 'トレーニングデータエクスポート', description: '' },
  },

  errors: {
    itemNotFound: 'アイテムが見つかりません：{{itemId}}',
    invalidRelation: '無効な関係：{{relationType}}',
    invalidParams: '無効なパラメータ：{{details}}',
    generatorNotFound: 'ジェネレーターが見つかりません：{{generatorName}}',
    exportFailed: 'エクスポート失敗：{{reason}}',
    executionError: '実行エラー：{{message}}',
    validationError: '検証エラー：{{message}}',
    unknownTool: '不明なツール：{{toolName}}',
    apiKeyRequired: 'APIキーが必要です',
    apiKeyInvalid: 'APIキーが無効です',
    apiKeyExpired: 'APIキーの有効期限が切れています',
    rateLimitExceeded: 'リクエスト制限を超えました。{{seconds}}秒後に再試行してください。',
  },

  success: {
    itemCreated: '位置({{x}}, {{y}})に{{itemType}}を作成しました',
    itemModified: 'アイテム{{itemId}}を変更しました',
    itemDeleted: 'アイテム{{itemId}}を削除しました',
    relationAdded: '{{relationType}}関係を追加：{{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}}と{{targetId}}間の関係を削除しました',
    animationApplied: '{{itemId}}に{{animationType}}アニメーションを適用しました',
    generatorExecuted: '{{generatorName}}ジェネレーターを実行しました',
    effectApplied: '{{itemId}}に{{effectType}}エフェクトを適用しました',
    backgroundSet: '背景色を{{color}}に設定しました',
    canvasSizeSet: 'キャンバスサイズを{{width}}×{{height}}に設定しました',
    exported: '{{format}}を正常にエクスポートしました',
  },

  itemTypes: {
    text: 'テキスト',
    circle: '円',
    star: '星',
    rectangle: '長方形',
    triangle: '三角形',
    polygon: '多角形',
    ellipse: '楕円',
    path: 'パス',
    line: '線',
    arc: '弧',
  },

  relationTypes: {
    orbits: '周回',
    follows: '追従',
    attached_to: '接続',
    maintains_distance: '距離維持',
    points_at: '指向',
    mirrors: 'ミラー',
    parallax: 'パララックス',
    bounds_to: '制限',
  },

  animationTypes: {
    pulse: 'パルス',
    rotate: '回転',
    bounce: 'バウンス',
    fade: 'フェード',
    wobble: 'ウォブル',
    slide: 'スライド',
    typewriter: 'タイプライター',
  },

  generators: {
    drawSunburst: 'サンバースト',
    drawSunsetScene: '夕日シーン',
    drawGrid: 'グリッド',
    drawStackedCircles: '積み重ね円',
    drawCircuit: '回路基板',
    drawWaves: '波',
    drawPattern: 'パターン',
  },

  common: {
    at: 'で',
    with: 'と',
    to: 'へ',
    from: 'から',
    position: '位置',
    radius: '半径',
    color: '色',
    speed: '速度',
    duration: '時間',
  },
});

export default ja;
