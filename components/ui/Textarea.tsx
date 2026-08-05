"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

import { useFieldContext } from "@/components/ui/Field";
import {
  inputControlClassName,
  type ControlState,
  type InputTone,
} from "@/components/ui/Input";

/**
 * Cap2.3 canonical Textarea (ADR 016 / Cap2b inventory).
 *
 * Same chrome / `state` / `tone` as Input. Compose with Field.
 *
 * ```tsx
 * <Field>
 *   <Label>Note</Label>
 *   <Textarea name="note" rows={3} />
 * </Field>
 * ```
 */

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  state?: ControlState;
  tone?: InputTone;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      state: stateProp,
      tone: toneProp,
      id,
      className = "",
      disabled,
      readOnly,
      ...rest
    },
    ref,
  ) {
    const field = useFieldContext();
    const state = stateProp ?? field?.state ?? "default";
    const tone = toneProp ?? field?.tone ?? "auth";
    const areaId = id ?? field?.id;

    return (
      <textarea
        {...rest}
        ref={ref}
        id={areaId}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={state === "error" ? true : undefined}
        aria-describedby={field?.describedBy}
        className={inputControlClassName({
          tone,
          state,
          className: ["resize-y", className].filter(Boolean).join(" "),
        })}
      />
    );
  },
);
