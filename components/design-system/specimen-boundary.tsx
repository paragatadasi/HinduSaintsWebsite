"use client";

import { useState, type ReactNode } from "react";
import { InstagramPreviewLink } from "@/components/instagram/instagram-preview-link";

export function SpecimenBoundary({ children }: { children: ReactNode }) {
  return <div onSubmitCapture={(event) => event.preventDefault()} onClickCapture={(event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a");
    if (anchor && !anchor.getAttribute("href")?.startsWith("#")) event.preventDefault();
  }}>{children}</div>;
}

export function SelectableInstagramSpecimen({ imageUrl }: { imageUrl: string }) {
  const [selected, setSelected] = useState(false);
  return <InstagramPreviewLink alt="Selectable design specimen" imageUrl={imageUrl} url="https://www.instagram.com/hindu_saints/" isSelected={selected} onSelect={() => setSelected((current) => !current)} />;
}
