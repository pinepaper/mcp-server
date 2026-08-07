# PinePaper MCP 서버

> Model Context Protocol로 AI가 애니메이션 벡터 그래픽을 만든다

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어** · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — 툴 콜로 만든 애니메이션" width="840">
</p>

*위 배너는 애니메이션 SVG입니다. PinePaper 툴 콜에서 그대로 내보낸 것으로, 동영상도 GIF도 아닙니다. GitHub에서 열면 움직입니다.*

## 개요

PinePaper MCP 서버는 AI 어시스턴트가 MCP를 통해 [PinePaper Studio](https://pinepaper.studio)에서 그래픽을 만들고 애니메이션하게 해줍니다. MCP 툴 콜을 지원하는 모든 AI(Claude, GPT, Gemini, 로컬 모델 등)와 호환됩니다.

**130개의 툴** 제공 — 드로잉, 애니메이션, 다이어그램, 지도, 타이포그래피, 물리, 이미지 편집, 데이터 시각화, 내보내기:

- 텍스트·도형·기하·복잡한 그래픽 생성
- 키프레임 대신 행동을 선언하는 **릴레이션**으로 애니메이션
- 프로시저럴 배경과 수식 기반 경로
- 다이어그램, 지도, 차트, 레터 콜라주
- 이미지 편집: 크롭, 크로마키 배경 제거, GPU 필터, 올가미 오려내기, 객체 감지
- 애니메이션 SVG, 비디오 프레임, 임베드 위젯, LLM 학습 데이터 내보내기

## 빠른 시작

```bash
npm install -g @pinepaper.studio/mcp-server
```

**Claude Desktop** (`claude_desktop_config.json`):

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

AI에게 이렇게 말해 보세요:

> "빨간색으로 맥박 치는 HELLO 텍스트를 만들어 줘"

> "태양과 지구를 만들고 지구가 태양을 공전하게 해 줘"

> "파랑·보라 선버스트 배경을 넣어 줘"

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="회전하는 선버스트 포스터">
  <img src="assets/easing-splashes.svg" width="300" alt="시차 바운스 스플래시">
  <img src="assets/live-badge.svg" width="180" alt="깜박이는 LIVE 배지">
</p>

## 1.6.0의 새 기능

- **이미지 편집 툴**: `pinepaper_crop_image`(원샷 크롭, id·릴레이션 유지), `pinepaper_chroma_key`(임계값 자동 추정 크로마키)
- **`pinepaper_media`에 `set_clip` 추가** — 업로드된 클립의 트림 재조정
- **셰이더 아우라**: `pinepaper_apply_effect`에 `heatmap` / `liquid_metal` / `gem_smoke`
- **`pinepaper_image_filter` 수정·확장** — 실제 GPU 필터 엔진에 연결, 15종 전체 필터(하프톤 계열, 포스터라이즈, 비네트, HSL, 디더 등)
- **README가 MCP 리소스로** — 클라이언트가 `pinepaper://docs/readme`(언어별 변형 포함)를 프로토콜 안에서 읽을 수 있음

## 더 보기

전체 툴 레퍼런스, 툴킷과 토큰 예산, 릴레이션 목록은 [영어 README](README.md)를 참고하세요. AI 에이전트용 표준 워크플로는 리소스 `pinepaper://docs/agent-guide`에 있습니다.

MIT 라이선스 · [pinepaper.studio](https://pinepaper.studio)
