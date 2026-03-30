import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('mounts without errors', () => {
    render(<App />)
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })
})
