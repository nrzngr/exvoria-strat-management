-- Migration 003: Create RPC function for fetching strategies with versions

CREATE OR REPLACE FUNCTION get_strategies_with_versions(p_map_id UUID DEFAULT NULL)
RETURNS SETOF JSON AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', s.id,
    'map_id', s.map_id,
    'current_version_id', s.current_version_id,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'current_version', (
      SELECT row_to_json(sv)
      FROM strategy_versions sv
      WHERE sv.id = s.current_version_id
    ),
    'map', (
      SELECT json_build_object('name', m.name, 'thumbnail_url', m.thumbnail_url)
      FROM maps m
      WHERE m.id = s.map_id
    ),
    'images', (
      SELECT json_agg(
        json_build_object(
          'id', si.id,
          'strategy_id', si.strategy_id,
          'version_id', si.version_id,
          'storage_path', si.storage_path,
          'bucket_name', si.bucket_name,
          'url', si.url,
          'alt_text', si.alt_text,
          'position_in_content', si.position_in_content,
          'created_at', si.created_at
        ) ORDER BY si.position_in_content
      )
      FROM strategy_images si
      WHERE si.strategy_id = s.id
    )
  )
  FROM strategies s
  WHERE (p_map_id IS NULL OR s.map_id = p_map_id)
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Also create a simpler function for individual strategy
CREATE OR REPLACE FUNCTION get_strategy_with_version(p_strategy_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'id', s.id,
      'map_id', s.map_id,
      'current_version_id', s.current_version_id,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'current_version', (
        SELECT row_to_json(sv)
        FROM strategy_versions sv
        WHERE sv.id = s.current_version_id
      ),
      'map', (
        SELECT row_to_json(m)
        FROM maps m
        WHERE m.id = s.map_id
      ),
      'images', (
        SELECT json_agg(
          json_build_object(
            'id', si.id,
            'strategy_id', si.strategy_id,
            'version_id', si.version_id,
            'storage_path', si.storage_path,
            'bucket_name', si.bucket_name,
            'url', si.url,
            'alt_text', si.alt_text,
            'position_in_content', si.position_in_content,
            'created_at', si.created_at
          ) ORDER BY si.position_in_content
        )
        FROM strategy_images si
        WHERE si.strategy_id = s.id
      )
    )
    FROM strategies s
    WHERE s.id = p_strategy_id
  );
END;
$$ LANGUAGE plpgsql;