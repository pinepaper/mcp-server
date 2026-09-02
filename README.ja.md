# PinePaper MCP サーバー

> Model Context Protocol で AI がアニメーション付きベクターグラフィックを作る

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — ツールコールから生まれるアニメーション" width="840">
</p>

*上のバナーはアニメーション SVG です。PinePaper のツールコールからそのまま書き出したもので、動画ファイルも GIF もありません。GitHub 上で開けば動いて見えます。*

## 概要

PinePaper MCP サーバーは、MCP 経由で AI アシスタントが [PinePaper Studio](https://pinepaper.studio) 上にグラフィックを作成・アニメーションさせるためのサーバーです。MCP ツールコールに対応した AI（Claude、GPT、Gemini、ローカルモデルなど）で動作します。

**144 個のツール**を提供 — 描画・アニメーション・図・地図・タイポグラフィ・物理・画像編集・データ可視化・エクスポート：

- テキスト、図形、ジオメトリ、複雑なグラフィックの作成
- キーフレームではなく、ふるまいを宣言する**リレーション**でアニメーション
- プロシージャル背景・数式パス
- ダイアグラム、地図、チャート、レターコラージュ
- 画像編集：クロップ、クロマキー背景除去、GPU フィルター、なげなわ切り抜き、物体検出
- アニメーション SVG、動画フレーム、埋め込みウィジェット、LLM 学習データの書き出し

## クイックスタート

```bash
npm install -g @pinepaper.studio/mcp-server
```

**Claude Desktop**（`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"]
    }
  }
}
```

AI にこう頼んでみてください：

> 「赤くパルスする HELLO のテキストを作って」

> 「太陽と地球を作って、地球を太陽の周りに公転させて」

> 「青と紫のサンバースト背景を追加して」

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="回転するサンバーストのポスター">
  <img src="assets/easing-splashes.svg" width="300" alt="時間差でバウンドするスプラッシュ">
  <img src="assets/live-badge.svg" width="180" alt="点滅する LIVE バッジ">
</p>

## 1.6.0 の新機能

- **画像編集ツール**：`pinepaper_crop_image`（ワンショットクロップ、id とリレーションを維持）、`pinepaper_chroma_key`（しきい値自動推定のクロマキー）
- **`pinepaper_media` に `set_clip`** — アップロード済みクリップのトリムをやり直し
- **シェーダーオーラ**：`pinepaper_apply_effect` に `heatmap` / `liquid_metal` / `gem_smoke`
- **`pinepaper_image_filter` を修正・拡充** — 実際の GPU フィルターエンジンに接続、全 15 フィルター（ハーフトーン、ポスタリゼーション、ビネット、HSL、ディザなど）
- **README が MCP リソースに** — クライアントは `pinepaper://docs/readme`（言語別あり）をプロトコル内で読めます

## ローカルまたはホスティング

**ローカルは無料で、機能に制限はありません。** 自分でこのサーバーを動かせば、
すべてのツールが使えます。制限版はありません。

必要なもの: Node 18 以降、約 **320 MB** のディスク (Puppeteer が Chrome を
ダウンロードします)、ジョブ実行中は約 1 GB のメモリ。ノート PC なら問題あり
ませんが、小さな VPS や制限のある業務用マシンでは厳しいことがあります。

**[cloud.pinepaper.studio](https://cloud.pinepaper.studio) は同じサーバーを
代わりに動かします** — 同じツール、同じバージョン、HTTP 経由。インストールも
ブラウザも不要です。

ホスティングには費用がかかるため有料で、クレジット制で動作します。現在の
料金は [cloud.pinepaper.studio](https://cloud.pinepaper.studio) をご覧ください。ローカルで
動かせるなら、ローカルで動かしてください。それで失うものはありません。

## さらに詳しく

ツールの完全なリファレンス、ツールキットとトークン予算、リレーション一覧は[英語版 README](README.md) を参照してください。AI エージェント向けの正準ワークフローはリソース `pinepaper://docs/agent-guide` にあります。

MIT ライセンス · [pinepaper.studio](https://pinepaper.studio)
