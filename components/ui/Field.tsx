"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";

import type { ControlState, InputTone } from "@/components/ui/Input";

/**
 * Cap2.3 layout primitive for form controls (ADR 016).
 *
 * ```tsx
 * <Field state="error">
 *   <Label required>Email</Label>
 *   <Input type="email" name="email" />
 *   <HelpText>We never share your email.</HelpText>
 *   <ErrorMessage>Enter a valid email.</ErrorMessage>
 * </Field>
 * ```
 *
 * No domain logic. Input / Textarea stay control primitives.
 */

export type FieldContextValue = {
  id: string;
  state: ControlState;
  tone: InputTone;
  describedBy?: string;
  helpId: string;
  errorId: string;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  children?: ReactNode;
};

export function Label({
  required,
  className = "",
  children,
  htmlFor,
  ...rest
}: LabelProps) {
  const field = useFieldContext();
  return (
    <label
      {...rest}
      htmlFor={htmlFor ?? field?.id}
      className={["block text-sm font-medium text-slate-700", className]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      {children}
      {required ? <span className="sr-only"> (required)</span> : null}
    </label>
  );
}

export type HelpTextProps = HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
};

export function HelpText({
  className = "",
  children,
  id,
  ...rest
}: HelpTextProps) {
  const field = useFieldContext();
  return (
    <p
      id={id ?? field?.helpId}
      className={["mt-1.5 text-sm text-slate-500", className]
        .filter(Boolean)
        .join(" ")
        .trim()}
      {...rest}
    >
      {children}
    </p>
  );
}

export type ErrorMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
};

export function ErrorMessage({
  className = "",
  children,
  id,
  ...rest
}: ErrorMessageProps) {
  const field = useFieldContext();
  return (
    <p
      id={id ?? field?.errorId}
      className={["mt-1.5 text-sm text-red-700", className]
        .filter(Boolean)
        .join(" ")
        .trim()}
      role="alert"
      {...rest}
    >
      {children}
    </p>
  );
}

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  state?: ControlState;
  /** Cascades to nested Input/Textarea when they omit `tone`. */
  tone?: InputTone;
  id?: string;
  children?: ReactNode;
};

function isElementType(
  child: ReactNode,
  type: typeof HelpText | typeof ErrorMessage,
): boolean {
  return isValidElement(child) && child.type === type;
}

export function Field({
  state = "default",
  tone = "auth",
  id,
  className = "",
  children,
  ...rest
}: FieldProps) {
  const reactId = useId();
  const fieldId = id ?? `field-${reactId}`;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  const childList = Children.toArray(children);
  const hasHelp = childList.some((child) => isElementType(child, HelpText));
  const hasError = childList.some((child) =>
    isElementType(child, ErrorMessage),
  );
  const describedBy =
    [hasError ? errorId : null, hasHelp ? helpId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <FieldContext.Provider
      value={{ id: fieldId, state, tone, describedBy, helpId, errorId }}
    >
      <div className={className || undefined} {...rest}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}
