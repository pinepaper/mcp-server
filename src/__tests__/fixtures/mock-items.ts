/**
 * Mock Items for Testing
 */

export const mockTextItem = {
  itemType: 'text' as const,
  position: { x: 400, y: 300 },
  properties: {
    content: 'Hello World',
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
};

export const mockCircleItem = {
  itemType: 'circle' as const,
  position: { x: 200, y: 200 },
  properties: {
    radius: 50,
    color: '#3b82f6',
    strokeColor: '#1d4ed8',
    strokeWidth: 2,
  },
};

export const mockStarItem = {
  itemType: 'star' as const,
  position: { x: 500, y: 300 },
  properties: {
    radius1: 60,
    radius2: 30,
    points: 5,
    color: '#fbbf24',
  },
};

export const mockRectangleItem = {
  itemType: 'rectangle' as const,
  position: { x: 100, y: 100 },
  properties: {
    width: 200,
    height: 100,
    color: '#10b981',
    cornerRadius: 8,
  },
};

export const mockPathItem = {
  itemType: 'path' as const,
  position: { x: 300, y: 300 },
  properties: {
    segments: [[0, 0], [100, 50], [200, 0]] as [number, number][],
    strokeColor: '#ef4444',
    strokeWidth: 3,
    closed: false,
    smooth: true,
  },
};

export const mockLineItem = {
  itemType: 'line' as const,
  position: { x: 0, y: 0 },
  properties: {
    from: [100, 100] as [number, number],
    to: [300, 200] as [number, number],
    strokeColor: '#8b5cf6',
    strokeWidth: 2,
  },
};

// Collection of all mock items
export const allMockItems = [
  mockTextItem,
  mockCircleItem,
  mockStarItem,
  mockRectangleItem,
  mockPathItem,
  mockLineItem,
];
