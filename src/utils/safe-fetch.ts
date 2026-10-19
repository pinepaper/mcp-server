/**
 * One guarded fetch for every URL a model hands the server (CWE-918).
 *
 * The server fetches remote images, SVGs and media itself, because the
 * studio page's CSP refuses a third-party fetch. That makes this process a
 * proxy for whatever URL arrives in a tool call, and this process can reach
 * things the model's user never meant to expose: the loopback services of the
 * machine it runs on, the LAN, and a cloud host's metadata endpoint, which
 * hands out credentials. So a URL is resolved here and refused when any
 * address it resolves to is private, loopback, link-local or reserved.
 *
 * Three things a plain address check misses, and how each is closed:
 *  - REDIRECTS. A public URL can 302 to http://127.0.0.1/. Redirects are
 *    followed here, one hop at a time (at most MAX_REDIRECTS), and every
 *    Location is checked by the same rules before it is connected to.
 *  - DNS REBINDING. A name can resolve to a public address for the check and
 *    to 127.0.0.1 for the connection. The connection is pinned: undici's
 *    connect.lookup returns exactly the addresses that were checked, so the
 *    socket cannot go anywhere else. (Bun's undici shim ignores
 *    connect.lookup; the published bin runs under node, where it holds.
 *    Under bun this degrades to check-then-connect.)
 *  - MAPPED FORMS. ::ffff:127.0.0.1 and 64:ff9b::7f00:1 are loopback in
 *    IPv6 clothing. BlockList matches IPv4 rules against mapped addresses;
 *    the NAT64 and 6to4 prefixes are unpacked and checked as IPv4.
 *
 * The opt-in: PINEPAPER_ALLOW_PRIVATE_NETWORK=1 allows loopback, private and
 * LAN addresses, for a local dev server. Cloud metadata addresses stay
 * refused with it set: nothing a design tool does needs them.
 *
 * undici and node:dns are loaded lazily. This module is also bundled into a
 * Cloudflare Worker, which has neither in the same form; there, the literal
 * address is still checked and the platform's own fetch does the rest
 * (Workers cannot open connections to private addresses).
 *
 * Keep this file to node builtins and undici, with no relative imports: the
 * pinning test loads it in a plain node process (bun cannot exercise pinning).
 */
import { BlockList, isIP } from 'node:net';

export const MAX_REDIRECTS = 5;

export interface ResolvedAddress { address: string; family: 4 | 6 }

/** Seams for tests: DNS, and the pinned transport. */
export const safeFetchDeps: {
  lookup: (host: string) => Promise<ResolvedAddress[]>;
  request: (url: URL, addresses: ResolvedAddress[], init: RequestInit) => Promise<Response>;
} = {
  lookup: defaultLookup,
  request: pinnedRequest,
};

const PRIVATE = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) PRIVATE.addSubnet(net, bits, 'ipv4');
for (const [net, bits] of [
  ['::', 96], ['100::', 64], ['2001:db8::', 32], ['fc00::', 7],
  ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
] as const) PRIVATE.addSubnet(net, bits, 'ipv6');

/** Refused even with the opt-in. */
const METADATA = new BlockList();
for (const a of ['169.254.169.254', '169.254.170.2', '100.100.100.200']) METADATA.addAddress(a, 'ipv4');
METADATA.addAddress('fd00:ec2::254', 'ipv6');

