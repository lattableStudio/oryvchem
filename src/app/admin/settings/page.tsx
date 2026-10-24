import { requireAdmin } from "@/lib/auth";
import { ConfirmButton } from "@/app/admin/ConfirmButton";
import { dbConfigured } from "@/lib/db";
import { locales, localeMeta } from "@/i18n/config";
import { SOCIAL_KEYS, loadStored, mergeSite } from "@/lib/settings";
import { saveBanner, saveSite, resetSettings } from "./actions";

const SOCIAL_LABEL: Record<(typeof SOCIAL_KEYS)[number], string> = { linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X (Twitter)", youtube: "YouTube" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to edit settings.</div>;

  const { site: stored, banner } = await loadStored();
  const def = mergeSite({});
  const cur = mergeSite(stored);

  return (
    <>
      <h1>Settings</h1>
      {sp.saved && <div className="ok">{sp.saved === "reset" ? "Reset to defaults." : "Saved"} — the public site refreshes within a few seconds.</div>}
      {sp.error && <div className="notice">{sp.error}</div>}
      <p className="muted small">Leave a field empty to use the built-in default shown as its placeholder.</p>

      <form action={saveSite} className="card">
        <h2>Contact &amp; address</h2>
        <p className="muted small">Shown in the header, footer, contact section, WhatsApp button, llms.txt and the structured data Google reads.</p>
        <div className="row2">
          <label>Phone<input name="phone" defaultValue={stored.phone ?? ""} placeholder={def.phone} dir="ltr" /></label>
          <label>WhatsApp number<input name="whatsappNumber" defaultValue={stored.whatsappNumber ? `+${stored.whatsappNumber}` : ""} placeholder={`+${def.whatsapp.replace("https://wa.me/", "")}`} dir="ltr" /></label>
        </div>
        <label>Public contact email<input name="email" type="email" defaultValue={stored.email ?? ""} placeholder={def.email} dir="ltr" /></label>
        <div className="row2">
          <label>Street / district<input name="street" defaultValue={stored.street ?? ""} placeholder={def.address.street} /></label>
          <label>City<input name="locality" defaultValue={stored.locality ?? ""} placeholder={def.address.locality} /></label>
        </div>
        <div className="row2">
          <label>Region / province<input name="region" defaultValue={stored.region ?? ""} placeholder={def.address.region} /></label>
          <label>Country code (2 letters)<input name="country" defaultValue={stored.country ?? ""} placeholder={def.address.country} maxLength={2} /></label>
        </div>
        <h3>Social profiles</h3>
        <p className="muted small">https:// links only. Set ones appear in the footer and in the Organization schema (<code>sameAs</code>).</p>
        <div className="row2">
          {SOCIAL_KEYS.map((k) => (
            <label key={k}>{SOCIAL_LABEL[k]}<input name={`social_${k}`} type="url" defaultValue={cur.social[k]} placeholder="https://…" dir="ltr" /></label>
          ))}
        </div>
        <div className="inline">
          <button className="btn">Save contact settings</button>
          <ConfirmButton message="Reset these settings to the built-in defaults?" className="btn ghost" formAction={resetSettings.bind(null, "site")} formNoValidate>Reset to defaults</ConfirmButton>
        </div>
      </form>

      <form action={saveBanner} className="card">
        <h2>Announcement banner</h2>
        <p className="muted small">A slim bar above the header on every public page — for holidays, new products or trade-fair news. Empty languages fall back to English.</p>
        <label className="inline"><input type="checkbox" name="enabled" defaultChecked={banner.enabled} /> Show the banner</label>
        {locales.map((l) => (
          <label key={l}>Text — {localeMeta[l].native}
            <input name={`text_${l}`} defaultValue={banner.text[l]} maxLength={300} dir={localeMeta[l].dir} />
          </label>
        ))}
        <label>Link (optional, https:// or /path)<input name="link" defaultValue={banner.link} placeholder="https://… or /en/insights" dir="ltr" /></label>
        <div className="inline">
          <button className="btn">Save banner</button>
          <button className="btn ghost" formAction={resetSettings.bind(null, "banner")} formNoValidate>Remove banner</button>
        </div>
      </form>
    </>
  );
}
