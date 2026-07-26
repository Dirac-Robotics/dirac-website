/**
 * ── PHASE 2 SEAM — ENTITLEMENTS ──────────────────────────────────────────────
 * Today the shipped catalog is public: anyone may view a published asset and
 * (later) download its files. When payments land, entitlement checks move here
 * and read from a NEW `entitlements` table keyed by (user_id, asset_id). No
 * change is required at the call sites or to any core table.
 *
 * See the PHASE 2 SEAM block in lib/db/schema.ts for the planned tables.
 */

export type EntitlementSubject = { id: string; published: boolean };

/**
 * Whether `userId` may download `asset`'s licensed files.
 * TODO(phase-2): replace body with an `entitlements` lookup; keep signature.
 */
export async function canDownloadAsset(
  _userId: string | null,
  asset: EntitlementSubject,
): Promise<boolean> {
  return asset.published;
}

/** Whether `userId` may access the (future) gated/metered Evals platform. */
export async function canAccessEvals(_userId: string | null): Promise<boolean> {
  // TODO(phase-2): metered/gated access check.
  return true;
}
