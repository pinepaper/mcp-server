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