function env(name: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

export function privateNetworkAllowed(): boolean {
  return /^(1|true|yes)$/i.test(env('PINEPAPER_ALLOW_PRIVATE_NETWORK') ?? '');
}

/** The IPv4 address an IPv6 address carries, for NAT64 (64:ff9b::/96) and 6to4 (2002::/16). */
function embeddedIPv4(address: string): string | null {
  const groups = expandIPv6(address);
  if (!groups) return null;
  const v4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (groups[0] === 0x64 && groups[1] === 0xff9b && groups.slice(2, 6).every((g) => g === 0)) return v4(groups[6], groups[7]);
  if (groups[0] === 0x2002) return v4(groups[1], groups[2]);
  return null;
}

function expandIPv6(address: string): number[] | null {
  let a = address.toLowerCase().split('%')[0];
  // A trailing dotted quad (::ffff:1.2.3.4) becomes two groups.
  const dotted = a.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const o = dotted[2].split('.').map(Number);
    a = `${dotted[1]}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const [head, tail] = a.includes('::') ? a.split('::') : [a, null];
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const fill = tail === null ? [] : new Array(8 - h.length - t.length).fill('0');
  const all = [...h, ...fill, ...t];
  if (all.length !== 8) return null;
  return all.map((g) => parseInt(g, 16));
}

/** 'metadata' | 'private' | null (public). */
export function classifyAddress(address: string): 'metadata' | 'private' | null {
  const family = isIP(address);
  if (family === 0) return 'private'; // not an address at all: never connect to it
  const type = family === 4 ? 'ipv4' : 'ipv6';
  if (METADATA.check(address, type)) return 'metadata';
  if (PRIVATE.check(address, type)) return 'private';
  if (family === 6) {
    const v4 = embeddedIPv4(address);
    if (v4) return classifyAddress(v4);
  }
  return null;
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

async function defaultLookup(host: string): Promise<ResolvedAddress[]> {
  let dns: typeof import('node:dns/promises');
  try {
    dns = await import('node:dns/promises');
  } catch {
    return []; // no resolver (a Worker): the literal check already ran
  }
  const all = await dns.lookup(host, { all: true, verbatim: true });
  return all.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
}

/**
 * Resolve a URL's host and refuse it unless every address is public.
 * Returns the checked addresses, which the connection is then pinned to.
 */
export async function checkUrl(input: string | URL): Promise<ResolvedAddress[]> {
  let url: URL;
  try {
    url = typeof input === 'string' ? new URL(input) : input;
  } catch {
    throw new UnsafeUrlError(`refused "${String(input)}" — not a valid URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`refused ${url.href} — only http and https URLs are fetched.`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const literal = isIP(host);
  let addresses: ResolvedAddress[];
  if (literal) {
    addresses = [{ address: host, family: literal === 6 ? 6 : 4 }];
  } else {
    addresses = await safeFetchDeps.lookup(host);
    if (!addresses.length && /(^|\.)localhost$/i.test(host)) addresses = [{ address: '127.0.0.1', family: 4 }];
  }
  const allowPrivate = privateNetworkAllowed();
  for (const { address } of addresses) {
    const kind = classifyAddress(address);
    if (kind === 'metadata') {
      throw new UnsafeUrlError(`refused ${url.href} — it resolves to ${address}, a cloud metadata address. This is refused even with PINEPAPER_ALLOW_PRIVATE_NETWORK=1.`);
    }
    if (kind === 'private' && !allowPrivate) {
      throw new UnsafeUrlError(`refused ${url.href} — it resolves to ${address}, a private address. Set PINEPAPER_ALLOW_PRIVATE_NETWORK=1 to allow local hosts.`);
    }
  }
  return addresses;
}

const REDIRECT = new Set([301, 302, 303, 307, 308]);
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

/**
 * fetch(), with every hop's address checked and the connection pinned to it.
 * Redirects are followed here; `init.redirect` is ignored. The body is read
 * in full before returning, so the per-request connection can be closed.
 */
export async function safeFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  let url = typeof input === 'string' ? new URL(input) : input;
  for (let hop = 0; ; hop++) {
    const addresses = await checkUrl(url);
    const res = await safeFetchDeps.request(url, addresses, { ...init, redirect: 'manual' });
    if (!REDIRECT.has(res.status)) return res;
    const location = res.headers.get('location');
    if (!location) return res;
    if (hop >= MAX_REDIRECTS) {
      throw new UnsafeUrlError(`refused ${input} — more than ${MAX_REDIRECTS} redirects.`);
    }
    url = new URL(location, url);
  }
}

async function pinnedRequest(url: URL, addresses: ResolvedAddress[], init: RequestInit): Promise<Response> {
  const undici = await import('undici').catch(() => null);
  // No undici, or no resolver (a Worker): the platform fetch, which cannot
  // reach private addresses.
  if (!undici || !addresses.length) return fetch(url, init);
  const agent = new undici.Agent({
    connect: {
      lookup: (_host: string, opts: { all?: boolean }, cb: (...a: unknown[]) => void) => {
        if (opts?.all) cb(null, addresses);
        else cb(null, addresses[0].address, addresses[0].family);
      },
    } as never,
  });
  try {
    const res = await undici.fetch(url, { ...(init as object), dispatcher: agent } as never);
    const body = NULL_BODY.has(res.status) ? null : Buffer.from(await res.arrayBuffer());
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers as unknown as HeadersInit });
  } finally {
    // Bun's undici shim has no close().
    await (agent as { close?: () => Promise<void> }).close?.().catch(() => {});
  }
}
