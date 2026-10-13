/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/ui-kit-tool-schema.ts
 * sha256:    8ea15dc0dc6414b247ae2dcbded9bd51b15d991ada0e916444bf76c976fdf398
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * pinepaper_ui_kit — THE UI KIT, REACHABLE FROM THE CONNECTOR (#81).
 *
 * The kit (ui-kit-runtime.ts) draws a phone lock screen with a Dynamic Island, stacked notifications, a prompt box
 * that types, a toggle, a calendar card and an ad card, on brand. It was reachable only as `UIKit.*` inside custom
 * code, and `pinepaper_execute_custom_code` is withheld from the connector (CONNECTOR_WITHHELD), so a connector user
 * could not place a phone at all (prod retest 2026-10-04: no tool offered one).
 *
 * This is a declarative door to the same kit. The call is RECORDED on the cloud canvas like every other craft tool;
 * the replay (replay-handlers/engine.ts) lowers it to the custom-code op below, and the render door attaches the kit
 * runtime to it (ui-kit-attach.ts) exactly as it does for a designer's own UIKit code. No JavaScript is accepted from
 * the caller: every argument is whitelisted, typed and travels as JSON.
 */
import { uiKitBrandLine } from "./ui-kit-runtime.js";

export const UI_KIT_ACTIONS = ["phone_lock_screen", "notification", "prompt_box", "toggle", "ad_card", "calendar_card"] as const;
export type UiKitAction = typeof UI_KIT_ACTIONS[number];

const colour = { type: "string", description: "A colour: #rrggbb, rgb(…) or hsl(…)." };
const notificationItem = {
  type: "object",
  properties: {
    app: { type: "string", description: "App name shown on the card, e.g. \"Acme\"." },
    title: { type: "string", description: "Bold first line." },
    body: { type: "string", description: "Up to two wrapped lines." },
    time: { type: "string", description: "Right-aligned meta, e.g. \"now\" or \"9:41\"." },
    icon: { type: "string", description: "One or two characters for the app icon (default: the app's first letter)." },
    at: { type: "number", description: "Second it arrives (default: staggered from 0.6 s, 0.9 s apart)." },
  },
};

export function uiKitTools() {
  return [
    {
      name: "pinepaper_ui_kit",
      description:
        "Place product-UI mockups drawn properly, on brand: a phone LOCK SCREEN (Dynamic Island, status bar, clock, wallpaper) " +
        "with notifications that stack in and a prompt box that types, or a standalone notification, prompt box, toggle, " +
        "calendar card or ad card. One call draws the whole component; it takes its colours (and faces) from `brand`, or from " +
        "a pinepaper_brand_kit set earlier. Use it for app promos, product launch videos and \"a phone showing…\" briefs instead " +
        "of building a phone out of rectangles. Positions and sizes default to the canvas (a phone fills ~78% of a portrait " +
        "frame's height, centred); times are in seconds. Recorded on your cloud canvas and drawn by pinepaper_render. [Cost: $0.001]",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [...UI_KIT_ACTIONS],
            description:
              "phone_lock_screen: a phone, optionally with notifications[] stacked on its lock screen and a prompt typing at the bottom. " +
              "notification: one card (or items[] stacked) anywhere. prompt_box: a chat input that types `text`. toggle: an iOS switch " +
              "that flips at switchAt. ad_card: a sponsored social card. calendar_card: a day card with events.",
          },
          brand: {
            type: "object",
            description: "Brand for this component. Omit to use the canvas brand kit (pinepaper_brand_kit), else the kit's iOS defaults.",
            properties: {
              name: { type: "string" },
              primary: colour, secondary: colour, accent: colour, background: colour, text: colour,
              headingFont: { type: "string", description: "Font family for headings and the clock (default Geist)." },
              bodyFont: { type: "string", description: "Font family for body text (default Geist)." },
              radius: { description: "Corner rounding: \"sharp\" | \"soft\" | \"round\" or 0..2." },
            },
          },
          x: { type: "number", description: "Centre x in canvas px (default: canvas centre)." },
          y: { type: "number", description: "Centre y in canvas px (notification: top edge). Default: canvas centre." },
          width: { type: "number", description: "Width in px (notification, prompt_box, ad_card, calendar_card)." },
          height: { type: "number", description: "phone_lock_screen: the phone's height in px. prompt_box: the box's height." },
          dark: { type: "boolean", description: "Dark cards / dark input (default light). For a phone, the frame stays dark." },
          at: { type: "number", description: "Second the component appears (default: present from the start)." },
          until: { type: "number", description: "Second it leaves (default: stays)." },
          // phone
          time: { type: "string", description: "phone_lock_screen: status-bar time (default 9:41). notification: the card's meta." },
          date: { type: "string", description: "phone_lock_screen: the date line (default \"Tuesday, June 9\")." },
          clock: { type: "string", description: "phone_lock_screen: the big clock (default: time)." },
          wallpaper: { description: "phone_lock_screen: one colour or an array of gradient stops (default: brand primary → secondary)." },
          notifications: { type: "array", items: notificationItem, maxItems: 6, description: "phone_lock_screen: cards stacked on the lock screen, newest on top." },
          prompt: {
            type: "object",
            description: "phone_lock_screen: a prompt box at the bottom of the screen that types `text`.",
            properties: {
              text: { type: "string" }, placeholder: { type: "string" },
              typeAt: { type: "number", description: "Second typing starts (default: just after the last notification lands)." },
              cps: { type: "number", description: "Characters per second (default 22)." },
            },
          },
          // notification
          app: { type: "string" }, title: { type: "string" }, body: { type: "string" }, icon: { type: "string" },
          items: { type: "array", items: notificationItem, maxItems: 6, description: "notification: several cards stacked." },
          // prompt_box
          text: { type: "string", description: "prompt_box: the prompt that types. toggle: its label." },
          placeholder: { type: "string" },
          typeAt: { type: "number" }, cps: { type: "number" },
          // toggle
          on: { type: "boolean", description: "toggle: starts on." },
          switchAt: { type: "number", description: "toggle: second it flips." },
          size: { type: "number", description: "toggle: height in points (default 31)." },
          color: colour,
          // ad_card / calendar_card
          headline: { type: "string" }, cta: { type: "string" }, brandName: { type: "string" }, logo: { type: "string" },
          aspect: { type: "string", enum: ["square", "landscape"] },
          day: { type: "string" }, month: { type: "string" }, dayNumber: { type: "number" },
          events: { type: "array", maxItems: 5, items: { type: "object", properties: { time: { type: "string" }, title: { type: "string" } } } },
        },
        required: ["action"],
      },
    },
  ];
}

