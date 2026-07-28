"use client";

import { useId, useRef, useState, type ChangeEvent, type TextareaHTMLAttributes, type UIEvent } from "react";

type SoftLimitTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue" | "maxLength" | "value"> & {
  defaultValue?: string;
  softLimit: number;
};

export function SoftLimitTextarea({
  "aria-describedby": ariaDescribedBy,
  defaultValue = "",
  id,
  onChange,
  onScroll,
  softLimit,
  ...textareaProps
}: SoftLimitTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-soft-limit`;
  const backdropRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const overflowCount = Math.max(0, value.length - softLimit);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = event.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    onScroll?.(event);
  }

  return (
    <div className="soft-limit-textarea">
      <div className="soft-limit-textarea__editor">
        <div aria-hidden="true" className="soft-limit-textarea__backdrop" ref={backdropRef}>
          <div className="soft-limit-textarea__highlight">
            <span>{value.slice(0, softLimit)}</span>
            <span className="soft-limit-textarea__overflow">{value.slice(softLimit)}</span>
            {value.endsWith("\n") ? "\u00a0" : null}
          </div>
        </div>
        <textarea
          {...textareaProps}
          aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(" ")}
          defaultValue={defaultValue}
          id={textareaId}
          onChange={handleChange}
          onScroll={handleScroll}
        />
      </div>
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
