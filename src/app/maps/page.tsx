'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Map as MapIcon, Search, Edit, Trash2, FileText, Compass, Layers, Target, Zap } from 'lucide-react'
import { getMaps, deleteMap } from '@/lib/database'
import { Map } from '@/types/database'
import EnvCheck from '@/components/env-check'
import { MotionDiv, staggerContainer, staggerItem, cardHover, fadeIn, scaleIn } from '@/lib/animations'

export default function MapsPage() {
  const [maps, setMaps] = useState<Map[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMaps()
  }, [])

  const loadMaps = async () => {
    try {
      setLoading(true)
      const data = await getMaps()
      setMaps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maps')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this map? This will also delete all strategies associated with it.')) {
      try {
        await deleteMap(id)
        await loadMaps()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete map')
      }
    }
  }

  const filteredMaps = maps.filter(map =>
    map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (map.description && map.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30"
          >
            <Compass className="h-8 w-8 text-blue-400" />
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
            <div className="text-red-400 font-medium">Navigation System Error: {error}</div>
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
        className="space-y-8"
      >
        {/* Header Section */}
        <MotionDiv variants={staggerItem} className="relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-teal-600/10 rounded-2xl blur-3xl"></div>

          <div className="relative glass-effect rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <MotionDiv
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center border border-blue-500/30"
                  >
                    <Compass className="h-6 w-6 text-blue-400" />
                  </MotionDiv>
                  <div>
                    <h1 className="text-4xl font-bold text-gradient">Tactical Maps</h1>
                  </div>
                </div>
              </div>
              <MotionDiv
                variants={cardHover}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/maps/new"
                  className="glass-effect px-6 py-3 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 hover:border-blue-500/50 flex items-center space-x-2 transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Tambah Peta</span>
                </Link>
              </MotionDiv>
            </div>
          </div>
        </MotionDiv>

        {/* Enhanced Search Bar */}
        <MotionDiv variants={staggerItem}>
          <div className="glass-effect rounded-2xl p-6 border border-gray-800">
            <div className="relative">
              <MotionDiv
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400"
              >
                <Search className="h-5 w-5" />
              </MotionDiv>
              <input
                type="text"
                placeholder="Cari peta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 transition-all duration-300"
              />
              {searchQuery && (
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-500"
                >
                  {filteredMaps.length} peta ditemukan
                </MotionDiv>
              )}
            </div>
          </div>
        </MotionDiv>

      {/* Maps Grid */}
        {filteredMaps.length === 0 ? (
          <MotionDiv
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass-effect rounded-2xl p-12 text-center border border-gray-800"
          >
            <div className="relative">
              {/* Animated Background Icons */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <MotionDiv
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-600/10 flex items-center justify-center border border-blue-500/20"
                >
                  <Compass className="h-16 w-16 text-blue-400/30" />
                </MotionDiv>
                <MotionDiv
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-xl bg-gradient-to-br from-cyan-600/10 to-teal-600/10 flex items-center justify-center border border-cyan-500/20"
                >
                  <Layers className="h-8 w-8 text-cyan-400/50" />
                </MotionDiv>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? 'Peta Tidak Ditemukan' : 'Belum Ada Peta'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada peta yang sesuai dengan pencarian Anda. Coba kata kunci lain.'
                  : 'Belum ada peta. Tambahkan peta pertama untuk memulai.'
                }
              </p>

              {!searchQuery && (
                <MotionDiv
                  variants={cardHover}
                  whileHover="hover"
                  whileTap="tap"
                  className="inline-block"
                >
                  <Link
                    href="/maps/new"
                    className="glass-effect px-8 py-4 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 hover:border-blue-500/50 flex items-center space-x-3 transition-all duration-300 group"
                  >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-medium">Tambah Peta Pertama</span>
                  </Link>
                </MotionDiv>
              )}
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredMaps.map((map, index) => (
              <MotionDiv
                key={map.id}
                variants={staggerItem}
                custom={index}
                whileHover="hover"
                className="group"
              >
                <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/20">
                  {/* Map Header */}
                  <div className="relative h-40 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-teal-600/20">
                      <div className="absolute inset-0 opacity-10">
                        <div className="grid grid-cols-4 grid-rows-4 h-full">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="border border-blue-500/20"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Map Thumbnail or Placeholder */}
                    {map.thumbnail_url ? (
                      <img
                        src={map.thumbnail_url}
                        alt={map.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MotionDiv
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-600/30 flex items-center justify-center border border-blue-500/30"
                        >
                          <MapIcon className="h-10 w-10 text-blue-400" />
                        </MotionDiv>
                      </div>
                    )}
                  </div>

                  {/* Map Content */}
                  <div className="p-6 space-y-4">
                    {/* Title Section */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-accent-blue transition-colors duration-300">
                        {map.name}
                      </h3>
                      {map.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                          {map.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <MotionDiv
                        variants={cardHover}
                        whileHover="hover"
                        whileTap="tap"
                        className="flex-1"
                      >
                        <Link
                          href={`/maps/${map.id}/strategies`}
                          className="w-full glass-effect px-4 py-3 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 hover:border-blue-500/50 flex items-center justify-center space-x-2 transition-all duration-300 text-sm font-medium"
                        >
                          <Target className="h-4 w-4" />
                          <span>Lihat Strategi</span>
                        </Link>
                      </MotionDiv>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/maps/${map.id}/edit`}
                          className="p-2 rounded-lg edit-button"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(map.id)}
                          className="p-2 rounded-lg delete-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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