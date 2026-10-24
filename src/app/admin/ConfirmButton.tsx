"use client";

import type { ButtonHTMLAttributes } from "react";

/** Submit button that asks for confirmation first. Accepts the usual button props (formAction, formNoValidate…). */
export function ConfirmButton({ message, children, ...rest }: { message: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
