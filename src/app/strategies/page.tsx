'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Image as ImageIcon, Edit, Trash2, Clock, MapPin, Eye } from 'lucide-react'
import { getStrategies, deleteStrategy } from '@/lib/database'
import { StrategyWithVersion } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, staggerContainer, staggerItem, cardHover, fadeIn, scaleIn } from '@/lib/animations'

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyWithVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getStrategies()
      console.log('=== DEBUG: Strategies page received data ===')
      console.log('Number of strategies:', data.length)
      data.forEach((strategy, index) => {
        console.log(`Page Strategy ${index + 1}:`, {
          id: strategy.id,
          title: strategy.current_version?.title || 'NO TITLE',
          description: strategy.current_version?.description || 'NO DESCRIPTION',
          current_version_id: strategy.current_version_id,
          current_version: strategy.current_version,
          map_name: strategy.map?.name
        })
      })
      console.log('=== END PAGE DEBUG ===')
      setStrategies(data)
    } catch (err) {
      console.error('Error loading strategies:', err)
      setError(err instanceof Error ? err.message : 'Failed to load strategies')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await deleteStrategy(strategyId)
        await loadStrategies()
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
          className="text-center"
        >
          <div className="skeleton h-8 w-64 mx-auto mb-4 rounded-lg"></div>
          <div className="skeleton h-4 w-48 mx-auto rounded"></div>
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
        className="space-y-8"
      >
        {/* Header Section */}
        <MotionDiv variants={staggerItem} className="relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/3 to-white/2 rounded-2xl blur-3xl"></div>

          <div className="relative glass-effect rounded-2xl p-8 border border-white/10 bg-black/40">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Link
                  href="/"
                  className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Link>
                <div>
                  <h1 className="text-4xl font-bold text-gradient">Strategi</h1>
                </div>
              </div>
              <MotionDiv
                variants={cardHover}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/strategies/new"
                  className="glass-effect px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center space-x-2 transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Strategi Baru</span>
                </Link>
              </MotionDiv>
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
              <div className="text-red-400 font-medium">Error: {error}</div>
            </div>
          </MotionDiv>
        )}

        {/* Empty State */}
        {strategies.length === 0 ? (
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
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30"
              >
                <FileText className="h-12 w-12 text-blue-400" />
              </MotionDiv>

              <h3 className="text-2xl font-bold text-white mb-3">Belum Ada Strategi</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Belum ada strategi. Buat strategi pertama untuk memulai.
              </p>

              <MotionDiv
                variants={cardHover}
                whileHover="hover"
                whileTap="tap"
                className="inline-block"
              >
                <Link
                  href="/strategies/new"
                  className="glass-effect px-8 py-4 rounded-xl border border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-600/10 hover:border-green-500/50 flex items-center space-x-3 transition-all duration-300 group"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Buat Strategi Pertama</span>
                </Link>
              </MotionDiv>
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {strategies.map((strategy, index) => (
              <MotionDiv
                key={strategy.id}
                variants={staggerItem}
                custom={index}
                whileHover="hover"
                className="group"
              >
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/10 bg-black/60 hover:border-white/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-white/10">
                  {/* Strategy Image Preview */}
                  <div className="relative h-48 overflow-hidden">
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

                    {/* Status Badge */}
                    <MotionDiv
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute top-3 left-3 glass-effect px-3 py-1 rounded-full text-xs font-medium text-white border border-white/30 z-20"
                    >
                      Active
                    </MotionDiv>
                  </div>

                  {/* Strategy Content */}
                  <div className="p-6 space-y-4">
                    {/* Title Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-3">
                        <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-gray-200 transition-colors duration-300">
                          {strategy.current_version?.title || 'Untitled Strategy'}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MotionDiv
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link
                            href={`/strategies/${strategy.id}/edit`}
                            className="p-2 rounded-lg edit-button"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </MotionDiv>
                        <MotionDiv
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <button
                            onClick={() => handleDeleteStrategy(strategy.id)}
                            className="p-2 rounded-lg delete-button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </MotionDiv>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                      {strategy.current_version?.description || 'No tactical briefing available'}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{strategy.map?.name || 'Unknown'}</span>
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
                        <span>v{strategy.current_version?.version_number || 1}</span>
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
                        className="w-full glass-effect px-4 py-3 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 hover:border-blue-500/50 flex items-center justify-center space-x-2 transition-all duration-300 group"
                      >
                        <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium">Lihat Detail</span>
                      </Link>
                    </MotionDiv>
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