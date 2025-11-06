-- Migration 001: Create initial schema for Delta Force Strategy Management

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