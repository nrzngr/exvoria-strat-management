// Database types for Delta Force Strategy Management

export interface Map {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  metadata: Record<string, any>;
  strategy_count: number;
  created_at: string;
  updated_at: string;
}

export interface Strategy {
  id: string;
  map_id: string;
  title: string;
  description: string;
  current_version_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyVersion {
  id: string;
  strategy_id: string;
  version_number: number;
  title: string;
  description: string;
  change_notes?: string;
  created_at: string;
}

export interface StrategyImage {
  id: string;
  strategy_id?: string;
  version_id?: string;
  storage_path: string;
  bucket_name: string;
  url: string;
  alt_text?: string;
  position_in_content: number;
  created_at: string;
}

export interface StrategyWithVersion extends Strategy {
  current_version?: StrategyVersion;
  map?: Map;
  images?: StrategyImage[];
}

export interface MapWithStrategies extends Map {
  strategies?: Strategy[];
}

// Form types
export interface CreateMapForm {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateStrategyForm {
  map_id: string;
  title: string;
  description: string;
  change_notes?: string;
}

export interface UpdateStrategyForm {
  title: string;
  description: string;
  change_notes?: string;
}