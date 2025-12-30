ALTER TABLE "events" ADD COLUMN "min_players_per_pair" integer DEFAULT 2;
ALTER TABLE "events" ADD COLUMN "max_players_per_pair" integer DEFAULT 2;
ALTER TABLE "events" ADD COLUMN "min_players_per_relay" integer;
ALTER TABLE "events" ADD COLUMN "max_players_per_relay" integer;
