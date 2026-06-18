'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/lib/db'

export interface NotificationsState {
  notifications: Notification[]
  unreadCount:   number
  loading:       boolean
  error:         string | null
  markRead:      (id: string) => Promise<void>
  markAllRead:   () => Promise<void>
  refresh:       () => void
}

export function useNotifications(userId: string | null): NotificationsState {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(false)
  const [error,   setError]               = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load notifications')
        return r.json()
      })
      .then(data => setNotifications(data.notifications))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const markRead = useCallback(async (id: string) => {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, loading, error, markRead, markAllRead, refresh }
}
