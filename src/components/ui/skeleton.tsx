'use client'

import { MotionDiv } from '@/lib/animations'
import { cn } from 'clsx'

// Base Skeleton Component
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circle' | 'text' | 'card' | 'image'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded-sm h-4',
    card: 'rounded-xl',
    image: 'rounded-lg'
  }

  const baseClasses = cn(
    'skeleton',
    variantClasses[variant],
    className
  )

  const style = {
    width: width || (variant === 'circle' ? '40px' : undefined),
    height: height || (variant === 'text' ? '1rem' : variant === 'circle' ? '40px' : undefined)
  }

  if (!animate) {
    return (
      <div
        className={cn(baseClasses, 'bg-gray-800')}
        style={style}
      />
    )
  }

  return (
    <MotionDiv
      className={baseClasses}
      style={style}
      animate={{
        opacity: [0.3, 0.8, 0.3]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// Strategy Card Skeleton
export function StrategyCardSkeleton() {
  return (
    <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800">
      {/* Image Skeleton */}
      <div className="relative h-48 overflow-hidden">
        <Skeleton variant="image" height="100%" width="100%" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>

        {/* Status Badge Skeleton */}
        <Skeleton
          variant="default"
          width="80px"
          height="24px"
          className="absolute top-3 left-3"
        />
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <Skeleton variant="text" width="70%" height="24px" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="85%" />
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circle" width={16} height={16} />
            <Skeleton variant="text" width="60px" height="14px" />
            <Skeleton variant="circle" width={16} height={16} />
            <Skeleton variant="text" width="40px" height="14px" />
          </div>
          <Skeleton variant="text" width="30px" height="14px" />
        </div>

        {/* Action Button */}
        <Skeleton variant="default" height="48px" className="rounded-xl" />
      </div>
    </div>
  )
}

// Map Card Skeleton
export function MapCardSkeleton() {
  return (
    <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800">
      {/* Map Header Skeleton */}
      <div className="relative h-40 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-teal-600/20">
          <Skeleton variant="default" height="100%" width="100%" className="opacity-30" />
        </div>

        {/* Map Icon Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton variant="circle" width={80} height={80} className="bg-blue-600/30" />
        </div>

        {/* Badges */}
        <Skeleton
          variant="default"
          width="90px"
          height="24px"
          className="absolute top-3 left-3"
        />
        <Skeleton
          variant="default"
          width="60px"
          height="24px"
          className="absolute top-3 right-3"
        />
      </div>

      {/* Map Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <Skeleton variant="text" width="60%" height="24px" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="75%" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton variant="text" width="80px" height="14px" />
            <Skeleton variant="text" width="50px" height="14px" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Skeleton variant="default" height="48px" className="flex-1 rounded-xl" />
          <Skeleton variant="circle" width={40} height={40} />
          <Skeleton variant="circle" width={40} height={40} />
        </div>
      </div>
    </div>
  )
}

// Grid Skeleton Loader
interface GridSkeletonProps {
  count?: number
  type?: 'strategy' | 'map' | 'card'
  className?: string
}

export function GridSkeleton({
  count = 6,
  type = 'card',
  className
}: GridSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  const getSkeletonComponent = () => {
    switch (type) {
      case 'strategy':
        return <StrategyCardSkeleton />
      case 'map':
        return <MapCardSkeleton />
      default:
        return (
          <div className="glass-effect rounded-2xl p-6 border border-gray-800 space-y-4">
            <Skeleton variant="text" width="60%" height="24px" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="default" height="40px" />
          </div>
        )
    }
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {skeletons.map((index) => (
        <MotionDiv
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {getSkeletonComponent()}
        </MotionDiv>
      ))}
    </div>
  )
}

// Page Loading Skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen space-y-8">
      {/* Header Skeleton */}
      <div className="glass-effect rounded-2xl p-8 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="300px" height="40px" />
            <Skeleton variant="text" width="500px" height="20px" />
          </div>
          <Skeleton variant="default" width="150px" height="48px" className="rounded-xl" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="glass-effect rounded-2xl p-6 border border-gray-800">
        <Skeleton variant="default" height="56px" className="rounded-xl" />
      </div>

      {/* Content Grid Skeleton */}
      <GridSkeleton count={6} type="card" />
    </div>
  )
}

// List Skeleton for table-like content
interface ListSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function ListSkeleton({
  rows = 5,
  columns = 3,
  className
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="glass-effect rounded-xl p-4 border border-gray-800"
        >
          <div className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                width={`${Math.random() * 30 + 60}%`}
                height="20px"
                className="flex-1"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Stat Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="glass-effect rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circle" width={48} height={48} />
        <Skeleton variant="text" width="80px" height="16px" />
      </div>
      <Skeleton variant="text" width="120px" height="32px" className="mb-2" />
      <Skeleton variant="text" width="150px" height="16px" />
    </div>
  )
}

// Stats Grid Skeleton
interface StatsSkeletonProps {
  count?: number
  className?: string
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((index) => (
        <MotionDiv
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <StatCardSkeleton />
        </MotionDiv>
      ))}
    </div>
  )
}