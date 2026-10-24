import { locales, localeMeta } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { listPublished } from "@/lib/posts";
import { categorySlugs, SITE } from "./site";
import { url } from "./seo";

/** /llms.txt — concise map of the site for LLM crawlers (llmstxt.org format). */
export async function buildLlmsTxt(): Promise<string> {
  const en = await getDict("en");
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${en.answer.body}`,
    "",
    "## Key facts",
    ...en.answer.facts.map(([k, v]) => `- ${k}: ${v}`),
    `- Phone / WhatsApp: ${SITE.phone}`,
    `- Email: ${SITE.email}`,
    `- Last updated: ${SITE.updated}`,
    "",
  ];
  for (const l of locales) {
    const d = await getDict(l);
    lines.push(`## ${localeMeta[l].label} (${localeMeta[l].native})`);
    lines.push(`- [${d.meta.title}](${url(l)}): ${d.meta.description}`);
    for (const s of categorySlugs) {
      lines.push(`- [${d.categories.items[s].name}](${url(l, `/products/${s}`)}): ${d.categories.items[s].short}`);
    }
    for (const p of await listPublished(l)) lines.push(`- [${p.title}](${url(l, `/insights/${p.slug}`)}): ${p.excerpt}`);
    lines.push("");
  }
  lines.push("## Full text", `- [llms-full.txt](${SITE.url}/llms-full.txt): all pages, FAQs and articles in plain text`, "");
  return lines.join("\n");
}

/** /llms-full.txt — all substantive content in plain text, per language. */
export async function buildLlmsFull(): Promise<string> {
  const out: string[] = [`# ${SITE.name} — full content`, `Last updated: ${SITE.updated}`, ""];
  for (const l of locales) {
    const d = await getDict(l);
    out.push(`# ${localeMeta[l].label} — ${url(l)}`, "", `## ${d.answer.title}`, d.answer.body, "");
    out.push(...d.answer.facts.map(([k, v]) => `- ${k}: ${v}`), "");
    out.push(`## ${d.categories.title}`);
    for (const s of categorySlugs) {
      const c = d.categories.items[s];
      out.push(`### ${c.name} (${url(l, `/products/${s}`)})`, c.intro, `${d.product.examples}: ${c.examples.join(", ")}`);
      out.push(`${d.product.uses}: ${c.uses.join("; ")}`);
      for (const f of c.faq) out.push(`Q: ${f.q}`, `A: ${f.a}`);
      out.push("");
    }
    out.push(`## ${d.process.title}`, ...d.process.steps.map((s, i) => `${i + 1}. ${s.t}: ${s.d}`), "");
    out.push(`## ${d.markets.title}`, d.markets.intro, ...d.markets.regions.map((r) => `- ${r.name}: ${r.countries}`), "");
    out.push(`## ${d.compliance.title}`, d.compliance.note, ...d.compliance.items.map((i) => `- ${i.t}: ${i.d}`), "");
    out.push(`## ${d.faq.title}`);
    for (const f of d.faq.items) out.push(`Q: ${f.q}`, `A: ${f.a}`);
    out.push("");
    const posts = await listPublished(l);
    if (posts.length) {
      out.push(`## ${d.insights.title}`);
      for (const p of posts) out.push(`### ${p.title} (${url(l, `/insights/${p.slug}`)})`, p.body, "");
    }
  }
  return out.join("\n");
}
