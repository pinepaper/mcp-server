/**
 * Mock Relations for Testing
 */

export const mockOrbitsRelation = {
  sourceId: 'item_2',
  targetId: 'item_1',
  relationType: 'orbits' as const,
  params: {
    radius: 150,
    speed: 0.5,
    direction: 'counterclockwise' as const,
    phase: 0,
  },
};

export const mockFollowsRelation = {
  sourceId: 'item_3',
  targetId: 'item_1',
  relationType: 'follows' as const,
  params: {
    offset: [0, -50] as [number, number],
    smoothing: 0.1,
    delay: 0.2,
  },
};

export const mockAttachedToRelation = {
  sourceId: 'label_1',
  targetId: 'item_1',
  relationType: 'attached_to' as const,
  params: {
    offset: [0, -70] as [number, number],
    inherit_rotation: false,
  },
};

export const mockMaintainsDistanceRelation = {
  sourceId: 'item_4',
  targetId: 'item_1',
  relationType: 'maintains_distance' as const,
  params: {
    distance: 200,
    strength: 0.8,
  },
};

export const mockPointsAtRelation = {
  sourceId: 'arrow_1',
  targetId: 'target_1',
  relationType: 'points_at' as const,
  params: {
    offset_angle: 0,
    smoothing: 0.2,
  },
};

export const mockMirrorsRelation = {
  sourceId: 'reflection_1',
  targetId: 'original_1',
  relationType: 'mirrors' as const,
  params: {
    axis: 'vertical' as const,
    center: [400, 300] as [number, number],
  },
};

export const mockParallaxRelation = {
  sourceId: 'bg_element',
  targetId: 'camera',
  relationType: 'parallax' as const,
  params: {
    depth: 0.5,
    origin: [400, 300] as [number, number],
  },
};

export const mockBoundsToRelation = {
  sourceId: 'player',
  targetId: 'arena',
  relationType: 'bounds_to' as const,
  params: {
    padding: 20,
    bounce: true,
  },
};

// Collection of all mock relations
export const allMockRelations = [
  mockOrbitsRelation,
  mockFollowsRelation,
  mockAttachedToRelation,
  mockMaintainsDistanceRelation,
  mockPointsAtRelation,
  mockMirrorsRelation,
  mockParallaxRelation,
  mockBoundsToRelation,
];
