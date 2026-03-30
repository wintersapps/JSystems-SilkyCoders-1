import { useState } from 'react'

const STORAGE_KEY = 'sinsay_session_id'

interface UseSessionReturn {
  sessionId: string | null
  setSessionId: (id: string) => void
  clearSession: () => void
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const setSessionId = (id: string): void => {
    localStorage.setItem(STORAGE_KEY, id)
    setSessionIdState(id)
  }

  const clearSession = (): void => {
    localStorage.removeItem(STORAGE_KEY)
    setSessionIdState(null)
  }

  return { sessionId, setSessionId, clearSession }
}
