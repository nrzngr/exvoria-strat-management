'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import { getMap, updateMap } from '@/lib/database'
import { Map } from '@/types/database'
import EnvCheck from '@/components/env-check'

const mapSchema = z.object({
  name: z.string().min(1, 'Map name is required').max(255, 'Map name must be less than 255 characters'),
  description: z.string().optional(),
})

type MapFormData = z.infer<typeof mapSchema>

export default function EditMapPage() {
  const router = useRouter()
  const params = useParams()
  const mapId = params.id as string

  const [map, setMap] = useState<Map | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm<MapFormData>({
    resolver: zodResolver(mapSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  })

  useEffect(() => {
    loadMap()
  }, [mapId])

  const loadMap = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMap(mapId)
      if (!data) {
        setError('Map not found')
        return
      }

      setMap(data)

      // Pre-fill form with map data
      setValue('name', data.name)
      setValue('description', data.description || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: MapFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const mapData = {
        name: data.name,
        description: data.description || undefined,
        metadata: map?.metadata || {}
      }

      await updateMap(mapId, mapData)
      router.push('/maps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update map')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  if (error || !map) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error || 'Map not found'}</div>
      </div>
    )
  }

  return (
    <EnvCheck>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/maps"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Maps
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Map</h1>
          <p className="text-gray-600 mt-2">Update map information</p>
        </div>

        {/* Current map info */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <div className="text-sm text-gray-600">
            <strong>Map ID:</strong> {map.id}<br />
            <strong>Current Name:</strong> {map.name}<br />
            <strong>Created:</strong> {new Date(map.created_at).toLocaleDateString()}<br />
            <strong>Last Updated:</strong> {new Date(map.updated_at).toLocaleDateString()}<br />
            <strong>Strategy Count:</strong> {map.strategy_count}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Map Name *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="name"
                {...register('name')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Desert Storm"
              />
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={4}
                {...register('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the map, its key features, layout, or objectives..."
              />
            </div>
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/maps"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !isDirty}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Updating Map...' : 'Update Map'}</span>
            </button>
          </div>
        </form>
      </div>
    </EnvCheck>
  )
}