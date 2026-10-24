"use client";

import { useState, type FormEvent } from "react";
import type { Dict } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Status = "idle" | "sending" | "ok" | "error" | "invalid";

export function InquiryForm({
  t,
  locale,
  variant = "quote",
  defaultProduct = "",
  idPrefix = "f",
}: {
  t: Dict["form"];
  locale: Locale;
  variant?: "quote" | "callback";
  defaultProduct?: string;
  idPrefix?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [bad, setBad] = useState<string[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    setBad([]);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: variant, locale, page: location.pathname }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setStatus("ok");
        form.reset();
      } else if (res.status === 422) {
        setBad(json.fields ?? []);
        setStatus("invalid");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const id = (n: string) => `${idPrefix}-${n}`;
  const err = (n: string) => bad.includes(n);
  const field = (
    n: string,
    label: string,
    ph: string,
    opts: { type?: string; required?: boolean; area?: boolean; auto?: string; dir?: "ltr" } = {},
  ) => (
    <div className={`field${err(n) ? " has-error" : ""}`}>
      <label htmlFor={id(n)}>{label}</label>
      {opts.area ? (
        <textarea id={id(n)} name={n} placeholder={ph} rows={4} maxLength={5000} aria-invalid={err(n)} />
      ) : (
        <input
          id={id(n)}
          name={n}
          type={opts.type ?? "text"}
          placeholder={ph}
          required={opts.required}
          autoComplete={opts.auto}
          dir={opts.dir}
          defaultValue={n === "product" ? defaultProduct : undefined}
          aria-invalid={err(n)}
        />
      )}
      {err(n) && <span className="field-error">{n === "email" ? t.invalidEmail : t.required}</span>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className={`inquiry inquiry-${variant}`}>
      {/* honeypot — hidden from people, filled by bots */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {variant === "callback" ? (
        <div className="callback-row">
          {field("name", t.name, t.namePh, { required: true, auto: "name" })}
          {field("phone", t.phone, t.phonePh, { type: "tel", required: true, auto: "tel", dir: "ltr" })}
        </div>
      ) : (
        <>
          <div className="two">
            {field("name", t.name, t.namePh, { required: true, auto: "name" })}
            {field("company", t.company, t.companyPh, { auto: "organization" })}
          </div>
          <div className="two">
            {field("email", t.email, t.emailPh, { type: "email", required: true, auto: "email", dir: "ltr" })}
            {field("phone", t.phone, t.phonePh, { type: "tel", auto: "tel", dir: "ltr" })}
          </div>
          <div className="two">
            {field("product", t.product, t.productPh)}
            {field("country", t.country, t.countryPh)}
          </div>
          {field("details", t.details, t.detailsPh, { area: true })}
        </>
      )}
      <button className="btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? t.sending : variant === "callback" ? t.callbackSend : t.send}
      </button>
      <p className="form-note">{t.privacy}</p>
      <div role="status" aria-live="polite" className={`form-status ${status}`}>
        {status === "ok" && t.success}
        {status === "error" && t.error}
        {status === "invalid" && t.invalid}
      </div>
    </form>
  );
}
