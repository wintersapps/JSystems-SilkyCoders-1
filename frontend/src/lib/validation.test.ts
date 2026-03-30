import { formSchema, validateImage } from './validation'

describe('formSchema', () => {
  const valid = {
    intent: 'RETURN' as const,
    orderNumber: 'ORD-001',
    productName: 'Blue Jacket',
    description: 'Item is damaged',
  }

  it('accepts valid data', () => {
    expect(() => formSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing intent', () => {
    expect(() => formSchema.parse({ ...valid, intent: undefined })).toThrow()
  })

  it('rejects empty orderNumber', () => {
    expect(() => formSchema.parse({ ...valid, orderNumber: '' })).toThrow()
  })

  it('rejects empty productName', () => {
    expect(() => formSchema.parse({ ...valid, productName: '' })).toThrow()
  })

  it('rejects empty description', () => {
    expect(() => formSchema.parse({ ...valid, description: '' })).toThrow()
  })
})

describe('validateImage', () => {
  const makeFile = (type: string, size: number) =>
    new File(['x'.repeat(size)], 'test.jpg', { type })

  it('accepts image/jpeg', () => {
    expect(validateImage(makeFile('image/jpeg', 1000))).toBeNull()
  })

  it('accepts image/png', () => {
    expect(validateImage(makeFile('image/png', 1000))).toBeNull()
  })

  it('rejects application/pdf', () => {
    expect(validateImage(makeFile('application/pdf', 1000))).toMatch(
      /JPEG|PNG|WebP|GIF/i,
    )
  })

  it('rejects file > 10MB', () => {
    expect(validateImage(makeFile('image/jpeg', 10_485_761))).toMatch(/10 MB/i)
  })

  it('accepts file exactly 10MB', () => {
    expect(validateImage(makeFile('image/jpeg', 10_485_760))).toBeNull()
  })
})
