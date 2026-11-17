/**
 * IS THIS A COLOUR (COLORBAD37)? An invalid colour string ("#notacolor") was accepted with success and no warning on
 * create and keyframe routes, and drawn black. Bogus easing names are refused at validation; colours now are too.
 *
 * A colour is: a hex (#rgb, #rgba, #rrggbb, #rrggbbaa); a CSS colour function (rgb, rgba, hsl, hsla, hwb, lab, lch,
 * oklab, oklch, color) with balanced parentheses; a CSS named colour; or transparent / none / currentcolor. Gradient
 * objects are not strings and are not judged here.
 */

const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown '
  + 'burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod '
  + 'darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon '
  + 'darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray '
  + 'dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green '
  + 'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon '
  + 'lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon '
  + 'lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta '
  + 'maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen '
  + 'mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab '
  + 'orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum '
  + 'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna '
  + 'silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet '
  + 'wheat white whitesmoke yellow yellowgreen transparent none currentcolor').split(' '));

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*[^()]+\s*\)$/i;

export function isCssColor(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return HEX.test(v) || FN.test(v) || NAMED.has(v.toLowerCase());
}

export const COLOR_ERROR_HINT = 'Use a hex colour (#rrggbb), rgb() / hsl(), or a CSS colour name.';

/** Property keys whose string value must be a colour, on create, modify and keyframes. */
export const COLOR_PROPERTY_KEYS: ReadonlySet<string> = new Set([
  'color', 'fillColor', 'strokeColor', 'shadowColor', 'backgroundColor', 'textColor', 'outlineColor', 'glowColor',
]);

/** "<key> "<value>" is not a colour" for each colour-keyed string in a properties record that is not one. */
export function colorProblems(props: Record<string, unknown> | undefined | null): string[] {
  if (!props || typeof props !== 'object') return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (COLOR_PROPERTY_KEYS.has(k) && typeof v === 'string' && !isCssColor(v)) {
      out.push(`${k} ${JSON.stringify(v)} is not a colour, and the studio would draw it black. ${COLOR_ERROR_HINT}`);
    }
  }
  return out;
}
