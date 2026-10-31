#!/usr/bin/env node
// SEO regression check. Zero dependencies; read-only GETs only.
//
//   npm run seo:check                                   # against http://localhost:3000 (run `npm start` first)
//   SEO_BASE_URL=https://www.oryvchem.com npm run seo:check   # against production
//
// SEO_BASE_URL  where to send requests (default http://localhost:3000)
// SEO_SITE_URL  canonical origin the pages declare (default https://www.oryvchem.com)
// SEO_APEX_URL  optional bare-domain URL that must 308 to SEO_SITE_URL (e.g. https://oryvchem.com)
// Exits 1 if any check fails.

const BASE = (process.env.SEO_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SITE = (process.env.SEO_SITE_URL ?? "https://www.oryvchem.com").replace(/\/$/, "");
const APEX = process.env.SEO_APEX_URL?.replace(/\/$/, "");
const LOCALES = { en: "ltr", ar: "rtl", fr: "ltr" };
const LIMITS = { title: [10, 70], description: [50, 160] };
const UA = "Mozilla/5.0 (compatible; OryvchemSeoCheck/1.0)";
const CONCURRENCY = 4;

const failures = [];
let passed = 0;
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const toBase = (u) => (u.startsWith(SITE) ? BASE + u.slice(SITE.length) : u);
const get = (u, opts = {}) => fetch(toBase(u), { redirect: "manual", headers: { "User-Agent": UA }, ...opts });

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1].toLowerCase(), decode(m[2])]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => attrs(m[0]));
const len = (s) => [...s].length;

function parseHead(html) {
  const metas = tags(html, "meta");
  const links = tags(html, "link");
  const meta = (k) => metas.find((m) => m.name === k || m.property === k)?.content;
  return {
    html: tags(html, "html")[0] ?? {},
    title: decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim(),
    description: meta("description") ?? "",
    robots: meta("robots") ?? "",
    canonicals: links.filter((l) => l.rel === "canonical").map((l) => l.href),
    hreflang: Object.fromEntries(links.filter((l) => l.rel === "alternate" && l.hreflang).map((l) => [l.hreflang, l.href])),
    ogImage: meta("og:image"),
    h1: (html.match(/<h1\b/gi) ?? []).length,
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  };
}

function ldTypes(blocks, where) {
  const out = [];
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === "object") {
      if (x["@graph"]) return walk(x["@graph"]);
      if (x["@type"]) out.push(...[].concat(x["@type"]));
    }
  };
  for (const b of blocks) {
    try {
      walk(JSON.parse(b));
    } catch (e) {
      fail(where, `JSON-LD does not parse (${e.message})`);
    }
  }
  return out;
}

async function pool(items, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await fn(queue.shift()); }));
}

// Expected page-level JSON-LD per template (Organization/WebSite come from the layout on every page).
function expectedTypes(path) {
  if (/^\/(en|ar|fr)$/.test(path)) return ["Organization", "WebSite", "WebPage", "ItemList"];
  if (/^\/(en|ar|fr)\/products\/[^/]+$/.test(path)) return ["Service", "BreadcrumbList", "FAQPage"];
  if (/^\/(en|ar|fr)\/insights$/.test(path)) return ["CollectionPage", "BreadcrumbList"];
  if (/^\/(en|ar|fr)\/insights\/[^/]+$/.test(path)) return ["Article", "BreadcrumbList"];
  return ["WebPage", "BreadcrumbList"];
}

async function checkPage(loc, pages) {
  const path = loc.slice(SITE.length);
  const where = path || "/";
  const res = await get(loc);
  if (res.status !== 200) return fail(where, `status ${res.status} (sitemap URLs must return 200 without redirect)`);
  const xrt = res.headers.get("x-robots-tag") ?? "";
  if (/noindex/i.test(xrt)) fail(where, `X-Robots-Tag: ${xrt}`);
  const h = parseHead(await res.text());
  const before = failures.length; // no awaits below, so only this page's failures can land in between
  pages.set(loc, h);
  const locale = path.split("/")[1];

  if (h.html.lang !== locale) fail(where, `html lang="${h.html.lang}" (expected ${locale})`);
  if (LOCALES[locale] && h.html.dir !== LOCALES[locale]) fail(where, `html dir="${h.html.dir}" (expected ${LOCALES[locale]})`);
  if (/noindex/i.test(h.robots)) fail(where, `meta robots "${h.robots}"`);
  if (h.canonicals.length !== 1) fail(where, `${h.canonicals.length} canonical tags`);
  else if (h.canonicals[0] !== loc) fail(where, `canonical ${h.canonicals[0]} ≠ sitemap URL ${loc}`);
  for (const [k, [min, max]] of Object.entries(LIMITS)) {
    const n = len(h[k]);
    if (n < min || n > max) fail(where, `${k} length ${n} (want ${min}–${max}): "${h[k].slice(0, 90)}${n > 90 ? "…" : ""}"`);
  }
  if (h.h1 !== 1) fail(where, `${h.h1} <h1> elements`);
  if (!h.ogImage) fail(where, "no og:image");
  const types = ldTypes(h.jsonld, where);
  for (const t of expectedTypes(path)) if (!types.includes(t)) fail(where, `missing JSON-LD @type ${t} (has ${types.join(", ") || "none"})`);
  const langs = Object.keys(h.hreflang);
  if (langs.length) {
    if (!h.hreflang["x-default"]) fail(where, "hreflang set without x-default");
    if (h.hreflang[locale] !== loc) fail(where, `hreflang="${locale}" is ${h.hreflang[locale]} (must self-reference)`);
  }
  if (failures.length === before) passed++;
}

