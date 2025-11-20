'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  disabled?: boolean
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = 'image/*',
  disabled = false,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const sizeMB = file.size / (1024 * 1024)
      return sizeMB <= maxSizeMB
    }).slice(0, maxFiles)

    setSelectedFiles(prev => {
      const newFiles = [...prev, ...validFiles].slice(0, maxFiles)
      onFilesSelected(newFiles)
      return newFiles
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const clearAll = () => {
    setSelectedFiles([])
    onFilesSelected([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${dragActive 
            ? 'border-accent bg-accent/5' 
            : 'border-muted hover:border-accent/50 hover:bg-muted/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            Images up to {maxSizeMB}MB (max {maxFiles} files)
          </p>
        </div>
      </div>

      {/* File Preview List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group rounded-lg border bg-card overflow-hidden"
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  disabled={disabled}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


