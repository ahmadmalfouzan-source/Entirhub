-- Migration to ensure the schema cache is refreshed
COMMENT ON TABLE earned_trophies IS 'User trophies earned for games';
COMMENT ON COLUMN earned_trophies.earned_at IS 'Timestamp when the trophy was earned';
