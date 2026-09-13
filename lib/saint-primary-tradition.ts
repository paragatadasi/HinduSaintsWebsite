type TraditionMembership = { traditionId: string; isPrimary: boolean };

/** Preserve the pre-option fallback for legacy records unless an editor opts out. */
export function getSaintPrimaryTraditionId(
  traditions: readonly TraditionMembership[],
  noPrimaryTradition: boolean
) {
  if (noPrimaryTradition) return undefined;
  return traditions.find((item) => item.isPrimary)?.traditionId ?? traditions[0]?.traditionId;
}

export function resolveSaintPrimaryTraditionUpdate({
  traditions,
  selectedIds,
  primaryTraditionId,
  clearPrimary,
  noPrimaryTradition
}: {
  traditions: readonly TraditionMembership[];
  selectedIds: string[];
  primaryTraditionId?: string;
  clearPrimary: boolean;
  noPrimaryTradition: boolean;
}) {
  if (clearPrimary) return { primaryTraditionId: undefined, noPrimaryTradition: true };
  if (primaryTraditionId) return { primaryTraditionId, noPrimaryTradition: false };
  // A missing form field is not an instruction to erase the existing primary.
  const retained = traditions.filter((item) => selectedIds.includes(item.traditionId));
  return {
    primaryTraditionId: getSaintPrimaryTraditionId(retained, noPrimaryTradition)
      ?? (noPrimaryTradition ? undefined : selectedIds[0]),
    noPrimaryTradition
  };
}
