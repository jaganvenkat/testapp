'use client'

import { useState, useEffect, useCallback } from 'react'
import { isTokenExpired } from '@/utils/auth'
import type { TokenPayload } from '@/utils/auth'

const TOKEN_KEY = 'auth_token'

function parseToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as TokenPayload
  } catch {
    return null
  }
}

export interface AuthState {
  user:            TokenPayload | null
  token:           string | null
  isAuthenticated: boolean
  login:           (email: string, password: string) => Promise<void>
  logout:          () => void
}

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(null)
  const [user,  setUser]  = useState<TokenPayload | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored && !isTokenExpired(stored)) {
      setToken(stored)
      setUser(parseToken(stored))
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Login failed')

    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(parseToken(data.token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return { user, token, isAuthenticated: !!token, login, logout }
}
