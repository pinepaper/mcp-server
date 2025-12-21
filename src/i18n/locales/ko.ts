/**
 * Korean Translations
 */

import { createBaseTranslation } from './base.js';

export const ko = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: '항목 생성', description: '' },
    pinepaper_modify_item: { name: '항목 수정', description: '' },
    pinepaper_delete_item: { name: '항목 삭제', description: '' },
    pinepaper_add_relation: { name: '관계 추가', description: '' },
    pinepaper_remove_relation: { name: '관계 제거', description: '' },
    pinepaper_query_relations: { name: '관계 조회', description: '' },
    pinepaper_animate: { name: '애니메이션', description: '' },
    pinepaper_keyframe_animate: { name: '키프레임 애니메이션', description: '' },
    pinepaper_play_timeline: { name: '타임라인 재생', description: '' },
    pinepaper_execute_generator: { name: '생성기 실행', description: '' },
    pinepaper_list_generators: { name: '생성기 목록', description: '' },
    pinepaper_apply_effect: { name: '효과 적용', description: '' },
    pinepaper_get_items: { name: '항목 가져오기', description: '' },
    pinepaper_get_relation_stats: { name: '관계 통계', description: '' },
    pinepaper_set_background_color: { name: '배경색 설정', description: '' },
    pinepaper_set_canvas_size: { name: '캔버스 크기 설정', description: '' },
    pinepaper_export_svg: { name: 'SVG 내보내기', description: '' },
    pinepaper_export_training_data: { name: '훈련 데이터 내보내기', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: '다이어그램 도형 생성',
      description: '캔버스에 다이어그램 도형을 생성합니다. 순서도, UML 다이어그램, 네트워크 다이어그램 등의 기술 도면용 특수 도형입니다.\n\n사용 시기:\n- 순서도, 프로세스 다이어그램, 워크플로우 생성\n- UML 클래스 다이어그램, 유즈케이스 다이어그램, 시퀀스 다이어그램 작성\n- 네트워크 토폴로지 다이어그램 설계\n- 조직도 또는 의사결정 트리 제작\n\n도형 유형:\n- 순서도: process, decision, terminal, data, document, database, preparation\n- UML: uml-class, uml-usecase, uml-actor\n- 네트워크: cloud, server\n- 기본: rectangle, circle, triangle, star'
    },
    pinepaper_connect: {
      name: '항목 연결',
      description: '두 항목을 스마트 커넥터로 연결합니다. 다이어그램 도형 간 선/화살표를 그리는 주요 방법입니다.\n\n사용 시기:\n- 순서도 단계 간 화살표 그리기\n- UML 클래스 간 연관 관계 연결\n- 노드 간 네트워크 연결 생성\n- 요소 간 선/화살표가 필요한 모든 다이어그램\n\n라우팅 유형:\n- orthogonal: 직각으로만 회전 (기본값)\n- direct: 지점 간 직선\n- curved: 곡률 조정 가능한 베지어 곡선'
    },
    pinepaper_connect_ports: {
      name: '포트 연결',
      description: '항목의 특정 포트를 연결합니다. 커넥터가 연결되는 포트를 정확히 제어해야 할 때 사용합니다.\n\n사용 시기:\n- 도형의 특정 면에 커넥터 연결 필요\n- 자동 포트 선택이 적합하지 않은 복잡한 다이어그램 생성\n- 특정 입출력 지점이 있는 회로형 다이어그램 작성'
    },
    pinepaper_add_ports: {
      name: '포트 추가',
      description: '기존 항목에 연결 포트를 추가합니다. 포트는 커넥터가 연결될 수 있는 앵커 포인트입니다.\n\n사용 시기:\n- 도형에 사용자 정의 포트 위치 추가\n- 포트가 없는 항목에 연결 기능 활성화\n- 복잡한 다이어그램용 특수 연결 지점 생성'
    },
    pinepaper_auto_layout: {
      name: '자동 레이아웃',
      description: '레이아웃 알고리즘을 사용하여 다이어그램 항목을 자동으로 배치합니다. 더 깔끔하고 읽기 쉬운 다이어그램으로 항목을 재구성합니다.\n\n사용 시기:\n- 다이어그램 항목이 지저분하거나 겹칠 때\n- 전문적인 레이아웃을 자동으로 생성하고 싶을 때\n- 많은 항목 추가 후 정리가 필요할 때\n\n레이아웃 유형:\n- hierarchical: 순서도, 조직도에 최적\n- force-directed: 네트워크 다이어그램에 최적\n- tree: 계층 구조에 최적\n- radial: 마인드맵에 최적\n- grid: 동등한 중요도의 항목에 최적'
    },
    pinepaper_get_diagram_shapes: {
      name: '다이어그램 도형 목록',
      description: '사용 가능한 다이어그램 도형과 속성 목록을 가져옵니다.\n\n사용 시기:\n- 사용 가능한 다이어그램 도형 확인 필요\n- 도형의 기본 크기 및 스타일 정보 필요\n- 도형 옵션을 표시하는 동적 UI 구축'
    },
    pinepaper_update_connector: {
      name: '커넥터 업데이트',
      description: '기존 커넥터의 스타일이나 레이블을 업데이트합니다.\n\n사용 시기:\n- 생성 후 커넥터 모양 변경\n- 커넥터 레이블 업데이트\n- 화살표 스타일이나 색상 변경'
    },
    pinepaper_remove_connector: {
      name: '커넥터 제거',
      description: '캔버스에서 커넥터를 제거합니다.\n\n사용 시기:\n- 항목 간 연결 삭제\n- 잘못된 링크 제거\n- 다이어그램 연결 구조 재구성'
    },
    pinepaper_diagram_mode: {
      name: '다이어그램 모드',
      description: '대화형 편집을 위한 다이어그램 모드를 제어합니다.\n\n사용 시기:\n- 그리기 모드와 선택 모드 간 전환\n- 다이어그램 전용 UI 활성화/비활성화\n- 다이어그램 생성용 캔버스 설정\n\n액션:\n- activate: 다이어그램 모드 활성화\n- deactivate: 일반 캔버스 모드로 복귀\n- toggle: 모드 간 전환\n- setMode: 특정 도구 모드 설정'
    },
  },

  errors: {
    itemNotFound: '항목을 찾을 수 없음: {{itemId}}',
    invalidRelation: '잘못된 관계: {{relationType}}',
    invalidParams: '잘못된 매개변수: {{details}}',
    generatorNotFound: '생성기를 찾을 수 없음: {{generatorName}}',
    exportFailed: '내보내기 실패: {{reason}}',
    executionError: '실행 오류: {{message}}',
    validationError: '유효성 검사 오류: {{message}}',
    unknownTool: '알 수 없는 도구: {{toolName}}',
    apiKeyRequired: 'API 키가 필요합니다',
    apiKeyInvalid: 'API 키가 유효하지 않습니다',
    apiKeyExpired: 'API 키가 만료되었습니다',
    rateLimitExceeded: '요청 한도를 초과했습니다. {{seconds}}초 후에 다시 시도하세요.',
  },

  success: {
    itemCreated: '위치 ({{x}}, {{y}})에 {{itemType}} 생성됨',
    itemModified: '항목 {{itemId}} 수정됨',
    itemDeleted: '항목 {{itemId}} 삭제됨',
    relationAdded: '{{relationType}} 관계 추가됨: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}}와 {{targetId}} 사이의 관계 제거됨',
    animationApplied: '{{itemId}}에 {{animationType}} 애니메이션 적용됨',
    generatorExecuted: '{{generatorName}} 생성기 실행됨',
    effectApplied: '{{itemId}}에 {{effectType}} 효과 적용됨',
    backgroundSet: '배경색이 {{color}}로 설정됨',
    canvasSizeSet: '캔버스 크기가 {{width}}×{{height}}로 설정됨',
    exported: '{{format}} 내보내기 성공',
  },

  itemTypes: {
    text: '텍스트',
    circle: '원',
    star: '별',
    rectangle: '직사각형',
    triangle: '삼각형',
    polygon: '다각형',
    ellipse: '타원',
    path: '경로',
    line: '선',
    arc: '호',
  },

  relationTypes: {
    orbits: '공전',
    follows: '따라가기',
    attached_to: '연결됨',
    maintains_distance: '거리 유지',
    points_at: '가리킴',
    mirrors: '미러',
    parallax: '시차',
    bounds_to: '제한',
  },

  animationTypes: {
    pulse: '펄스',
    rotate: '회전',
    bounce: '바운스',
    fade: '페이드',
    wobble: '흔들림',
    slide: '슬라이드',
    typewriter: '타자기',
  },

  generators: {
    drawSunburst: '선버스트',
    drawSunsetScene: '일몰 장면',
    drawGrid: '그리드',
    drawStackedCircles: '누적 원',
    drawCircuit: '회로 기판',
    drawWaves: '파도',
    drawPattern: '패턴',
  },

  common: {
    at: '에서',
    with: '와',
    to: '로',
    from: '에서',
    position: '위치',
    radius: '반경',
    color: '색상',
    speed: '속도',
    duration: '지속 시간',
  },
});

export default ko;
