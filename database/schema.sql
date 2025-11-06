-- Delta Force Strategy Management Database Schema

-- Maps table: Manually created Delta Force game maps
CREATE TABLE maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  strategy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategies table: Main strategy content with map association and versioning
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  current_version_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy versions table: Version history with change tracking
CREATE TABLE strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(strategy_id, version_number)
);

-- Strategy images table: Image assets linked to strategies (using Supabase Storage)
CREATE TABLE strategy_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  version_id UUID REFERENCES strategy_versions(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  bucket_name VARCHAR(100) NOT NULL DEFAULT 'strategy-images',
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  position_in_content INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_strategies_map_id ON strategies(map_id);
CREATE INDEX idx_strategy_versions_strategy_id ON strategy_versions(strategy_id);
CREATE INDEX idx_strategy_images_strategy_id ON strategy_images(strategy_id);
CREATE INDEX idx_strategy_images_version_id ON strategy_images(version_id);
CREATE INDEX idx_maps_name ON maps(name);
CREATE INDEX idx_strategies_title ON strategies USING gin(to_tsvector('english', title));
CREATE INDEX idx_strategies_description ON strategies USING gin(to_tsvector('english', description));

-- Function to update strategy counts when strategies are created/deleted
CREATE OR REPLACE FUNCTION update_map_strategy_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE maps SET strategy_count = strategy_count + 1 WHERE id = NEW.map_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE maps SET strategy_count = strategy_count - 1 WHERE id = OLD.map_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.map_id != OLD.map_id THEN
      UPDATE maps SET strategy_count = strategy_count - 1 WHERE id = OLD.map_id;
      UPDATE maps SET strategy_count = strategy_count + 1 WHERE id = NEW.map_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update map strategy counts
CREATE TRIGGER trigger_update_map_strategy_count
  AFTER INSERT OR DELETE OR UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_map_strategy_count();

-- Function to create new strategy version
CREATE OR REPLACE FUNCTION create_strategy_version(
  p_strategy_id UUID,
  p_title VARCHAR(255),
  p_description TEXT,
  p_change_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_number INTEGER;
  v_version_id UUID;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM strategy_versions
  WHERE strategy_id = p_strategy_id;

  -- Create new version
  INSERT INTO strategy_versions (strategy_id, version_number, title, description, change_notes)
  VALUES (p_strategy_id, v_version_number, p_title, p_description, p_change_notes)
  RETURNING id INTO v_version_id;

  -- Update current version in strategies table
  UPDATE strategies
  SET current_version_id = v_version_id, updated_at = NOW()
  WHERE id = p_strategy_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;