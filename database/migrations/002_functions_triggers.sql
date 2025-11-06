-- Migration 002: Create database functions and triggers

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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
CREATE TRIGGER update_maps_updated_at
  BEFORE UPDATE ON maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();