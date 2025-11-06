'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Preload the logo
    const img = new Image()
    img.src = '/logo.png'

    // Redirect to maps page after a short delay to allow logo preloading
    const timer = setTimeout(() => {
      router.push('/maps')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20">
          <img
            src="/logo.png"
            alt="Exvoria"
            className="w-10 h-10 object-contain"
          />
        </div>
        <p className="text-gray-400">Memuat Exvoria...</p>
      </div>
    </div>
  )
}