'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, FileText, MapPin, Upload, X, Image as ImageIcon, Plus, Trash2, CloudUpload, Loader2, Calendar, TrendingUp } from 'lucide-react'
import { getMaps, getStrategy, updateStrategy, createStrategyImage, deleteStrategyImage, updateStrategyImage, copyImagesToVersion } from '@/lib/database'
import { uploadImage } from '@/lib/storage'
import { Map, StrategyWithVersion } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, fadeIn, fadeInSlideUp, scaleIn, staggerItem, itemVariants } from '@/lib/animations'
import { motion, AnimatePresence } from 'framer-motion'

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
      const newVersionId = updatedStrategy.current_version_id

      // Copy all existing images to the new version
      const oldVersionId = strategy?.current_version_id

      try {
        if (oldVersionId) {
          // Copy from current version to new version
          await copyImagesToVersion(strategyId, oldVersionId, newVersionId)
        } else {
          // Handle case where there's no version (legacy data) - copy unversioned images
          await copyImagesToVersion(strategyId, undefined, newVersionId)
        }
      } catch (copyError) {
        console.error('Failed to copy existing images to new version:', copyError)
        throw new Error(`Failed to copy images to new version: ${copyError instanceof Error ? copyError.message : 'Unknown error'}`)
      }

      // Update descriptions for images with fallback logic
      const updatedStrategyWithImages = await getStrategy(strategyId)
      const newVersionImages = updatedStrategyWithImages?.images?.filter(
        img => img.version_id === newVersionId
      ) || []

      // Update descriptions for images with fallback logic
      for (const [originalImageId, description] of Object.entries(existingImageDescriptions)) {
        const originalImage = strategy?.images?.find(img => img.id === originalImageId)

        if (originalImage && originalImage.alt_text !== description.trim()) {
          // Try to find the corresponding image in the new version first
          let newVersionImage = newVersionImages.find(img =>
            img.storage_path === originalImage.storage_path ||
            img.position_in_content === originalImage.position_in_content
          )

          // If no copied image found, use the original image as fallback
          if (!newVersionImage) {
            await updateStrategyImage(originalImage.id, description.trim())
          } else if (description.trim()) {
            await updateStrategyImage(newVersionImage.id, description.trim())
          }
        }
      }

      // Upload new images if any were selected
      if (uploadedImages.length > 0) {
        setUploadingImages(true)
        try {
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
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Enhanced Header Section */}
        <MotionDiv variants={staggerItem} className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/3 to-white/2 rounded-2xl blur-3xl"></div>

          <div className="relative glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
            {/* Breadcrumb */}
            <MotionDiv variants={fadeIn} className="mb-6">
              <Link
                href={`/strategies/${strategyId}`}
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategy
              </Link>
            </MotionDiv>

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <MotionDiv
                  variants={fadeIn}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center sm:items-start sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0"
                >
                  <MotionDiv
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30"
                  >
                    <Edit className="h-8 w-8 text-white" />
                  </MotionDiv>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
                      Edit Strategy
                    </h1>
                    <p className="text-gray-400">Update and refine your tactical approach</p>
                  </div>
                </MotionDiv>
              </div>

              {/* Strategy Status Badge */}
              <MotionDiv
                variants={fadeIn}
                custom={1}
                initial="hidden"
                animate="visible"
                className="flex items-center space-x-3"
              >
                <div className="px-4 py-2 rounded-xl bg-green-600/20 border border-green-500/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Version {strategy.current_version?.version_number || 1}</span>
                  </div>
                </div>
              </MotionDiv>
            </div>

            {/* Strategy Info Bar */}
            <MotionDiv
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Map</div>
                  <div className="text-sm text-white font-medium">{strategy.map?.name}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Created</div>
                  <div className="text-sm text-white font-medium">{new Date(strategy.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Images</div>
                  <div className="text-sm text-white font-medium">{strategy.images?.length || 0} diagrams</div>
                </div>
              </div>
            </MotionDiv>
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

        <MotionDiv variants={staggerContainer} initial="hidden" animate="visible">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <MotionDiv variants={fadeIn} custom={0} className="space-y-6">
            <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
              <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Strategy Information</h2>
              </MotionDiv>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strategy Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                    Strategy Title *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      {...register('title')}
                      className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                      placeholder="e.g., Rush A Site Strategy"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {errors.title && (
                    <MotionDiv
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <p className="text-sm text-red-400 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        {errors.title.message}
                      </p>
                    </MotionDiv>
                  )}
                </div>

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
                      disabled
                    >
                      <option value="" className="bg-gray-800">{strategy.map?.name}</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 lg:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Strategy Description *
                </label>
                <textarea
                  id="description"
                  rows={8}
                  {...register('description')}
                  className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="Describe your strategy in detail: objectives, positions, movement patterns, communication calls, timing, etc..."
                />
                {errors.description && (
                  <MotionDiv
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      {errors.description.message}
                    </p>
                  </MotionDiv>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  {strategy.current_version?.description?.length || 0} characters • Supports markdown formatting
                </div>
              </div>
            </div>
          </MotionDiv>

          {/* Change Notes Section */}
          <MotionDiv variants={fadeIn} custom={1} className="space-y-6">
            <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
              <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Version Updates</h2>
              </MotionDiv>

              <textarea
                id="change_notes"
                rows={4}
                {...register('change_notes')}
                className="glass-button w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                placeholder="What tactical changes or improvements did you make in this version? (optional)"
              />
              {errors.change_notes && (
                <MotionDiv
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <p className="text-sm text-red-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    {errors.change_notes.message}
                  </p>
                </MotionDiv>
              )}
            </div>
          </MotionDiv>

          {/* Tactical Diagrams Section */}
          <MotionDiv variants={fadeIn} custom={2} className="space-y-6">
            <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
              <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gradient">Tactical Diagrams</h2>
                    <p className="text-gray-400 text-sm">Upload and annotate strategic visualizations</p>
                  </div>
                </div>
                <motion.div
                  className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-300 text-sm font-medium">
                    {strategy.images?.length || 0} existing
                  </span>
                  {imagePreviews.length > 0 && (
                    <span className="text-green-400 text-sm font-medium">+ {imagePreviews.length} new</span>
                  )}
                </motion.div>
              </MotionDiv>

              <AnimatePresence mode="popLayout">
                {strategy.images && strategy.images.length > 0 && (
                  <motion.div
                    variants={fadeInSlideUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mb-8 space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Existing Diagrams ({strategy.images.length})
                    </h3>
                    <div className="grid gap-4">
                      {strategy.images.map((image, index) => (
                        <motion.div
                          key={image.id}
                          layout
                          variants={fadeInSlideUp}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-700/10 to-gray-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                          <div className="relative bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-700 transition-all duration-300">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <div className="px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-700">
                                <span className="text-gray-400 text-xs font-medium">Diagram {index + 1}</span>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="rounded-xl overflow-hidden bg-black/40 border border-gray-700/50">
                                  <img
                                    src={image.url}
                                    alt={existingImageDescriptions[image.id] || 'Strategy diagram'}
                                    className="w-full h-64 object-contain hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Tactical Description
                                  </label>
                                  <textarea
                                    value={existingImageDescriptions[image.id] || ''}
                                    onChange={(e) => updateExistingImageDescription(image.id, e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                                    placeholder="Describe the tactical situation, key factors, decision points, and strategic implications..."
                                    disabled={submitting}
                                  />
                                  <p className="mt-2 text-xs text-gray-500">
                                    {existingImageDescriptions[image.id]?.length || 0} characters
                                  </p>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                  <div className="text-sm text-gray-500">
                                    <span className="text-green-400">Existing diagram</span>
                                  </div>
                                  <motion.button
                                    type="button"
                                    onClick={() => deleteExistingImage(image.id)}
                                    disabled={deletingImage === image.id || submitting}
                                    className="text-red-400 hover:text-red-300 font-medium text-sm flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                                    whileHover={!deletingImage && !submitting ? { scale: 1.05 } : {}}
                                    whileTap={!deletingImage && !submitting ? { scale: 0.95 } : {}}
                                  >
                                    {deletingImage === image.id ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      >
                                        <Loader2 className="w-4 h-4" />
                                      </motion.div>
                                    ) : (
                                      <>
                                        <Trash2 className="w-4 h-4" />
                                        Remove
                                      </>
                                    )}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Upload Area */}
                <motion.div
                  variants={fadeInSlideUp}
                  layout
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-300">
                    <input
                      type="file"
                      id="strategy-images"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={submitting}
                    />
                    <motion.label
                      htmlFor="strategy-images"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Upload className="h-16 w-16 text-gray-500" />
                      </motion.div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">Upload New Diagrams</h4>
                        <p className="text-gray-400 text-sm mb-2">Click to browse or drag and drop</p>
                        <p className="text-gray-500 text-xs">PNG, JPG, GIF up to 5MB each</p>
                      </div>
                      <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4" />
                        Choose Files
                      </motion.div>
                    </motion.label>
                  </div>
                </motion.div>

                {/* New Image Previews */}
                <AnimatePresence>
                  {imagePreviews.length > 0 && (
                    <motion.div
                      variants={fadeInSlideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-8 space-y-4"
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        New Diagrams ({imagePreviews.length})
                      </h3>
                      <div className="grid gap-4">
                        {imagePreviews.map((preview, index) => (
                          <motion.div
                            key={index}
                            layout
                            variants={fadeInSlideUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="group relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                              <div className="absolute top-4 right-4 flex items-center gap-2">
                                <div className="px-3 py-1 bg-green-900/60 backdrop-blur-sm rounded-full border border-green-500/50">
                                  <span className="text-green-400 text-xs font-medium">New</span>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="rounded-xl overflow-hidden bg-black/40 border border-gray-700/50">
                                    <img
                                      src={preview}
                                      alt={`New tactical diagram ${index + 1}`}
                                      className="w-full h-64 object-contain hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  {uploadedImages[index]?.name && (
                                    <div className="text-sm text-gray-400">
                                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                      </svg>
                                      {uploadedImages[index].name}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Tactical Description
                                    </label>
                                    <textarea
                                      value={imageDescriptions[index] || ''}
                                      onChange={(e) => updateImageDescription(index, e.target.value)}
                                      rows={6}
                                      className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
                                      placeholder="Describe the tactical situation, key factors, decision points, and strategic implications..."
                                      disabled={submitting}
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                      {imageDescriptions[index]?.length || 0} characters
                                    </p>
                                  </div>

                                  <div className="flex justify-between items-center pt-2">
                                    <div className="text-sm text-green-400">
                                      Ready to upload
                                    </div>
                                    <motion.button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      disabled={submitting}
                                      className="text-red-400 hover:text-red-300 font-medium text-sm flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                                      whileHover={!submitting ? { scale: 1.05 } : {}}
                                      whileTap={!submitting ? { scale: 0.95 } : {}}
                                    >
                                      <X className="w-4 h-4" />
                                      Remove
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatePresence>
            </div>
          </MotionDiv>

          {/* Action Buttons */}
          <MotionDiv variants={itemVariants} className="flex justify-end gap-4 pt-8 border-t border-gray-700/50">
            <MotionDiv variants={fadeInSlideUp}>
              <Link
                href={`/strategies/${strategyId}`}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl text-gray-300 font-medium hover:bg-gray-700/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </Link>
            </MotionDiv>

            <MotionDiv variants={fadeInSlideUp}>
              <motion.button
                type="submit"
                disabled={submitting || uploadingImages || !isDirty}
                className="relative inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/30 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={!submitting && !uploadingImages && isDirty ? { scale: 1.02, y: -2 } : {}}
                whileTap={!submitting && !uploadingImages && isDirty ? { scale: 0.98 } : {}}
              >
                <AnimatePresence mode="wait">
                  {uploadingImages && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CloudUpload className="w-4 h-4" />
                    </motion.div>
                  )}
                  {submitting && !uploadingImages && (
                    <motion.div
                      key="submitting"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                  )}
                  {!submitting && !uploadingImages && (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Save className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <span>
                  {uploadingImages ? 'Uploading Images...' :
                   submitting ? 'Updating Strategy...' :
                   isDirty ? 'Update Strategy' : 'No Changes'}
                </span>

                {isDirty && !submitting && !uploadingImages && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            </MotionDiv>
          </MotionDiv>
        </form>
        </MotionDiv>
      </MotionDiv>
    </EnvCheck>
  )
}