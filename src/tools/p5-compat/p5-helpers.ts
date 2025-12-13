/**
 * p5.js Compatibility Helpers for PinePaper
 *
 * This module provides p5.js-style drawing functions that wrap Paper.js.
 * These helpers are injected into the browser context to allow Claude
 * to use familiar p5.js syntax when drawing on the PinePaper canvas.
 *
 * SUPPORTED FUNCTIONS (v1.3.1):
 * - Shapes: circle, ellipse, rect, line, triangle, quad, arc, point
 * - Style: fill, noFill, stroke, noStroke, strokeWeight, background
 * - Math: random, map, constrain, dist, lerp, radians, degrees
 * - Canvas: width, height
 * - Mode: rectMode, ellipseMode
 * - Constants: PI, TWO_PI, HALF_PI, QUARTER_PI, CENTER, CORNER
 */

/**
 * Browser-side p5.js compatibility helpers.
 * This code is injected into the PinePaper page context and executed via eval().
 */
export const P5_HELPERS = `
(function() {
  // Prevent double-initialization
  if (window._p5Initialized) {
    console.log('[p5-compat] Already initialized');
    return;
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  window._p5State = {
    fillColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 1,
    rectMode: 'corner',
    ellipseMode: 'center'
  };

  // ==========================================================================
  // CONSTANTS
  // ==========================================================================

  window.PI = Math.PI;
  window.TWO_PI = Math.PI * 2;
  window.HALF_PI = Math.PI / 2;
  window.QUARTER_PI = Math.PI / 4;

  window.CENTER = 'center';
  window.CORNER = 'corner';

  // ==========================================================================
  // CANVAS PROPERTIES
  // ==========================================================================

  Object.defineProperty(window, 'width', {
    get: function() {
      return paper.view ? paper.view.size.width : 800;
    },
    configurable: true
  });

  Object.defineProperty(window, 'height', {
    get: function() {
      return paper.view ? paper.view.size.height : 600;
    },
    configurable: true
  });

  // ==========================================================================
  // MATH UTILITIES
  // ==========================================================================

  window.random = function(min, max) {
    if (arguments.length === 0) {
      return Math.random();
    } else if (arguments.length === 1) {
      if (Array.isArray(min)) {
        // random(array) - return random element
        return min[Math.floor(Math.random() * min.length)];
      }
      // random(max) - return 0 to max
      return Math.random() * min;
    } else {
      // random(min, max)
      return Math.random() * (max - min) + min;
    }
  };

  window.map = function(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  };

  window.constrain = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
  };

  window.dist = function(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  };

  window.lerp = function(start, stop, amount) {
    return start + (stop - start) * amount;
  };

  window.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  window.degrees = function(radians) {
    return radians * 180 / Math.PI;
  };

  // ==========================================================================
  // STYLE FUNCTIONS
  // ==========================================================================

  /**
   * Parse color arguments into a valid color string.
   * Supports: fill(gray), fill(r,g,b), fill(r,g,b,a), fill('#hex')
   */
  function parseColor(args) {
    if (args.length === 0) return null;

    if (args.length === 1) {
      var val = args[0];
      if (typeof val === 'string') {
        return val;
      } else if (typeof val === 'number') {
        // Grayscale
        return 'rgb(' + val + ', ' + val + ', ' + val + ')';
      }
    } else if (args.length === 3) {
      // RGB
      return 'rgb(' + args[0] + ', ' + args[1] + ', ' + args[2] + ')';
    } else if (args.length === 4) {
      // RGBA (p5 uses 0-255 for alpha, CSS uses 0-1)
      return 'rgba(' + args[0] + ', ' + args[1] + ', ' + args[2] + ', ' + (args[3] / 255) + ')';
    }

    return null;
  }

  window.fill = function() {
    var color = parseColor(Array.prototype.slice.call(arguments));
    window._p5State.fillColor = color;
  };

  window.noFill = function() {
    window._p5State.fillColor = null;
  };

  window.stroke = function() {
    var color = parseColor(Array.prototype.slice.call(arguments));
    window._p5State.strokeColor = color;
  };

  window.noStroke = function() {
    window._p5State.strokeColor = null;
  };

  window.strokeWeight = function(weight) {
    window._p5State.strokeWidth = weight;
  };

  window.background = function() {
    var color = parseColor(Array.prototype.slice.call(arguments));
    if (color && typeof app !== 'undefined' && app.setBackgroundColor) {
      app.setBackgroundColor(color);
    }
  };

  // ==========================================================================
  // MODE FUNCTIONS
  // ==========================================================================

  window.rectMode = function(mode) {
    window._p5State.rectMode = mode.toLowerCase();
  };

  window.ellipseMode = function(mode) {
    window._p5State.ellipseMode = mode.toLowerCase();
  };

  // ==========================================================================
  // SHAPE FUNCTIONS
  // ==========================================================================

  /**
   * Apply current style state to an item
   */
  function applyStyle(item) {
    if (window._p5State.fillColor) {
      item.fillColor = window._p5State.fillColor;
    }
    if (window._p5State.strokeColor) {
      item.strokeColor = window._p5State.strokeColor;
      item.strokeWidth = window._p5State.strokeWidth;
    }
  }

  /**
   * Register item with PinePaper's ItemRegistry
   */
  function registerItem(item, type) {
    if (typeof app !== 'undefined' && app.registerItem) {
      app.registerItem(item, type, { source: 'p5' });
    }
    return item;
  }

  /**
   * Draw a circle
   * circle(x, y, diameter)
   */
  window.circle = function(x, y, d) {
    var item = new paper.Path.Circle({
      center: [x, y],
      radius: d / 2
    });
    applyStyle(item);
    return registerItem(item, 'circle');
  };

  /**
   * Draw an ellipse
   * ellipse(x, y, width, [height])
   */
  window.ellipse = function(x, y, w, h) {
    h = h !== undefined ? h : w;
    var mode = window._p5State.ellipseMode;
    var center = mode === 'center' ? [x, y] : [x + w / 2, y + h / 2];

    var item = new paper.Path.Ellipse({
      center: center,
      size: [w, h]
    });
    applyStyle(item);
    return registerItem(item, 'ellipse');
  };

  /**
   * Draw a rectangle
   * rect(x, y, width, height, [cornerRadius])
   */
  window.rect = function(x, y, w, h, r) {
    var mode = window._p5State.rectMode;
    var point = mode === 'center' ? [x - w / 2, y - h / 2] : [x, y];

    var options = {
      point: point,
      size: [w, h]
    };

    if (r !== undefined && r > 0) {
      options.radius = r;
    }

    var item = new paper.Path.Rectangle(options);
    applyStyle(item);
    return registerItem(item, 'rectangle');
  };

  /**
   * Draw a line
   * line(x1, y1, x2, y2)
   */
  window.line = function(x1, y1, x2, y2) {
    var item = new paper.Path.Line({
      from: [x1, y1],
      to: [x2, y2]
    });
    // Lines typically don't have fill
    if (window._p5State.strokeColor) {
      item.strokeColor = window._p5State.strokeColor;
      item.strokeWidth = window._p5State.strokeWidth;
    }
    return registerItem(item, 'line');
  };

  /**
   * Draw a triangle
   * triangle(x1, y1, x2, y2, x3, y3)
   */
  window.triangle = function(x1, y1, x2, y2, x3, y3) {
    var item = new paper.Path({
      segments: [[x1, y1], [x2, y2], [x3, y3]],
      closed: true
    });
    applyStyle(item);
    return registerItem(item, 'triangle');
  };

  /**
   * Draw a quadrilateral
   * quad(x1, y1, x2, y2, x3, y3, x4, y4)
   */
  window.quad = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var item = new paper.Path({
      segments: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
      closed: true
    });
    applyStyle(item);
    return registerItem(item, 'quad');
  };

  /**
   * Draw an arc
   * arc(x, y, width, height, startAngle, stopAngle)
   * Note: p5.js uses radians by default
   */
  window.arc = function(x, y, w, h, start, stop) {
    // Calculate the arc using Paper.js
    var cx = x;
    var cy = y;
    var rx = w / 2;
    var ry = h / 2;

    // Convert from p5's angle system to Paper.js
    // p5 uses radians where 0 is right, PI/2 is down
    var startDeg = start * 180 / Math.PI;
    var stopDeg = stop * 180 / Math.PI;

    // Create arc using path segments
    var item = new paper.Path.Arc({
      from: [
        cx + rx * Math.cos(start),
        cy + ry * Math.sin(start)
      ],
      through: [
        cx + rx * Math.cos((start + stop) / 2),
        cy + ry * Math.sin((start + stop) / 2)
      ],
      to: [
        cx + rx * Math.cos(stop),
        cy + ry * Math.sin(stop)
      ]
    });

    applyStyle(item);
    return registerItem(item, 'arc');
  };

  /**
   * Draw a point (tiny circle)
   * point(x, y)
   */
  window.point = function(x, y) {
    var size = window._p5State.strokeWidth || 1;
    var item = new paper.Path.Circle({
      center: [x, y],
      radius: size / 2
    });
    // Points use stroke color as fill
    if (window._p5State.strokeColor) {
      item.fillColor = window._p5State.strokeColor;
    }
    return registerItem(item, 'point');
  };

  // ==========================================================================
  // INITIALIZATION COMPLETE
  // ==========================================================================

  window._p5Initialized = true;
  console.log('[p5-compat] p5.js compatibility layer loaded (v1.3.1)');
  console.log('[p5-compat] Available: circle, ellipse, rect, line, triangle, quad, arc, point');
  console.log('[p5-compat] Style: fill, noFill, stroke, noStroke, strokeWeight, background');
  console.log('[p5-compat] Math: random, map, constrain, dist, lerp, radians, degrees');
})();
`;

/**
 * Generate code that initializes p5 helpers and executes user code
 */
export function generateP5DrawCode(userCode: string): string {
  return `
// Initialize p5.js compatibility layer if not already loaded
if (!window._p5Initialized) {
  ${P5_HELPERS}
}

// Execute user's p5.js-style code
(function() {
  try {
    ${userCode}

    // Save history state after drawing
    if (typeof app !== 'undefined' && app.historyManager) {
      app.historyManager.saveState();
    }

    return { success: true, message: 'p5.js code executed successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`;
}
