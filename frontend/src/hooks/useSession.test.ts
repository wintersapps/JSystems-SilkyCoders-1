import { renderHook, act } from '@testing-library/react'
import { useSession } from './useSession'

beforeEach(() => localStorage.clear())

describe('useSession', () => {
  it('returns null when no session in storage', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.sessionId).toBeNull()
  })

  it('setSessionId writes to localStorage', () => {
    const { result } = renderHook(() => useSession())
    act(() => result.current.setSessionId('abc-123'))
    expect(localStorage.getItem('sinsay_session_id')).toBe('abc-123')
    expect(result.current.sessionId).toBe('abc-123')
  })

  it('clearSession removes from localStorage', () => {
    localStorage.setItem('sinsay_session_id', 'abc-123')
    const { result } = renderHook(() => useSession())
    act(() => result.current.clearSession())
    expect(localStorage.getItem('sinsay_session_id')).toBeNull()
    expect(result.current.sessionId).toBeNull()
  })

  it('reads existing value from localStorage on init', () => {
    localStorage.setItem('sinsay_session_id', 'existing-id')
    const { result } = renderHook(() => useSession())
    expect(result.current.sessionId).toBe('existing-id')
  })
})
