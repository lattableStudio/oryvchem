import Link from "next/link";
import { locales, localeMeta } from "@/i18n/config";
import { getStaticDict as getDict } from "@/i18n/dictionaries";

// Language-neutral: shows the message in every supported language.
export default function NotFound() {
  return (
    <section className="wrap notfound">
      <h1 className="headline">404</h1>
      {locales.map((l) => {
        const d = getDict(l);
        return (
          <p key={l} lang={l} dir={localeMeta[l].dir} className="lede">
            <Link className="btn-primary" href={`/${l}`}>{d.notFound.back}</Link> {d.notFound.title}
          </p>
        );
      })}
    </section>
  );
}
