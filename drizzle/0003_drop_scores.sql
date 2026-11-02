DROP INDEX "items_rank_idx";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "novelty";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "magnitude";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "evidence";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "breadth";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "maturity";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "quality";--> statement-breakpoint
ALTER TABLE "item_assessments" DROP COLUMN "rationale";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "quality";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "rank";