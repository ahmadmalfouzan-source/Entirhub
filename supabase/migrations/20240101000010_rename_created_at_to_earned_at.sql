-- Migration to fix the column name in earned_trophies
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'earned_trophies' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE earned_trophies RENAME COLUMN created_at TO earned_at;
    END IF;
END $$;
