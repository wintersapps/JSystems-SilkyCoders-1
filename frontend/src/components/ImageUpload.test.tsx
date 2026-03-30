import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ImageUpload from './ImageUpload'

const makeFile = (name: string, type: string, size: number) => {
  const content = 'x'.repeat(size)
  return new File([content], name, { type })
}

describe('ImageUpload', () => {
  it('renders drop zone with accepted format and size text', () => {
    render(<ImageUpload value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/JPEG|PNG|WebP|GIF/i)).toBeInTheDocument()
    expect(screen.getByText(/10 MB/i)).toBeInTheDocument()
  })

  it('valid JPEG selection shows thumbnail and filename, no error', async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = makeFile('photo.jpg', 'image/jpeg', 1000)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.any(File)))
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('PDF file shows format error immediately', async () => {
    render(<ImageUpload value={null} onChange={vi.fn()} />)

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = makeFile('doc.pdf', 'application/pdf', 1000)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Dozwolone formaty: JPEG, PNG, WebP, GIF/i,
      ),
    )
  })

  it('file over 10MB shows size error immediately', async () => {
    render(<ImageUpload value={null} onChange={vi.fn()} />)

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = makeFile('big.jpg', 'image/jpeg', 10_485_761)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Maksymalny rozmiar pliku: 10 MB/i,
      ),
    )
  })

  it('remove button clears selection and shows drop zone again', async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = makeFile('photo.jpg', 'image/jpeg', 1000)

    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.any(File)))

    const removeBtn = screen.getByRole('button', { name: /usu[nń]/i })
    fireEvent.click(removeBtn)

    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('onChange called with File on valid selection and null on remove', async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = makeFile('photo.png', 'image/png', 500)

    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'photo.png' }),
      ),
    )

    const removeBtn = screen.getByRole('button', { name: /usu[nń]/i })
    fireEvent.click(removeBtn)
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('displays external error prop', () => {
    render(
      <ImageUpload
        value={null}
        onChange={vi.fn()}
        error="Zdjęcie jest wymagane"
      />,
    )
    expect(screen.getByText('Zdjęcie jest wymagane')).toBeInTheDocument()
  })
})
