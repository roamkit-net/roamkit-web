import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Cap2.3 canonical Input (ADR 016 / Cap2b inventory).
 *
 * Scope: text / email / password control chrome. Textarea, search, OTP → later.
 *
 * ```tsx
 * <Input label="Email" type="email" name="email" autoComplete="email" required />
 * ```
 *
 * Themes via `tone` (not color names): `auth` = cyan focus (AuthForm), `app` = sky focus.
 *
 * Gaps (do not expand API yet):
 * - PasswordField show/hide remains a domain wrapper (uses `inputControlClassName`)
 * - Deposit / voucher `rounded-xl` sky fields — Cap2.3+ or tone=app size later
 * - Checkbox — not an Input
 */

export type InputTone = "app" | "auth";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  tone?: InputTone;
};

const TONE_FOCUS: Record<InputTone, string> = {
  auth: "ring-cyan-500 focus:border-cyan-500 focus:ring-2",
  app: "ring-sky-600 focus:border-sky-500 focus:ring-2",
};

const ERROR_FOCUS =
  "border-red-300 ring-red-500 focus:border-red-500 focus:ring-2";

/**
 * Shared control classes for `<input>` and wrappers (e.g. PasswordField).
 */
export function inputControlClassName({
  tone = "auth",
  error = false,
  hasLeading = false,
  hasTrailing = false,
  className = "",
}: {
  tone?: InputTone;
  error?: boolean;
  hasLeading?: boolean;
  hasTrailing?: boolean;
  className?: string;
} = {}): string {
  return [
    "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm outline-none",
    error ? ERROR_FOCUS : `border-slate-300 ${TONE_FOCUS[tone]}`,
    hasLeading ? "pl-10" : null,
    hasTrailing ? "pr-10" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leadingIcon,
    trailingIcon,
    tone = "auth",
    id,
    className = "",
    disabled,
    required,
    type = "text",
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const control = (
    <input
      {...rest}
      ref={ref}
      id={inputId}
      type={type}
      disabled={disabled}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={inputControlClassName({
        tone,
        error: Boolean(error),
        hasLeading: Boolean(leadingIcon),
        hasTrailing: Boolean(trailingIcon),
        className,
      })}
    />
  );

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required ? (
          <span className="sr-only"> (required)</span>
        ) : null}
      </label>
      {leadingIcon || trailingIcon ? (
        <div className="relative">
          {leadingIcon ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              {leadingIcon}
            </div>
          ) : null}
          {control}
          {trailingIcon ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              {trailingIcon}
            </div>
          ) : null}
        </div>
      ) : (
        control
      )}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
