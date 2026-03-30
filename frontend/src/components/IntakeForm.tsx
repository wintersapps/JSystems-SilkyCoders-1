import { useState, useCallback } from 'react'
import { formSchema, validateImage } from '../lib/validation'
import type { FormErrors } from '../lib/validation'
import ImageUpload from './ImageUpload'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'

interface IntakeFormProps {
  onSuccess: (
    sessionId: string,
    message: string,
    description: string,
    intent: 'RETURN' | 'COMPLAINT',
    orderNumber: string,
    productName: string,
  ) => void
}

interface FormState {
  intent: 'RETURN' | 'COMPLAINT' | null
  orderNumber: string
  productName: string
  description: string
  image: File | null
}

export function IntakeForm({ onSuccess }: IntakeFormProps) {
  const [form, setForm] = useState<FormState>({
    intent: null,
    orderNumber: '',
    productName: '',
    description: '',
    image: null,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleImageChange = useCallback((file: File | null) => {
    setForm((prev) => ({ ...prev, image: file }))
    if (file) {
      const err = validateImage(file)
      setErrors((prev) => ({ ...prev, image: err ?? undefined }))
    } else {
      setErrors((prev) => ({ ...prev, image: undefined }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newErrors: FormErrors = {}

    const parsed = formSchema.safeParse({
      intent: form.intent,
      orderNumber: form.orderNumber,
      productName: form.productName,
      description: form.description,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      if (fieldErrors.intent?.[0]) newErrors.intent = fieldErrors.intent[0]
      if (fieldErrors.orderNumber?.[0])
        newErrors.orderNumber = fieldErrors.orderNumber[0]
      if (fieldErrors.productName?.[0])
        newErrors.productName = fieldErrors.productName[0]
      if (fieldErrors.description?.[0])
        newErrors.description = fieldErrors.description[0]
    }

    if (!form.image) {
      newErrors.image = 'Zdjęcie jest wymagane'
    } else {
      const imageErr = validateImage(form.image)
      if (imageErr) newErrors.image = imageErr
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const formData = new FormData()
      if (form.intent) formData.append('intent', form.intent)
      formData.append('orderNumber', form.orderNumber)
      formData.append('productName', form.productName)
      formData.append('description', form.description)
      if (form.image) formData.append('image', form.image)

      const response = await fetch('/api/sessions', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = (await response.json()) as {
        sessionId: string
        message: string
      }

      localStorage.setItem('sinsay_session_id', data.sessionId)
      const intent = form.intent ?? 'RETURN'
      onSuccess(
        data.sessionId,
        data.message,
        form.description,
        intent,
        form.orderNumber,
        form.productName,
      )
    } catch {
      setErrors({ submit: 'Wystąpił błąd. Spróbuj ponownie.' })
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="mb-6 text-center">
          <img src="/logo.svg" alt="Sinsay" className="mx-auto h-8" />
        </div>

        <h1
          className="mb-2 text-center font-semibold"
          style={{ color: '#16181D', fontSize: '24px', fontWeight: 600 }}
        >
          Sprawdź zwrot lub reklamację
        </h1>
        <p className="mb-6 text-center text-sm" style={{ color: '#7b7d80' }}>
          Asystent AI Sinsay do obsługi zwrotów i reklamacji
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          className="rounded-lg border p-6"
          style={{ borderColor: '#e3e4e5' }}
        >
          {/* Intent */}
          <div className="mb-4">
            <Label className="mb-2 block text-sm font-medium text-[#333333]">
              Rodzaj zgłoszenia *
            </Label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="intent"
                  value="RETURN"
                  checked={form.intent === 'RETURN'}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, intent: 'RETURN' }))
                  }
                  className="sr-only"
                />
                <span
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                  style={
                    form.intent === 'RETURN'
                      ? {
                          borderColor: '#E09243',
                          backgroundColor: '#FFF2E5',
                          color: '#16181D',
                        }
                      : {
                          borderColor: '#e3e4e5',
                          backgroundColor: '#ffffff',
                          color: '#494a4d',
                        }
                  }
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 flex-shrink-0"
                    style={
                      form.intent === 'RETURN'
                        ? { borderColor: '#E09243', backgroundColor: '#E09243' }
                        : { borderColor: '#c8c9cc', backgroundColor: '#ffffff' }
                    }
                  />
                  Zwrot
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="intent"
                  value="COMPLAINT"
                  checked={form.intent === 'COMPLAINT'}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, intent: 'COMPLAINT' }))
                  }
                  className="sr-only"
                />
                <span
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                  style={
                    form.intent === 'COMPLAINT'
                      ? {
                          borderColor: '#E09243',
                          backgroundColor: '#FFF2E5',
                          color: '#16181D',
                        }
                      : {
                          borderColor: '#e3e4e5',
                          backgroundColor: '#ffffff',
                          color: '#494a4d',
                        }
                  }
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 flex-shrink-0"
                    style={
                      form.intent === 'COMPLAINT'
                        ? { borderColor: '#E09243', backgroundColor: '#E09243' }
                        : { borderColor: '#c8c9cc', backgroundColor: '#ffffff' }
                    }
                  />
                  Reklamacja
                </span>
              </label>
            </div>
            {errors.intent && (
              <p role="alert" className="mt-1 text-sm text-[#E90000]">
                {errors.intent}
              </p>
            )}
          </div>

          {/* Order number */}
          <div className="mb-4">
            <Label
              htmlFor="orderNumber"
              className="mb-1 block text-sm font-medium text-[#333333]"
            >
              Numer zamówienia *
            </Label>
            <Input
              id="orderNumber"
              type="text"
              placeholder="np. ORD-12345"
              value={form.orderNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, orderNumber: e.target.value }))
              }
            />
            {errors.orderNumber && (
              <p role="alert" className="mt-1 text-sm text-[#E90000]">
                {errors.orderNumber}
              </p>
            )}
          </div>

          {/* Product name */}
          <div className="mb-4">
            <Label
              htmlFor="productName"
              className="mb-1 block text-sm font-medium text-[#333333]"
            >
              Nazwa produktu *
            </Label>
            <Input
              id="productName"
              type="text"
              placeholder="np. Niebieska kurtka"
              value={form.productName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productName: e.target.value }))
              }
            />
            {errors.productName && (
              <p role="alert" className="mt-1 text-sm text-[#E90000]">
                {errors.productName}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <Label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-[#333333]"
            >
              Opis problemu *
            </Label>
            <Textarea
              id="description"
              placeholder="Opisz szczegółowo problem..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />
            {errors.description && (
              <p role="alert" className="mt-1 text-sm text-[#E90000]">
                {errors.description}
              </p>
            )}
          </div>

          {/* Image upload */}
          <div className="mb-6">
            <Label className="mb-1 block text-sm font-medium text-[#333333]">
              Zdjęcie produktu
            </Label>
            <ImageUpload
              value={form.image}
              onChange={handleImageChange}
              error={errors.image}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p role="alert" className="mb-4 text-sm text-[#E90000]">
              {errors.submit}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: '#E09243',
              color: '#ffffff',
              border: '1.6px solid #E09243',
              borderRadius: '0px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              width: '100%',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Analizuję...' : 'Sprawdź'}
          </button>
        </form>
      </div>
    </div>
  )
}
