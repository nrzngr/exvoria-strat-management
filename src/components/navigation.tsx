'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Map, FileText, PlusCircle, Menu, X, Search, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { MotionDiv, MotionNav, MotionButton, buttonHover, slideInFromLeft, slideInFromRight } from '@/lib/animations'

const navigation = [
  { name: 'Peta', href: '/maps', icon: Map, color: 'blue' },
  { name: 'Strategi', href: '/strategies', icon: FileText, color: 'green' },
  { name: 'Strategi Baru', href: '/strategies/new', icon: PlusCircle, color: 'purple' },
]

const getColorClasses = (color: string, isActive: boolean) => {
  const colors = {
    blue: isActive
      ? 'bg-white/10 text-white border-white/30'
      : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20',
    green: isActive
      ? 'bg-white/10 text-white border-white/30'
      : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20',
    purple: isActive
      ? 'bg-black/20 text-white border-white/30'
      : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20',
  }
  return colors[color as keyof typeof colors] || colors.blue
}

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <MotionNav
        initial="hidden"
        animate="visible"
        variants={slideInFromLeft}
        className="glass-effect border-b border-white/10 sticky top-0 z-50"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(10, 10, 10, 0.8)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <MotionDiv
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
                >
                  <img
                    src="/logo.png"
                    alt="Exvoria"
                    className="w-6 h-6 object-contain"
                  />
                </MotionDiv>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: 'var(--color-accent-bone)' }}>Exvoria</h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <MotionDiv
                    key={item.name}
                    variants={slideInFromRight}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2',
                        'border border-transparent transition-all duration-300',
                        getColorClasses(item.color, isActive),
                        isActive && 'shadow-lg shadow-blue-500/20'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {isActive && (
                        <MotionDiv
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50"
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </Link>
                  </MotionDiv>
                )
              })}
            </div>

            {/* Search and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari strategi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-black/50 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <MotionButton
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </MotionButton>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari strategi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-black/50 transition-all duration-300"
            />
          </div>
        </div>
      </MotionNav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MotionDiv
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden glass-effect border-b border-white/10 overflow-hidden"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(10, 10, 10, 0.9)'
          }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <MotionDiv
                  key={item.name}
                  variants={slideInFromLeft}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center space-x-3 px-3 py-3 rounded-xl text-base font-medium',
                      'border border-transparent transition-all duration-300',
                      getColorClasses(item.color, isActive),
                      isActive && 'shadow-lg shadow-blue-500/20'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {isActive && (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                </MotionDiv>
              )
            })}
          </div>
        </MotionDiv>
      )}
    </>
  )
}