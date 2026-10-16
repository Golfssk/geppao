/** Shared client request contract; nullable optional fields must remain valid JSON. */
export function acceptImportRequest(
  existingPlaceId: string | null = null,
  reviewedDistinctIds: string[] = [],
  distinctReason: string | null = null,
) {
  return {
    action: 'accept' as const,
    existing_place_id: existingPlaceId,
    reviewed_distinct_ids: [...reviewedDistinctIds],
    distinct_reason: distinctReason?.trim() || null,
  };
}
