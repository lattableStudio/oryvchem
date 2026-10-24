"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGETS =
  ".section-head, .cat-card, .market, .step, .facts, .compliance-list li, .compliance-note, .faq details, .contact-info, .inquiry, .prose";

/** Scroll-reveal + header shadow. Pure progressive enhancement: without JS everything stays visible. */
export function Enhance() {
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => document.querySelector("header.nav")?.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>(TARGETS).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--d", `${(i % 4) * 70}ms`);
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
