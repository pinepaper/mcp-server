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
    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'ダイアグラム図形作成',
      description: `キャンバスにダイアグラム図形を作成します。フローチャート、UML図、ネットワーク図などの技術図面用の特殊図形。

使用例:
- フローチャート、プロセス図、ワークフローの作成
- UMLクラス図、ユースケース図、シーケンス図の作成
- ネットワークトポロジー図の設計
- 組織図や決定木の作成

図形タイプ:
- フローチャート: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- ネットワーク: cloud, server
- 基本: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'アイテム接続',
      description: `2つのアイテムをスマートコネクタで接続します。ダイアグラム図形間に線や矢印を描く主要な方法。

使用例:
- フローチャートのステップ間に矢印を描く
- UMLクラス間の関連付けを接続
- ノード間のネットワーク接続を作成
- 要素間に線/矢印が必要な任意のダイアグラム

ルーティングタイプ:
- orthogonal: 直角のみ（デフォルト）
- direct: 2点間の直線
- curved: 調整可能な曲率のベジェ曲線`,
    },
    pinepaper_connect_ports: {
      name: 'ポート接続',
      description: `アイテム上の特定のポートを接続します。コネクタが接続するポートを正確に制御する必要がある場合に使用。

使用例:
- 図形の特定の辺にコネクタを接続する必要がある場合
- 自動ポート選択が理想的でない複雑なダイアグラムの作成
- 特定の入力/出力ポイントを持つ回路図の構築`,
    },
    pinepaper_add_ports: {
      name: 'ポート追加',
      description: `既存のアイテムに接続ポートを追加します。ポートはコネクタが接続できるアンカーポイント。

使用例:
- 図形にカスタムポート位置を追加
- ポートのないアイテムに接続を有効化
- 複雑なダイアグラム用の特殊接続ポイントの作成`,
    },
    pinepaper_auto_layout: {
      name: '自動レイアウト',
      description: `レイアウトアルゴリズムを使用してダイアグラムアイテムを自動配置します。より読みやすいダイアグラムのためにアイテムを再編成。

使用例:
- ダイアグラムアイテムが乱雑または重複している場合
- プロフェッショナルなレイアウトを自動作成したい場合
- 多数のアイテムを追加した後、整理が必要な場合

レイアウトタイプ:
- hierarchical: フローチャート、組織図に最適
- force-directed: ネットワーク図に最適
- tree: 階層構造に最適
- radial: マインドマップに最適
- grid: 同等の重要度のアイテムに最適`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'ダイアグラム図形一覧',
      description: `利用可能なダイアグラム図形とそのプロパティのリストを取得します。

使用例:
- 利用可能なダイアグラム図形を確認する必要がある場合
- 図形のデフォルトサイズとスタイリングを知りたい場合
- 図形オプションを表示する動的UIの構築`,
    },
    pinepaper_update_connector: {
      name: 'コネクタ更新',
      description: `既存のコネクタのスタイルまたはラベルを更新します。

使用例:
- 作成後のコネクタの外観変更
- コネクタラベルの更新
- 矢印のスタイルや色の変更`,
    },
    pinepaper_remove_connector: {
      name: 'コネクタ削除',
      description: `キャンバスからコネクタを削除します。

使用例:
- アイテム間の接続を削除
- 誤ったリンクの削除
- ダイアグラム接続の再構築`,
    },
    pinepaper_diagram_mode: {
      name: 'ダイアグラムモード',
      description: `インタラクティブ編集のためのダイアグラムモードを制御します。

使用例:
- 描画モードと選択モードの切り替え
- ダイアグラム固有のUIの有効化/無効化
- ダイアグラム作成のためのキャンバス設定

アクション:
- activate: ダイアグラムモードを有効化
- deactivate: 通常のキャンバスモードに戻る
- toggle: モード間の切り替え
- setMode: 特定のツールモードを設定`,
    },
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
