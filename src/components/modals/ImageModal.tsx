'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { modalOverlay, modalContent, MotionDiv } from '@/lib/animations'

interface StrategyImage {
  id: string
  url: string
  alt_text?: string
  description?: string
}

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  image: StrategyImage | null
  allImages?: StrategyImage[]
  currentImageIndex?: number
  onNavigate?: (index: number) => void
}

export default function ImageModal({
  isOpen,
  onClose,
  image,
  allImages = [],
  currentImageIndex = 0,
  onNavigate
}: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [descriptionHeight, setDescriptionHeight] = useState('auto')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Reset state when image changes
    setScale(1)
    setRotation(0)
    setIsDescriptionExpanded(false)
  }, [image])

  useEffect(() => {
    // Handle escape key and body scroll
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => prev + 90)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handlePrevious = () => {
    if (onNavigate && allImages.length > 1) {
      const newIndex = currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1
      onNavigate(newIndex)
    }
  }

  const handleNext = () => {
    if (onNavigate && allImages.length > 1) {
      const newIndex = currentImageIndex === allImages.length - 1 ? 0 : currentImageIndex + 1
      onNavigate(newIndex)
    }
  }

  const toggleDescription = () => {
    setIsDescriptionExpanded(prev => !prev)
  }

  // Helper to check if description is long enough to need collapsing
  const shouldCollapseDescription = image?.alt_text && image.alt_text.length > 200

  if (!isOpen || !image) return null

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with controls */}
          <div className="flex items-center justify-between p-4 md:p-6 bg-black/50 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-white font-medium">Tactical Diagram</h3>
              {allImages.length > 1 && (
                <span className="text-sm text-gray-400">
                  {currentImageIndex + 1} / {allImages.length}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom controls - hidden on mobile */}
              {!isMobile && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Rotate image"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Navigation controls */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Next image"
                  >
                    →
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Image container */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
              <div
                className="relative max-w-full max-h-full"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt_text || 'Strategy diagram'}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  draggable={false}
                />

                {/* Mobile tap hint */}
                {isMobile && scale === 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                    Tap to zoom
                  </div>
                )}
              </div>
            </div>

            {/* Description sidebar - Desktop only */}
            {!isMobile && image.alt_text && (
              <div className="lg:w-96 lg:border-l lg:border-white/10 bg-black/30 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white">Description</h4>
                      {shouldCollapseDescription && (
                        <button
                          onClick={toggleDescription}
                          className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          <span>{isDescriptionExpanded ? 'Show less' : 'Show more'}</span>
                          {isDescriptionExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <div
                        className={`text-gray-300 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                          shouldCollapseDescription && !isDescriptionExpanded
                            ? 'line-clamp-3 overflow-hidden'
                            : ''
                        }`}
                        style={
                          shouldCollapseDescription && !isDescriptionExpanded
                            ? {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }
                            : {}
                        }
                      >
                        {image.alt_text}
                      </div>
                    </div>
                    {shouldCollapseDescription && !isDescriptionExpanded && (
                      <div className="mt-2">
                        <button
                          onClick={toggleDescription}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                        >
                          <span>Continue reading</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional image info */}
                  <div className="pt-4 border-t border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Image Details</h5>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div>Format: Tactical Diagram</div>
                      <div>Strategy Asset</div>
                    </div>
                  </div>

                  {/* Reset button for desktop */}
                  {(scale !== 1 || rotation !== 0) && (
                    <button
                      onClick={handleReset}
                      className="w-full mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Reset View
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Description Section */}
          {isMobile && image.alt_text && (
            <div className="lg:hidden bg-black/50 backdrop-blur-sm border-t border-white/10 p-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">Description</h4>
                  {shouldCollapseDescription && (
                    <button
                      onClick={toggleDescription}
                      className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <span>{isDescriptionExpanded ? 'Show less' : 'Show more'}</span>
                      {isDescriptionExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <div className="prose prose-invert max-w-none">
                  <div
                    className={`text-gray-300 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                      shouldCollapseDescription && !isDescriptionExpanded
                        ? 'line-clamp-3 overflow-hidden'
                        : ''
                    }`}
                    style={
                      shouldCollapseDescription && !isDescriptionExpanded
                        ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }
                        : {}
                    }
                  >
                    {image.alt_text}
                  </div>
                </div>
                {shouldCollapseDescription && !isDescriptionExpanded && (
                  <div className="mt-2">
                    <button
                      onClick={toggleDescription}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                    >
                      <span>Continue reading</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile bottom controls */}
          {isMobile && (
            <div className="lg:hidden p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                {(scale !== 1 || rotation !== 0) && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}