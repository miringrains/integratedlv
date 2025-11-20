'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: Array<{
    url: string
    caption?: string
    fileName?: string
  }>
  className?: string
}

export function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedIndex === null) return
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeLightbox()
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border bg-muted hover:shadow-lg transition-all"
          >
            <Image
              src={image.url}
              alt={image.caption || `Image ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-7xl w-full max-h-[95vh] p-0">
            <div className="relative w-full h-full flex items-center justify-center bg-black/95">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation Buttons */}
              {selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {selectedIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <div className="relative w-full h-[80vh] flex items-center justify-center p-8">
                <Image
                  src={images[selectedIndex].url}
                  alt={images[selectedIndex].caption || `Image ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Caption */}
              {images[selectedIndex].caption && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg max-w-2xl">
                  <p className="text-sm">{images[selectedIndex].caption}</p>
                </div>
              )}

              {/* Counter */}
              <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}


