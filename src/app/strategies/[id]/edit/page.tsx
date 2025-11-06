'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, FileText, MapPin, Upload, X, Image as ImageIcon } from 'lucide-react'
import { getMaps, getStrategy, updateStrategy, createStrategyImage, deleteStrategyImage, updateStrategyImage } from '@/lib/database'
import { uploadImage } from '@/lib/storage'
import { Map, StrategyWithVersion } from '@/types/database'
import EnvCheck from '@/components/env-check'

const strategySchema = z.object({
  title: z.string().min(1, 'Strategy title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Strategy description is required'),
  change_notes: z.string().optional(),
})

type StrategyFormData = z.infer<typeof strategySchema>

export default function EditStrategyPage() {
  const router = useRouter()
  const params = useParams()
  const strategyId = params.id as string

  const [maps, setMaps] = useState<Map[]>([])
  const [strategy, setStrategy] = useState<StrategyWithVersion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  const [existingImageDescriptions, setExistingImageDescriptions] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      title: '',
      description: '',
      change_notes: '',
    }
  })

  useEffect(() => {
    loadMaps()
    loadStrategy()
  }, [strategyId])

  const loadMaps = async () => {
    try {
      const data = await getMaps()
      setMaps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maps')
    }
  }

  const loadStrategy = async () => {
    try {
      setLoading(true)
      const data = await getStrategy(strategyId)
      if (!data) {
        setError('Strategy not found')
        return
      }

      setStrategy(data)

      // Load existing image descriptions
      const imageDescMap: Record<string, string> = {}
      data.images?.forEach(image => {
        if (image.alt_text) {
          imageDescMap[image.id] = image.alt_text
        }
      })
      setExistingImageDescriptions(imageDescMap)

      // Pre-fill form with current version data
      const currentVersion = data.current_version
      if (currentVersion) {
        setValue('title', currentVersion.title)
        setValue('description', currentVersion.description)
        setValue('change_notes', '')
      } else {
        // Fallback to strategy data if no version
        setValue('title', data.title)
        setValue('description', data.description)
        setValue('change_notes', '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load strategy')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    )

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please ensure all files are images under 5MB.')
    }

    setUploadedImages(prev => [...prev, ...validFiles])
    setImageDescriptions(prev => [...prev, ...validFiles.map(() => '')])

    // Create previews for valid files
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageDescriptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateImageDescription = (index: number, description: string) => {
    setImageDescriptions(prev =>
      prev.map((desc, i) => i === index ? description : desc)
    )
  }

  const updateExistingImageDescription = (imageId: string, description: string) => {
    setExistingImageDescriptions(prev => ({
      ...prev,
      [imageId]: description
    }))
  }

  const deleteExistingImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      setDeletingImage(imageId)
      await deleteStrategyImage(imageId)

      // Update local state to remove the image from UI
      setStrategy(prev => {
        if (!prev || !prev.images) return prev
        return {
          ...prev,
          images: prev.images.filter(img => img.id !== imageId)
        }
      })

      // Add to deleted images list for reference
      setDeletedImageIds(prev => [...prev, imageId])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setDeletingImage(null)
    }
  }

  const uploadStrategyImages = async (strategyId: string, versionId?: string): Promise<string[]> => {
    const imageUrls: string[] = []

    // Get current strategy to determine image position
    const currentStrategy = await getStrategy(strategyId)
    const currentImageCount = currentStrategy?.images?.length || 0

    for (let index = 0; index < uploadedImages.length; index++) {
      const file = uploadedImages[index]
      try {
        const result = await uploadImage(file, 'STRATEGY_IMAGES', `strategies/${strategyId}`)
        imageUrls.push(result.url)

        // Save image metadata to database with version association
        const customDescription = imageDescriptions[index]?.trim() ||
          `Strategy diagram ${currentImageCount + index + 1} for ${strategyId}`

        await createStrategyImage(
          strategyId,
          result.path,
          'strategy-images',
          result.url,
          customDescription,
          currentImageCount + index,
          versionId // Associate with the new version if provided
        )
      } catch (error) {
        console.error('Failed to upload image:', error)
        throw new Error(`Failed to upload image: ${file.name}`)
      }
    }

    return imageUrls
  }

  const onSubmit = async (data: StrategyFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const strategyData = {
        title: data.title,
        description: data.description,
        change_notes: data.change_notes || 'Updated strategy'
      }

      // Update the strategy (creates new version)
      const updatedStrategy = await updateStrategy(strategyId, strategyData)

      // Update existing image descriptions if any were changed
      for (const [imageId, description] of Object.entries(existingImageDescriptions)) {
        const existingImage = strategy?.images?.find(img => img.id === imageId)
        if (existingImage && existingImage.alt_text !== description && description.trim()) {
          await updateStrategyImage(imageId, description.trim())
        }
      }

      // Upload new images if any were selected
      if (uploadedImages.length > 0) {
        setUploadingImages(true)
        try {
          const newVersionId = updatedStrategy.current_version_id
          await uploadStrategyImages(strategyId, newVersionId)
        } catch (uploadError) {
          throw new Error(`Strategy updated but image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        } finally {
          setUploadingImages(false)
        }
      }

      router.push(`/strategies/${strategyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update strategy')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading strategy...</div>
      </div>
    )
  }

  if (error || !strategy) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error || 'Strategy not found'}</div>
      </div>
    )
  }

  return (
    <EnvCheck>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/strategies/${strategyId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Strategy
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Strategy</h1>
          <p className="text-gray-600 mt-2">Update your strategy</p>
        </div>

        {/* Current strategy info */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <div className="text-sm text-gray-600">
            <strong>Current Map:</strong> {strategy.map?.name}<br />
            <strong>Current Version:</strong> {strategy.current_version?.version_number || 1}<br />
            <strong>Created:</strong> {new Date(strategy.created_at).toLocaleDateString()}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Strategy Title *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="title"
                {...register('title')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Rush A Site Strategy"
              />
            </div>
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Strategy Description *
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={6}
                {...register('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your strategy in detail: objectives, positions, communication, etc..."
              />
            </div>
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="change_notes" className="block text-sm font-medium text-gray-700">
              Change Notes
            </label>
            <div className="mt-1">
              <textarea
                id="change_notes"
                rows={3}
                {...register('change_notes')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what changed in this version..."
              />
            </div>
            {errors.change_notes && (
              <p className="mt-2 text-sm text-red-600">{errors.change_notes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Add New Images
            </label>

            {/* Existing Images Display */}
            {strategy.images && strategy.images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images ({strategy.images.length})</h4>
                <div className="space-y-3">
                  {strategy.images.map((image) => (
                    <div key={image.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                              src={image.url}
                              alt={image.alt_text || 'Strategy image'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              Existing Image
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteExistingImage(image.id)}
                              disabled={deletingImage === image.id}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete image"
                            >
                              {deletingImage === image.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Image Description
                            </label>
                            <textarea
                              value={existingImageDescriptions[image.id] || ''}
                              onChange={(e) => updateExistingImageDescription(image.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder="Describe this image..."
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="strategy-images"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={submitting}
              />
              <label
                htmlFor="strategy-images"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload additional strategy images
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB each
                </span>
              </label>
            </div>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images ({imagePreviews.length})</h4>
                <div className="space-y-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                              src={preview}
                              alt={`New strategy image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              New Image {index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              disabled={submitting}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-600">
                            {uploadedImages[index]?.name}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Image Description
                            </label>
                            <textarea
                              value={imageDescriptions[index] || ''}
                              onChange={(e) => updateImageDescription(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder="Describe this image (e.g., 'Initial setup positions', 'Flanking route', 'Final approach')"
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/strategies/${strategyId}`}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploadingImages || !isDirty}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>
                {uploadingImages ? 'Uploading Images...' : submitting ? 'Updating Strategy...' : 'Update Strategy'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </EnvCheck>
  )
}