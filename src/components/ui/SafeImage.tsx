'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function SafeImage({ src, alt, className, fallbackClassName }: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 ${fallbackClassName || className || ''}`}>
        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/60 mt-1">Failed to load</span>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className={`flex items-center justify-center bg-muted/30 animate-pulse absolute inset-0 ${className || ''}`}>
          <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
      />
    </>
  )
}
