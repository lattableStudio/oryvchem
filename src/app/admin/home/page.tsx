import { requireAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { HOME_SECTIONS, loadHomeLayout } from "@/lib/homeLayout";
import { HomeLayoutEditor } from "./HomeLayoutEditor";

export default async function HomeLayoutPage() {
  await requireAdmin();
  if (!dbConfigured()) {
    return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to change the home page layout.</div>;
  }
  const layout = await loadHomeLayout();
  const label = (id: string) => HOME_SECTIONS.find((s) => s.id === id)?.label ?? id;
  return (
    <>
      <h1>Home page layout</h1>
      <p className="muted">Reorder or hide the sections below the hero. The hero and the product ticker always stay at the top. Hiding a section also removes its structured data (for example the FAQ schema).</p>
      <p className="muted small">Menu links point to section anchors; a link to a hidden section simply stays on the page without scrolling.</p>
      <HomeLayoutEditor initial={layout.map((l) => ({ id: l.id, label: label(l.id), visible: l.visible }))} />
    </>
  );
}
