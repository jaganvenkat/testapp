/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST } from '@/api/auth/login/route'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/utils/auth'

jest.mock('@/lib/db', () => ({
  db: { users: { findByEmail: jest.fn() } },
}))

jest.mock('@/utils/auth', () => ({
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}))

const mockFindByEmail = db.users.findByEmail as jest.Mock
const mockVerify      = verifyPassword as jest.Mock
const mockGenerate    = generateToken as jest.Mock

const testUser = {
  id: 'user-1', name: 'Test User', email: 'test@example.com',
  password: 'hashed', role: 'user' as const, createdAt: new Date(),
}

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => jest.clearAllMocks())

describe('POST /api/auth/login — validation', () => {
  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', password: 'pass1234' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty password', async () => {
    const res = await POST(makeRequest({ email: 'test@example.com', password: '' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login — authentication', () => {
  it('returns 401 for unknown email', async () => {
    mockFindByEmail.mockReturnValue(null)
    const res = await POST(makeRequest({ email: 'x@x.com', password: 'pass1234' }))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Invalid email or password')
  })

  it('returns 401 for wrong password', async () => {
    mockFindByEmail.mockReturnValue(testUser)
    mockVerify.mockResolvedValue(false)
    const res = await POST(makeRequest({ email: testUser.email, password: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('same error for unknown email and wrong password', async () => {
    mockFindByEmail.mockReturnValue(null)
    const r1 = await POST(makeRequest({ email: 'ghost@x.com', password: 'pass1234' }))
    mockFindByEmail.mockReturnValue(testUser)
    mockVerify.mockResolvedValue(false)
    const r2 = await POST(makeRequest({ email: testUser.email, password: 'wrong' }))
    expect((await r1.json()).error).toBe((await r2.json()).error)
  })
})

describe('POST /api/auth/login — success', () => {
  it('returns token and user without password field', async () => {
    mockFindByEmail.mockReturnValue(testUser)
    mockVerify.mockResolvedValue(true)
    mockGenerate.mockReturnValue('signed-jwt')
    const res = await POST(makeRequest({ email: testUser.email, password: 'correct' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('signed-jwt')
    expect(body.user.email).toBe(testUser.email)
    expect(body.user.password).toBeUndefined()
  })

  it('calls generateToken with correct payload', async () => {
    mockFindByEmail.mockReturnValue(testUser)
    mockVerify.mockResolvedValue(true)
    mockGenerate.mockReturnValue('tok')
    await POST(makeRequest({ email: testUser.email, password: 'correct' }))
    expect(mockGenerate).toHaveBeenCalledWith({ userId: testUser.id, email: testUser.email, role: testUser.role })
  })
})
