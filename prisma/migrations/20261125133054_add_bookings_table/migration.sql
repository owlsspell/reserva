-- CreateExtension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "hold_expires_at" TIMESTAMPTZ(3),
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "cancelled_at" TIMESTAMPTZ(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- Add Exclusion Constraint for Overlapping Bookings
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "resource_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" IN ('held', 'confirmed'));

-- Add Check Constraints
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_valid_range" CHECK ("ends_at" > "starts_at");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_valid" CHECK ("status" IN ('held','confirmed','cancelled','expired'));
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hold_has_expiry" CHECK ("status" <> 'held' OR "hold_expires_at" IS NOT NULL);
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_amount_nonneg" CHECK ("amount_minor" >= 0);

-- CreateIndex
CREATE INDEX "bookings_user_id_created_at_id_idx" ON "bookings"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "bookings_resource_id_starts_at_idx" ON "bookings"("resource_id", "starts_at");

-- CreateIndex
CREATE INDEX "bookings_status_hold_expires_at_idx" ON "bookings"("status", "hold_expires_at");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
