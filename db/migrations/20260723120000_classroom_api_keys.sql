-- Classroom-supplied OpenRouter keys for the reasoning-transparency grader
-- (instructor-managed; any member may grade on them), plus the per-user
-- grader key preference ("server" | "user" | "classroom:<id>"; NULL = auto).
-- ciphertext is AES-GCM-encrypted key material; last4 is the only clear-text
-- fragment, for display.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "graderKeyPref" TEXT;

-- CreateTable
CREATE TABLE "ClassroomApiKey" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openrouter',
    "ciphertext" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassroomApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomApiKey_classroomId_provider_key" ON "ClassroomApiKey"("classroomId", "provider");

-- AddForeignKey
ALTER TABLE "ClassroomApiKey" ADD CONSTRAINT "ClassroomApiKey_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
