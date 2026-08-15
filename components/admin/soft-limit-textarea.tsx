"use client";

import { useId, useState, type InputEvent, type TextareaHTMLAttributes } from "react";
import { SHORT_DESCRIPTION_MAX_LENGTH } from "@/lib/content-limits";

type SoftLimitTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue" | "value"> & {
  defaultValue?: string;
  softLimit: number;
};

export function SoftLimitTextarea({
  "aria-describedby": ariaDescribedBy,
  defaultValue = "",
  id,
  maxLength = SHORT_DESCRIPTION_MAX_LENGTH,
  onInput,
  softLimit,
  ...textareaProps
}: SoftLimitTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-soft-limit`;
  const [value, setValue] = useState(defaultValue);
  const overflowCount = Math.max(0, value.length - softLimit);

  function handleInput(event: InputEvent<HTMLTextAreaElement>) {
    setValue(event.currentTarget.value);
    onInput?.(event);
  }

  return (
    <div className="soft-limit-textarea">
      <textarea
        {...textareaProps}
        aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(" ")}
        defaultValue={defaultValue}
        id={textareaId}
        maxLength={maxLength}
        onInput={handleInput}
      />
      <span
        className={overflowCount > 0 ? "soft-limit-textarea__hint soft-limit-textarea__hint--over" : "soft-limit-textarea__hint"}
        id={hintId}
      >
        {overflowCount > 0
          ? `${value.length.toLocaleString()} characters — ${overflowCount.toLocaleString()} over the suggested ${softLimit.toLocaleString()}`
          : `${value.length.toLocaleString()} of ${softLimit.toLocaleString()} suggested characters`}
      </span>
    </div>
  );
}
