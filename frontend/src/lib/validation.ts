import { z } from 'zod'

export const formSchema = z.object({
  intent: z.enum(['RETURN', 'COMPLAINT'], {
    error: 'Wybierz typ zgłoszenia',
  }),
  orderNumber: z.string().min(1, 'Numer zamówienia jest wymagany'),
  productName: z.string().min(1, 'Nazwa produktu jest wymagana'),
  description: z.string().min(1, 'Opis problemu jest wymagany'),
})

export type FormData = z.infer<typeof formSchema>

export interface FormErrors {
  intent?: string
  orderNumber?: string
  productName?: string
  description?: string
  image?: string
  submit?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10_485_760 // 10 MB

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Dozwolone formaty: JPEG, PNG, WebP, GIF'
  }
  if (file.size > MAX_SIZE) {
    return 'Maksymalny rozmiar pliku: 10 MB'
  }
  return null
}
