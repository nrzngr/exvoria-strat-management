'use client'

import { motion, AnimatePresence, MotionProps, Variants, Transition } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { pageTransition } from '@/lib/animations'

// Page Transition Provider
interface PageTransitionProviderProps {
  children: React.ReactNode
  className?: string
}

export function PageTransitionProvider({ children, className }: PageTransitionProviderProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransition as Variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Animated Page Wrapper
interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
  variant?: 'fade' | 'slide' | 'scale' | 'flip'
}

export function AnimatedPage({ children, className, variant = 'fade' }: AnimatedPageProps) {
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    },
    flip: {
      hidden: { opacity: 0, rotateY: -90 },
      visible: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: 90 }
    }
  }

  const transition: Transition = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1] as const
  }

  return (
    <motion.div
      variants={variants[variant] as Variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Route Change Animation
interface RouteTransitionProps {
  children: React.ReactNode
  direction?: 'forward' | 'backward'
}

export function RouteTransition({ children, direction = 'forward' }: RouteTransitionProps) {
  const slideVariants = {
    forward: {
      hidden: { opacity: 0, x: 100 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 }
    },
    backward: {
      hidden: { opacity: 0, x: -100 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 100 }
    }
  }

  const transition: Transition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const
  }

  return (
    <motion.div
      variants={slideVariants[direction] as Variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

// Layout Transition Component
interface LayoutTransitionProps {
  children: React.ReactNode
  type?: 'container' | 'section' | 'card'
  stagger?: boolean
  delay?: number
}

export function LayoutTransition({
  children,
  type = 'container',
  stagger = false,
  delay = 0
}: LayoutTransitionProps) {
  const variants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.6,
          delay,
          staggerChildren: stagger ? 0.1 : 0,
          when: "beforeChildren" as const
        }
      }
    },
    section: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          delay,
          ease: [0.4, 0, 0.2, 1] as const
        }
      }
    },
    card: {
      hidden: { opacity: 0, scale: 0.9, y: 20 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.4,
          delay,
          ease: [0.4, 0, 0.2, 1] as const
        }
      }
    }
  }

  return (
    <motion.div
      variants={variants[type] as Variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

// Animated Section with scroll-triggered animations
interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  delay?: number
  duration?: number
}

export function AnimatedSection({
  children,
  className,
  threshold = 0.1,
  delay = 0,
  duration = 0.6
}: AnimatedSectionProps) {
  const transition: Transition = {
    duration,
    delay,
    ease: [0.4, 0, 0.2, 1] as const
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      transition={transition}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered Children Animation
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay: initialDelay,
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered Item
interface StaggerItemProps {
  children: React.ReactNode
  className?: string
  variants?: Variants
}

export function StaggerItem({ children, className, variants }: StaggerItemProps) {
  const defaultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className={className}
      variants={variants || defaultVariants}
    >
      {children}
    </motion.div>
  )
}

// Page Loading Overlay
interface PageLoadingProps {
  isLoading: boolean
  message?: string
}

export function PageLoading({ isLoading, message = "Loading..." }: PageLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center glass-effect"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="text-center space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </motion.div>
            <motion.p
              className="text-white font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Route Progress Bar
interface RouteProgressProps {
  isRouteChanging: boolean
}

export function RouteProgress({ isRouteChanging }: RouteProgressProps) {
  return (
    <AnimatePresence>
      {isRouteChanging && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 0.3, 0.8, 1] }}
          exit={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
          style={{ originX: 0 }}
        />
      )}
    </AnimatePresence>
  )
}

// Fade In Component
interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 20
}: FadeInProps) {
  const getVariants = () => {
    const directions = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance }
    }

    return {
      hidden: { opacity: 0, ...directions[direction] },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.4, 0, 0.2, 1] as const
        }
      }
    }
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={getVariants()}
    >
      {children}
    </motion.div>
  )
}