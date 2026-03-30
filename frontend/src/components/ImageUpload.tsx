import { useRef, useState, useCallback } from 'react'
import { validateImage } from '../lib/validation'

interface ImageUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  error?: string
}

async function resizeImage(file: File): Promise<File> {
  const MAX_SIDE = 1024
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const longestSide = Math.max(width, height)
      if (longestSide <= MAX_SIDE) {
        resolve(file)
        return
      }
      const scale = MAX_SIDE / longestSide
      const newWidth = Math.round(width * scale)
      const newHeight = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name, { type: file.type }))
        },
        file.type,
        0.92,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

export default function ImageUpload({
  value,
  onChange,
  error,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Track selected file for display independently of the controlled value prop
  const [selectedFile, setSelectedFile] = useState<File | null>(value)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateImage(file)
      if (validationError) {
        setInternalError(validationError)
        setSelectedFile(null)
        onChange(null)
        return
      }
      setInternalError(null)
      try {
        const resized = await resizeImage(file)
        const preview = URL.createObjectURL(resized)
        setPreviewUrl(preview)
        setSelectedFile(resized)
        onChange(resized)
      } catch {
        const preview = URL.createObjectURL(file)
        setPreviewUrl(preview)
        setSelectedFile(file)
        onChange(file)
      }
    },
    [onChange],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setInternalError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [previewUrl, onChange])

  const displayError = internalError ?? error

  return (
    <div className="w-full">
      {selectedFile && previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <img
            src={previewUrl}
            alt="Podgląd zdjęcia"
            className="h-16 w-16 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">
              {selectedFile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 text-sm text-red-500 hover:text-red-700"
          >
            Usuń
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Strefa przesyłania zdjęcia"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <svg
            className="mb-2 h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            Przeciągnij zdjęcie lub{' '}
            <span className="font-medium text-orange-500">wybierz plik</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Dozwolone formaty: JPEG, PNG, WebP, GIF
          </p>
          <p className="text-xs text-gray-400">
            Maksymalny rozmiar pliku: 10 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {displayError && (
        <p role="alert" className="mt-1 text-sm text-red-500">
          {displayError}
        </p>
      )}
    </div>
  )
}
