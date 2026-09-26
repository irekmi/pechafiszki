-- DEC-37: deleting a card cascades its Review Events, but a finished session's summary must not change.
-- Nullable and without a backfill: existing sessions keep deriving their summary from their events until
-- a card they marked is deleted, at which point the service stores the counters here first.

-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "frozenSummary" JSONB;
