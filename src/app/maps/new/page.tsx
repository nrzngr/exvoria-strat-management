'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import { createMap } from '@/lib/database'
import { CreateMapForm } from '@/types/database'
import EnvCheck from '@/components/env-check'

const mapSchema = z.object({
  name: z.string().min(1, 'Map name is required').max(255, 'Map name must be less than 255 characters'),
  description: z.string().optional(),
})

type MapFormData = z.infer<typeof mapSchema>

export default function NewMapPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<MapFormData>({
    resolver: zodResolver(mapSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  })

  const onSubmit = async (data: MapFormData) => {
    try {
      setLoading(true)
      setError(null)

      const mapData: CreateMapForm = {
        name: data.name,
        description: data.description || undefined,
        metadata: {}
      }

      await createMap(mapData)
      router.push('/maps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Map</h1>
        <p className="text-gray-600 mt-2">Add a new map for strategy organization</p>
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
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Operation Desert Storm"
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
              placeholder="Optional description of the map, game mode, or other details..."
            />
          </div>
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/maps"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Creating...' : 'Create Map'}</span>
          </button>
        </div>
      </form>
      </div>
    </EnvCheck>
  )
}