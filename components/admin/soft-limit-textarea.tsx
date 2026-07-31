"use client";

import { useId, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";

type SoftLimitTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue" | "maxLength" | "value"> & {
  defaultValue?: string;
  softLimit: number;
};

export function SoftLimitTextarea({
  "aria-describedby": ariaDescribedBy,
  defaultValue = "",
  id,
  onChange,
  softLimit,
  ...textareaProps
}: SoftLimitTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-soft-limit`;
  const [value, setValue] = useState(defaultValue);
  const overflowCount = Math.max(0, value.length - softLimit);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  return (
    <div className="soft-limit-textarea">
      <textarea
        {...textareaProps}
        aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(" ")}
        defaultValue={defaultValue}
        id={textareaId}
        onChange={handleChange}
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
