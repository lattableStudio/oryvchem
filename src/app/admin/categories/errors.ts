export const ERRORS: Record<string, string> = {
  slug: "Slug must be lowercase letters, numbers and single dashes (for example “packaging-materials”).",
  dup: "A category with that slug already exists.",
  name: "The English name is required.",
  code: "Tab code must be 2–4 letters.",
  db: "Could not save. Check that DATABASE_URL is set and the database is reachable.",
};