// ---------- the code it lowers to ---------------------------------------------------------------

type Args = Record<string, unknown>;
const str = (v: unknown, max = 200) => (typeof v === "string" && v.length ? v.slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const col = (v: unknown) => (typeof v === "string" && COLOUR.test(v.trim()) ? v.trim() : undefined);

/** Drop undefined so the JSON is the call's own words and nothing else. */
function clean(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}
/** JSON that is safe inside a script: no `</script>`, no line separators a parser treats as newlines. */
function js(v: unknown): string {
  const LS = new RegExp(String.fromCharCode(0x2028), "g"), PS = new RegExp(String.fromCharCode(0x2029), "g");
  return JSON.stringify(v).replace(/</g, "\\u003c").replace(LS, "\\u2028").replace(PS, "\\u2029");
}
function note(n: unknown) {
  const a = (n && typeof n === "object" ? n : {}) as Args;
  return clean({ app: str(a.app, 40), title: str(a.title, 120), body: str(a.body, 300), time: str(a.time, 20), icon: str(a.icon, 2), at: num(a.at) });
}
const common = (a: Args) => clean({ x: num(a.x), y: num(a.y), dark: bool(a.dark), at: num(a.at), until: num(a.until) });

/** The brand line for this call, or null. Built through uiKitBrandLine, which checks every value. */
function brandLine(a: Args): string | null {
  const b = a.brand && typeof a.brand === "object" ? (a.brand as Args) : null;
  if (!b) return null;
  return uiKitBrandLine({
    name: str(b.name, 80),
    colors: { primary: b.primary, secondary: b.secondary, accent: b.accent, background: b.background, text: b.text },
    fonts: { heading: b.headingFont, body: b.bodyFont ?? b.headingFont },
    radius: b.radius,
  });
}

/** Problems with a call, said before a render is paid for. Empty when the call draws. */
export function uiKitProblems(a: Args): string[] {
  const action = a.action;
  if (typeof action !== "string" || !(UI_KIT_ACTIONS as readonly string[]).includes(action)) {
    return [`ui_kit: action must be one of ${UI_KIT_ACTIONS.join(", ")} (got ${JSON.stringify(action ?? null)})`];
  }
  if (a.brand && typeof a.brand === "object" && (a.brand as Args).primary !== undefined && !brandLine(a)) {
    return [`ui_kit: brand.primary ${JSON.stringify((a.brand as Args).primary)} is not a colour — the component is drawn in the canvas brand instead`];
  }
  return [];
}

/**
 * The engine code one call draws: UIKit calls only, with JSON arguments. The kit itself is attached at the render
 * door (ui-kit-attach.ts), so this stays small and the scene's own brand_kit still applies underneath `brand`.
 * Null for an action the kit does not have.
 */
export function generateUiKitCode(args: Args): string | null {
  const a = args ?? {};
  const lines: string[] = [];
  const brand = brandLine(a);
  if (brand) lines.push(brand);
  switch (a.action) {
    case "phone_lock_screen": {
      const wall = Array.isArray(a.wallpaper) ? a.wallpaper.map(col).filter(Boolean).slice(0, 4) : col(a.wallpaper);
      lines.push(`var ph = UIKit.phone(${js(clean({ ...common(a), height: num(a.height), time: str(a.time, 12), date: str(a.date, 60), clock: str(a.clock, 12), wallpaper: Array.isArray(wall) && !wall.length ? undefined : wall }))});`);
      const notes = Array.isArray(a.notifications) ? a.notifications.slice(0, 6).map(note) : [];
      lines.push(notes.length ? `var n = UIKit.notifications(ph, ${js(notes)});` : "var n = null;");
      const p = a.prompt && typeof a.prompt === "object" ? (a.prompt as Args) : null;
      if (p && (str(p.text) || str(p.placeholder))) {
        const po = clean({ text: str(p.text, 280), placeholder: str(p.placeholder, 80), cps: num(p.cps), typeAt: num(p.typeAt) });
        lines.push(`var po = ${js(po)}; po.phone = ph; if (po.typeAt === undefined && n) po.typeAt = n.doneAt + 0.6;`);
        lines.push("UIKit.promptBox(po);");
      }
      break;
    }
    case "notification": {
      const items = Array.isArray(a.items) && a.items.length ? a.items.slice(0, 6).map(note) : [note(a)];
      lines.push(`UIKit.notifications(${js(clean({ ...common(a), items, width: num(a.width), start: num(a.at) }))});`);
      break;
    }
    case "prompt_box":
      lines.push(`UIKit.promptBox(${js(clean({ ...common(a), width: num(a.width), height: num(a.height), text: str(a.text, 280), placeholder: str(a.placeholder, 80), typeAt: num(a.typeAt), cps: num(a.cps) }))});`);
      break;
    case "toggle":
      lines.push(`UIKit.toggle(${js(clean({ ...common(a), size: num(a.size), on: bool(a.on), switchAt: num(a.switchAt), label: str(a.text, 60) ?? str(a.title, 60), color: col(a.color) }))});`);
      break;
    case "ad_card":
      lines.push(`UIKit.adCard(${js(clean({ ...common(a), width: num(a.width), headline: str(a.headline, 120), body: str(a.body, 160), cta: str(a.cta, 30), brandName: str(a.brandName, 60), logo: str(a.logo, 2), aspect: a.aspect === "square" ? "square" : undefined }))});`);
      break;
    case "calendar_card": {
      const events = Array.isArray(a.events) ? a.events.slice(0, 5).map((e) => { const r = (e && typeof e === "object" ? e : {}) as Args; return clean({ time: str(r.time, 20), title: str(r.title, 80) }); }) : undefined;
      lines.push(`UIKit.calendarCard(${js(clean({ ...common(a), width: num(a.width), day: str(a.day, 20), month: str(a.month, 20), date: num(a.dayNumber), events }))});`);
      break;
    }
    default:
      return null;
  }
  return lines.join("\n");
}
