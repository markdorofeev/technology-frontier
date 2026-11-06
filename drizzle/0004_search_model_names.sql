ALTER TABLE "items" drop column "search";--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "search" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("items"."title", '') || ' ' || translate(coalesce("items"."title", ''), '/-', '  ') || ' ' || coalesce("items"."excerpt", '') || ' ' || coalesce("items"."abstract", ''))) STORED;--> statement-breakpoint
CREATE INDEX "items_search_idx" ON "items" USING gin ("search");