function checkReciprocity(pages) {
  for (const [loc, h] of pages) {
    for (const [lang, href] of Object.entries(h.hreflang)) {
      if (lang === "x-default") continue;
      const other = pages.get(href);
      const where = loc.slice(SITE.length);
      if (!other) { fail(where, `hreflang ${lang} → ${href} is not in the sitemap`); continue; }
      const back = Object.entries(other.hreflang).find(([, u]) => u === loc);
      if (!back) fail(where, `hreflang ${lang} → ${href} does not link back (non-reciprocal)`);
    }
  }
}

async function checkSitemap() {
  const res = await get(`${SITE}/sitemap.xml`);
  if (res.status !== 200) { fail("/sitemap.xml", `status ${res.status}`); return []; }
  const xml = await res.text();
  const before = failures.length;
  if (!xml.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) fail("/sitemap.xml", "missing sitemap namespace");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  if (!locs.length) fail("/sitemap.xml", "no <loc> entries");
  const dupes = locs.filter((u, i) => locs.indexOf(u) !== i);
  if (dupes.length) fail("/sitemap.xml", `duplicate URLs: ${dupes.join(", ")}`);
  for (const u of locs) if (!u.startsWith(`${SITE}/`)) fail("/sitemap.xml", `URL on wrong origin: ${u}`);
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    if (Number.isNaN(Date.parse(m[1]))) fail("/sitemap.xml", `bad lastmod ${m[1]}`);
    else if (Date.parse(m[1]) > Date.now() + 86_400_000) fail("/sitemap.xml", `lastmod in the future: ${m[1]}`);
  }
  if (failures.length === before) passed++;
  return locs;
}

async function checkRobots() {
  const res = await get(`${SITE}/robots.txt`);
  if (res.status !== 200) return fail("/robots.txt", `status ${res.status}`);
  const txt = await res.text();
  const before = failures.length;
  if (!txt.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail("/robots.txt", "no Sitemap line for the canonical origin");
  // A bare "Disallow: /" in any group would block the whole site for that crawler.
  if (/^Disallow:\s*\/\s*$/im.test(txt)) fail("/robots.txt", "contains a site-wide Disallow: /");
  if (failures.length === before) passed++;
}

async function checkMisc() {
  const nf = await get(`${SITE}/en/__seo-check-missing__`);
  if (nf.status !== 404) fail("404", `unknown path returned ${nf.status}`); else passed++;

  const admin = await get(`${SITE}/admin/login`);
  if (!/noindex/i.test(admin.headers.get("x-robots-tag") ?? "")) fail("/admin/login", "missing X-Robots-Tag: noindex"); else passed++;

  for (const p of ["/llms.txt", "/llms-full.txt"]) {
    const r = await get(`${SITE}${p}`);
    if (r.status !== 200 || !(r.headers.get("content-type") ?? "").startsWith("text/plain")) fail(p, `status ${r.status}, type ${r.headers.get("content-type")}`);
    else passed++;
  }

  const root = await get(`${SITE}/`, { headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" } });
  const to = root.headers.get("location") ?? "";
  if (![307, 308].includes(root.status) || !/\/fr$/.test(to)) fail("/", `Accept-Language fr → ${root.status} ${to} (expected redirect to /fr)`); else passed++;

  if (APEX) {
    const r = await fetch(`${APEX}/en`, { redirect: "manual", headers: { "User-Agent": UA } });
    const loc = r.headers.get("location") ?? "";
    if (r.status !== 308 && r.status !== 301) fail("apex", `${APEX}/en returned ${r.status}, expected 308 → ${SITE}/en`);
    else if (loc !== `${SITE}/en`) fail("apex", `${APEX}/en redirects to ${loc}, expected ${SITE}/en`);
    else passed++;
  }
}

function unitChecks() {
  // Mirrors snippet() in src/lib/seo.ts (kept dependency-free so this script runs without a TS toolchain).
  const snippet = (text, max = 155) => {
    const t = text.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
  };
  const short = "Short intro that fits.";
  if (snippet(short) !== short) fail("unit", "snippet() altered a short string");
  const long = "word ".repeat(60);
  const s = snippet(long);
  if (!s.endsWith("…") || s.length > 156 || / …$/.test(s)) fail("unit", `snippet() bad truncation: "${s.slice(-20)}"`);
  else passed++;
}

const t0 = Date.now();
console.log(`SEO check → ${BASE} (canonical origin ${SITE})`);
try {
  unitChecks();
  await checkRobots();
  const locs = await checkSitemap();
  const pages = new Map();
  await pool(locs, (u) => checkPage(u, pages));
  checkReciprocity(pages);
  await checkMisc();
  console.log(`Pages checked: ${pages.size}/${locs.length}`);
} catch (e) {
  fail("runner", e.cause?.code === "ECONNREFUSED" ? `cannot reach ${BASE} — start the app first (npm start)` : e.stack);
}

for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`\n${passed} checks passed, ${failures.length} failed (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
process.exit(failures.length ? 1 : 0);
