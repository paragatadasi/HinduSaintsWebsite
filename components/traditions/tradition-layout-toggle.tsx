"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import type { TraditionDetailLayoutOption } from "@/components/traditions/tradition-page-layouts";

type TraditionLayoutToggleProps = {
  currentLayout: TraditionDetailLayoutOption;
  options: Array<{
    value: TraditionDetailLayoutOption;
    label: string;
  }>;
};

export function TraditionLayoutToggle({ currentLayout, options }: TraditionLayoutToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form className="layout-dev-toggle">
      <label htmlFor="tradition-layout">Layout option</label>
      <select
        id="tradition-layout"
        value={currentLayout}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("layout", event.target.value);
          router.push(`${pathname}?${params.toString()}` as Route);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </form>
  );
}
