'use client'

import { useState, useEffect, useRef } from 'react'
import { MotionDiv } from '@/lib/animations'
import { motion, Variants, Transition } from 'framer-motion'
import { cn } from '@/lib/utils'

// Hover Card with advanced effects
interface HoverCardProps {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  tilt?: boolean
  glow?: boolean
}

export function HoverCard({ children, className, hoverScale = 1.02, tilt = true, glow = true }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setMousePosition({ x, y })
  }

  const transform = tilt ? {
    rotateX: (mousePosition.y - 0.5) * 10 * (isHovered ? 1 : 0),
    rotateY: (mousePosition.x - 0.5) * -10 * (isHovered ? 1 : 0),
    scale: isHovered ? hoverScale : 1
  } : {
    scale: isHovered ? hoverScale : 1
  }

  return (
    <MotionDiv
      ref={cardRef}
      className={cn(
        'relative transition-all duration-300 ease-out',
        glow && isHovered && 'shadow-2xl shadow-blue-500/20',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Glow effect overlay */}
      {glow && isHovered && (
        <div
          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.5), transparent 50%)`,
            mixBlendMode: 'screen'
          }}
        />
      )}
      {children}
    </MotionDiv>
  )
}

// Floating Action Button
interface FloatingActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'sm' | 'md' | 'lg'
}

export function FloatingActionButton({
  children,
  onClick,
  className,
  position = 'bottom-right',
  size = 'md'
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  return (
    <MotionDiv
      className={cn(
        'glass-effect rounded-full flex items-center justify-center border border-blue-500/30 cursor-pointer z-50',
        positionClasses[position],
        sizeClasses[size],
        className
      )}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        y: [0, -5, 0]
      }}
      transition={{
        y: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ripple effect */}
      <MotionDiv
        className="absolute inset-0 rounded-full bg-blue-500/20"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: isHovered ? 1.5 : 0, opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      />
      {children}
    </MotionDiv>
  )
}

// Magnetic Button
interface MagneticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  strength?: number
}

export function MagneticButton({ children, onClick, className, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength

    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'glass-effect px-6 py-3 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 transition-all duration-300',
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      animate={{
        scale: position.x !== 0 || position.y !== 0 ? 1.02 : 1
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.button>
  )
}

// Scroll Progress Indicator
interface ScrollProgressProps {
  className?: string
  color?: string
  height?: number
}

export function ScrollProgress({ className, color = '#3b82f6', height = 4 }: ScrollProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={cn('fixed top-0 left-0 right-0 z-50 bg-gray-800', className)}
      style={{ height: `${height}px` }}
    >
      <motion.div
        className="h-full origin-left"
        style={{ backgroundColor: color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: scrollProgress / 100 }}
        transition={{ duration: 0.1 }}
      />
    </div>
  )
}

// Parallax Section
interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({ children, speed = 0.5, className }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const rate = scrolled * -speed

      setOffsetY(rate)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.div
        style={{
          transform: `translateY(${offsetY}px)`
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Scroll Reveal Animation
interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function ScrollReveal({
  children,
  className,
  threshold = 0.1,
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  const getVariants = (): Variants => {
    const directions = {
      up: { y: 50 },
      down: { y: -50 },
      left: { x: 50 },
      right: { x: -50 }
    }

    return {
      hidden: { opacity: 0, ...directions[direction] },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.4, 0, 0.2, 1] as const
        }
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={getVariants()}
    >
      {children}
    </motion.div>
  )
}

// Typewriter Effect
interface TypewriterProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  cursor?: boolean
}

export function Typewriter({ text, className, speed = 50, delay = 0, cursor = true }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true)
      setDisplayedText('')

      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex])
          currentIndex++
        } else {
          setIsTyping(false)
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayedText}
      {cursor && isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-blue-400"
        >
          |
        </motion.span>
      )}
    </span>
  )
}

// Pulse Animation Component
interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'normal' | 'strong'
}

export function Pulse({ children, className, intensity = 'normal' }: PulseProps) {
  const intensities = {
    subtle: { scale: [1, 1.02, 1] },
    normal: { scale: [1, 1.05, 1] },
    strong: { scale: [1, 1.1, 1] }
  }

  return (
    <MotionDiv
      className={className}
      animate={intensities[intensity]}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </MotionDiv>
  )
}

// Glow on Hover Component
interface GlowOnHoverProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  glowSize?: 'sm' | 'md' | 'lg'
}

export function GlowOnHover({ children, className, glowColor = '#3b82f6', glowSize = 'md' }: GlowOnHoverProps) {
  const [isHovered, setIsHovered] = useState(false)

  const glowSizes = {
    sm: '0 0 20px',
    md: '0 0 40px',
    lg: '0 0 60px'
  }

  return (
    <motion.div
      className={cn('relative', className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: isHovered ? `${glowSizes[glowSize]} ${glowColor}` : 'none',
          opacity: isHovered ? 0.5 : 0,
          transition: 'all 0.3s ease'
        }}
      />
    </motion.div>
  )
}

// Counter Animation
interface CounterProps {
  from: number
  to: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function Counter({ from, to, duration = 2, className, prefix = '', suffix = '' }: CounterProps) {
  const [count, setCount] = useState(from)

  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration * 1000

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / (endTime - startTime), 1)

      const currentCount = Math.floor(from + (to - from) * progress)
      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }, [from, to, duration])

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}