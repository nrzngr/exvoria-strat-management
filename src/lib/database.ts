import { supabase } from './supabase'
import { Map, Strategy, StrategyVersion, StrategyImage, StrategyWithVersion, MapWithStrategies, CreateMapForm, CreateStrategyForm, UpdateStrategyForm } from '@/types/database'

// Mock data for when Supabase is not configured
const mockMaps: Map[] = [
  {
    id: '1',
    name: 'Desert Storm',
    description: 'A classic desert map perfect for long-range engagements',
    thumbnail_url: undefined,
    metadata: {},
    strategy_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Urban Warfare',
    description: 'Close-quarters combat in city environments',
    thumbnail_url: undefined,
    metadata: {},
    strategy_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

// Map Management
export async function getMaps(): Promise<Map[]> {
  if (!supabase) {
    return mockMaps
  }

  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function getMap(id: string): Promise<Map | null> {
  if (!supabase) {
    return mockMaps.find(map => map.id === id) || null
  }

  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createMap(mapData: CreateMapForm): Promise<Map> {
  if (!supabase) {
    const newMap: Map = {
      id: Date.now().toString(),
      name: mapData.name,
      description: mapData.description || '',
      thumbnail_url: undefined,
      metadata: mapData.metadata || {},
      strategy_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockMaps.push(newMap)
    return newMap
  }

  const { data, error } = await supabase
    .from('maps')
    .insert(mapData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMap(id: string, mapData: Partial<Map>): Promise<Map> {
  if (!supabase) {
    const index = mockMaps.findIndex(map => map.id === id)
    if (index === -1) throw new Error('Map not found')
    mockMaps[index] = { ...mockMaps[index], ...mapData, updated_at: new Date().toISOString() }
    return mockMaps[index]
  }

  const { data, error } = await supabase
    .from('maps')
    .update({ ...mapData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMap(id: string): Promise<void> {
  if (!supabase) {
    const index = mockMaps.findIndex(map => map.id === id)
    if (index !== -1) {
      mockMaps.splice(index, 1)
    }
    return
  }

  const { error } = await supabase
    .from('maps')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Strategy Management
export async function getStrategies(mapId?: string): Promise<StrategyWithVersion[]> {
  if (!supabase) {
    return []
  }

  // Store supabase in local variable to satisfy TypeScript
  const db = supabase

  // Try using RPC approach to get the data with proper joins
  const { data: rpcData, error: rpcError } = await db.rpc('get_strategies_with_versions', {
    p_map_id: mapId || null
  })

  if (rpcError) {
    console.error('RPC query error, falling back to regular query:', rpcError)

    // Fallback to regular query with simpler join
    let fallbackQuery = db
      .from('strategies')
      .select(`
        *,
        map:maps(name, thumbnail_url),
        images:strategy_images(*)
      `)
      .order('updated_at', { ascending: false })
      .order('position_in_content', { foreignTable: 'strategy_images', ascending: true })

    if (mapId) {
      fallbackQuery = fallbackQuery.eq('map_id', mapId)
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery
    if (fallbackError) {
      console.error('Fallback query error:', fallbackError)
      throw fallbackError
    }

    // Manually fetch current versions for each strategy
    const strategiesWithVersions = await Promise.all(
      (fallbackData || []).map(async (strategy) => {
        console.log(`=== Processing strategy ${strategy.id}, current_version_id: ${strategy.current_version_id} ===`)
        if (strategy.current_version_id) {
          const { data: versionData, error: versionError } = await db
            .from('strategy_versions')
            .select('*')
            .eq('id', strategy.current_version_id)
            .single()

          if (versionError) {
            console.error(`Error fetching version ${strategy.current_version_id}:`, versionError)
          } else {
            console.log(`Found version data:`, versionData)
          }

          return { ...strategy, current_version: versionData }
        }
        console.log(`No current_version_id for strategy ${strategy.id}`)
        return { ...strategy, current_version: null }
      })
    )

    console.log('=== FINAL STRATEGIES WITH VERSIONS ===')
    strategiesWithVersions.forEach((strategy, index) => {
      console.log(`Final Strategy ${index + 1}:`, {
        id: strategy.id,
        current_version_id: strategy.current_version_id,
        current_version: strategy.current_version,
        title: strategy.current_version?.title || 'NO TITLE',
        description: strategy.current_version?.description || 'NO DESCRIPTION'
      })
    })

    return strategiesWithVersions
  }

  // If RPC succeeded, use that data
  if (rpcData && rpcData.length > 0) {
    console.log('=== DEBUG: RPC strategies data from database ===')
    console.log('Number of strategies fetched:', rpcData?.length || 0)

    // Parse JSON data from RPC
    const parsedData = rpcData.map((item: any) => {
      const strategy = typeof item === 'string' ? JSON.parse(item) : item
      console.log(`RPC Strategy ${strategy.id}:`, {
        id: strategy.id,
        current_version_id: strategy.current_version_id,
        current_version: strategy.current_version,
        map: strategy.map,
        images_count: strategy.images?.length || 0,
        title: strategy.current_version?.title || 'NO TITLE',
        description: strategy.current_version?.description?.substring(0, 50) + '...' || 'NO DESCRIPTION'
      })
      return strategy
    })
    console.log('=== END RPC DEBUG DATA ===')
    return parsedData
  }

  // Return empty array if no data found
  return []
}

export async function getStrategy(id: string): Promise<StrategyWithVersion | null> {
  if (!supabase) {
    return null
  }

  // Store supabase in local variable to satisfy TypeScript
  const db = supabase

  // Try using RPC first
  const { data: rpcData, error: rpcError } = await db.rpc('get_strategy_with_version', {
    p_strategy_id: id
  })

  if (rpcError) {
    console.error('Strategy RPC error, falling back to regular query:', rpcError)

    // Fallback to regular query with manual version fetching
    const { data: strategyData, error: strategyError } = await db
      .from('strategies')
      .select(`
        *,
        map:maps(*),
        images:strategy_images(*)
      `)
      .eq('id', id)
      .single()

    if (strategyError) {
      console.error('Strategy query error:', strategyError)
      throw strategyError
    }

    // Manually fetch current version
    let current_version = null
    if (strategyData?.current_version_id) {
      const { data: versionData } = await db
        .from('strategy_versions')
        .select('*')
        .eq('id', strategyData.current_version_id)
        .single()

      current_version = versionData
    }

    const finalData = { 
      ...strategyData, 
      current_version,
      title: (strategyData as any).title || (current_version?.title || ''),
      description: (strategyData as any).description || (current_version?.description || '')
    }

    console.log('=== DEBUG: Single strategy data from fallback ===')
    console.log('Strategy ID:', id)
    console.log('Strategy data:', {
      id: finalData.id,
      current_version_id: finalData.current_version_id,
      current_version: finalData.current_version,
      map: finalData.map,
      images_count: finalData.images?.length || 0,
      title: finalData.current_version?.title || 'NO TITLE',
      description: finalData.current_version?.description?.substring(0, 50) + '...' || 'NO DESCRIPTION'
    })
    console.log('=== END SINGLE STRATEGY FALLBACK DEBUG ===')

    return finalData
  }

  // Parse RPC data
  const strategy = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData

  console.log('=== DEBUG: Single strategy data from RPC ===')
  console.log('Strategy ID:', id)
  console.log('Strategy data:', {
    id: strategy.id,
    current_version_id: strategy.current_version_id,
    current_version: strategy.current_version,
    map: strategy.map,
    images_count: strategy.images?.length || 0,
    title: strategy.current_version?.title || 'NO TITLE',
    description: strategy.current_version?.description?.substring(0, 50) + '...' || 'NO DESCRIPTION'
  })
  console.log('=== END SINGLE STRATEGY RPC DEBUG ===')

  return strategy
}

export async function getStrategyWithCache(id: string): Promise<StrategyWithVersion | null> {
  if (!supabase) {
    return null
  }

  try {
    // Store supabase in local variable to satisfy TypeScript
    const db = supabase

    // Add cache busting parameter to force fresh data
    const cacheBuster = Date.now()

    const { data: strategyData, error: strategyError } = await db
      .from('strategies')
      .select(`
        id,
        map_id,
        current_version_id,
        created_at,
        updated_at,
        map:maps(*),
        images:strategy_images(*)
      `)
      .eq('id', id)
      .order('position_in_content', { foreignTable: 'strategy_images', ascending: true })
      .single()

    if (strategyError) {
      console.error('Strategy cache query error:', strategyError)
      throw strategyError
    }

    // Manually fetch current version if it exists
    let current_version = null
    if (strategyData?.current_version_id) {
      const { data: versionData } = await db
        .from('strategy_versions')
        .select('*')
        .eq('id', strategyData.current_version_id)
        .single()

      current_version = versionData
    }

    // Type cast strategyData to access title and description
    const strategyDataWithFields = strategyData as any
    
    const finalData: StrategyWithVersion = { 
      ...strategyData, 
      current_version,
      title: strategyDataWithFields.title || (current_version?.title || ''),
      description: strategyDataWithFields.description || (current_version?.description || ''),
      map: strategyDataWithFields.map as Map,
      images: strategyDataWithFields.images || []
    }
    
    return finalData
  } catch (error) {
    console.error('Error in getStrategyWithCache:', error)
    throw error
  }
}

export async function createStrategy(strategyData: CreateStrategyForm): Promise<StrategyWithVersion> {
  if (!supabase) {
    throw new Error('Strategy creation requires Supabase configuration')
  }

  try {
    // Store supabase in local variable to satisfy TypeScript
    const db = supabase

    // First create the strategy
    const { data: strategy, error: strategyError } = await db
      .from('strategies')
      .insert({
        map_id: strategyData.map_id,
        title: strategyData.title,
        description: strategyData.description
      })
      .select()
      .single()

    if (strategyError) throw strategyError

    // Then create the initial version
    const { data: version, error: versionError } = await db
      .from('strategy_versions')
      .insert({
        strategy_id: strategy.id,
        version_number: 1,
        title: strategyData.title,
        description: strategyData.description,
        change_notes: strategyData.change_notes || 'Initial version'
      })
      .select()
      .single()

    if (versionError) throw versionError

    // Update strategy with current version
    const { data: updatedStrategy, error: updateError } = await db
      .from('strategies')
      .update({ current_version_id: version.id })
      .eq('id', strategy.id)
      .select(`
        *,
        map:maps(name, thumbnail_url)
      `)
      .single()

    if (updateError) throw updateError

    // Manually fetch the current version since we can't use the foreign key relationship
    const { data: currentVersion, error: versionFetchError } = await db
      .from('strategy_versions')
      .select('*')
      .eq('id', version.id)
      .single()

    if (versionFetchError) {
      console.error('Error fetching current version:', versionFetchError)
      throw versionFetchError
    }

    // Construct the final strategy object with version
    const finalStrategy: StrategyWithVersion = {
      ...updatedStrategy,
      current_version: currentVersion,
      images: [] // Initialize with empty images array
    }

    return finalStrategy
  } catch (error) {
    console.error('Error in createStrategy:', error)
    throw error
  }
}

export async function updateStrategy(id: string, strategyData: UpdateStrategyForm): Promise<StrategyWithVersion> {
  if (!supabase) {
    throw new Error('Strategy updates require Supabase configuration')
  }

  try {
    // Store supabase in local variable to satisfy TypeScript
    const db = supabase

    // First get the current strategy to find the latest version number
    const { data: currentStrategy, error: fetchError } = await db
      .from('strategies')
      .select('current_version_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Get the latest version number
    let nextVersionNumber = 1
    if (currentStrategy?.current_version_id) {
      const { data: currentVersion } = await db
        .from('strategy_versions')
        .select('version_number')
        .eq('id', currentStrategy.current_version_id)
        .single()

      if (currentVersion) {
        nextVersionNumber = currentVersion.version_number + 1
      }
    }

    // Create new version
    const { data: newVersion, error: versionError } = await db
      .from('strategy_versions')
      .insert({
        strategy_id: id,
        version_number: nextVersionNumber,
        title: strategyData.title,
        description: strategyData.description,
        change_notes: strategyData.change_notes
      })
      .select()
      .single()

    if (versionError) throw versionError

    // Update strategy with new current version
    const { data: updatedStrategy, error: updateError } = await db
      .from('strategies')
      .update({
        current_version_id: newVersion.id,
        title: strategyData.title,
        description: strategyData.description
      })
      .eq('id', id)
      .select(`
        *,
        map:maps(*)
      `)
      .single()

    if (updateError) throw updateError

    // Fetch images for this strategy
    const { data: images } = await db
      .from('strategy_images')
      .select('*')
      .eq('strategy_id', id)
      .order('position_in_content', { ascending: true })

    // Construct the final strategy object
    const finalStrategy: StrategyWithVersion = {
      ...updatedStrategy,
      current_version: newVersion,
      images: images || []
    }

    return finalStrategy
  } catch (error) {
    console.error('Error in updateStrategy:', error)
    throw error
  }
}

export async function deleteStrategy(id: string): Promise<void> {
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from('strategies')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Strategy Images Management
export async function createStrategyImage(
  strategyId: string,
  storagePath: string,
  bucketName: string,
  url: string,
  altText?: string,
  positionInContent?: number,
  versionId?: string
): Promise<StrategyImage> {
  if (!supabase) {
    throw new Error('Strategy image creation requires Supabase configuration')
  }

  const { data, error } = await supabase
    .from('strategy_images')
    .insert({
      strategy_id: strategyId,
      version_id: versionId || null,
      storage_path: storagePath,
      bucket_name: bucketName,
      url: url,
      alt_text: altText || `Strategy diagram for ${strategyId}`,
      position_in_content: positionInContent || 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function copyImagesToVersion(strategyId: string, fromVersionId?: string, toVersionId?: string): Promise<StrategyImage[]> {
  if (!supabase) {
    throw new Error('Image copying requires Supabase configuration')
  }

  // Get existing images associated with the old version (or unversioned images)
  let query = supabase
    .from('strategy_images')
    .select('*')
    .eq('strategy_id', strategyId)

  // If fromVersionId is provided, get images from that version
  // Otherwise, get images without version_id (unversioned)
  if (fromVersionId) {
    query = query.eq('version_id', fromVersionId)
  } else {
    query = query.is('version_id', null)
  }

  const { data: existingImages, error: fetchError } = await query.order('position_in_content')

  if (fetchError) throw fetchError

  // Copy each image to the new version
  const copiedImages: StrategyImage[] = []
  for (const image of existingImages || []) {
    const { data: copiedImage, error: copyError } = await supabase
      .from('strategy_images')
      .insert({
        strategy_id: strategyId,
        version_id: toVersionId || null,
        storage_path: image.storage_path,
        bucket_name: image.bucket_name,
        url: image.url,
        alt_text: image.alt_text,
        position_in_content: image.position_in_content,
      })
      .select()
      .single()

    if (copyError) {
      console.error('Failed to copy image:', image.id, copyError)
      continue // Skip this image but continue with others
    }

    copiedImages.push(copiedImage)
  }

  return copiedImages
}

export async function updateStrategyImage(imageId: string, altText: string): Promise<StrategyImage> {
  if (!supabase) {
    throw new Error('Strategy image update requires Supabase configuration')
  }

  const { data, error } = await supabase
    .from('strategy_images')
    .update({ alt_text: altText })
    .eq('id', imageId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStrategyImage(imageId: string): Promise<void> {
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from('strategy_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

// Strategy Versions
export async function getStrategyVersions(strategyId: string): Promise<StrategyVersion[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('strategy_versions')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('version_number', { ascending: false })

  if (error) throw error
  return data
}

// Search functionality
export async function searchStrategies(query: string, mapId?: string): Promise<StrategyWithVersion[]> {
  if (!supabase) {
    return []
  }

  try {
    // Store supabase in local variable to satisfy TypeScript
    const db = supabase

    let dbQuery = db
      .from('strategies')
      .select(`
        *,
        map:maps(name, thumbnail_url),
        images:strategy_images(*)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false })

    if (mapId) {
      dbQuery = dbQuery.eq('map_id', mapId)
    }

    const { data: strategies, error } = await dbQuery

    if (error) throw error

    // Manually fetch current versions for each strategy
    const strategiesWithVersions = await Promise.all(
      (strategies || []).map(async (strategy) => {
        if (strategy.current_version_id) {
          const { data: versionData } = await db
            .from('strategy_versions')
            .select('*')
            .eq('id', strategy.current_version_id)
            .single()

          return { 
            ...strategy, 
            current_version: versionData,
            title: (strategy as any).title || (versionData?.title || ''),
            description: (strategy as any).description || (versionData?.description || '')
          }
        }
        return { 
          ...strategy, 
          current_version: null,
          title: (strategy as any).title || '',
          description: (strategy as any).description || ''
        }
      })
    )

    return strategiesWithVersions
  } catch (error) {
    console.error('Error in searchStrategies:', error)
    throw error
  }
}