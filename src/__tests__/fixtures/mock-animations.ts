/**
 * Mock Animations for Testing
 */

export const mockPulseAnimation = {
  itemId: 'item_1',
  animationType: 'pulse' as const,
  speed: 1.0,
};

export const mockRotateAnimation = {
  itemId: 'item_2',
  animationType: 'rotate' as const,
  speed: 0.5,
};

export const mockBounceAnimation = {
  itemId: 'item_3',
  animationType: 'bounce' as const,
  speed: 1.5,
};

export const mockFadeAnimation = {
  itemId: 'item_4',
  animationType: 'fade' as const,
  speed: 0.8,
};

export const mockWobbleAnimation = {
  itemId: 'item_5',
  animationType: 'wobble' as const,
  speed: 2.0,
};

export const mockSlideAnimation = {
  itemId: 'item_6',
  animationType: 'slide' as const,
  speed: 1.2,
};

export const mockTypewriterAnimation = {
  itemId: 'text_1',
  animationType: 'typewriter' as const,
  speed: 0.5,
};

// Keyframe animations
export const mockFadeInKeyframes = {
  itemId: 'item_1',
  keyframes: [
    { time: 0, properties: { opacity: 0 }, easing: 'linear' as const },
    { time: 1, properties: { opacity: 1 }, easing: 'easeOut' as const },
  ],
  duration: 1,
  loop: false,
};

export const mockMoveKeyframes = {
  itemId: 'item_1',
  keyframes: [
    { time: 0, properties: { x: 0, y: 0 }, easing: 'linear' as const },
    { time: 1, properties: { x: 200, y: 0 }, easing: 'easeInOut' as const },
    { time: 2, properties: { x: 200, y: 200 }, easing: 'easeInOut' as const },
  ],
  duration: 2,
  loop: true,
};

export const mockColorKeyframes = {
  itemId: 'item_1',
  keyframes: [
    { time: 0, properties: { fillColor: '#ff0000' }, easing: 'linear' as const },
    { time: 0.5, properties: { fillColor: '#00ff00' }, easing: 'linear' as const },
    { time: 1, properties: { fillColor: '#0000ff' }, easing: 'linear' as const },
  ],
  duration: 1,
  loop: true,
};

export const mockScaleKeyframes = {
  itemId: 'item_1',
  keyframes: [
    { time: 0, properties: { scale: 1 }, easing: 'linear' as const },
    { time: 0.5, properties: { scale: 1.5 }, easing: 'bounce' as const },
    { time: 1, properties: { scale: 1 }, easing: 'elastic' as const },
  ],
  duration: 2,
  loop: true,
};

// Collection of all simple animations
export const allSimpleAnimations = [
  mockPulseAnimation,
  mockRotateAnimation,
  mockBounceAnimation,
  mockFadeAnimation,
  mockWobbleAnimation,
  mockSlideAnimation,
  mockTypewriterAnimation,
];

// Collection of all keyframe animations
export const allKeyframeAnimations = [
  mockFadeInKeyframes,
  mockMoveKeyframes,
  mockColorKeyframes,
  mockScaleKeyframes,
];
