import type { Locale } from "../config";
import type { Dict } from "./en";
import { en } from "./en";
import { ar } from "./ar";
import { fr } from "./fr";

const dicts: Record<Locale, Dict> = { en, ar, fr };

/** Built-in copy (no database). Use `getDict` from `@/lib/content` for the editable version. */
export function getStaticDict(locale: Locale): Dict {
  return dicts[locale];
}
export type { Dict };
