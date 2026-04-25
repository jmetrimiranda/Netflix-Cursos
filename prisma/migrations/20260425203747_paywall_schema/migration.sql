-- Enrollment status enum
CREATE TYPE "EnrollmentStatus" AS ENUM ('pending_payment', 'active', 'cancelled');

ALTER TABLE "Enrollment"
  ADD COLUMN "status" "EnrollmentStatus" NOT NULL DEFAULT 'pending_payment';

-- Grandfathering: enrollments criados antes do paywall (F3) ficam ativos
UPDATE "Enrollment" SET "status" = 'active' WHERE "startedAt" < NOW();

-- Default da nota mínima
ALTER TABLE "Course" ALTER COLUMN "examPassScore" SET DEFAULT 6.0;
