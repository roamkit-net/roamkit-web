"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { useFieldContext } from "@/components/ui/Field";

/**
 * Cap2.3 canonical Input control (ADR 016 / Cap2b inventory).
 *
 * Bare control — compose with `Field` / `Label` / `HelpText` / `ErrorMessage`.
 *
 * ```tsx
 * <Field state="error">
 *   <Label required>Email</Label>
 *   <Input type="email" name="email" autoComplete="email" />
 *   <ErrorMessage>Enter a valid email.</ErrorMessage>
 * </Field>
 * ```
 *
 * Themes via `tone` (not color names): `auth` = `--auth-*` focus, `app` = sky focus.
 * Validation via `state` (not `error={true}`).
 * Slots: `startAdornment` / `endAdornment` (any ReactNode).
 *
 * Out of scope (composition later): Masked / Phone / OTP / Search Box / Country.
 * Gaps: deposit `rounded-xl` sky fields — Cap2.3+ size later.
 */

export type InputTone = "app" | "auth";
export type ControlState = "default" | "error" | "success" | "warning";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> & {
  state?: ControlState;
  tone?: InputTone;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
};

const TONE_FOCUS: Record<InputTone, string> = {
  auth: "border-slate-300 ring-[var(--auth-focus-ring)] focus:border-[var(--auth-primary)] focus:ring-2",
  app: "border-slate-300 ring-sky-600 focus:border-sky-500 focus:ring-2",
};

const STATE_FOCUS: Record<Exclude<ControlState, "default">, string> = {
  error: "border-red-300 ring-red-500 focus:border-red-500 focus:ring-2",
  success:
    "border-emerald-300 ring-emerald-500 focus:border-emerald-500 focus:ring-2",
  warning:
    "border-amber-300 ring-amber-500 focus:border-amber-500 focus:ring-2",
};

/**
 * Shared control classes for `<input>` / `<textarea>` and domain wrappers
 * (e.g. PasswordField).
 */
export function inputControlClassName({
  tone = "auth",
  state = "default",
  hasStartAdornment = false,
  hasEndAdornment = false,
  className = "",
}: {
  tone?: InputTone;
  state?: ControlState;
  hasStartAdornment?: boolean;
  hasEndAdornment?: boolean;
  className?: string;
} = {}): string {
  const focus =
    state === "default" ? TONE_FOCUS[tone] : STATE_FOCUS[state];
  return [
    "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm outline-none",
    focus,
    hasStartAdornment ? "pl-10" : null,
    hasEndAdornment ? "pr-10" : null,
    "disabled:cursor-not-allowed disabled:opacity-60",
    "read-only:bg-slate-50",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    state: stateProp,
    tone: toneProp,
    startAdornment,
    endAdornment,
    id,
    className = "",
    disabled,
    readOnly,
    type = "text",
    ...rest
  },
  ref,
) {
  const field = useFieldContext();
  const state = stateProp ?? field?.state ?? "default";
  const tone = toneProp ?? field?.tone ?? "auth";
  const inputId = id ?? field?.id;
  const describedBy = field?.describedBy;
  const hasStart = Boolean(startAdornment);
  const hasEnd = Boolean(endAdornment);

  const control = (
    <input
      {...rest}
      ref={ref}
      id={inputId}
      type={type}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={state === "error" ? true : undefined}
      aria-describedby={describedBy}
      className={inputControlClassName({
        tone,
        state,
        hasStartAdornment: hasStart,
        hasEndAdornment: hasEnd,
        className,
      })}
    />
  );

  if (!hasStart && !hasEnd) {
    return control;
  }

  return (
    <div className="relative">
      {hasStart ? (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          {startAdornment}
        </div>
      ) : null}
      {control}
      {hasEnd ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
          {endAdornment}
        </div>
      ) : null}
    </div>
  );
});
