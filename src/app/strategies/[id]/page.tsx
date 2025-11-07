'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, MapPin, Calendar, FileText, Image as ImageIcon, RefreshCw, Clock, MessageSquare, Star, TrendingUp } from 'lucide-react'
import { getStrategy, deleteStrategy } from '@/lib/database'
import { StrategyWithVersion } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, staggerContainer, staggerItem, cardHover, fadeIn, scaleIn } from '@/lib/animations'
import ImageModal from '@/components/modals/ImageModal'

export default function StrategyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const strategyId = params.id as string

  const [strategy, setStrategy] = useState<StrategyWithVersion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadStrategy()
  }, [strategyId])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStrategy()
      }
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', checkMobile)

    // Initial mobile check
    checkMobile()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', checkMobile)
    }
  }, [strategyId])

  const loadStrategy = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const data = await getStrategy(strategyId)
      setStrategy(data)
    } catch (err) {
      console.error('Error loading strategy:', err)
      setError(err instanceof Error ? err.message : 'Failed to load strategy')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadStrategy(true)
  }

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imageUrl))
  }

  const isImageFailed = (imageUrl: string) => {
    return failedImages.has(imageUrl)
  }

  const handleDeleteStrategy = async () => {
    if (window.confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      try {
        setDeleting(true)
        await deleteStrategy(strategyId)
        router.push('/strategies')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete strategy')
        setDeleting(false)
      }
    }
  }

  // Modal handlers
  const handleImageClick = (imageIndex: number) => {
    // Only open modal on mobile view
    if (isMobile) {
      setSelectedImageIndex(imageIndex)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedImageIndex(0)
  }

  const handleNavigateImage = (index: number) => {
    setSelectedImageIndex(index)
  }

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MotionDiv
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="text-center space-y-4"
        >
          <MotionDiv
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20"
          >
            <FileText className="h-8 w-8 text-white" />
          </MotionDiv>
          <div className="skeleton h-6 w-48 mx-auto rounded-lg"></div>
        </MotionDiv>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MotionDiv
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="glass-effect border border-red-500/30 bg-red-600/10 rounded-xl p-8 max-w-md mx-auto"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="text-red-400 font-medium">Error: {error}</div>
          </div>
        </MotionDiv>
      </div>
    )
  }

  if (!strategy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MotionDiv
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6"
        >
          <MotionDiv
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20"
          >
            <FileText className="h-12 w-12 text-gray-400" />
          </MotionDiv>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Strategy Not Found</h3>
            <p className="text-gray-400 mb-6">The strategy you're looking for doesn't exist or has been removed.</p>
            <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap">
              <Link
                href="/strategies"
                className="glass-effect px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center space-x-3 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Strategies</span>
              </Link>
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    )
  }

  const currentVersionId = strategy.current_version?.id

  // Filter images for current version with fallback logic
  const currentVersionImages = strategy.images?.filter(image => {
    // Case 1: Image explicitly matches current version
    if (image.version_id === currentVersionId) {
      return true
    }

    // Case 2: Image has no version (legacy) - show as fallback
    if (!image.version_id) {
      return true
    }

    // Case 3: If there are no images for current version, show all images as fallback
    if (!strategy.images?.some(img => img.version_id === currentVersionId)) {
      return true
    }

    return false
  }) || []

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
                href="/strategies"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Strategi
              </Link>
            </MotionDiv>

            {/* Main Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <MotionDiv
                  variants={fadeIn}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center sm:items-start sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30 flex-shrink-0">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
                      {strategy.current_version?.title || 'Untitled Strategy'}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {strategy.map?.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(strategy.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        Version {strategy.current_version?.version_number || 1}
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              </div>

              {/* Action Buttons */}
              <MotionDiv
                variants={fadeIn}
                custom={1}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-2 w-full sm:w-auto"
              >
                <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap" className="w-full sm:w-auto">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="glass-button w-full sm:w-auto px-4 py-2 rounded-xl text-white disabled:opacity-50 flex items-center justify-center space-x-2"
                    title="Refresh strategy data"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm">Segarkan</span>
                  </button>
                </MotionDiv>

                <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap" className="w-full sm:w-auto">
                  <Link
                    href={`/strategies/${strategy.id}/edit`}
                    className="glass-button w-full sm:w-auto px-4 py-2 rounded-xl text-white flex items-center justify-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="text-sm">Sunting</span>
                  </Link>
                </MotionDiv>
              </MotionDiv>
            </div>
          </div>
        </MotionDiv>

        {/* Main Content - Full Width */}
        <div className="space-y-8">
          {/* Strategy Description */}
          <MotionDiv variants={staggerItem} custom={0}>
            <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
              <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gradient">Strategy Description</h2>
              </MotionDiv>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                  {strategy.current_version?.description || 'No description available'}
                </p>
              </div>

              {/* Change Notes */}
              {strategy.current_version?.change_notes && (
                <MotionDiv
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="mt-8 p-6 rounded-xl bg-gradient-to-r from-white/5 to-white/2 border border-white/10"
                >
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                    Change Notes
                  </h3>
                  <p className="text-gray-400 whitespace-pre-wrap">
                    {strategy.current_version.change_notes}
                  </p>
                </MotionDiv>
              )}
            </div>
          </MotionDiv>

          {/* Strategy Images */}
          {currentVersionImages.length > 0 && (
            <MotionDiv variants={staggerItem} custom={1}>
              <div className="glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
                <MotionDiv variants={fadeIn} initial="hidden" animate="visible" className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gradient">Tactical Diagrams</h2>
                    <p className="text-sm text-gray-400">{currentVersionImages.length} visual aids</p>
                  </div>
                </MotionDiv>

                <div className="space-y-8">
                  {currentVersionImages
                    .sort((a, b) => a.position_in_content - b.position_in_content)
                    .map((image, index) => (
                      <MotionDiv
                        key={image.id}
                        variants={staggerItem}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        className="group"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                          {/* Image Section */}
                          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            {isImageFailed(image.url) ? (
                              <div className="w-full h-80 bg-black/60 rounded-xl flex items-center justify-center border border-white/10">
                                <div className="text-center">
                                  <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                                  <p className="text-sm text-gray-400 mb-3">Image failed to load</p>
                                  <button
                                    onClick={handleRefresh}
                                    className="glass-effect px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 text-sm transition-all duration-300"
                                  >
                                    Try refreshing
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`${isMobile ? 'cursor-pointer' : ''} relative`}
                                  onClick={() => handleImageClick(index)}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.alt_text || 'Strategy diagram'}
                                    className={`w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700 ${isMobile ? 'cursor-pointer' : ''}`}
                                    onError={() => handleImageError(image.url)}
                                    loading="lazy"
                                  />
                                  {/* Mobile click indicator */}
                                  {isMobile && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                        <span>Tap to view full image</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Description Section */}
                          <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30 flex-shrink-0 mt-1">
                                <ImageIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                {/* Dynamic User Description */}
                                <div className="space-y-3">
                                  {image.alt_text ? (
                                    <div className="space-y-3">
                                      <p className="text-gray-300 leading-relaxed">
                                        {image.alt_text}
                                      </p>

                                      </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <p className="text-gray-400 leading-relaxed italic">
                                        No description provided by the strategy creator
                                      </p>

                                      <div className="glass-effect rounded-xl p-4 border border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                                          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                          Awaiting Creator Input
                                        </h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                          The strategy creator can add detailed explanations and tactical insights for this diagram.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Separator for multiple images */}
                        {index < currentVersionImages.length - 1 && (
                          <div className="mt-8 pt-8 border-t border-white/10"></div>
                        )}
                      </MotionDiv>
                    ))}
                </div>
              </div>
            </MotionDiv>
          )}

        {/* Image Modal */}
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          image={currentVersionImages[selectedImageIndex] || null}
          allImages={currentVersionImages}
          currentImageIndex={selectedImageIndex}
          onNavigate={handleNavigateImage}
        />
        </div>
      </MotionDiv>
    </EnvCheck>
  )
}