'use client'

import { MotionDiv } from '@/lib/animations'
import { cn } from '@/lib/utils'

// Responsive Grid System
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'cards' | 'masonry' | 'strategies' | 'maps'
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveGrid({
  children,
  className,
  variant = 'default',
  cols,
  gap = 'lg'
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const gapClasses = {
      sm: 'gap-2 sm:gap-3',
      md: 'gap-3 sm:gap-4',
      lg: 'gap-4 sm:gap-6',
      xl: 'gap-6 sm:gap-8'
    }

    const variantClasses = {
      default: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
      masonry: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      strategies: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      maps: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }

    const customCols = cols
      ? `grid-cols-1 ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''} ${cols.md ? `md:grid-cols-${cols.md}` : ''} ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''} ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''} ${cols['2xl'] ? `2xl:grid-cols-${cols['2xl']}` : ''}`
      : variantClasses[variant]

    return cn('grid', gapClasses[gap], customCols, className)
  }

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  )
}

// Advanced Section Container
interface SectionProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'gradient' | 'spotlight'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  delay?: number
}

export function Section({
  children,
  className,
  variant = 'default',
  padding = 'lg',
  animate = true,
  delay = 0
}: SectionProps) {
  const getSectionClasses = () => {
    const paddingClasses = {
      sm: 'py-4 px-4',
      md: 'py-6 px-6',
      lg: 'py-8 px-8',
      xl: 'py-12 px-8'
    }

    const variantClasses = {
      default: '',
      glass: 'glass-effect border border-gray-800 rounded-2xl',
      gradient: 'bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-green-600/10 rounded-2xl border border-gray-800',
      spotlight: 'relative overflow-hidden rounded-2xl border border-gray-800'
    }

    return cn(paddingClasses[padding], variantClasses[variant], className)
  }

  const content = (
    <div className={getSectionClasses()}>
      {variant === 'spotlight' && (
        <>
          {/* Spotlight effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 glass-effect rounded-2xl"></div>
          <div className="relative z-10">{children}</div>
        </>
      )}
      {variant !== 'spotlight' && children}
    </div>
  )

  if (animate) {
    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {content}
      </MotionDiv>
    )
  }

  return content
}

// Masonry Layout for varied content
interface MasonryGridProps {
  children: React.ReactNode[]
  className?: string
  columns?: number
  gap?: string
}

export function MasonryGrid({
  children,
  className,
  columns = 3,
  gap = '1.5rem'
}: MasonryGridProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        gridAutoRows: 'auto'
      }}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className="contents"
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Flexible Container for content layout
interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centered?: boolean
}

export function Container({
  children,
  className,
  size = 'xl',
  centered = true
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        centered && 'mx-auto',
        'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// Stack Layout for vertical content
interface StackProps {
  children: React.ReactNode
  className?: string
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end'
  divide?: boolean
}

export function Stack({
  children,
  className,
  spacing = 'md',
  align = 'start',
  divide = false
}: StackProps) {
  const spacingClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end'
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        spacingClasses[spacing],
        alignClasses[align],
        divide && 'divide-y divide-gray-800',
        className
      )}
    >
      {children}
    </div>
  )
}

// Flex Layout for horizontal content
interface FlexProps {
  children: React.ReactNode
  className?: string
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'center' | 'end' | 'stretch'
  wrap?: boolean
  gap?: string
}

export function Flex({
  children,
  className,
  justify = 'start',
  align = 'start',
  wrap = false,
  gap
}: FlexProps) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  return (
    <div
      className={cn(
        'flex',
        justifyClasses[justify],
        alignClasses[align],
        wrap && 'flex-wrap',
        className
      )}
      style={gap ? { gap } : undefined}
    >
      {children}
    </div>
  )
}

// Animated Grid Container
interface AnimatedGridProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  variants?: any
}

export function AnimatedGrid({
  children,
  className,
  staggerDelay = 0.1,
  variants
}: AnimatedGridProps) {
  return (
    <MotionDiv
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {children}
    </MotionDiv>
  )
}

// Card Grid Layout
interface CardGridProps {
  children: React.ReactNode
  className?: string
  minCardWidth?: string
  maxCardWidth?: string
  gap?: string
}

export function CardGrid({
  children,
  className,
  minCardWidth = '320px',
  maxCardWidth = '400px',
  gap = '1.5rem'
}: CardGridProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}, ${maxCardWidth}))`,
        gap
      }}
    >
      {children}
    </div>
  )
}