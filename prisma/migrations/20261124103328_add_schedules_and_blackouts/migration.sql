-- CreateTable
CREATE TABLE "resource_schedules" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opens_at" TEXT NOT NULL,
    "closes_at" TEXT NOT NULL,

    CONSTRAINT "resource_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_blackouts" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "resource_blackouts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resource_schedules" ADD CONSTRAINT "resource_schedules_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_blackouts" ADD CONSTRAINT "resource_blackouts_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
