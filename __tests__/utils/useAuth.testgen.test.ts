import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import * as authUtils from '@/utils/auth'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

jest.mock('@/utils/auth', () => ({
  isTokenExpired: jest.fn(),
  generateToken: jest.fn(),
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    users: {
      findByEmail: jest.fn(),
    },
  },
}))

jest.mock('@/utils/validation', () => ({
  validateLogin: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signature = 'fakesig'
  return `${header}.${body}.${signature}`
}

const mockTokenPayload = {
  userId: 'user-1',
  email: 'test@example.com',
  role: 'user',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseToken', () => {
  it('TC-001: parseToken extracts and decodes valid JWT payload', () => {
    const token = buildJWT(mockTokenPayload)
    // We test parseToken indirectly via useAuth loading from localStorage
    // by setting a valid token and checking the user state
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(token),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toMatchObject({
      userId: mockTokenPayload.userId,
      email: mockTokenPayload.email,
      role: mockTokenPayload.role,
    })
  })

  it('TC-002: parseToken returns null for invalid or malformed tokens', () => {
    const malformedToken = 'this.is.notvalidbase64!!!'
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(malformedToken),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  it('TC-003: useAuth loads valid token from localStorage on mount', () => {
    const token = buildJWT(mockTokenPayload)
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(token)
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.token).toBe(token)
    expect(result.current.user).toMatchObject(mockTokenPayload)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('TC-004: useAuth removes expired token from localStorage on mount', () => {
    const token = buildJWT(mockTokenPayload)
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(token)
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(true)

    const { result } = renderHook(() => useAuth())

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('TC-005: login function calls POST /api/auth/login and stores returned token', async () => {
    const token = buildJWT(mockTokenPayload)
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(null)
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(false)

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token, user: mockTokenPayload }),
    })
    global.fetch = mockFetch

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    }))
    expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', token)
    expect(result.current.token).toBe(token)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('TC-006: login throws error when API returns !res.ok with error message', async () => {
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(null)

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid email or password' }),
    })
    global.fetch = mockFetch

    const { result } = renderHook(() => useAuth())

    await expect(
      act(async () => {
        await result.current.login('wrong@example.com', 'wrongpassword')
      })
    ).rejects.toThrow('Invalid email or password')

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('TC-007: logout clears token and user state from localStorage and component state', async () => {
    const token = buildJWT(mockTokenPayload)
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(token)
    ;(authUtils.isTokenExpired as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})