/**
 * Shared domain types that are not directly inferred from the DB schema.
 */

/** A measured physical quantity with stated uncertainty. This is the pitch. */
export type PhysicsQuantity = {
  value: number;
  uncertainty: number;
  unit: string;
};

/**
 * Physics metadata stored on `assets.physics` (JSONB). Every field is a
 * measured quantity. Kept open-ended so new measurements can be added without
 * a migration; the gallery renders `mass`, `friction`, and `inertia` up front.
 */
export type AssetPhysics = {
  mass?: PhysicsQuantity;
  /** Coefficient of friction. Dimensionless, so `unit` is usually "μ" or "". */
  friction?: PhysicsQuantity;
  /** Representative principal moment of inertia. Unit "kg·m²". */
  inertia?: PhysicsQuantity;
  [key: string]: PhysicsQuantity | undefined;
};
