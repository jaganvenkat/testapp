'use client'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDate } from '@/utils/formatters'
import type { NotificationType } from '@/lib/db'

const TYPE_STYLES: Record<NotificationType, string> = {
  info:    'bg-blue-50   border-blue-200   text-blue-700',
  success: 'bg-green-50  border-green-200  text-green-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  error:   'bg-red-50    border-red-200    text-red-700',
}

const TYPE_ICON: Record<NotificationType, string> = {
  info:    'ℹ',
  success: '✓',
  warning: '⚠',
  error:   '✕',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, error, markRead, markAllRead } =
    useNotifications(user?.userId ?? null)

  if (!user) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm" data-testid="notifs-unauthenticated">
        Please log in to view your notifications.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="notifs-loading">
        <span className="text-muted-foreground text-sm">Loading notifications…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="notifs-error">
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="notifications-page">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">
          Notifications
          {unreadCount > 0 && (
            <span
              data-testid="unread-badge"
              className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white"
            >
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            data-testid="mark-all-read"
            onClick={markAllRead}
            className="text-xs text-indigo-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm" data-testid="notifs-empty">
          You're all caught up — no notifications.
        </div>
      ) : (
        <ul className="space-y-2" data-testid="notifications-list">
          {notifications.map(n => (
            <li
              key={n.id}
              data-testid="notification-item"
              data-read={n.read}
              className={`flex gap-3 rounded-xl border p-4 transition-opacity ${n.read ? 'opacity-60' : ''}`}
            >
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${TYPE_STYLES[n.type]}`}
              >
                {TYPE_ICON[n.type]}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground" data-testid="notif-title">
                  {n.title}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="notif-body">
                  {n.body}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(n.createdAt, 'relative')}
                </p>
              </div>

              {!n.read && (
                <button
                  data-testid="mark-read"
                  aria-label="Mark as read"
                  onClick={() => markRead(n.id)}
                  className="shrink-0 self-start rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
