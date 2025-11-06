'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, FileText, Map as MapIcon, Edit, Trash2, Image as ImageIcon, Eye, Star, Clock } from 'lucide-react'
import { getMap, getStrategies, deleteStrategy, getMaps } from '@/lib/database'
import { Map as MapType, StrategyWithVersion } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, staggerContainer, staggerItem, cardHover, fadeIn, scaleIn } from '@/lib/animations'

export default function MapStrategiesPage() {
  const params = useParams()
  const mapId = params.id as string

  const [map, setMap] = useState<MapType | null>(null)
  const [strategies, setStrategies] = useState<StrategyWithVersion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [mapId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [mapData, strategiesData] = await Promise.all([
        getMap(mapId),
        getStrategies(mapId)
      ])

      setMap(mapData)
      setStrategies(strategiesData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await deleteStrategy(strategyId)
        await loadData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete strategy')
      }
    }
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
            <MapIcon className="h-8 w-8 text-white" />
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
            <div className="text-red-400 font-medium">System Alert: {error}</div>
          </div>
        </MotionDiv>
      </div>
    )
  }

  if (!map) {
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
            <MapIcon className="h-12 w-12 text-gray-400" />
          </MotionDiv>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Map Not Found</h3>
            <p className="text-gray-400 mb-6">The map you're looking for doesn't exist or has been removed.</p>
            <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap">
              <Link
                href="/maps"
                className="glass-effect px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center space-x-3 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Maps</span>
              </Link>
            </MotionDiv>
          </div>
        </MotionDiv>
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
                href="/maps"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Maps
              </Link>
            </MotionDiv>

            {/* Main Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
              <div className="lg:flex-1">
                <MotionDiv
                  variants={fadeIn}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center lg:items-start space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30 flex-shrink-0">
                    <MapIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center lg:text-left max-w-2xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">
                      {map.name}
                    </h1>
                  </div>
                </MotionDiv>
              </div>

              {/* Action Button */}
              <MotionDiv
                variants={fadeIn}
                custom={1}
                initial="hidden"
                animate="visible"
                className="flex justify-center lg:justify-end"
              >
                <MotionDiv variants={cardHover} whileHover="hover" whileTap="tap">
                  <Link
                    href={`/strategies/new?mapId=${mapId}`}
                    className="glass-button px-6 py-3 rounded-xl text-white flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">New Strategy</span>
                  </Link>
                </MotionDiv>
              </MotionDiv>
            </div>
          </div>
        </MotionDiv>

        {/* Empty State */}
        {!strategies || strategies.length === 0 ? (
          <MotionDiv
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass-effect rounded-2xl p-12 text-center border border-gray-800"
          >
            <div className="relative">
              {/* Animated Background Icon */}
              <MotionDiv
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border border-white/30"
              >
                <FileText className="h-12 w-12 text-gray-400" />
              </MotionDiv>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">No Strategies Deployed</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm sm:text-base">
                No tactical strategies have been created for this map yet. Be the first to deploy your elite strategy.
              </p>

              <MotionDiv
                variants={cardHover}
                whileHover="hover"
                whileTap="tap"
                className="inline-block"
              >
                <Link
                  href={`/strategies/new?mapId=${mapId}`}
                  className="glass-button px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-green-400 flex items-center space-x-3 group"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Deploy First Strategy</span>
                </Link>
              </MotionDiv>
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {strategies?.map((strategy, index) => (
              <MotionDiv
                key={strategy.id}
                variants={staggerItem}
                custom={index}
                whileHover="hover"
                className="group"
              >
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/10 bg-black/60 hover:border-white/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-white/10">
                  <div className="flex flex-col lg:flex-row">
                    {/* Strategy Image Preview */}
                    <div className="lg:w-48 h-48 lg:h-auto relative overflow-hidden">
                      {/* Background gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>

                      {(() => {
                        const currentVersionId = strategy.current_version?.id
                        const currentVersionImages = strategy.images?.filter(
                          image => image.version_id === currentVersionId || !image.version_id
                        ) || []

                        if (currentVersionImages.length > 0) {
                          return (
                            <div className="relative h-full">
                              <img
                                src={currentVersionImages[0].url}
                                alt={currentVersionImages[0].alt_text || 'Strategy diagram'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              {currentVersionImages.length > 1 && (
                                <MotionDiv
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className="absolute top-3 right-3 glass-effect px-2 py-1 rounded-full text-xs text-white border border-white/20"
                                >
                                  +{currentVersionImages.length - 1} more
                                </MotionDiv>
                              )}
                            </div>
                          )
                        } else {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                              <MotionDiv
                                animate={{
                                  scale: [1, 1.1, 1],
                                  opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <ImageIcon className="h-12 w-12 text-gray-600" />
                              </MotionDiv>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {/* Strategy Content */}
                    <div className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Title and Actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2 sm:mr-4">
                          <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 sm:line-clamp-1 group-hover:text-gray-200 transition-colors duration-300">
                            {strategy.current_version?.title || 'Untitled Strategy'}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <MotionDiv
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link
                              href={`/strategies/${strategy.id}`}
                              className="p-1.5 sm:p-2 rounded-lg glass-button text-blue-400"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link
                              href={`/strategies/${strategy.id}/edit`}
                              className="p-1.5 sm:p-2 rounded-lg edit-button"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Link>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <button
                              onClick={() => handleDeleteStrategy(strategy.id)}
                              className="p-1.5 sm:p-2 rounded-lg delete-button"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </MotionDiv>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {strategy.current_version?.description || 'No tactical briefing available'}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Star className="h-3 w-3" />
                            <span>v{strategy.current_version?.version_number || 1}</span>
                          </div>
                          {(() => {
                            const currentVersionId = strategy.current_version?.id
                            const currentVersionImageCount = strategy.images?.filter(
                              image => image.version_id === currentVersionId || !image.version_id
                            ).length || 0

                            if (currentVersionImageCount > 0) {
                              return (
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <ImageIcon className="h-3 w-3" />
                                  <span>{currentVersionImageCount}</span>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(strategy.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <MotionDiv
                        variants={cardHover}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Link
                          href={`/strategies/${strategy.id}`}
                          className="w-full glass-button px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-blue-400 flex items-center justify-center space-x-2 group"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium text-sm sm:text-base">View Tactical Details</span>
                        </Link>
                      </MotionDiv>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        )}
      </MotionDiv>
    </EnvCheck>
  )
}

