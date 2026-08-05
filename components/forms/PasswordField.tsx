"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export type PasswordFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.8 11.8 0 0 1-4.2 5.1" />
        <path d="M6.1 6.1A11.8 11.8 0 0 0 1 12.5C2.7 16.9 7 20 12 20c1.4 0 2.7-.2 3.9-.7" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 12.5C3.7 8.1 7.9 5 12 5s8.3 3.1 10 7.5c-1.7 4.4-5.9 7.5-10 7.5S3.7 16.9 2 12.5Z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

/**
 * Domain composition: password visibility toggle on top of ui/Input.
 * Not a Cap2 primitive (No Domain Logic).
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    {
      label,
      hint,
      id,
      className,
      spellCheck = false,
      autoCorrect = "off",
      autoCapitalize = "none",
      minLength = 8,
      required = true,
      ...rest
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? "password";

    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={inputId}>{label}</Label>
          {hint ? <div className="text-sm">{hint}</div> : null}
        </div>
        <Input
          {...rest}
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          tone="auth"
          spellCheck={spellCheck}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          minLength={minLength}
          required={required}
          className={className}
          endAdornment={
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="flex items-center px-3 text-slate-500 hover:text-slate-700"
            >
              <EyeIcon open={visible} />
            </button>
          }
        />
      </div>
    );
  },
);
