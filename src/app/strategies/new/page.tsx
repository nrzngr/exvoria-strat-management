'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, FileText, MapPin, Upload, X, Image as ImageIcon, Plus, Eye, Sparkles } from 'lucide-react'
import { getMaps, createStrategy, createStrategyImage } from '@/lib/database'
import { uploadImage } from '@/lib/storage'
import { Map, CreateStrategyForm } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, staggerContainer, staggerItem, cardHover, fadeIn, scaleIn } from '@/lib/animations'

const strategySchema = z.object({
  map_id: z.string().min(1, 'Pilih peta'),
  title: z.string().min(1, 'Judul strategi harus diisi').max(255, 'Judul maksimal 255 karakter'),
  description: z.string().min(1, 'Deskripsi strategi harus diisi'),
  change_notes: z.string().optional(),
})

type StrategyFormData = z.infer<typeof strategySchema>

export default function NewStrategyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mapId = searchParams.get('mapId')

  const [maps, setMaps] = useState<Map[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      map_id: mapId || '',
      title: '',
      description: '',
      change_notes: '',
    }
  })

  useEffect(() => {
    loadMaps()
    if (mapId) {
      setValue('map_id', mapId)
    }
  }, [mapId, setValue])

  const loadMaps = async () => {
    try {
      const data = await getMaps()
      setMaps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat peta')
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
      setError('Beberapa file ditolak. Pastikan semua file adalah gambar maksimal 5MB.')
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

  const uploadStrategyImages = async (strategyId: string, versionId?: string): Promise<string[]> => {
    const imageUrls: string[] = []

    for (let index = 0; index < uploadedImages.length; index++) {
      const file = uploadedImages[index]
      try {
        const result = await uploadImage(file, 'strategy-images', `strategies/${strategyId}`)
        imageUrls.push(result.url)

        // Save image information to database with version association
        const customDescription = imageDescriptions[index]?.trim() ||
          `Gambar strategi ${index + 1} untuk ${strategyId}`

        // Truncate values to fit within database constraints (varchar(255))
        const truncateString = (str: string, maxLength: number = 250): string => {
          if (str.length <= maxLength) return str
          return str.substring(0, maxLength - 3) + '...'
        }

        await createStrategyImage(
          strategyId,
          truncateString(result.path, 250),
          'strategy-images',
          truncateString(result.url, 250),
          truncateString(customDescription, 250),
          index,
          versionId // Associate with the version if provided
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

      console.log('=== DEBUG: Form submission data ===')
      console.log('Form data:', data)
      console.log('Uploaded images count:', uploadedImages.length)

      const strategyData: CreateStrategyForm = {
        map_id: data.map_id,
        title: data.title,
        description: data.description,
        change_notes: data.change_notes || 'Initial version'
      }

      console.log('=== DEBUG: Strategy data to create ===')
      console.log('Strategy data:', strategyData)

      // First create the strategy
      const strategy = await createStrategy(strategyData)
      console.log('=== DEBUG: Strategy created successfully ===')
      console.log('Created strategy:', strategy)

      // Then upload images if any were selected
      if (uploadedImages.length > 0) {
        setUploadingImages(true)
        try {
          const versionId = strategy.current_version_id
          console.log('=== DEBUG: Uploading images ===')
          console.log('Version ID:', versionId)
          const imageUrls = await uploadStrategyImages(strategy.id, versionId)
          console.log('Uploaded images:', imageUrls)
        } catch (uploadError) {
          console.error('=== DEBUG: Image upload error ===')
          console.error('Upload error:', uploadError)
          throw new Error(`Strategy created but image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        } finally {
          setUploadingImages(false)
        }
      }

      console.log('=== DEBUG: Redirecting to strategies ===')
      router.push('/strategies')
    } catch (err) {
      console.error('=== DEBUG: Strategy creation error ===')
      console.error('Error details:', err)
      console.error('Error type:', typeof err)
      console.error('Error message:', err instanceof Error ? err.message : 'No error message')

      setError(err instanceof Error ? err.message : 'Failed to create strategy')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EnvCheck>
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Enhanced Header Section */}
        <MotionDiv variants={staggerItem} className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/3 to-white/2 rounded-2xl blur-3xl"></div>

          <div className="relative glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
            {/* Breadcrumb */}
            <MotionDiv variants={fadeIn} className="mb-6">
              <Link
                href="/strategies"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategies
              </Link>
            </MotionDiv>

            {/* Header Content */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <MotionDiv
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </MotionDiv>
                <div>
                  <h1 className="text-4xl font-bold text-gradient">Create New Strategy</h1>
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Error State */}
        {error && (
          <MotionDiv
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass-effect border border-red-500/30 bg-red-600/10 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="text-red-400 font-medium">System Alert: {error}</div>
            </div>
          </MotionDiv>
        )}

        {/* Form */}
        <MotionDiv variants={staggerItem}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <MotionDiv variants={fadeIn} custom={0} className="space-y-6">
              <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
                <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gradient">Basic Information</h2>
                </MotionDiv>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Map Selection */}
                  <div>
                    <label htmlFor="map_id" className="block text-sm font-medium text-white mb-2">
                      Tactical Map *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="map_id"
                        {...register('map_id')}
                        className="glass-button w-full pl-10 pr-3 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                        disabled={!!mapId}
                      >
                        <option value="" className="bg-gray-800">Select a map</option>
                        {maps.map((map) => (
                          <option key={map.id} value={map.id} className="bg-gray-800">
                            {map.name}
                          </option>
                        ))}
                      </select>
                      {mapId && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {errors.map_id && (
                      <p className="mt-2 text-sm text-red-400">{errors.map_id.message}</p>
                    )}
                    {mapId && (
                      <p className="mt-2 text-xs text-green-400 flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Map pre-selected from previous page
                      </p>
                    )}
                  </div>

                  {/* Strategy Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                      Strategy Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      {...register('title')}
                      className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                      placeholder="e.g., Rush A Site Strategy"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                    Strategy Description *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    {...register('description')}
                    className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                    placeholder="Describe your strategy in detail: objectives, positions, communication, etc..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </MotionDiv>

            {/* Strategy Images Section */}
            <MotionDiv variants={fadeIn} custom={1} className="space-y-6">
              <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
                <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gradient">Tactical Diagrams</h2>
                </MotionDiv>

                {/* Image Upload Area */}
                <div className="glass-effect rounded-xl p-8 border-2 border-dashed border-white/20 hover:border-white/30 transition-all duration-300 text-center group">
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
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <MotionDiv
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20 group-hover:border-white/30 transition-all duration-300"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                    </MotionDiv>
                    <div>
                      <span className="text-white font-medium">Upload Tactical Images</span>
                      <p className="text-gray-400 text-sm mt-1">
                        PNG, JPG, GIF up to 5MB each • Multiple files supported
                      </p>
                    </div>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6">
                    <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-2 mb-4">
                      <Eye className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">
                        Selected Diagrams ({imagePreviews.length})
                      </h3>
                    </MotionDiv>
                    <div className="space-y-4">
                      {imagePreviews.map((preview, index) => (
                        <MotionDiv
                          key={index}
                          variants={staggerItem}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          className="glass-effect rounded-xl p-6 border border-white/10"
                        >
                          <div className="flex gap-6">
                            {/* Image Preview */}
                            <div className="flex-shrink-0">
                              <div className="w-32 h-32 rounded-xl overflow-hidden bg-black/60 border border-white/10">
                                <img
                                  src={preview}
                                  alt={`Strategy diagram ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            </div>

                            {/* Image Details */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30">
                                    <ImageIcon className="h-4 w-4 text-blue-400" />
                                  </div>
                                  <h4 className="text-lg font-medium text-white">
                                    Diagram {index + 1}
                                  </h4>
                                </div>
                                <MotionDiv
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-2 rounded-lg glass-button text-red-400"
                                    disabled={submitting}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </MotionDiv>
                              </div>

                              <div className="text-sm text-gray-400">
                                {uploadedImages[index]?.name}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Tactical Description
                                </label>
                                <textarea
                                  value={imageDescriptions[index] || ''}
                                  onChange={(e) => updateImageDescription(index, e.target.value)}
                                  className="glass-button w-full px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                                  rows={3}
                                  placeholder="Describe this diagram (e.g., 'Initial setup positions', 'Flanking route', 'Final approach')"
                                  disabled={submitting}
                                />
                              </div>
                            </div>
                          </div>
                        </MotionDiv>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </MotionDiv>

            {/* Change Notes Section */}
            <MotionDiv variants={fadeIn} custom={2}>
              <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
                <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gradient">Version Notes</h2>
                </MotionDiv>

                <textarea
                  id="change_notes"
                  rows={3}
                  {...register('change_notes')}
                  className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="Optional: describe what makes this version special..."
                />
                {errors.change_notes && (
                  <p className="mt-2 text-sm text-red-400">{errors.change_notes.message}</p>
                )}
              </div>
            </MotionDiv>

            {/* Action Buttons */}
            <MotionDiv variants={fadeIn} custom={3}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 flex items-center justify-center border border-green-500/30">
                    <Save className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Deploy Strategy</h3>
                    <p className="text-sm text-gray-400">Create and save your tactical approach</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap">
                    <Link
                      href="/strategies"
                      className="glass-button px-6 py-3 rounded-xl text-gray-400 hover:text-white flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span className="font-medium">Cancel</span>
                    </Link>
                  </MotionDiv>

                  <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap">
                    <button
                      type="submit"
                      disabled={submitting || uploadingImages || !isDirty}
                      className="glass-button px-6 py-3 rounded-xl text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">
                        {uploadingImages ? 'Uploading Images...' : submitting ? 'Creating Strategy...' : 'Create Strategy'}
                      </span>
                    </button>
                  </MotionDiv>
                </div>
              </div>
            </MotionDiv>
          </form>
        </MotionDiv>
      </MotionDiv>
    </EnvCheck>
  )
}