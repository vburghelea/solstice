DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'event_registrations'
       AND column_name = 'team_id'
       AND data_type <> 'text'
  ) THEN
    IF EXISTS (
      SELECT 1
        FROM information_schema.table_constraints
       WHERE constraint_schema = 'public'
         AND table_name = 'event_registrations'
         AND constraint_name = 'event_registrations_team_id_teams_id_fk'
    ) THEN
      ALTER TABLE "event_registrations"
        DROP CONSTRAINT "event_registrations_team_id_teams_id_fk";
    END IF;

    ALTER TABLE "event_registrations"
      ALTER COLUMN "team_id" TYPE text USING "team_id"::text;

    ALTER TABLE "event_registrations"
      ADD CONSTRAINT "event_registrations_team_id_teams_id_fk"
        FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");
  END IF;
END $$;
