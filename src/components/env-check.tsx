'use client'

import { useEffect, useState } from 'react'

export default function EnvCheck({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only render children when we're in the browser
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}